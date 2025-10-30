from django.db import models
from django.contrib.auth.models import User

class Feira(models.Model):
    nome = models.CharField(max_length=120)
    cidade = models.CharField(max_length=120)
    data = models.DateField(help_text="Data da feira (yyyy-mm-dd)")
    
    class Meta:
        db_table = 'feira'

    def __str__(self):
        return f"{self.nome} - {self.cidade} ({self.data})"


class Produtor(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="produtores")
    nome_fazenda = models.CharField(max_length=120)
    cidade = models.CharField(max_length=120)
    
    class Meta:
        db_table = 'produtor'

    def __str__(self):
        return f"{self.nome_fazenda} ({self.cidade})"


class Produto(models.Model):
    nome = models.CharField(max_length=120)
    preco = models.DecimalField(max_digits=8, decimal_places=2)
    prod = models.ForeignKey(Produtor, on_delete=models.CASCADE, related_name="produtos")
    feira = models.ForeignKey(Feira, on_delete=models.CASCADE, related_name="produtos")
    
    class Meta:
        db_table = 'produto'

    def __str__(self):
        return f"{self.nome} - R${self.preco} ({self.prod})"