from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class BackupSettings(models.Model):
    ativo = models.BooleanField(default=False)
    hora_execucao = models.TimeField(default="02:00")
    manter_dias = models.PositiveIntegerField(default=15)
    ultima_execucao = models.DateTimeField(null=True, blank=True)
    proxima_execucao = models.DateTimeField(null=True, blank=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Configuracao de Backup"
        verbose_name_plural = "Configuracoes de Backup"

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def calcular_proxima_execucao(self, referencia=None):
        referencia_local = timezone.localtime(referencia or timezone.now())
        proxima = referencia_local.replace(
            hour=self.hora_execucao.hour,
            minute=self.hora_execucao.minute,
            second=0,
            microsecond=0,
        )
        if proxima <= referencia_local:
            proxima += timedelta(days=1)
        return proxima

    def atualizar_proxima_execucao(self, referencia=None, save=True):
        self.proxima_execucao = self.calcular_proxima_execucao(referencia=referencia)
        if save:
            self.save(update_fields=["proxima_execucao", "atualizado_em"])
        return self.proxima_execucao


class BackupArquivo(models.Model):
    ORIGEM_MANUAL = "manual"
    ORIGEM_AGENDADO = "agendado"
    ORIGEM_UPLOAD = "upload"
    ORIGEM_CHOICES = [
        (ORIGEM_MANUAL, "Manual"),
        (ORIGEM_AGENDADO, "Agendado"),
        (ORIGEM_UPLOAD, "Upload para restauracao"),
    ]

    arquivo = models.FileField(upload_to="backups/")
    nome_arquivo = models.CharField(max_length=255)
    tamanho_bytes = models.BigIntegerField(default=0)
    hash_sha256 = models.CharField(max_length=64, blank=True)
    origem = models.CharField(max_length=20, choices=ORIGEM_CHOICES, default=ORIGEM_MANUAL)
    observacao = models.TextField(blank=True)
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="backups_criados",
    )
    restaurado_em = models.DateTimeField(null=True, blank=True)
    restaurado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="backups_restaurados",
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Arquivo de Backup"
        verbose_name_plural = "Arquivos de Backup"
        ordering = ["-criado_em"]

    def __str__(self):
        return f"{self.nome_arquivo} ({self.get_origem_display()})"
