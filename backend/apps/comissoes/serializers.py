from rest_framework import serializers
from .models import ParcelaComissao, LogAlteracao


class LogAlteracaoSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source="usuario.get_full_name", read_only=True)

    class Meta:
        model = LogAlteracao
        fields = ["id", "status_anterior", "status_novo", "observacao", "data_hora", "usuario_nome"]


class ParcelaComissaoSerializer(serializers.ModelSerializer):
    venda_contrato = serializers.CharField(source="venda.numero_contrato", read_only=True)
    vendedor_nome = serializers.CharField(source="venda.vendedor.nome", read_only=True)
    coordenador_nome = serializers.CharField(source="venda.vendedor.coordenador.nome", read_only=True)
    cliente_nome = serializers.SerializerMethodField()
    logs = LogAlteracaoSerializer(many=True, read_only=True)

    def get_cliente_nome(self, obj):
        return obj.venda.cliente.nome if obj.venda.cliente else ""

    class Meta:
        model = ParcelaComissao
        fields = [
            "id", "venda", "venda_contrato", "vendedor_nome", "coordenador_nome", "cliente_nome",
            "numero_parcela", "data_vencimento", "valor", "percentual",
            "status", "status_contrato_banco", "data_pagamento", "criado_em", "atualizado_em", "logs",
        ]
        read_only_fields = ["id", "criado_em", "atualizado_em"]


class AlterarStatusSerializer(serializers.Serializer):
    STATUS_CHOICES = [("pendente", "Pendente"), ("pago", "Pago"), ("vencido", "Vencido")]
    STATUS_BANCO_CHOICES = [("ok", "OK"), ("inadimplente", "Inadimplente")]
    status = serializers.ChoiceField(choices=STATUS_CHOICES)
    status_contrato_banco = serializers.ChoiceField(choices=STATUS_BANCO_CHOICES, required=False)
    observacao = serializers.CharField(required=False, allow_blank=True, default="")


class GerarComissoesSerializer(serializers.Serializer):
    venda_id = serializers.IntegerField()
