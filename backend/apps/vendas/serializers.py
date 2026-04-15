from rest_framework import serializers

from apps.cadastros.models import Consorcio
from .models import Venda
from .services import (
    identificar_faixa,
    calcular_primeiro_vencimento,
    calcular_plano_parcelas,
    obter_indice_faixa_supervisor,
)


class VendaSerializer(serializers.ModelSerializer):
    vendedor_nome = serializers.CharField(source="vendedor.nome", read_only=True)
    cliente_nome = serializers.CharField(source="cliente.nome", read_only=True, default="")
    coban_sigla = serializers.CharField(source="coban.sigla", read_only=True)
    tipo_bem_nome = serializers.SerializerMethodField()
    consorcio_nome = serializers.CharField(source="consorcio.nome", read_only=True)
    coordenador_nome = serializers.CharField(source="vendedor.coordenador.nome", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    def get_tipo_bem_nome(self, obj):
        return obj.tipo_bem.get_nome_display() if obj.tipo_bem else ""

    class Meta:
        model = Venda
        fields = [
            "id", "data_venda", "numero_contrato", "cliente", "cliente_nome",
            "vendedor", "vendedor_nome", "coban", "coban_sigla", "tipo_bem", "tipo_bem_nome",
            "valor_bem", "consorcio", "consorcio_nome", "valor_total_comissao",
            "status", "status_display", "coordenador_nome", "criado_em", "atualizado_em",
        ]
        read_only_fields = ["id", "valor_total_comissao", "criado_em", "atualizado_em"]


class AlterarStatusVendaSerializer(serializers.Serializer):
    STATUS_CHOICES = [("a_contemplar", "A Contemplar"), ("contemplado", "Contemplado"), ("cancelada", "Cancelada")]
    status = serializers.ChoiceField(choices=STATUS_CHOICES)


class VendaPreviewSerializer(serializers.Serializer):
    data_venda = serializers.DateField()
    coban = serializers.CharField()
    tipo_bem = serializers.CharField()
    valor_bem = serializers.DecimalField(max_digits=15, decimal_places=2)
    consorcio_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        data_venda = attrs["data_venda"]
        coban = attrs["coban"]
        tipo_bem = attrs["tipo_bem"]
        valor_bem = attrs["valor_bem"]

        consorcios_base = Consorcio.objects.filter(
            coban__sigla=coban,
            tipo_bem__nome=tipo_bem,
            vigencia_inicio__lte=data_venda,
            vigencia_fim__gte=data_venda,
            ativo=True,
        )

        faixa, consorcios = identificar_faixa(coban, tipo_bem, valor_bem, data_venda)

        if not consorcios:
            if consorcios_base.exists():
                raise serializers.ValidationError(
                    "Consórcio encontrado, mas sem faixa de comissão do Supervisor para o valor informado."
                )
            raise serializers.ValidationError(
                "Nenhum consórcio encontrado para os parâmetros informados."
            )

        attrs["_faixa"] = faixa
        attrs["_consorcios"] = consorcios

        if attrs.get("consorcio_id") is not None:
            try:
                consorcio = Consorcio.objects.get(id=attrs["consorcio_id"])
            except Consorcio.DoesNotExist as exc:
                raise serializers.ValidationError("Consórcio não encontrado.") from exc

            primeiro_vencimento = calcular_primeiro_vencimento(data_venda, consorcio)
            indice_faixa = obter_indice_faixa_supervisor(consorcio, valor_bem)
            # A prévia da venda sempre mostra a comissão do vendedor.
            parcelas, total = calcular_plano_parcelas(
                valor_bem,
                consorcio,
                primeiro_vencimento,
                perfil="vendedor",
                indice_faixa=indice_faixa,
            )
            if not parcelas:
                raise serializers.ValidationError(
                    "Consórcio encontrado, mas sem faixa de comissão do Vendedor para o valor informado."
                )
            attrs["_parcelas"] = parcelas
            attrs["_total"] = total
            attrs["_primeiro_vencimento"] = primeiro_vencimento
            attrs["_consorcio"] = consorcio

        return attrs
