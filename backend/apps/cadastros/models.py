from django.db import models

UF_CHOICES = [
    ("AC", "AC"), ("AL", "AL"), ("AM", "AM"), ("AP", "AP"), ("BA", "BA"), ("CE", "CE"),
    ("DF", "DF"), ("ES", "ES"), ("GO", "GO"), ("MA", "MA"), ("MG", "MG"), ("MS", "MS"),
    ("MT", "MT"), ("PA", "PA"), ("PB", "PB"), ("PE", "PE"), ("PI", "PI"), ("PR", "PR"),
    ("RJ", "RJ"), ("RN", "RN"), ("RO", "RO"), ("RR", "RR"), ("RS", "RS"), ("SC", "SC"),
    ("SE", "SE"), ("SP", "SP"), ("TO", "TO"),
]


class Supervisor(models.Model):
    nome = models.CharField(max_length=200)
    cpf = models.CharField(max_length=14, unique=True)
    email = models.EmailField(unique=True)
    telefone = models.CharField(max_length=20, blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Supervisor"
        verbose_name_plural = "Supervisores"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class Cliente(models.Model):
    SEXO_CHOICES = [("M", "Masculino"), ("F", "Feminino"), ("O", "Outro")]
    ESTADO_CIVIL_CHOICES = [
        ("solteiro", "Solteiro(a)"), ("casado", "Casado(a)"),
        ("divorciado", "Divorciado(a)"), ("viuvo", "Viúvo(a)"),
        ("uniao_estavel", "União Estável"),
    ]
    ESCOLARIDADE_CHOICES = [
        ("fundamental", "Ensino Fundamental"), ("medio", "Ensino Médio"),
        ("superior", "Ensino Superior"), ("pos", "Pós-Graduação"),
    ]
    nome = models.CharField(max_length=200)
    identidade = models.CharField(max_length=30, blank=True)
    cpf = models.CharField(max_length=14, unique=True)
    orgao_emissor = models.CharField(max_length=20, blank=True)
    data_nascimento = models.DateField(null=True, blank=True)
    nacionalidade = models.CharField(max_length=50, blank=True, default="Brasileiro(a)")
    uf = models.CharField(max_length=2, choices=UF_CHOICES, blank=True)
    naturalidade = models.CharField(max_length=100, blank=True)
    sexo = models.CharField(max_length=1, choices=SEXO_CHOICES, blank=True)
    estado_civil = models.CharField(max_length=20, choices=ESTADO_CIVIL_CHOICES, blank=True)
    celular = models.CharField(max_length=20, blank=True)
    escolaridade = models.CharField(max_length=20, choices=ESCOLARIDADE_CHOICES, blank=True)
    profissao = models.CharField(max_length=100, blank=True)
    endereco = models.CharField(max_length=200, blank=True)
    numero = models.CharField(max_length=10, blank=True)
    empresa = models.CharField(max_length=200, blank=True)
    data_admissao = models.DateField(null=True, blank=True)
    renda = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    email = models.EmailField(blank=True)
    conta_bancaria = models.CharField(max_length=20, blank=True)
    agencia = models.CharField(max_length=10, blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ["nome"]

    def __str__(self):
        return f"{self.nome} — {self.cpf}"


class Coordenador(models.Model):
    supervisor = models.ForeignKey(
        Supervisor, on_delete=models.PROTECT, related_name="coordenadores",
        null=True, blank=True
    )
    nome = models.CharField(max_length=200)
    cpf = models.CharField(max_length=14, unique=True)
    email = models.EmailField(unique=True)
    telefone = models.CharField(max_length=20, blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Coordenador"
        verbose_name_plural = "Coordenadores"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class Vendedor(models.Model):
    coordenador = models.ForeignKey(
        Coordenador, on_delete=models.PROTECT, related_name="vendedores"
    )
    nome = models.CharField(max_length=200)
    cpf = models.CharField(max_length=14, unique=True)
    email = models.EmailField(unique=True)
    telefone = models.CharField(max_length=20, blank=True)
    foto = models.CharField(
        max_length=500, blank=True,
        default="/media/vendedores/default.png"
    )
    cidade = models.CharField(max_length=100, blank=True)
    uf = models.CharField(max_length=2, choices=UF_CHOICES, blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Vendedor"
        verbose_name_plural = "Vendedores"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class TipoBem(models.Model):
    TIPO_CHOICES = [
        ("imoveis", "Bens Imóveis"),
        ("moveis", "Bens Móveis"),
        ("outros", "Outros Bens"),
    ]
    nome = models.CharField(max_length=50, choices=TIPO_CHOICES, unique=True)
    descricao = models.CharField(max_length=100, blank=True)
    ativo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Tipo de Bem"
        verbose_name_plural = "Tipos de Bem"

    def __str__(self):
        return self.get_nome_display()


class COBAN(models.Model):
    SIGLA_CHOICES = [
        ("BBTS", "BBTS"),
        ("ISF", "ISF"),
    ]
    sigla = models.CharField(max_length=10, choices=SIGLA_CHOICES, unique=True)
    descricao = models.CharField(max_length=100, blank=True)
    ativo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "COBAN"
        verbose_name_plural = "COBANs"

    def __str__(self):
        return self.sigla


class Consorcio(models.Model):
    nome = models.CharField(max_length=200)
    coban = models.ForeignKey(COBAN, on_delete=models.PROTECT, related_name="consorcios")
    tipo_bem = models.ForeignKey(TipoBem, on_delete=models.PROTECT, related_name="consorcios")
    vigencia_inicio = models.DateField()
    vigencia_fim = models.DateField()
    qtd_parcelas = models.PositiveIntegerField()
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Consórcio"
        verbose_name_plural = "Consórcios"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class FaixaComissao(models.Model):
    consorcio = models.ForeignKey(
        Consorcio, on_delete=models.CASCADE, related_name="faixas"
    )
    valor_min = models.DecimalField(max_digits=15, decimal_places=2)
    valor_max = models.DecimalField(max_digits=15, decimal_places=2)
    percentuais = models.JSONField(
        help_text="Lista de percentuais por parcela. Ex: [0.5, 0.5, 0.5] para 3 parcelas"
    )
    ativo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Faixa de Comissão"
        verbose_name_plural = "Faixas de Comissão"
        ordering = ["consorcio_id", "valor_min"]
        unique_together = [["consorcio", "valor_min", "valor_max"]]

    def __str__(self):
        return f"{self.consorcio} | R$ {self.valor_min} - R$ {self.valor_max}"


class FaixaComissaoVendedor(models.Model):
    valor_min = models.DecimalField(max_digits=15, decimal_places=2)
    valor_max = models.DecimalField(max_digits=15, decimal_places=2)
    percentual_total = models.DecimalField(max_digits=7, decimal_places=4)
    qtd_parcelas = models.PositiveIntegerField(default=10)
    ativo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Faixa de Comissão do Vendedor"
        verbose_name_plural = "Faixas de Comissão do Vendedor"
        ordering = ["valor_min"]
        unique_together = [["valor_min", "valor_max"]]

    def __str__(self):
        return f"Vendedor | R$ {self.valor_min} - R$ {self.valor_max}"


class FaixaComissaoCoordenador(models.Model):
    valor_min = models.DecimalField(max_digits=15, decimal_places=2)
    valor_max = models.DecimalField(max_digits=15, decimal_places=2)
    percentual_total = models.DecimalField(max_digits=7, decimal_places=4)
    qtd_parcelas = models.PositiveIntegerField(default=10)
    ativo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Faixa de Comissão do Coordenador"
        verbose_name_plural = "Faixas de Comissão do Coordenador"
        ordering = ["valor_min"]
        unique_together = [["valor_min", "valor_max"]]

    def __str__(self):
        return f"Coordenador | R$ {self.valor_min} - R$ {self.valor_max}"


class Assembleia(models.Model):
    consorcio = models.ForeignKey(
        Consorcio, on_delete=models.CASCADE, related_name="assembleias"
    )
    data_assembleia = models.DateField()
    descricao = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name = "Assembleia"
        verbose_name_plural = "Assembleias"
        ordering = ["-data_assembleia"]

    def __str__(self):
        return f"{self.consorcio} - {self.data_assembleia}"
