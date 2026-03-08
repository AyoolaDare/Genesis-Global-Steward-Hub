from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('persons', '0004_person_landmark'),
    ]

    operations = [
        migrations.AddField(
            model_name='person',
            name='marital_status',
            field=models.CharField(blank=True, max_length=30),
        ),
        migrations.AddField(
            model_name='person',
            name='occupation',
            field=models.CharField(blank=True, max_length=150),
        ),
    ]
