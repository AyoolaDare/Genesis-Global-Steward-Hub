from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('departments', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='departmentmember',
            name='role',
            field=models.CharField(
                choices=[
                    ('HOD',       'Head of Department'),
                    ('ASST_HOD',  'Assistant HOD'),
                    ('TREASURER', 'Treasurer'),
                    ('PRO',       'Public Relations Officer'),
                    ('WELFARE',   'Welfare Officer'),
                    ('VOLUNTEER', 'Volunteer'),
                ],
                default='VOLUNTEER',
                max_length=50,
            ),
        ),
    ]
