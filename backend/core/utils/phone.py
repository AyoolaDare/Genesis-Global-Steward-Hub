import re


def normalize_phone(phone: str) -> str:
    """
    Normalize a Nigerian phone number to the format: 08012345678
    Rules:
    - Strip all spaces, dashes, brackets, dots
    - Convert +234 prefix to 0
    - Convert 234 prefix (without +) to 0
    - Store in normalized form: 08012345678
    """
    if not phone:
        return phone

    # Keep digits only for consistent storage/search.
    digits = re.sub(r'\D', '', phone.strip())
    if not digits:
        return digits

    # 08012345678
    if digits.startswith('0') and len(digits) == 11:
        return digits

    # 2348012345678 -> 08012345678
    if digits.startswith('234') and len(digits) >= 13:
        return '0' + digits[3:14]

    # 8012345678 -> 08012345678
    if len(digits) == 10:
        return '0' + digits

    return digits
