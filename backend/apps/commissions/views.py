from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.commissions.models import Commission
from apps.commissions.serializers import CommissionSerializer
from apps.commissions.services import CommissionService

class CommissionViewSet(viewsets.ModelViewSet):
    queryset = Commission.objects.all()
    serializer_class = CommissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        service = CommissionService()
        data = service.get_commission_summary()
        return Response(data)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        service = CommissionService()
        data = service.get_commission_analytics()
        return Response(data)
