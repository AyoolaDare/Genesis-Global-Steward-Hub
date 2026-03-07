import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField


class MedicalRecord(models.Model):
    id                        = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person                    = models.OneToOneField(
                                  'persons.Person', on_delete=models.RESTRICT,
                                  related_name='medical_record'
                                )
    blood_group               = models.CharField(max_length=5, blank=True)
    genotype                  = models.CharField(max_length=5, blank=True)
    allergies                 = ArrayField(models.TextField(), default=list, blank=True)
    chronic_conditions        = ArrayField(models.TextField(), default=list, blank=True)
    disabilities              = ArrayField(models.TextField(), default=list, blank=True)
    current_medications       = ArrayField(models.TextField(), default=list, blank=True)
    preferred_hospital        = models.CharField(max_length=255, blank=True)
    health_insurance_provider = models.CharField(max_length=255, blank=True)
    health_insurance_number   = models.CharField(max_length=100, blank=True)
    created_by                = models.ForeignKey(
                                  'accounts.SystemUser', null=True, blank=True,
                                  on_delete=models.SET_NULL,
                                  related_name='medical_records_created'
                                )
    created_at                = models.DateTimeField(auto_now_add=True)
    updated_at                = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'medical_records'

    def __str__(self):
        return f"Medical Record — {self.person.full_name}"


class MedicalVisit(models.Model):
    VISIT_TYPES = [
        ('ROUTINE',   'Routine'),
        ('EMERGENCY', 'Emergency'),
        ('FOLLOWUP',  'Follow-Up'),
        ('SCREENING', 'Screening'),
    ]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person          = models.ForeignKey(
                        'persons.Person', on_delete=models.RESTRICT,
                        related_name='medical_visits'
                      )
    medical_record  = models.ForeignKey(
                        MedicalRecord, on_delete=models.SET_NULL,
                        null=True, blank=True, related_name='visits'
                      )
    visit_date      = models.DateField()
    visit_type      = models.CharField(max_length=50, choices=VISIT_TYPES, default='ROUTINE')
    complaint       = models.TextField(blank=True)
    diagnosis       = models.TextField(blank=True)
    treatment       = models.TextField(blank=True)
    prescription    = models.TextField(blank=True)
    next_visit_date = models.DateField(null=True, blank=True)
    blood_pressure  = models.CharField(max_length=20, blank=True)
    weight_kg       = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    height_cm       = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    temperature_c   = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    pulse_rate      = models.PositiveIntegerField(null=True, blank=True)
    attachments     = ArrayField(models.TextField(), default=list, blank=True)
    notes           = models.TextField(blank=True)
    attended_by     = models.ForeignKey(
                        'accounts.SystemUser', null=True, blank=True,
                        on_delete=models.SET_NULL, related_name='visits_attended'
                      )
    created_at      = models.DateTimeField(auto_now_add=True)
    # No updated_at — visits are immutable; amendments are new records

    class Meta:
        db_table = 'medical_visits'
        ordering = ['-visit_date', '-created_at']

    def __str__(self):
        return f"Visit — {self.person.full_name} on {self.visit_date}"
