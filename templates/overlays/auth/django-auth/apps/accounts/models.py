from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Custom user model. Extend as needed."""

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.email or self.username
