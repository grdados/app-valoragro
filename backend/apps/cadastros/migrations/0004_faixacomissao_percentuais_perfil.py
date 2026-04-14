from django.db import migrations, models


def preencher_percentuais_por_perfil(apps, schema_editor):
    FaixaComissao = apps.get_model('cadastros', 'FaixaComissao')
    for faixa in FaixaComissao.objects.all():
        base = faixa.percentuais or []
        faixa.percentuais_vendedor = list(base)
        faixa.percentuais_coordenador = list(base)
        faixa.percentuais_supervisor = list(base)
        faixa.save(update_fields=['percentuais_vendedor', 'percentuais_coordenador', 'percentuais_supervisor'])


class Migration(migrations.Migration):

    dependencies = [
        ('cadastros', '0003_supervisor_coordenador_fk_vendedor_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='faixacomissao',
            name='percentuais_coordenador',
            field=models.JSONField(default=list, help_text='Percentuais por parcela para o perfil coordenador.'),
        ),
        migrations.AddField(
            model_name='faixacomissao',
            name='percentuais_supervisor',
            field=models.JSONField(default=list, help_text='Percentuais por parcela para o perfil supervisor.'),
        ),
        migrations.AddField(
            model_name='faixacomissao',
            name='percentuais_vendedor',
            field=models.JSONField(default=list, help_text='Percentuais por parcela para o perfil vendedor.'),
        ),
        migrations.RunPython(preencher_percentuais_por_perfil, migrations.RunPython.noop),
    ]
