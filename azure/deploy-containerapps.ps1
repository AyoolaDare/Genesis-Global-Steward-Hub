param(
  [string]$ResourceGroup = "cms-church-rg",
  [string]$ParametersFile = "azure/parameters.json"
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ParametersPath = Resolve-Path (Join-Path $RepoRoot $ParametersFile)
$TemplatePath = Join-Path $RepoRoot "azure/containerapps.bicep"
$BackendPath = Join-Path $RepoRoot "backend"
$FrontendPath = Join-Path $RepoRoot "frontend"

$parameters = (Get-Content $ParametersPath -Raw | ConvertFrom-Json).parameters

function Invoke-Checked([scriptblock]$Command) {
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code $LASTEXITCODE"
  }
}

function Get-ParamValue([string]$Name) {
  $entry = $parameters.$Name
  if ($null -eq $entry -or $null -eq $entry.value) {
    throw "Missing parameter value: $Name"
  }

  $value = [string]$entry.value
  if ($value.StartsWith("CHANGE_ME")) {
    throw "Replace the placeholder value for '$Name' in $ParametersFile before deploying."
  }

  return $value
}

$AppName = Get-ParamValue "appName"
$Location = Get-ParamValue "location"
$DbAdminUser = Get-ParamValue "dbAdminUser"
$DbAdminPassword = Get-ParamValue "dbAdminPassword"
$DjangoSecretKey = Get-ParamValue "djangoSecretKey"
$JwtSigningKey = Get-ParamValue "jwtSigningKey"
$CronSecret = Get-ParamValue "cronSecret"
$TermiiSenderId = Get-ParamValue "termiiSenderId"
$SuperuserEmail = Get-ParamValue "superuserEmail"
$SuperuserPassword = Get-ParamValue "superuserPassword"
$TermiiApiKey = if ($parameters.termiiApiKey.value) { [string]$parameters.termiiApiKey.value } else { "" }
$PaystackSecretKey = if ($parameters.paystackSecretKey.value) { [string]$parameters.paystackSecretKey.value } else { "" }

$BackendName = "$AppName-api"
$EnvironmentName = "$AppName-env"
$StorageAccountName = "$($AppName.ToLower())media"
$DatabaseName = "cms_church"
$DatabaseHost = "$AppName-db.postgres.database.azure.com"

Write-Host "==> Ensuring Azure CLI extensions/providers..."
Invoke-Checked { az extension add --name containerapp --upgrade --only-show-errors }
Invoke-Checked { az provider register --namespace Microsoft.App --wait --only-show-errors }
Invoke-Checked { az provider register --namespace Microsoft.OperationalInsights --wait --only-show-errors }
Invoke-Checked { az provider register --namespace Microsoft.ContainerRegistry --wait --only-show-errors }

Write-Host "==> Deploying shared Azure infrastructure..."
Invoke-Checked { az group create --name $ResourceGroup --location $Location --only-show-errors | Out-Null }
Invoke-Checked {
  az deployment group create `
    --resource-group $ResourceGroup `
    --template-file $TemplatePath `
    --parameters `
      appName=$AppName `
      location=$Location `
      dbAdminUser=$DbAdminUser `
      dbAdminPassword=$DbAdminPassword `
    --only-show-errors | Out-Null
}

$FrontendHostname = az staticwebapp show `
  --name "$AppName-frontend" `
  --resource-group $ResourceGroup `
  --query "defaultHostname" `
  -o tsv
$FrontendUrl = "https://$FrontendHostname"

$StorageKey = az storage account keys list `
  --resource-group $ResourceGroup `
  --account-name $StorageAccountName `
  --query "[0].value" `
  -o tsv

Write-Host "==> Building and deploying backend Container App..."
Invoke-Checked {
  az containerapp up `
    --name $BackendName `
    --resource-group $ResourceGroup `
    --location $Location `
    --environment $EnvironmentName `
    --source $BackendPath `
    --ingress external `
    --target-port 8000 `
    --env-vars `
      DJANGO_SETTINGS_MODULE=cms.settings.production `
      SECRET_KEY=$DjangoSecretKey `
      JWT_SIGNING_KEY=$JwtSigningKey `
      DEBUG=False `
      PORT=8000 `
      ALLOWED_HOSTS=* `
      CORS_ALLOWED_ORIGINS=$FrontendUrl `
      CSRF_TRUSTED_ORIGINS=$FrontendUrl `
      DB_NAME=$DatabaseName `
      DB_USER=$DbAdminUser `
      DB_PASSWORD=$DbAdminPassword `
      DB_HOST=$DatabaseHost `
      DB_PORT=5432 `
      AZURE_STORAGE_ACCOUNT_NAME=$StorageAccountName `
      AZURE_STORAGE_ACCOUNT_KEY=$StorageKey `
      AZURE_MEDIA_CONTAINER=media `
      TERMII_API_KEY=$TermiiApiKey `
      TERMII_SENDER_ID=$TermiiSenderId `
      PAYSTACK_SECRET_KEY=$PaystackSecretKey `
      CRON_SECRET=$CronSecret `
      SUPERUSER_EMAIL=$SuperuserEmail `
      SUPERUSER_PASSWORD=$SuperuserPassword | Out-Null
}

$BackendFqdn = az containerapp show `
  --name $BackendName `
  --resource-group $ResourceGroup `
  --query "properties.configuration.ingress.fqdn" `
  -o tsv
$BackendUrl = "https://$BackendFqdn"

Write-Host "==> Updating backend with final ALLOWED_HOSTS, CORS, and CSRF..."
Invoke-Checked {
  az containerapp update `
    --name $BackendName `
    --resource-group $ResourceGroup `
    --set-env-vars `
      ALLOWED_HOSTS="$BackendFqdn,localhost,127.0.0.1" `
      CORS_ALLOWED_ORIGINS=$FrontendUrl `
      CSRF_TRUSTED_ORIGINS="$FrontendUrl,$BackendUrl" | Out-Null
}

Write-Host "==> Building frontend..."
Push-Location $FrontendPath
try {
  Invoke-Checked { npm.cmd install }
  $env:VITE_API_URL = "$BackendUrl/api/v1"
  Invoke-Checked { npm.cmd run build }

  $StaticWebAppToken = az staticwebapp secrets list `
    --name "$AppName-frontend" `
    --resource-group $ResourceGroup `
    --query "properties.apiKey" `
    -o tsv

  Write-Host "==> Deploying frontend Static Web App..."
  Invoke-Checked {
    npx.cmd @azure/static-web-apps-cli deploy .\dist `
      --deployment-token $StaticWebAppToken `
      --env production
  }
}
finally {
  Pop-Location
}

Write-Host ""
Write-Host "Deployment complete."
Write-Host "Frontend: $FrontendUrl"
Write-Host "Backend:  $BackendUrl"
Write-Host "Health:   $BackendUrl/api/v1/health/"
