from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Document
from .serializers import DocumentSerializer
from .services import DocumentService

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        service = DocumentService()
        data = service.get_document_stats()
        return Response(data)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        status = request.data.get('status')
        notes = request.data.get('notes')
        service = DocumentService()
        result = service.verify_document(pk, status, notes)
        return Response(result)
