from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.cadastros.models import Supervisor, Coordenador, Vendedor, TipoBem, COBAN, Consorcio, FaixaComissao
from datetime import date

User = get_user_model()


class Command(BaseCommand):
    help = "Seed initial data for Gestão de Consórcios ERP"

    def handle(self, *args, **options):
        self.stdout.write("Seeding data...")

        if User.objects.filter(username="admin").exists():
            self.stdout.write("Data already seeded. Skipping.")
            return

        admin = User.objects.create_superuser(
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

        user_sup = User.objects.create_user(
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
            nome="Carlos Mendes", cpf="111.111.111-11",
            email="carlos@valoragro.com.br", telefone="(11) 99999-0001",
        )
        coord2 = Coordenador.objects.create(
            supervisor=sup1,
            nome="Ana Paula Lima", cpf="222.222.222-22",
            email="ana@valoragro.com.br", telefone="(11) 99999-0002",
        )

        vend1 = Vendedor.objects.create(nome="João Silva", cpf="333.333.333-33", email="joao@valoragro.com.br", coordenador=coord1)
        vend2 = Vendedor.objects.create(nome="Maria Souza", cpf="444.444.444-44", email="maria@valoragro.com.br", coordenador=coord1)
        vend3 = Vendedor.objects.create(nome="Pedro Costa", cpf="555.555.555-55", email="pedro@valoragro.com.br", coordenador=coord2)

        tipo_imoveis, _ = TipoBem.objects.get_or_create(nome="imoveis", defaults={"descricao": "Bens Imóveis"})
        tipo_moveis, _ = TipoBem.objects.get_or_create(nome="moveis", defaults={"descricao": "Bens Móveis"})
        tipo_outros, _ = TipoBem.objects.get_or_create(nome="outros", defaults={"descricao": "Outros Bens"})

        bbts, _ = COBAN.objects.get_or_create(sigla="BBTS", defaults={"descricao": "BBTS"})
        isf, _ = COBAN.objects.get_or_create(sigla="ISF", defaults={"descricao": "ISF"})

        cons1 = Consorcio.objects.create(
            nome="Consórcio Imóveis Premium BBTS",
            coban=bbts, tipo_bem=tipo_imoveis,
            vigencia_inicio=date(2024, 1, 1), vigencia_fim=date(2026, 12, 31),
            qtd_parcelas=3,
        )
        self._criar_faixa(cons1, 100000, 300000, 1.50, 3, 0.30, 3, 0.15, 3)
        self._criar_faixa(cons1, 300001, 800000, 1.80, 3, 0.36, 3, 0.18, 3)

        cons2 = Consorcio.objects.create(
            nome="Consórcio Veículos ISF",
            coban=isf, tipo_bem=tipo_moveis,
            vigencia_inicio=date(2024, 1, 1), vigencia_fim=date(2026, 12, 31),
            qtd_parcelas=2,
        )
        self._criar_faixa(cons2, 30000, 150000, 0.80, 2, 0.16, 2, 0.08, 2)

        cons3 = Consorcio.objects.create(
            nome="Consórcio Outros Bens BBTS",
            coban=bbts, tipo_bem=tipo_outros,
            vigencia_inicio=date(2024, 1, 1), vigencia_fim=date(2026, 12, 31),
            qtd_parcelas=2,
        )
        self._criar_faixa(cons3, 5000, 100000, 0.70, 2, 0.14, 2, 0.06, 2)

        User.objects.create_user(
            username="carlos", email="carlos.user@valoragro.com.br", password="coord123",
            first_name="Carlos", last_name="Mendes", perfil="coordenador", coordenador_ref=coord1,
        )
        User.objects.create_user(
            username="ana", email="ana.user@valoragro.com.br", password="coord123",
            first_name="Ana Paula", last_name="Lima", perfil="coordenador", coordenador_ref=coord2,
        )
        User.objects.create_user(
            username="joao", email="joao.user@valoragro.com.br", password="vend123",
            first_name="João", last_name="Silva", perfil="vendedor", vendedor_ref=vend1,
        )
        User.objects.create_user(
            username="maria", email="maria.user@valoragro.com.br", password="vend123",
            first_name="Maria", last_name="Souza", perfil="vendedor", vendedor_ref=vend2,
        )
        User.objects.create_user(
            username="pedro", email="pedro.user@valoragro.com.br", password="vend123",
            first_name="Pedro", last_name="Costa", perfil="vendedor", vendedor_ref=vend3,
        )

        self.stdout.write(self.style.SUCCESS("Seed completed successfully!"))
        self.stdout.write("  admin / admin123 (Dev/Admin)")
        self.stdout.write("  roberto / sup123 (Supervisor)")
        self.stdout.write("  carlos / coord123 (Coordenador)")
        self.stdout.write("  ana / coord123 (Coordenador)")
        self.stdout.write("  joao / vend123 (Vendedor)")
        self.stdout.write("  maria / vend123 (Vendedor)")
        self.stdout.write("  pedro / vend123 (Vendedor)")

    def _criar_faixa(
        self,
        consorcio: Consorcio,
        valor_min: float,
        valor_max: float,
        perc_vendedor: float,
        parcelas_vendedor: int,
        perc_coordenador: float,
        parcelas_coordenador: int,
        perc_supervisor: float,
        parcelas_supervisor: int,
    ):
        FaixaComissao.objects.create(
            consorcio=consorcio,
            perfil="vendedor",
            valor_min=valor_min,
            valor_max=valor_max,
            percentual_total=perc_vendedor,
            qtd_parcelas=parcelas_vendedor,
        )
        FaixaComissao.objects.create(
            consorcio=consorcio,
            perfil="coordenador",
            valor_min=valor_min,
            valor_max=valor_max,
            percentual_total=perc_coordenador,
            qtd_parcelas=parcelas_coordenador,
        )
        FaixaComissao.objects.create(
            consorcio=consorcio,
            perfil="supervisor",
            valor_min=valor_min,
            valor_max=valor_max,
            percentual_total=perc_supervisor,
            qtd_parcelas=parcelas_supervisor,
        )
