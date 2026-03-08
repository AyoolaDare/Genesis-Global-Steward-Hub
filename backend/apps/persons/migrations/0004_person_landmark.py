from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('persons', '0003_alter_person_source'),
    ]

    operations = [
        migrations.AddField(
            model_name='person',
            name='landmark',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
