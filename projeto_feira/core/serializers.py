from django.contrib.auth.models import User, Group
from rest_framework import serializers
from .models import Feira, Produtor, Produto


# ------------------------
# SERIALIZERS PRINCIPAIS
# ------------------------
class FeiraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feira
        fields = ["id", "nome", "cidade", "data"]


class ProdutorSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source="user.username")

    class Meta:
        model = Produtor
        fields = ["id", "username", "nome_fazenda", "cidade"]


class ProdutoSerializer(serializers.ModelSerializer):
    # Para leitura, exibe todos os dados da feira
    feira_detalhes = FeiraSerializer(source="feira", read_only=True)
    # Para escrita, aceita apenas o ID da feira
    feira = serializers.PrimaryKeyRelatedField(queryset=Feira.objects.all())
    prod = ProdutorSerializer(read_only=True)

    class Meta:
        model = Produto
        fields = ["id", "nome", "preco", "feira", "feira_detalhes", "prod"]
        read_only_fields = ["id", "prod", "feira_detalhes"]


# ------------------------
# SERIALIZER DE REGISTRO
# ------------------------
class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=4)
    role = serializers.ChoiceField(choices=[("PRODUTOR", "PRODUTOR"), ("CONSUMIDOR", "CONSUMIDOR")])
    nome_fazenda = serializers.CharField(max_length=120, required=False, allow_blank=True)
    cidade = serializers.CharField(max_length=120, required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nome de usuário já está em uso.")
        return value

    def create(self, validated_data):
        role = validated_data.pop("role")
        nome_fazenda = validated_data.pop("nome_fazenda", "").strip()
        cidade = validated_data.pop("cidade", "").strip()
        password = validated_data.pop("password")

        user = User.objects.create(username=validated_data["username"])
        user.set_password(password)
        user.save()

        consumidores, _ = Group.objects.get_or_create(name="Consumidores")
        produtores, _ = Group.objects.get_or_create(name="Produtores")

        if role == "PRODUTOR":
            user.groups.add(produtores)
            Produtor.objects.create(
                user=user,
                nome_fazenda=nome_fazenda or "Minha Fazenda",
                cidade=cidade or "Cidade"
            )
        else:
            user.groups.add(consumidores)

        return user
