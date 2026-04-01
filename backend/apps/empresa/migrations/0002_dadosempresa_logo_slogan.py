from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('empresa', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='dadosempresa',
            name='logo',
            field=models.CharField(blank=True, help_text='URL ou path do logotipo da empresa', max_length=500),
        ),
        migrations.AddField(
            model_name='dadosempresa',
            name='slogan',
            field=models.CharField(blank=True, max_length=200),
        ),
    ]
