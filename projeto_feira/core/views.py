from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User, Group
from rest_framework.permissions import IsAuthenticated, BasePermission

from .models import Feira, Produtor, Produto
from .serializers import FeiraSerializer, ProdutorSerializer, ProdutoSerializer, RegisterSerializer
from .permissions import LeituraPermitida, PodeEditar, PodeExcluir


# ------------------------
# VIEWSETS PRINCIPAIS
# ------------------------
class FeiraViewSet(viewsets.ModelViewSet):
    queryset = Feira.objects.all().order_by("-data")
    serializer_class = FeiraSerializer
    permission_classes = [LeituraPermitida]


class ProdutorViewSet(viewsets.ModelViewSet):
    queryset = Produtor.objects.all()
    serializer_class = ProdutorSerializer
    permission_classes = [LeituraPermitida]


class ProdutoViewSet(viewsets.ModelViewSet):
    serializer_class = ProdutoSerializer
    permission_classes = [LeituraPermitida & PodeEditar & PodeExcluir]

    def get_queryset(self):
        """
        Lista pública com filtros por nome e preço máximo.
        """
        qs = Produto.objects.select_related("feira", "prod", "prod__user").all()
        nome = self.request.query_params.get("nome")
        preco_max = self.request.query_params.get("preco_max")

        if nome:
            qs = qs.filter(nome__icontains=nome)
        if preco_max:
            qs = qs.filter(preco__lte=preco_max)

        # 🔹 Se for produtor logado, retorna apenas os produtos dele no painel
        if self.action in ["list", "meus"] and self.request.user.is_authenticated:
            if self.request.user.groups.filter(name="Produtores").exists():
                qs = qs.filter(prod__user=self.request.user)
        return qs

    def perform_create(self, serializer):
        """
        Define automaticamente o produtor com base no usuário logado
        e associa a feira enviada no payload.
        """
        try:
            produtor = Produtor.objects.get(user=self.request.user)
        except Produtor.DoesNotExist:
            raise serializers.ValidationError({"detail": "Usuário não é um produtor."})

        feira_id = self.request.data.get("feira")
        if not feira_id:
            raise serializers.ValidationError({"feira": "Campo obrigatório."})

        try:
            feira = Feira.objects.get(pk=feira_id)
        except Feira.DoesNotExist:
            raise serializers.ValidationError({"feira": "Feira não encontrada."})

        serializer.save(prod=produtor, feira=feira)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def meus(self, request):
        """Lista produtos do produtor logado."""
        qs = self.get_queryset().filter(prod__user=request.user)
        return Response(self.get_serializer(qs, many=True).data)


# ------------------------
# VIEW DE REGISTRO DE USUÁRIO
# ------------------------
class RegisterView(APIView):
    """
    Endpoint público para cadastro de usuários.
    Cria o usuário e apenas retorna mensagem de sucesso (sem login automático).
    """
    permission_classes = []  # público

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    "message": "Usuário criado com sucesso!",
                    "username": user.username,
                    "groups": list(user.groups.values_list("name", flat=True))
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WhoAmIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        grupos = list(user.groups.values_list("name", flat=True))
        return Response({
            "username": user.username,
            "groups": grupos,
            "is_superuser": user.is_superuser,
        })


# ------------------------
# VIEW DO MODERADOR
# ------------------------
class IsModerador(BasePermission):
    """Permite acesso apenas a usuários do grupo Moderadores ou superusuário."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or request.user.groups.filter(name="Moderadores").exists())
        )


class UserManagementViewSet(viewsets.ViewSet):
    permission_classes = [IsModerador]

    def list(self, request):
        """Lista usuários comuns (Consumidores e Produtores)."""
        users = User.objects.exclude(is_superuser=True)
        data = []
        for user in users:
            grupos = list(user.groups.values_list("name", flat=True))
            data.append({
                "id": user.id,
                "username": user.username,
                "groups": grupos,
            })
        return Response(data)

    def destroy(self, request, pk=None):
        """Permite excluir um usuário (Consumidor ou Produtor)."""
        try:
            user = User.objects.get(pk=pk)
            if user.is_superuser:
                return Response({"error": "Não é permitido excluir superusuário."}, status=status.HTTP_403_FORBIDDEN)
            user.delete()
            return Response({"message": "Usuário excluído com sucesso."}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)
