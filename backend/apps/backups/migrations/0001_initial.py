from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BackupSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("ativo", models.BooleanField(default=False)),
                ("hora_execucao", models.TimeField(default="02:00")),
                ("manter_dias", models.PositiveIntegerField(default=15)),
                ("ultima_execucao", models.DateTimeField(blank=True, null=True)),
                ("proxima_execucao", models.DateTimeField(blank=True, null=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Configuracao de Backup",
                "verbose_name_plural": "Configuracoes de Backup",
            },
        ),
        migrations.CreateModel(
            name="BackupArquivo",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("arquivo", models.FileField(upload_to="backups/")),
                ("nome_arquivo", models.CharField(max_length=255)),
                ("tamanho_bytes", models.BigIntegerField(default=0)),
                ("hash_sha256", models.CharField(blank=True, max_length=64)),
                (
                    "origem",
                    models.CharField(
                        choices=[
                            ("manual", "Manual"),
                            ("agendado", "Agendado"),
                            ("upload", "Upload para restauracao"),
                        ],
                        default="manual",
                        max_length=20,
                    ),
                ),
                ("observacao", models.TextField(blank=True)),
                ("restaurado_em", models.DateTimeField(blank=True, null=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                (
                    "criado_por",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="backups_criados",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "restaurado_por",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="backups_restaurados",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Arquivo de Backup",
                "verbose_name_plural": "Arquivos de Backup",
                "ordering": ["-criado_em"],
            },
        ),
    ]
