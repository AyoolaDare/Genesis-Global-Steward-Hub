from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('persons', '0002_alter_person_options_person_address_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='person',
            name='source',
            field=models.CharField(
                blank=True,
                choices=[
                    ('WALK_IN', 'Walk In'),
                    ('MEDICAL', 'Medical'),
                    ('FOLLOWUP', 'Follow Up'),
                    ('CELL', 'Cell Group'),
                    ('DEPARTMENT', 'Department'),
                    ('ADMIN', 'Admin'),
                ],
                max_length=30,
            ),
        ),
    ]
