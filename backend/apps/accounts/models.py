from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    PERFIL_CHOICES = [
        ("dev", "Desenvolvedor"),
        ("supervisor", "Supervisor"),
        ("coordenador", "Coordenador"),
        ("vendedor", "Vendedor"),
    ]
    perfil = models.CharField(max_length=20, choices=PERFIL_CHOICES, default="vendedor")
    supervisor_ref = models.ForeignKey(
        "cadastros.Supervisor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="usuarios",
    )
    coordenador_ref = models.ForeignKey(
        "cadastros.Coordenador",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="usuarios",
    )
    vendedor_ref = models.ForeignKey(
        "cadastros.Vendedor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="usuarios",
    )

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"

    def is_dev(self):
        return self.perfil == "dev" or self.is_superuser

    def is_admin(self):
        return self.is_dev()

    def is_supervisor(self):
        return self.perfil == "supervisor"

    def is_coordenador(self):
        return self.perfil == "coordenador"

    def is_vendedor(self):
        return self.perfil == "vendedor"
