from decimal import Decimal
from django.db import migrations, models


def backfill_percentual_total_qtd_parcelas(apps, schema_editor):
    FaixaComissao = apps.get_model("cadastros", "FaixaComissao")
    for faixa in FaixaComissao.objects.all():
        percentuais = faixa.percentuais or []
        if percentuais:
            total = sum(Decimal(str(p)) for p in percentuais)
            faixa.percentual_total = total
            faixa.qtd_parcelas = len(percentuais)
        else:
            faixa.percentual_total = Decimal("0.0001")
            faixa.qtd_parcelas = 1
        faixa.save(update_fields=["percentual_total", "qtd_parcelas"])


class Migration(migrations.Migration):
    dependencies = [
        ("cadastros", "0003_supervisor_coordenador_fk_vendedor_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="faixacomissao",
            name="perfil",
            field=models.CharField(
                choices=[
                    ("vendedor", "Vendedor"),
                    ("coordenador", "Coordenador"),
                    ("supervisor", "Supervisor"),
                ],
                default="vendedor",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="faixacomissao",
            name="percentual_total",
            field=models.DecimalField(decimal_places=4, default=0, max_digits=7),
        ),
        migrations.AddField(
            model_name="faixacomissao",
            name="qtd_parcelas",
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AlterField(
            model_name="faixacomissao",
            name="percentuais",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterModelOptions(
            name="faixacomissao",
            options={
                "ordering": ["consorcio_id", "perfil", "valor_min"],
                "verbose_name": "Faixa de Comissão",
                "verbose_name_plural": "Faixas de Comissão",
            },
        ),
        migrations.AlterUniqueTogether(
            name="faixacomissao",
            unique_together={("consorcio", "perfil", "valor_min", "valor_max")},
        ),
        migrations.RunPython(
            backfill_percentual_total_qtd_parcelas, migrations.RunPython.noop
        ),
    ]
