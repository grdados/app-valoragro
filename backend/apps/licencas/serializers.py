from rest_framework import serializers
from .models import Licenca, PagamentoLicenca


class PagamentoLicencaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagamentoLicenca
        fields = "__all__"
        read_only_fields = ["id", "criado_em"]


class LicencaSerializer(serializers.ModelSerializer):
    pagamentos = PagamentoLicencaSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Licenca
        fields = "__all__"
        read_only_fields = ["id", "criado_em", "atualizado_em"]
