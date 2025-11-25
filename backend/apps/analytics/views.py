from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.analytics.models import Event
from apps.analytics.serializers import EventSerializer
from apps.analytics.services import AnalyticsService

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        # Example: return dashboard metrics
        service = AnalyticsService()
        metrics = service.get_dashboard_metrics()
        return Response(metrics)

    @action(detail=False, methods=['get'])
    def lender_performance(self, request):
        service = AnalyticsService()
        data = service.get_lender_performance()
        return Response(data)

    @action(detail=False, methods=['get'])
    def funnel(self, request):
        service = AnalyticsService()
        data = service.get_application_funnel()
        return Response(data)

    @action(detail=False, methods=['get'])
    def user_activity(self, request):
        user_id = request.query_params.get('user_id')
        service = AnalyticsService()
        data = service.get_user_activity(user_id)
        return Response(data)
