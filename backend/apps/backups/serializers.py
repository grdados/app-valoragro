from rest_framework import serializers

from .models import BackupArquivo, BackupSettings


class BackupSettingsSerializer(serializers.ModelSerializer):
    hora_execucao = serializers.TimeField(format="%H:%M", input_formats=["%H:%M", "%H:%M:%S"])

    class Meta:
        model = BackupSettings
        fields = [
            "ativo",
            "hora_execucao",
            "manter_dias",
            "ultima_execucao",
            "proxima_execucao",
            "atualizado_em",
        ]


class BackupArquivoSerializer(serializers.ModelSerializer):
    origem_display = serializers.CharField(source="get_origem_display", read_only=True)
    criado_por_nome = serializers.CharField(source="criado_por.get_full_name", read_only=True)
    restaurado_por_nome = serializers.CharField(source="restaurado_por.get_full_name", read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = BackupArquivo
        fields = [
            "id",
            "nome_arquivo",
            "arquivo",
            "download_url",
            "tamanho_bytes",
            "hash_sha256",
            "origem",
            "origem_display",
            "observacao",
            "criado_por",
            "criado_por_nome",
            "restaurado_em",
            "restaurado_por",
            "restaurado_por_nome",
            "criado_em",
        ]
        read_only_fields = fields

    def get_download_url(self, obj):
        request = self.context.get("request")
        if not request:
            return None
        return request.build_absolute_uri(f"/api/backups/{obj.pk}/download/")
