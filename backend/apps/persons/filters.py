import django_filters
from .models import Person


class PersonFilter(django_filters.FilterSet):
    status = django_filters.MultipleChoiceFilter(choices=Person.Status.choices)
    source = django_filters.MultipleChoiceFilter(choices=Person.Source.choices)
    gender = django_filters.CharFilter(lookup_expr='iexact')
    created_after  = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model  = Person
        fields = ['status', 'source', 'gender']
