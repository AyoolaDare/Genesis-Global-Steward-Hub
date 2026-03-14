"""Termii SMS provider for transactional SMS and basic account diagnostics."""
import json
import logging
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)


class TermiiProvider:
    """Thin wrapper around the Termii API."""

    def __init__(self):
        self.api_key = getattr(settings, 'TERMII_API_KEY', '').strip()
        self.sender_id = getattr(settings, 'TERMII_SENDER_ID', '').strip()
        self.base_url = getattr(
            settings,
            'TERMII_BASE_URL',
            'https://api.ng.termii.com/api',
        ).rstrip('/')

    def is_configured(self) -> bool:
        return bool(self.api_key and self.sender_id)

    def _request_json(self, path: str, payload: dict | None = None, method: str = 'POST') -> dict:
        url = f"{self.base_url}/{path.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        data = None

        if method.upper() == 'GET':
            query = {'api_key': self.api_key}
            if payload:
                query.update(payload)
            url = f"{url}?{urllib.parse.urlencode(query)}"
        else:
            request_payload = {'api_key': self.api_key}
            if payload:
                request_payload.update(payload)
            data = json.dumps(request_payload).encode('utf-8')

        req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read()
            return json.loads(raw or b'{}')

    def get_sender_ids(self, sender_id: str = '', status: str = '') -> dict:
        """Fetch registered sender IDs from Termii for diagnostics."""
        if not self.api_key:
            return {'configured': False, 'reason': 'TERMII_API_KEY missing'}
        params = {}
        if sender_id:
            params['sender_id'] = sender_id
        if status:
            params['status'] = status
        return self._request_json('/sender-id', payload=params, method='GET')

    def get_sender_status(self, sender_id: str | None = None) -> dict:
        """Return a single sender match when available, plus the raw Termii response."""
        target_sender = (sender_id or self.sender_id).strip()
        response = self.get_sender_ids(sender_id=target_sender)

        senders = []
        if isinstance(response, dict):
            senders = (
                response.get('content')
                or response.get('data')
                or response.get('sender_id')
                or response.get('sender_ids')
                or []
            )
            if isinstance(senders, dict):
                senders = [senders]

        match = None
        for entry in senders:
            name = str(entry.get('sender_id') or entry.get('sender') or entry.get('from') or '').strip()
            if name.lower() == target_sender.lower():
                match = entry
                break

        return {
            'configured': self.is_configured(),
            'base_url': self.base_url,
            'sender_id': target_sender,
            'match': match,
            'response': response,
        }

    def send_sms(self, to: str, message: str) -> bool:
        """
        Send a plain SMS via Termii.

        Args:
            to: Recipient in international format, e.g. 2348012345678.
            message: Message body.

        Returns:
            True on success, False on any failure.
        """
        if not self.is_configured():
            logger.warning('Termii not configured (TERMII_API_KEY / TERMII_SENDER_ID missing) - SMS skipped.')
            return False

        if not to:
            logger.warning('Termii send_sms called with empty recipient - SMS skipped.')
            return False

        payload = {
            'to': to,
            'from': self.sender_id,
            'sms': message,
            'type': 'plain',
            'channel': 'generic',
        }

        try:
            body = self._request_json('/sms/send', payload=payload, method='POST')
            logger.info(
                'Termii SMS sent | to=%s message_id=%s balance=%s',
                to,
                body.get('message_id'),
                body.get('balance'),
            )
            return True
        except urllib.error.HTTPError as exc:
            body = exc.read()
            logger.error(
                'Termii SMS HTTP error | to=%s status=%s base_url=%s body=%s',
                to, exc.code, self.base_url, body,
            )
        except Exception:
            logger.exception('Termii SMS unexpected error | to=%s base_url=%s', to, self.base_url)

        return False
