"""Standalone Termii SMS smoke test.

Usage:
    python termii_test.py --to 2348012345678 --message "Test SMS"
    python termii_test.py --to 08123456789
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / '.env'


def load_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values

    for raw_line in path.read_text(encoding='utf-8').splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue

        key, value = line.split('=', 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        values[key] = value

    return values


def normalize_phone(phone: str) -> str:
    digits = ''.join(ch for ch in phone if ch.isdigit())
    if digits.startswith('234'):
        return digits
    if digits.startswith('0'):
        return f'234{digits[1:]}'
    return digits


def main() -> int:
    parser = argparse.ArgumentParser(description='Send a direct test SMS via Termii.')
    parser.add_argument('--to', required=True, help='Recipient phone number in local or 234 format.')
    parser.add_argument('--message', default='Termii smoke test from CMS backend.', help='Message body.')
    parser.add_argument(
        '--base-url',
        default='',
        help='Optional override for Termii base URL. Defaults to TERMII_BASE_URL or api.ng.termii.com.',
    )
    args = parser.parse_args()

    env = load_env_file(ENV_PATH)
    api_key = env.get('TERMII_API_KEY', '').strip()
    sender_id = env.get('TERMII_SENDER_ID', '').strip()
    base_url = (args.base_url or env.get('TERMII_BASE_URL') or 'https://api.ng.termii.com/api').rstrip('/')
    to = normalize_phone(args.to)

    if not api_key or not sender_id:
        print('Missing TERMII_API_KEY or TERMII_SENDER_ID in backend/.env', file=sys.stderr)
        return 1

    payload = {
        'api_key': api_key,
        'to': to,
        'from': sender_id,
        'sms': args.message,
        'type': 'plain',
        'channel': 'dnd',
    }

    request = urllib.request.Request(
        f'{base_url}/sms/send',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )

    print(json.dumps({
        'base_url': base_url,
        'sender_id': sender_id,
        'to': to,
        'message': args.message,
    }, indent=2))

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            body = response.read().decode('utf-8')
            print('HTTP', response.status)
            print(body)
            return 0
    except urllib.error.HTTPError as exc:
        body = exc.read().decode('utf-8', errors='replace')
        print(f'HTTP {exc.code}', file=sys.stderr)
        print(body, file=sys.stderr)
        return 2
    except Exception as exc:
        print(f'Unexpected error: {exc}', file=sys.stderr)
        return 3


if __name__ == '__main__':
    raise SystemExit(main())
