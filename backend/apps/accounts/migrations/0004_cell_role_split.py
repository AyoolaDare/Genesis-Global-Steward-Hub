from django.db import migrations, models


def migrate_cell_roles(apps, schema_editor):
    SystemUser = apps.get_model('accounts', 'SystemUser')
    SystemUser.objects.filter(role='CELL_ADMIN').update(role='CELL_LEADER')


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_update_role_choices_dept_exec'),
    ]

    operations = [
        migrations.RunPython(migrate_cell_roles, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='systemuser',
            name='role',
            field=models.CharField(
                choices=[
                    ('ADMIN', 'Admin'),
                    ('MEDICAL', 'Medical Team'),
                    ('FOLLOWUP', 'Follow Up Team'),
                    ('CELL_LEADER', 'Cell Leader'),
                    ('CELL_ASST', 'Cell Lead Assistant'),
                    ('HOD', 'Head of Department'),
                    ('ASST_HOD', 'Assistant Head of Department'),
                    ('WELFARE', 'Welfare Officer'),
                    ('PRO', 'Public Relations Officer'),
                    ('HR', 'HR Team'),
                ],
                db_index=True,
                default='FOLLOWUP',
                max_length=30,
            ),
        ),
    ]
