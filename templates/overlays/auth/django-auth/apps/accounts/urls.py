from django.urls import path

from apps.accounts import views

urlpatterns = [
    path("auth/me/", views.me, name="auth-me"),
]
