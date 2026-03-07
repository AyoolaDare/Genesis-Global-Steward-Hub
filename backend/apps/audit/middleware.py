import re


class AuditMiddleware:
    """
    Records every successful write operation (POST/PUT/PATCH/DELETE).
    Full model implementation completed in Phase 2; middleware wired now.
    """
    TRACKED_METHODS = ('POST', 'PUT', 'PATCH', 'DELETE')

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if (
            request.method in self.TRACKED_METHODS
            and hasattr(request, 'user')
            and request.user.is_authenticated
            and response.status_code < 400
        ):
            try:
                from .models import AuditLog
                action_label = self._build_action_label(request)
                if not action_label:
                    return response

                entity_type, entity_id = self._extract_entity(request.path)
                AuditLog.objects.create(
                    user=request.user,
                    user_role=request.user.role,
                    action=action_label,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    after_state={
                        'method': request.method,
                        'path': request.path,
                        'status_code': response.status_code,
                        'target_display': self._build_target_display(request, entity_type, entity_id),
                    },
                    ip_address=self._get_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                )
            except Exception:
                # Don't let audit logging failures break the request
                pass

        return response

    def _get_ip(self, request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')

    def _extract_entity(self, path: str):
        # Typical path: /api/v1/persons/<uuid>/...
        tokens = [p for p in path.strip('/').split('/') if p]
        if len(tokens) < 3:
            return '', None

        module = tokens[2]
        entity_map = {
            'persons': 'PERSON',
            'medical': 'MEDICAL',
            'followup': 'FOLLOWUP',
            'cells': 'CELL_GROUP',
            'depts': 'DEPARTMENT',
            'hr': 'WORKER',
            'auth': 'AUTH',
            'notifications': 'NOTIFICATION',
            'audit': 'AUDIT',
        }
        entity_type = entity_map.get(module, module.upper())

        uuid_value = None
        for token in tokens[3:]:
            if re.match(r'^[0-9a-fA-F-]{32,36}$', token):
                uuid_value = token
                break

        return entity_type, uuid_value

    def _build_action_label(self, request):
        tokens = [p for p in request.path.strip('/').split('/') if p]
        if len(tokens) < 3:
            return None

        method = request.method.upper()
        module = tokens[2]
        endpoint = tokens[3] if len(tokens) > 3 else ''

        # Skip low-value technical events.
        if module == 'auth' and endpoint in ('login', 'logout', 'refresh', 'me', 'reset-password'):
            return None
        if module == 'persons' and endpoint == 'phone_lookup':
            return None
        if module in ('audit', 'health'):
            return None

        custom = {
            ('persons', 'POST', 'approve'): 'Approved member profile',
            ('persons', 'POST', 'merge'): 'Merged member profiles',
            ('depts', 'POST', 'add_member'): 'Added member to department',
            ('depts', 'DELETE', 'members'): 'Removed member from department',
            ('depts', 'POST', 'mark_attendance'): 'Marked department attendance',
            ('hr', 'PATCH', 'update_status'): 'Updated worker status',
            ('hr', 'PATCH', 'onboard'): 'Updated worker onboarding',
            ('hr', 'POST', 'terminate'): 'Terminated worker',
            ('followup', 'PATCH', 'assign'): 'Assigned follow-up task',
            ('followup', 'PATCH', 'complete'): 'Completed follow-up task',
        }

        last_token = tokens[-1]
        last_token = last_token.rstrip('/') if last_token else last_token
        key = (module, method, last_token)
        if key in custom:
            return custom[key]

        if module == 'depts' and method == 'POST' and len(tokens) == 3:
            return 'Created department'
        if module == 'persons' and method == 'POST' and len(tokens) == 3:
            return 'Created person profile'
        if module == 'auth' and method == 'POST' and endpoint == 'users':
            return 'Created system user'
        if module == 'auth' and method in ('PATCH', 'PUT') and endpoint == 'users':
            return 'Updated system user'
        if module == 'medical' and method == 'POST' and endpoint == 'visits':
            return 'Recorded medical visit'

        verb = {
            'POST': 'Created',
            'PATCH': 'Updated',
            'PUT': 'Updated',
            'DELETE': 'Deleted',
        }.get(method, method.title())
        entity_type, _ = self._extract_entity(request.path)
        entity = entity_type.replace('_', ' ').title() if entity_type else module.replace('_', ' ').title()
        return f'{verb} {entity}'

    def _build_target_display(self, request, entity_type, entity_id):
        if not entity_type:
            return None
        if entity_id:
            return f'{entity_type}:{entity_id}'
        return entity_type
