from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("cadastros", "0005_split_faixas_por_perfil"),
        ("comissoes", "0003_parcelacomissao_perfil_comissao"),
    ]

    operations = [
        migrations.CreateModel(
            name="BonusMensalCoordenador",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("ano", models.PositiveIntegerField()),
                ("mes", models.PositiveIntegerField()),
                ("total_vendas_mes", models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ("percentual_bonus", models.DecimalField(decimal_places=4, default=0, max_digits=7)),
                ("valor_bonus", models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                (
                    "coordenador",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="bonus_mensais",
                        to="cadastros.coordenador",
                    ),
                ),
            ],
            options={
                "verbose_name": "Bônus Mensal do Coordenador",
                "verbose_name_plural": "Bônus Mensal do Coordenador",
                "ordering": ["-ano", "-mes", "coordenador__nome"],
                "unique_together": {("coordenador", "ano", "mes")},
            },
        ),
    ]
