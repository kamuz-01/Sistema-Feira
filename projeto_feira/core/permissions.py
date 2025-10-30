from rest_framework.permissions import BasePermission, SAFE_METHODS

from rest_framework import permissions

class LeituraPermitida(permissions.BasePermission):
    """
    Permite leitura a qualquer usuário (público),
    mas exige autenticação para escrita.
    """
    def has_permission(self, request, view):
        # Libera qualquer GET, HEAD, OPTIONS
        if request.method in permissions.SAFE_METHODS:
            return True
        # Bloqueia escrita se não estiver logado
        return request.user and request.user.is_authenticated


class PodeEditar(permissions.BasePermission):
    """
    Permite editar apenas objetos do produtor logado.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(obj, "prod") and obj.prod.user == request.user


class PodeExcluir(permissions.BasePermission):
    """
    Permite excluir apenas objetos do produtor logado.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(obj, "prod") and obj.prod.user == request.user
