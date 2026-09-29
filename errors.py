class ChatError(Exception):
    def __init__(self, message: str, status: int = 503, retry_after: int = 0):
        super().__init__(message)
        self.status = status
        self.retry_after = retry_after
