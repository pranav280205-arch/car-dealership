"""User registration and login."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User
from app.security import create_access_token, hash_password, verify_password
from app.services.errors import AuthError, ConflictError


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def find_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email.lower()))

    def register(self, name: str, email: str, password: str, role: str = "user") -> User:
        if self.find_by_email(email):
            raise ConflictError("Email is already registered")

        user = User(
            name=name.strip(),
            email=email.lower(),
            password_hash=hash_password(password),
            role=role,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def login(self, email: str, password: str) -> tuple[User, str]:
        """Returns (user, token). Same error for unknown email and wrong
        password so we don't leak which emails exist."""
        user = self.find_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise AuthError("Invalid email or password")
        return user, create_access_token(user.id, user.role)
