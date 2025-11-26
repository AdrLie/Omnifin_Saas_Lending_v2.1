from rest_framework import serializers
from apps.documents.models import Document, DocumentVerification

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'

class DocumentVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentVerification
        fields = '__all__'
