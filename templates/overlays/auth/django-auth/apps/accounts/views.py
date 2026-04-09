from django.http import JsonResponse
from django.contrib.auth import get_user_model

User = get_user_model()


def me(request):
    """Return the current authenticated user."""
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": {"message": "Not authenticated", "status": 401}},
            status=401,
        )
    return JsonResponse({
        "id": request.user.id,
        "username": request.user.username,
        "email": request.user.email,
    })
