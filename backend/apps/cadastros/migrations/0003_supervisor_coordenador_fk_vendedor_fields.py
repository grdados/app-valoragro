import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cadastros', '0002_cliente'),
    ]

    operations = [
        migrations.CreateModel(
            name='Supervisor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=200)),
                ('cpf', models.CharField(max_length=14, unique=True)),
                ('email', models.EmailField(unique=True)),
                ('telefone', models.CharField(blank=True, max_length=20)),
                ('ativo', models.BooleanField(default=True)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Supervisor',
                'verbose_name_plural': 'Supervisores',
                'ordering': ['nome'],
            },
        ),
        migrations.AddField(
            model_name='coordenador',
            name='supervisor',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='coordenadores',
                to='cadastros.supervisor',
            ),
        ),
        migrations.AddField(
            model_name='vendedor',
            name='foto',
            field=models.CharField(blank=True, default='/media/vendedores/default.png', max_length=500),
        ),
        migrations.AddField(
            model_name='vendedor',
            name='cidade',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='vendedor',
            name='uf',
            field=models.CharField(
                blank=True, max_length=2,
                choices=[
                    ('AC','AC'),('AL','AL'),('AM','AM'),('AP','AP'),('BA','BA'),('CE','CE'),
                    ('DF','DF'),('ES','ES'),('GO','GO'),('MA','MA'),('MG','MG'),('MS','MS'),
                    ('MT','MT'),('PA','PA'),('PB','PB'),('PE','PE'),('PI','PI'),('PR','PR'),
                    ('RJ','RJ'),('RN','RN'),('RO','RO'),('RR','RR'),('RS','RS'),('SC','SC'),
                    ('SE','SE'),('SP','SP'),('TO','TO'),
                ],
            ),
        ),
    ]
