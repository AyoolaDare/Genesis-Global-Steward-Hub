from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('persons', '0005_person_occupation_marital_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='person',
            name='deleted_at',
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
    ]
