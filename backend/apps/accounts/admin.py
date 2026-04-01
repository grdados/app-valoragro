from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "perfil", "is_active")
    list_filter = ("perfil", "is_active")
    fieldsets = UserAdmin.fieldsets + (
        ("Perfil Valor Agro", {"fields": ("perfil", "coordenador_ref", "vendedor_ref")}),
    )
