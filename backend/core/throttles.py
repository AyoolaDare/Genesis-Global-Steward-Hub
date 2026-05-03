from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """10 login attempts per hour per IP — protects against brute-force."""
    scope = 'login'


class RefreshTokenThrottle(AnonRateThrottle):
    """20 token-refresh calls per hour per IP — limits stolen-token replay."""
    scope = 'token_refresh'


class PhoneLookupThrottle(UserRateThrottle):
    """30 phone-lookup calls per hour per user — prevents bulk harvesting."""
    scope = 'phone_lookup'


class SearchThrottle(UserRateThrottle):
    """120 global-search calls per hour per user."""
    scope = 'search'
