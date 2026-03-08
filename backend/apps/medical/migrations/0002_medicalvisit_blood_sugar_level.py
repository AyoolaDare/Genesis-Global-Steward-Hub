from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('medical', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='medicalvisit',
            name='blood_sugar_level',
            field=models.CharField(blank=True, max_length=30),
        ),
    ]
