class ProviderError(RuntimeError):
    """Base class for any provider-specific error."""
    pass

class RetryExhaustedError(ProviderError):
    """Raised when retry limit is hit."""
    pass

class TimeoutError(ProviderError):
    """Raised on per-call timeout."""
    pass
