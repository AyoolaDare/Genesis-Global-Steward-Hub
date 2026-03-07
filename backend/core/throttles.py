from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """10 login attempts per hour per IP — protects against brute-force."""
    scope = 'login'


class PhoneLookupThrottle(UserRateThrottle):
    """30 phone-lookup calls per hour per user — prevents bulk harvesting."""
    scope = 'phone_lookup'
