from rest_framework import serializers
from .models import Supervisor, Cliente, Coordenador, Vendedor, TipoBem, COBAN, Consorcio, FaixaComissao, Assembleia


class SupervisorSerializer(serializers.ModelSerializer):
    total_coordenadores = serializers.SerializerMethodField()

    class Meta:
        model = Supervisor
        fields = ["id", "nome", "cpf", "email", "telefone", "ativo", "criado_em", "total_coordenadores"]
        read_only_fields = ["id", "criado_em"]

    def get_total_coordenadores(self, obj):
        return obj.coordenadores.filter(ativo=True).count()


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = [
            "id", "nome", "identidade", "cpf", "orgao_emissor", "data_nascimento",
            "nacionalidade", "uf", "naturalidade", "sexo", "estado_civil", "celular",
            "escolaridade", "profissao", "endereco", "numero", "empresa", "data_admissao",
            "renda", "email", "conta_bancaria", "agencia", "ativo", "criado_em",
        ]
        read_only_fields = ["id", "criado_em"]


class CoordenadorSerializer(serializers.ModelSerializer):
    total_vendedores = serializers.SerializerMethodField()
    supervisor_nome = serializers.CharField(source="supervisor.nome", read_only=True)

    class Meta:
        model = Coordenador
        fields = [
            "id", "supervisor", "supervisor_nome", "nome", "cpf", "email",
            "telefone", "ativo", "criado_em", "total_vendedores",
        ]
        read_only_fields = ["id", "criado_em"]

    def get_total_vendedores(self, obj):
        return obj.vendedores.filter(ativo=True).count()

    def validate(self, attrs):
        supervisor = attrs.get("supervisor", getattr(self.instance, "supervisor", None))
        if not supervisor:
            raise serializers.ValidationError(
                {"supervisor": "Coordenador deve estar vinculado a um supervisor."}
            )
        return attrs


class VendedorSerializer(serializers.ModelSerializer):
    coordenador_nome = serializers.CharField(source="coordenador.nome", read_only=True)

    class Meta:
        model = Vendedor
        fields = [
            "id", "coordenador", "coordenador_nome", "nome", "cpf", "email",
            "telefone", "foto", "cidade", "uf", "ativo", "criado_em",
        ]
        read_only_fields = ["id", "criado_em"]


class PublicVendedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendedor
        fields = ["id", "nome", "email", "telefone", "foto", "cidade", "uf"]


class TipoBemSerializer(serializers.ModelSerializer):
    nome_display = serializers.CharField(source="get_nome_display", read_only=True)

    class Meta:
        model = TipoBem
        fields = ["id", "nome", "nome_display", "descricao", "ativo"]


class COBANSerializer(serializers.ModelSerializer):
    class Meta:
        model = COBAN
        fields = ["id", "sigla", "descricao", "ativo"]


class FaixaComissaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FaixaComissao
        fields = ["id", "consorcio", "valor_min", "valor_max", "percentuais", "ativo"]

    def validate_percentuais(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Percentuais deve ser uma lista.")
        if not all(isinstance(p, (int, float)) for p in value):
            raise serializers.ValidationError("Todos os percentuais devem ser números.")
        return value


class AssembleiaSerializer(serializers.ModelSerializer):
    consorcio_nome = serializers.CharField(source="consorcio.nome", read_only=True)

    class Meta:
        model = Assembleia
        fields = ["id", "consorcio", "consorcio_nome", "data_assembleia", "descricao"]


class ConsorcioSerializer(serializers.ModelSerializer):
    coban_sigla = serializers.CharField(source="coban.sigla", read_only=True)
    tipo_bem_nome = serializers.CharField(source="tipo_bem.get_nome_display", read_only=True)
    faixas = FaixaComissaoSerializer(many=True, read_only=True)
    assembleias = AssembleiaSerializer(many=True, read_only=True)

    class Meta:
        model = Consorcio
        fields = [
            "id", "nome", "coban", "coban_sigla", "tipo_bem", "tipo_bem_nome",
            "vigencia_inicio", "vigencia_fim", "qtd_parcelas", "ativo", "criado_em",
            "faixas", "assembleias",
        ]
        read_only_fields = ["id", "criado_em"]
