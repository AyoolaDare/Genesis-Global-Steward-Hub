// ─────────────────────────────────────────────────────────────────────────────
// Genesis Global CMS — Azure Infrastructure
// Budget: ~$29/month  (~$87 for 3 months, fits comfortably in $200 budget)
//
// Deploy once:
//   az group create --name cms-church-rg --location uksouth
//   az deployment group create \
//     --resource-group cms-church-rg \
//     --template-file azure/main.bicep \
//     --parameters azure/parameters.json
// ─────────────────────────────────────────────────────────────────────────────

@description('Base name prefix for all resources (lowercase, alphanumeric, no dashes in storage name)')
param appName string = 'cmschurch'

@description('Azure region for all resources (uksouth is closest to Nigeria)')
param location string = 'uksouth'

@description('PostgreSQL admin login')
param dbAdminUser string = 'cms_admin'

@secure()
@description('PostgreSQL admin password (min 12 chars, upper+lower+number+symbol)')
param dbAdminPassword string

@secure()
@description('Django SECRET_KEY — generate with: python -c "import secrets; print(secrets.token_hex(50))"')
param djangoSecretKey string

@description('Frontend URL for CORS (e.g. https://cmschurch.azurestaticapps.net)')
param frontendUrl string

@description('Termii API key for SMS')
@secure()
param termiiApiKey string = ''

@description('Termii Sender ID')
param termiiSenderId string = 'Genesis'

@secure()
@description('Secret for GitHub Actions scheduled cron workflows (random hex string)')
param cronSecret string

@description('App Service plan SKU name. Use F1 to avoid Basic VM quota; switch to B1 after quota is approved.')
@allowed([
  'F1'
  'B1'
])
param appServicePlanSkuName string = 'F1'

@description('App Service plan SKU tier matching the selected SKU name.')
@allowed([
  'Free'
  'Basic'
])
param appServicePlanSkuTier string = 'Free'

@description('Enable Always On. Must be false on Free tier; set true when using Basic or higher.')
param appServiceAlwaysOn bool = false

// ── Storage Account (media files — replaces Cloudinary) ─────────────────────
// Name: must be globally unique, 3-24 chars, lowercase alphanumeric only
var storageAccountName = '${toLower(appName)}media'
var mediaContainerName = 'media'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    cors: {
      corsRules: [
        {
          allowedOrigins: ['*']
          allowedMethods: ['GET']
          allowedHeaders: ['*']
          exposedHeaders: []
          maxAgeInSeconds: 3600
        }
      ]
    }
  }
}

resource mediaContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: mediaContainerName
  properties: {
    publicAccess: 'Blob'  // profile photos are public-readable
  }
}

// ── PostgreSQL Flexible Server ───────────────────────────────────────────────
// B1ms: 1 vCore, 2 GB RAM, 32 GB storage — ~$14/month in uksouth
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: '${appName}-db'
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: dbAdminUser
    administratorLoginPassword: dbAdminPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: { mode: 'Disabled' }
    network: { publicNetworkAccess: 'Enabled' }
  }
}

resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: postgresServer
  name: 'cms_church'
  properties: {
    charset: 'utf8'
    collation: 'en_US.utf8'
  }
}

// Allow Azure services (App Service) to reach the database
resource postgresFirewallAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ── App Service Plan ─────────────────────────────────────────────────────────
// B1: 1 Core, 1.75 GB RAM — ~$13/month in uksouth, Linux/Python
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${appName}-plan'
  location: location
  sku: {
    name: appServicePlanSkuName
    tier: appServicePlanSkuTier
  }
  kind: 'linux'
  properties: {
    reserved: true  // required for Linux App Service
  }
}

// ── App Service (Django backend) ─────────────────────────────────────────────
var storageKey = storageAccount.listKeys().keys[0].value

resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: '${appName}-api'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'PYTHON|3.12'
      appCommandLine: 'bash startup.sh'
      alwaysOn: appServiceAlwaysOn
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      appSettings: [
        { name: 'DJANGO_SETTINGS_MODULE',    value: 'cms.settings.production' }
        { name: 'SECRET_KEY',               value: djangoSecretKey }
        { name: 'DEBUG',                    value: 'False' }
        { name: 'ALLOWED_HOSTS',            value: '${appName}-api.azurewebsites.net' }
        // Database
        { name: 'DB_NAME',                  value: 'cms_church' }
        { name: 'DB_USER',                  value: dbAdminUser }
        { name: 'DB_PASSWORD',              value: dbAdminPassword }
        { name: 'DB_HOST',                  value: '${postgresServer.name}.postgres.database.azure.com' }
        { name: 'DB_PORT',                  value: '5432' }
        // CORS / CSRF
        { name: 'CORS_ALLOWED_ORIGINS',     value: frontendUrl }
        { name: 'CSRF_TRUSTED_ORIGINS',     value: 'https://${appName}-api.azurewebsites.net' }
        // Azure Blob Storage for media
        { name: 'AZURE_STORAGE_ACCOUNT_NAME', value: storageAccountName }
        { name: 'AZURE_STORAGE_ACCOUNT_KEY',  value: storageKey }
        { name: 'AZURE_MEDIA_CONTAINER',      value: mediaContainerName }
        // SMS
        { name: 'TERMII_API_KEY',           value: termiiApiKey }
        { name: 'TERMII_SENDER_ID',         value: termiiSenderId }
        // Azure App Service build settings
        { name: 'CRON_SECRET',                    value: cronSecret }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'true' }
        { name: 'WEBSITE_RUN_FROM_PACKAGE',       value: '0' }
      ]
    }
  }
}

// ── Static Web App (React frontend — Free tier) ───────────────────────────────
// Free: 100 GB/month bandwidth, custom domains, global CDN
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: '${appName}-frontend'
  location: 'eastus2'  // Static Web Apps only available in specific regions
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {}
}

// ── Outputs — copy these into GitHub Secrets ─────────────────────────────────
output backendUrl          string = 'https://${appService.name}.azurewebsites.net'
output frontendHostname    string = staticWebApp.properties.defaultHostname
output storageAccountName  string = storageAccountName
output postgresHost        string = '${postgresServer.name}.postgres.database.azure.com'
