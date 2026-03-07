from rest_framework.response import Response


def success_response(data=None, message='Success', status=200, **kwargs):
    return Response({
        'success': True,
        'message': message,
        'data':    data,
    }, status=status, **kwargs)


def error_response(message='An error occurred', status=400, **kwargs):
    return Response({
        'success': False,
        'error':   {'message': message, 'statusCode': status},
    }, status=status, **kwargs)
