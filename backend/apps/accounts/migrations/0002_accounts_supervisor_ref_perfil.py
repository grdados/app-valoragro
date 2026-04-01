import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('cadastros', '0003_supervisor_coordenador_fk_vendedor_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='perfil',
            field=models.CharField(
                choices=[
                    ('dev', 'Desenvolvedor'),
                    ('supervisor', 'Supervisor'),
                    ('coordenador', 'Coordenador'),
                    ('vendedor', 'Vendedor'),
                ],
                default='vendedor',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='supervisor_ref',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='usuarios',
                to='cadastros.supervisor',
            ),
        ),
    ]
