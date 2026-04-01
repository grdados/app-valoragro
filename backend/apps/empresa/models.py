from django.db import models


class DadosEmpresa(models.Model):
    nome = models.CharField(max_length=200)
    cnpj = models.CharField(max_length=18, blank=True)
    endereco = models.CharField(max_length=200, blank=True)
    cidade = models.CharField(max_length=100, blank=True)
    uf = models.CharField(max_length=2, blank=True)
    cep = models.CharField(max_length=9, blank=True)
    telefone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    site = models.CharField(max_length=100, blank=True)
    logo_url = models.CharField(max_length=300, blank=True)
    logo = models.CharField(max_length=500, blank=True, help_text="URL ou path do logotipo da empresa")
    slogan = models.CharField(max_length=200, blank=True)
    responsavel = models.CharField(max_length=200, blank=True)
    texto_recibo = models.TextField(blank=True, help_text="Texto adicional exibido no rodapé dos recibos")
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Dados da Empresa"
        verbose_name_plural = "Dados da Empresa"

    def __str__(self):
        return self.nome
