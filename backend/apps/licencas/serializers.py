from rest_framework import serializers
from decimal import Decimal
from .models import Licenca, PagamentoLicenca


class PagamentoLicencaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagamentoLicenca
        fields = "__all__"
        read_only_fields = ["id", "criado_em"]


class LicencaSerializer(serializers.ModelSerializer):
    pagamentos = PagamentoLicencaSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    PLAN_PRICES = {
        "mensal": Decimal("400.00"),
        "semestral": Decimal("2160.00"),
        "anual": Decimal("3990.00"),
    }

    class Meta:
        model = Licenca
        fields = "__all__"
        read_only_fields = ["id", "criado_em", "atualizado_em"]

    def create(self, validated_data):
        plano = validated_data.get("plano", "mensal")
        if plano in self.PLAN_PRICES:
            validated_data["valor_mensalidade"] = self.PLAN_PRICES[plano]
        return super().create(validated_data)

    def update(self, instance, validated_data):
        plano = validated_data.get("plano", instance.plano)
        if plano in self.PLAN_PRICES:
            validated_data["valor_mensalidade"] = self.PLAN_PRICES[plano]
        return super().update(instance, validated_data)
