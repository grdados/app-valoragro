from django.db import migrations, models


def definir_perfil_vendedor(apps, schema_editor):
    ParcelaComissao = apps.get_model('comissoes', 'ParcelaComissao')
    ParcelaComissao.objects.filter(perfil_comissao__isnull=True).update(perfil_comissao='vendedor')


class Migration(migrations.Migration):

    dependencies = [
        ('comissoes', '0002_parcelacomissao_status_contrato_banco'),
    ]

    operations = [
        migrations.AddField(
            model_name='parcelacomissao',
            name='perfil_comissao',
            field=models.CharField(
                choices=[('vendedor', 'Vendedor'), ('coordenador', 'Coordenador'), ('supervisor', 'Supervisor')],
                default='vendedor',
                max_length=20,
            ),
        ),
        migrations.RunPython(definir_perfil_vendedor, migrations.RunPython.noop),
        migrations.AlterUniqueTogether(
            name='parcelacomissao',
            unique_together={('venda', 'perfil_comissao', 'numero_parcela')},
        ),
    ]
