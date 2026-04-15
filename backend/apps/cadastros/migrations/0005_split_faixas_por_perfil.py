import json
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


def _coerce_percentuais(raw):
    if raw is None:
        return []
    if isinstance(raw, list):
        return raw
    if isinstance(raw, tuple):
        return list(raw)
    if isinstance(raw, str):
        txt = raw.strip()
        if not txt:
            return []
        try:
            val = json.loads(txt)
            if isinstance(val, list):
                return val
        except Exception:
            return []
    return []


def migrar_faixas(apps, schema_editor):
    FaixaComissao = apps.get_model("cadastros", "FaixaComissao")
    FaixaComissaoVendedor = apps.get_model("cadastros", "FaixaComissaoVendedor")
    FaixaComissaoCoordenador = apps.get_model("cadastros", "FaixaComissaoCoordenador")

    connection = schema_editor.connection
    table_name = "cadastros_faixacomissao"

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = %s
            """,
            [table_name],
        )
        columns = {row[0] for row in cursor.fetchall()}

    has_perfil = "perfil" in columns
    has_percentual_total = "percentual_total" in columns
    has_qtd_parcelas = "qtd_parcelas" in columns

    select_cols = ["id", "consorcio_id", "valor_min", "valor_max", "percentuais", "ativo"]
    if has_perfil:
        select_cols.append("perfil")
    if has_percentual_total:
        select_cols.append("percentual_total")
    if has_qtd_parcelas:
        select_cols.append("qtd_parcelas")

    sql = f"SELECT {', '.join(select_cols)} FROM {table_name} ORDER BY id"

    with connection.cursor() as cursor:
        cursor.execute(sql)
        rows = cursor.fetchall()

    idx = {name: i for i, name in enumerate(select_cols)}
    manter_por_chave = {}

    for row in rows:
        faixa_id = row[idx["id"]]
        consorcio_id = row[idx["consorcio_id"]]
        valor_min = row[idx["valor_min"]]
        valor_max = row[idx["valor_max"]]
        ativo = row[idx["ativo"]]

        perfil = row[idx["perfil"]] if has_perfil else "supervisor"
        percentual_total = row[idx["percentual_total"]] if has_percentual_total else None
        qtd_parcelas = row[idx["qtd_parcelas"]] if has_qtd_parcelas else None

        percentuais = _coerce_percentuais(row[idx["percentuais"]])
        if not percentuais:
            percentuais = _build_percentuais(percentual_total, qtd_parcelas)
            FaixaComissao.objects.filter(id=faixa_id).update(percentuais=percentuais)

        if perfil == "vendedor":
            FaixaComissaoVendedor.objects.update_or_create(
                valor_min=valor_min,
                valor_max=valor_max,
                defaults={
                    "percentual_total": Decimal(str(percentual_total or sum(percentuais))),
                    "qtd_parcelas": int(qtd_parcelas or len(percentuais) or 1),
                    "ativo": bool(ativo),
                },
            )
            continue

        if perfil == "coordenador":
            FaixaComissaoCoordenador.objects.update_or_create(
                valor_min=valor_min,
                valor_max=valor_max,
                defaults={
                    "percentual_total": Decimal(str(percentual_total or sum(percentuais))),
                    "qtd_parcelas": int(qtd_parcelas or len(percentuais) or 1),
                    "ativo": bool(ativo),
                },
            )
            continue

        chave = (consorcio_id, valor_min, valor_max)
        if chave not in manter_por_chave:
            manter_por_chave[chave] = faixa_id

    ids_manter = set(manter_por_chave.values())
    if ids_manter:
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
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL("ALTER TABLE cadastros_faixacomissao DROP COLUMN IF EXISTS perfil"),
                migrations.RunSQL("ALTER TABLE cadastros_faixacomissao DROP COLUMN IF EXISTS percentual_total"),
                migrations.RunSQL("ALTER TABLE cadastros_faixacomissao DROP COLUMN IF EXISTS qtd_parcelas"),
            ],
            state_operations=[
                migrations.RemoveField(model_name="faixacomissao", name="perfil"),
                migrations.RemoveField(model_name="faixacomissao", name="percentual_total"),
                migrations.RemoveField(model_name="faixacomissao", name="qtd_parcelas"),
            ],
        ),
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
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterUniqueTogether(
                    name="faixacomissao",
                    unique_together={("consorcio", "valor_min", "valor_max")},
                ),
            ],
        ),
    ]
