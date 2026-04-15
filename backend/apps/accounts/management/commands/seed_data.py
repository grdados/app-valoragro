from datetime import date

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.cadastros.models import (
    COBAN,
    Coordenador,
    Consorcio,
    FaixaComissao,
    FaixaComissaoCoordenador,
    FaixaComissaoVendedor,
    Supervisor,
    TipoBem,
    Vendedor,
)

User = get_user_model()


class Command(BaseCommand):
    help = "Seed initial data for Gestão de Consórcios ERP"

    def handle(self, *args, **options):
        self.stdout.write("Seeding data...")

        if User.objects.filter(username="admin").exists():
            self.stdout.write("Data already seeded. Skipping.")
            return

        User.objects.create_superuser(
            username="admin",
            email="admin@valoragro.com.br",
            password="admin123",
            first_name="Administrador",
            last_name="Sistema",
            perfil="dev",
        )

        sup1 = Supervisor.objects.create(
            nome="Roberto Alves",
            cpf="000.000.000-00",
            email="roberto@valoragro.com.br",
            telefone="(11) 99999-0000",
        )

        User.objects.create_user(
            username="roberto",
            email="roberto.user@valoragro.com.br",
            password="sup123",
            first_name="Roberto",
            last_name="Alves",
            perfil="supervisor",
            supervisor_ref=sup1,
        )

        coord1 = Coordenador.objects.create(
            supervisor=sup1,
            nome="Carlos Mendes",
            cpf="111.111.111-11",
            email="carlos@valoragro.com.br",
            telefone="(11) 99999-0001",
        )
        coord2 = Coordenador.objects.create(
            supervisor=sup1,
            nome="Ana Paula Lima",
            cpf="222.222.222-22",
            email="ana@valoragro.com.br",
            telefone="(11) 99999-0002",
        )

        vend1 = Vendedor.objects.create(nome="João Silva", cpf="333.333.333-33", email="joao@valoragro.com.br", coordenador=coord1)
        vend2 = Vendedor.objects.create(nome="Maria Souza", cpf="444.444.444-44", email="maria@valoragro.com.br", coordenador=coord1)
        vend3 = Vendedor.objects.create(nome="Pedro Costa", cpf="555.555.555-55", email="pedro@valoragro.com.br", coordenador=coord2)

        tipo_imoveis, _ = TipoBem.objects.get_or_create(nome="imoveis", defaults={"descricao": "Bens Imóveis"})
        tipo_moveis, _ = TipoBem.objects.get_or_create(nome="moveis", defaults={"descricao": "Bens Móveis"})
        tipo_outros, _ = TipoBem.objects.get_or_create(nome="outros", defaults={"descricao": "Outros Bens"})

        bbts, _ = COBAN.objects.get_or_create(sigla="BBTS", defaults={"descricao": "BBTS"})
        isf, _ = COBAN.objects.get_or_create(sigla="ISF", defaults={"descricao": "ISF"})

        Consorcio.objects.create(
            nome="Consórcio Imóveis Premium BBTS",
            coban=bbts,
            tipo_bem=tipo_imoveis,
            vigencia_inicio=date(2024, 1, 1),
            vigencia_fim=date(2028, 12, 31),
            qtd_parcelas=10,
        )
        Consorcio.objects.create(
            nome="Consórcio Veículos ISF",
            coban=isf,
            tipo_bem=tipo_moveis,
            vigencia_inicio=date(2024, 1, 1),
            vigencia_fim=date(2028, 12, 31),
            qtd_parcelas=10,
        )
        Consorcio.objects.create(
            nome="Consórcio Outros Bens BBTS",
            coban=bbts,
            tipo_bem=tipo_outros,
            vigencia_inicio=date(2024, 1, 1),
            vigencia_fim=date(2028, 12, 31),
            qtd_parcelas=10,
        )

        for consorcio in Consorcio.objects.all():
            FaixaComissao.objects.create(
                consorcio=consorcio,
                valor_min=0.01,
                valor_max=500000,
                percentuais=[0.25] * 10,
            )
            FaixaComissao.objects.create(
                consorcio=consorcio,
                valor_min=500000.01,
                valor_max=1500000,
                percentuais=[0.35] * 10,
            )

        FaixaComissaoVendedor.objects.create(valor_min=0.01, valor_max=999999.99, percentual_total=0.8, qtd_parcelas=10)
        FaixaComissaoVendedor.objects.create(valor_min=1000000, valor_max=3500000, percentual_total=1.0, qtd_parcelas=10)
        FaixaComissaoVendedor.objects.create(valor_min=3500000.01, valor_max=999999999.99, percentual_total=1.2, qtd_parcelas=10)

        FaixaComissaoCoordenador.objects.create(valor_min=0.01, valor_max=999999.99, percentual_total=1.0, qtd_parcelas=10)
        FaixaComissaoCoordenador.objects.create(valor_min=1000000, valor_max=3500000, percentual_total=1.0, qtd_parcelas=10)
        FaixaComissaoCoordenador.objects.create(valor_min=3500000.01, valor_max=999999999.99, percentual_total=1.2, qtd_parcelas=10)

        User.objects.create_user(
            username="carlos",
            email="carlos.user@valoragro.com.br",
            password="coord123",
            first_name="Carlos",
            last_name="Mendes",
            perfil="coordenador",
            coordenador_ref=coord1,
        )
        User.objects.create_user(
            username="ana",
            email="ana.user@valoragro.com.br",
            password="coord123",
            first_name="Ana Paula",
            last_name="Lima",
            perfil="coordenador",
            coordenador_ref=coord2,
        )
        User.objects.create_user(
            username="joao",
            email="joao.user@valoragro.com.br",
            password="vend123",
            first_name="João",
            last_name="Silva",
            perfil="vendedor",
            vendedor_ref=vend1,
        )
        User.objects.create_user(
            username="maria",
            email="maria.user@valoragro.com.br",
            password="vend123",
            first_name="Maria",
            last_name="Souza",
            perfil="vendedor",
            vendedor_ref=vend2,
        )
        User.objects.create_user(
            username="pedro",
            email="pedro.user@valoragro.com.br",
            password="vend123",
            first_name="Pedro",
            last_name="Costa",
            perfil="vendedor",
            vendedor_ref=vend3,
        )

        self.stdout.write(self.style.SUCCESS("Seed completed successfully!"))
