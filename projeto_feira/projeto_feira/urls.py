from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from core.views import FeiraViewSet, ProdutorViewSet, ProdutoViewSet,  RegisterView
from core.views import WhoAmIView

router = DefaultRouter()
router.register(r"feiras", FeiraViewSet, basename="feira")
router.register(r"produtores", ProdutorViewSet, basename="produtor")
router.register(r"produtos", ProdutoViewSet, basename="produto")
from core.views import UserManagementViewSet

user_mgmt = UserManagementViewSet.as_view({
    "get": "list",
    "delete": "destroy"
})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/register/", RegisterView.as_view()),
    path("api/whoami/", WhoAmIView.as_view()),
    path("api/users/", user_mgmt, name="user-list"),
    path("api/users/<int:pk>/", user_mgmt, name="user-delete"),
    path('api/api-token-auth/', obtain_auth_token, name='api_token_auth'), 
]