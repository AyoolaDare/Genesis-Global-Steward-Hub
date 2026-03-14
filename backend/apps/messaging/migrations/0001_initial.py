import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('persons', '0005_person_occupation_marital_status'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SMSCampaign',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('message', models.TextField()),
                ('channel', models.CharField(
                    choices=[('SMS', 'SMS'), ('WHATSAPP', 'WhatsApp')],
                    default='SMS', max_length=20,
                )),
                ('status', models.CharField(
                    choices=[('PENDING', 'Pending Approval'), ('APPROVED', 'Approved & Sent'), ('REJECTED', 'Rejected')],
                    db_index=True, default='PENDING', max_length=20,
                )),
                ('review_note', models.TextField(blank=True)),
                ('sent_count', models.PositiveIntegerField(default=0)),
                ('failed_count', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('created_by', models.ForeignKey(
                    null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='created_campaigns', to=settings.AUTH_USER_MODEL,
                )),
                ('reviewed_by', models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='reviewed_campaigns', to=settings.AUTH_USER_MODEL,
                )),
                ('recipients', models.ManyToManyField(
                    blank=True, related_name='sms_campaigns', to='persons.person',
                )),
            ],
            options={
                'db_table': 'messaging_campaigns',
                'ordering': ['-created_at'],
            },
        ),
    ]
