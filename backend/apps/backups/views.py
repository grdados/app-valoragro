from pathlib import Path

from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.permissions import IsSupervisorOrAbove

from .models import BackupArquivo
from .serializers import BackupArquivoSerializer, BackupSettingsSerializer
from .services import (
    cleanup_old_backups,
    create_backup_archive,
    get_or_create_settings,
    process_scheduled_backups,
    restore_from_backup,
    restore_from_uploaded_file,
)


class BackupViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BackupArquivo.objects.select_related("criado_por", "restaurado_por")
    serializer_class = BackupArquivoSerializer
    permission_classes = [permissions.IsAuthenticated, IsSupervisorOrAbove]

    @action(detail=False, methods=["get", "put"], url_path="configuracao")
    def configuracao(self, request):
        config = get_or_create_settings()
        if request.method == "GET":
            return Response(BackupSettingsSerializer(config).data)

        serializer = BackupSettingsSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        if config.ativo:
            config.proxima_execucao = config.calcular_proxima_execucao(referencia=timezone.now())
        else:
            config.proxima_execucao = None
        config.save(update_fields=["proxima_execucao", "atualizado_em"])
        return Response(BackupSettingsSerializer(config).data)

    @action(detail=False, methods=["post"], url_path="gerar")
    def gerar(self, request):
        registro = create_backup_archive(
            criado_por=request.user,
            origem=BackupArquivo.ORIGEM_MANUAL,
            observacao="Backup gerado manualmente no painel",
        )
        config = get_or_create_settings()
        cleanup_old_backups(config.manter_dias)
        data = BackupArquivoSerializer(registro, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)

    @action(
        detail=False,
        methods=["post"],
        url_path="restaurar",
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def restaurar(self, request):
        backup_id = request.data.get("backup_id")
        arquivo = request.FILES.get("arquivo")

        if not backup_id and not arquivo:
            return Response(
                {"detail": "Informe backup_id ou envie arquivo para restauracao."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if backup_id:
            try:
                registro = BackupArquivo.objects.get(pk=backup_id)
            except BackupArquivo.DoesNotExist:
                return Response({"detail": "Backup nao encontrado."}, status=status.HTTP_404_NOT_FOUND)

            if not registro.arquivo:
                return Response(
                    {"detail": "Backup sem arquivo associado."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            restore_from_backup(backup_path=Path(registro.arquivo.path), restaurado_por=request.user)
            registro.restaurado_em = timezone.now()
            registro.restaurado_por = request.user
            registro.save(update_fields=["restaurado_em", "restaurado_por"])
            return Response({"detail": "Backup restaurado com sucesso."})

        restore_from_uploaded_file(uploaded_file=arquivo, restaurado_por=request.user)
        return Response({"detail": "Backup enviado e restaurado com sucesso."})

    @action(detail=False, methods=["post"], url_path="processar-agendados")
    def processar_agendados(self, request):
        resultado = process_scheduled_backups(actor=request.user)
        return Response(resultado)

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        registro = self.get_object()
        if not registro.arquivo:
            raise Http404("Arquivo nao encontrado")
        response = FileResponse(registro.arquivo.open("rb"), as_attachment=True)
        response["Content-Disposition"] = f'attachment; filename="{registro.nome_arquivo}"'
        return response
