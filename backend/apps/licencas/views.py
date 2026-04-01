from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from apps.accounts.permissions import IsDev, IsSupervisorOrAbove
from .models import Licenca, PagamentoLicenca
from .serializers import LicencaSerializer, PagamentoLicencaSerializer


class LicencaViewSet(viewsets.ModelViewSet):
    queryset = Licenca.objects.prefetch_related("pagamentos").all()
    serializer_class = LicencaSerializer

    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [permissions.IsAuthenticated(), IsSupervisorOrAbove()]
        return [permissions.IsAuthenticated(), IsDev()]

    @action(detail=True, methods=["post"], url_path="gerar-faturas")
    def gerar_faturas(self, request, pk=None):
        licenca = self.get_object()
        meses = request.data.get("meses", 12)
        try:
            meses = int(meses)
        except (ValueError, TypeError):
            meses = 12

        geradas = 0
        data_base = licenca.data_inicio
        for i in range(meses):
            competencia_dt = data_base + relativedelta(months=i)
            competencia = competencia_dt.strftime("%Y-%m")
            vencimento = competencia_dt.replace(day=10) + relativedelta(months=1)
            if not PagamentoLicenca.objects.filter(licenca=licenca, competencia=competencia).exists():
                PagamentoLicenca.objects.create(
                    licenca=licenca,
                    competencia=competencia,
                    data_vencimento=vencimento,
                    valor=licenca.valor_mensalidade,
                    status="pendente",
                )
                geradas += 1

        return Response({"geradas": geradas, "mensagem": f"{geradas} fatura(s) gerada(s)."})


class PagamentoLicencaViewSet(viewsets.ModelViewSet):
    queryset = PagamentoLicenca.objects.select_related("licenca").all()
    serializer_class = PagamentoLicencaSerializer

    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [permissions.IsAuthenticated(), IsSupervisorOrAbove()]
        return [permissions.IsAuthenticated(), IsDev()]

    def perform_update(self, serializer):
        instance = serializer.instance
        new_status = serializer.validated_data.get("status", instance.status)
        data_pag = serializer.validated_data.get("data_pagamento", instance.data_pagamento)
        if new_status in ("pendente", "vencido"):
            serializer.validated_data["data_pagamento"] = None
        serializer.save()
