from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db_status = 'connected'
        try:
            connection.ensure_connection()
        except Exception:
            db_status = 'error'

        return Response({
            'status':    'ok',
            'db':        db_status,
            'timestamp': timezone.now().isoformat(),
        })
