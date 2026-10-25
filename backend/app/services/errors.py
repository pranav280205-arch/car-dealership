"""Domain errors raised by services.

Services don't know about HTTP. Routers (or the handler in main.py) turn these
into proper status codes, which keeps business logic easy to test on its own.
"""


class DomainError(Exception):
    status_code = 400

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFoundError(DomainError):
    status_code = 404


class ConflictError(DomainError):
    status_code = 409


class AuthError(DomainError):
    status_code = 401
