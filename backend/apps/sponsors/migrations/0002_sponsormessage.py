import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sponsors', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SponsorMessage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('message_type', models.CharField(
                    choices=[
                        ('THANK_YOU', 'Thank You'),
                        ('GREETING', 'Greeting'),
                        ('PRAYER', 'Prayer'),
                        ('CUSTOM', 'Custom'),
                    ],
                    db_index=True,
                    max_length=20,
                )),
                ('body', models.TextField()),
                ('phone', models.CharField(max_length=30)),
                ('success', models.BooleanField(default=False)),
                ('sent_at', models.DateTimeField(auto_now_add=True)),
                ('payment', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='messages',
                    to='sponsors.sponsorshippayment',
                )),
                ('sent_by', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='sponsor_messages_sent',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('sponsor', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='messages',
                    to='sponsors.sponsor',
                )),
            ],
            options={
                'db_table': 'sponsor_messages',
                'ordering': ['-sent_at'],
            },
        ),
    ]
