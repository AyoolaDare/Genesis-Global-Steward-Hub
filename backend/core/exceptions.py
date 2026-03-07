import uuid
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            'success':   False,
            'error': {
                'message':    _extract_message(response.data),
                'statusCode': response.status_code,
            },
            'requestId': str(uuid.uuid4()),
        }
    return response


def _extract_message(data):
    if isinstance(data, dict):
        for key in ('detail', 'non_field_errors'):
            if key in data:
                val = data[key]
                return str(val[0]) if isinstance(val, list) else str(val)
        for key, val in data.items():
            return f"{key}: {val[0] if isinstance(val, list) else val}"
    if isinstance(data, list):
        return str(data[0])
    return str(data)
