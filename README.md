# Sistema de Feiras & Produtos

Este é um projeto full-stack que simula um portal para visualização e gerenciamento de produtos de feiras locais. Ele é composto por um **Backend (API RESTful)** desenvolvido com Django e Django REST Framework, e um **Frontend** construído com HTML, CSS e JavaScript puro que consome essa API.

O sistema define três perfis de usuário com diferentes níveis de permissão:

  * **Consumidor:** Pode se cadastrar, ver feiras e visualizar/filtrar todos os produtos.
  * **Produtor:** Pode se cadastrar, ver feiras e gerenciar (CRUD) apenas os seus próprios produtos.
  * **Moderador:** Pode gerenciar (CRUD) as Feiras e excluir usuários (Produtores ou Consumidores).

## 🚀 Tecnologias Utilizadas

### Backend

  * **Python 3.12+**
  * **Django 5.2.7**
  * **Django REST Framework 3.16.1**
  * **Django REST Authtoken:** Para autenticação baseada em Token.
  * **SQLite:** Banco de dados padrão do projeto.

### Frontend

  * **HTML5**
  * **Bootstrap 5:** Para componentização e layout responsivo.
  * **JavaScript (ES6+):** Para lógica do cliente e interatividade.
  * **Axios:** Para realizar as requisições HTTP à API.

## ✨ Funcionalidades Principais

### Gerais

  * **Autenticação por Token:** Sistema completo de Login, Logout e Registro.
  * **Registro de Usuários:** Usuários podem se cadastrar como "Consumidor" ou "Produtor".
  * **Páginas Públicas:** Visitantes não logados podem visualizar a lista de feiras e produtos.
  * **Proteção de API:** Limitação de requisições (Throttling) para usuários não autenticados.
  * **Redirecionamento por Perfil:** Após o login, o usuário é redirecionado para a página correspondente ao seu perfil (Consumidor, Produtor ou Moderador).

### 👨‍🌾 Produtor

  * Painel dedicado (`produtor.html`).
  * Gerenciamento completo (CRUD) **apenas dos seus próprios produtos**.
  * Ao criar um produto, o sistema associa automaticamente o produtor logado.

### 🛒 Consumidor

  * Painel dedicado (`consumidor.html`).
  * Visualização de todos os produtos de todas as feiras.
  * Filtragem de produtos por nome e por preço máximo.

### 🛠️ Moderador

  * Painel dedicado (`moderador.html`).
  * Gerenciamento de Usuários: Listar e excluir usuários (Consumidores ou Produtores).
  * Gerenciamento de Feiras (`feiras.html`): CRUD completo para cadastro de feiras.

## 🔧 Instalação e Execução

Siga os passos abaixo para executar o projeto localmente.

### 1\. Backend (API Django)

1.  **Clone o repositório:**

    ```bash
    git clone https://github.com/seu-usuario/seu-repositorio.git
    cd seu-repositorio/projeto_feira/
    ```

2.  **Crie e ative um ambiente virtual:**

    ```bash
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

3.  **Instale as dependências:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Aplique as migrações do banco de dados:**

    ```bash
    python manage.py migrate
    ```

5.  **Crie um superusuário** (Necessário para acessar o Admin e criar Moderadores):

    ```bash
    python manage.py createsuperuser
    ```

6.  **Execute o servidor:**

    ```bash
    python manage.py runserver
    ```

    O backend estará rodando em `http://127.0.0.1:8000/`.

7.  **(Opcional) Crie o grupo Moderadores:**

      * Acesse o painel admin: `http://127.0.0.1:8000/admin/`
      * Faça login com seu superusuário.
      * Vá até "Groups" (Grupos) e crie um novo grupo com o nome exatamente `Moderadores`.
      * Atribua seu superusuário (ou outro usuário) a este grupo.

### 2\. Frontend

1.  **Acesse a pasta `front_end/`**.
2.  Como o projeto usa HTML/CSS/JS puros, você pode simplesmente abrir os arquivos `.html` no navegador.
3.  **Recomendado:** Use uma extensão como o **Live Server** (VS Code) para servir os arquivos estáticos, evitando problemas com CORS. O `settings.py` já está configurado para permitir requisições vindas de `http://127.0.0.1:5500`.
4.  Abra o `index.html` para começar.

## 🗺️ Endpoints da API

A base da API é `http://127.0.0.1:8000/api/`.

| Método | Endpoint | Proteção | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/api-token-auth/` | Pública | Realiza login e obtém um token de autenticação. |
| `POST` | `/api/register/` | Pública | Registra um novo usuário (Consumidor ou Produtor). |
| `GET` | `/api/whoami/` | Autenticada | Retorna os dados (`username`, `groups`) do usuário logado. |
| `GET` | `/api/feiras/` | Pública | Lista todas as feiras. |
| `POST` | `/api/feiras/` | Moderador | Cria uma nova feira. |
| `GET` | `/api/feiras/<id>/` | Pública | Detalha uma feira. |
| `PUT/PATCH` | `/api/feiras/<id>/` | Moderador | Atualiza uma feira. |
| `DELETE` | `/api/feiras/<id>/` | Moderador | Exclui uma feira. |
| `GET` | `/api/produtos/` | Pública | Lista todos os produtos. Aceita filtros: `?nome=` e `?preco_max=`. |
| `POST` | `/api/produtos/` | Produtor | Cria um novo produto (associa ao usuário logado). |
| `GET` | `/api/produtos/<id>/` | Pública | Detalha um produto. |
| `PUT/PATCH` | `/api/produtos/<id>/` | Produtor (Dono) | Atualiza um produto. |
| `DELETE` | `/api/produtos/<id>/` | Produtor (Dono) | Exclui um produto. |
| `GET` | `/api/produtos/meus/` | Produtor | Lista apenas os produtos do produtor logado. |
| `GET` | `/api/users/` | Moderador | Lista todos os usuários (exceto superusuários). |
| `DELETE` | `/api/users/<id>/` | Moderador | Exclui um usuário. |

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT**.
Veja o arquivo [LICENSE](https://www.google.com/search?q=LICENSE) para mais detalhes.

-----