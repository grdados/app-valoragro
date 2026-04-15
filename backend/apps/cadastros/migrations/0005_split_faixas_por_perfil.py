from decimal import Decimal, ROUND_HALF_UP

from django.db import migrations, models


def _build_percentuais(total, qtd):
    qtd = max(int(qtd or 1), 1)
    total = Decimal(str(total or 0))
    if total <= 0:
        total = Decimal("0.0001")

    base = (total / Decimal(qtd)).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    percentuais = [base for _ in range(qtd)]
    diff = (total - sum(percentuais)).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    percentuais[-1] = (percentuais[-1] + diff).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    return [float(p) for p in percentuais]


def migrar_faixas(apps, schema_editor):
    FaixaComissao = apps.get_model("cadastros", "FaixaComissao")
    FaixaComissaoVendedor = apps.get_model("cadastros", "FaixaComissaoVendedor")
    FaixaComissaoCoordenador = apps.get_model("cadastros", "FaixaComissaoCoordenador")

    faixas = list(FaixaComissao.objects.all().order_by("id"))
    manter_por_chave = {}

    for faixa in faixas:
        perfil = getattr(faixa, "perfil", "supervisor")
        percentuais = list(getattr(faixa, "percentuais", []) or [])
        if not percentuais:
            percentuais = _build_percentuais(
                getattr(faixa, "percentual_total", 0),
                getattr(faixa, "qtd_parcelas", 1),
            )
            faixa.percentuais = percentuais
            faixa.save(update_fields=["percentuais"])

        if perfil == "vendedor":
            FaixaComissaoVendedor.objects.update_or_create(
                valor_min=faixa.valor_min,
                valor_max=faixa.valor_max,
                defaults={
                    "percentual_total": getattr(faixa, "percentual_total", sum(percentuais)),
                    "qtd_parcelas": getattr(faixa, "qtd_parcelas", len(percentuais) or 1),
                    "ativo": faixa.ativo,
                },
            )
            continue

        if perfil == "coordenador":
            FaixaComissaoCoordenador.objects.update_or_create(
                valor_min=faixa.valor_min,
                valor_max=faixa.valor_max,
                defaults={
                    "percentual_total": getattr(faixa, "percentual_total", sum(percentuais)),
                    "qtd_parcelas": getattr(faixa, "qtd_parcelas", len(percentuais) or 1),
                    "ativo": faixa.ativo,
                },
            )
            continue

        chave = (faixa.consorcio_id, faixa.valor_min, faixa.valor_max)
        if chave not in manter_por_chave:
            manter_por_chave[chave] = faixa.id

    ids_manter = set(manter_por_chave.values())
    FaixaComissao.objects.exclude(id__in=ids_manter).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("cadastros", "0004_faixacomissao_percentuais_perfil"),
    ]

    operations = [
        migrations.CreateModel(
            name="FaixaComissaoCoordenador",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("valor_min", models.DecimalField(decimal_places=2, max_digits=15)),
                ("valor_max", models.DecimalField(decimal_places=2, max_digits=15)),
                ("percentual_total", models.DecimalField(decimal_places=4, max_digits=7)),
                ("qtd_parcelas", models.PositiveIntegerField(default=10)),
                ("ativo", models.BooleanField(default=True)),
            ],
            options={
                "verbose_name": "Faixa de Comissão do Coordenador",
                "verbose_name_plural": "Faixas de Comissão do Coordenador",
                "ordering": ["valor_min"],
                "unique_together": {("valor_min", "valor_max")},
            },
        ),
        migrations.CreateModel(
            name="FaixaComissaoVendedor",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("valor_min", models.DecimalField(decimal_places=2, max_digits=15)),
                ("valor_max", models.DecimalField(decimal_places=2, max_digits=15)),
                ("percentual_total", models.DecimalField(decimal_places=4, max_digits=7)),
                ("qtd_parcelas", models.PositiveIntegerField(default=10)),
                ("ativo", models.BooleanField(default=True)),
            ],
            options={
                "verbose_name": "Faixa de Comissão do Vendedor",
                "verbose_name_plural": "Faixas de Comissão do Vendedor",
                "ordering": ["valor_min"],
                "unique_together": {("valor_min", "valor_max")},
            },
        ),
        migrations.RunPython(migrar_faixas, migrations.RunPython.noop),
        migrations.RemoveField(model_name="faixacomissao", name="perfil"),
        migrations.RemoveField(model_name="faixacomissao", name="percentual_total"),
        migrations.RemoveField(model_name="faixacomissao", name="qtd_parcelas"),
        migrations.AlterField(
            model_name="faixacomissao",
            name="percentuais",
            field=models.JSONField(
                help_text="Lista de percentuais por parcela. Ex: [0.5, 0.5, 0.5] para 3 parcelas"
            ),
        ),
        migrations.AlterModelOptions(
            name="faixacomissao",
            options={
                "ordering": ["consorcio_id", "valor_min"],
                "verbose_name": "Faixa de Comissão",
                "verbose_name_plural": "Faixas de Comissão",
            },
        ),
        migrations.AlterUniqueTogether(
            name="faixacomissao",
            unique_together={("consorcio", "valor_min", "valor_max")},
        ),
    ]
