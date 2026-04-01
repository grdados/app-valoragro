from rest_framework import serializers
from .models import DadosEmpresa


class DadosEmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DadosEmpresa
        fields = "__all__"
        read_only_fields = ["id", "atualizado_em"]
