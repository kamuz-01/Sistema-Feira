const API_BASE = "http://127.0.0.1:8000/api/";
const TOKEN = localStorage.getItem("token");
axios.defaults.headers.common["Authorization"] = `Token ${TOKEN}`;

// ===============================
// Elementos
// ===============================
const tabela = document.querySelector("#tabelaUsuarios tbody");
const logoutBtn = document.getElementById("logoutBtn");

// Cria modal de confirmação dinamicamente
const modalHTML = `
<div class="modal fade" id="confirmModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header bg-danger text-white">
        <h5 class="modal-title">Confirmar exclusão</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <p id="confirmMessage" class="mb-0"></p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-danger" id="confirmYes">Excluir</button>
      </div>
    </div>
  </div>
</div>
`;
document.body.insertAdjacentHTML("beforeend", modalHTML);
const confirmModal = new bootstrap.Modal("#confirmModal");
const confirmMessage = document.getElementById("confirmMessage");
const confirmYes = document.getElementById("confirmYes");

// ===============================
// Toast helper
// ===============================
function toast(msg, type = "info") {
  const el = document.createElement("div");
  el.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 shadow`;
  el.style.zIndex = 2000;
  el.innerHTML = `${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  document.body.appendChild(el);
  setTimeout(() => bootstrap.Alert.getOrCreateInstance(el).close(), 4000);
}

// ===============================
// Logout
// ===============================
logoutBtn?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

// ===============================
// Exibir nome do usuário logado
// ===============================
async function mostrarUsuarioLogado() {

    
  try {
    const { data } = await axios.get(API_BASE + "whoami/");
    const grupos = data.groups || [];
    const span = document.createElement("span");
    span.id = "whoami";
    span.className = "text-white small me-2";
    span.textContent = `Moderador: ${data.username}`;
    logoutBtn.parentNode.insertBefore(span, logoutBtn);
    logoutBtn.classList.remove("ms-auto");

    return data;
  } catch {
    toast("Sessão expirada. Faça login novamente.", "warning");
    localStorage.clear();
    setTimeout(() => (window.location.href = "index.html"), 2000);
    throw new Error("Sessão inválida");
  }
}

// ===============================
// Carregar lista de usuários
// ===============================
async function carregarUsuarios() {
  tabela.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Carregando...</td></tr>`;

  try {
    const { data } = await axios.get(API_BASE + "users/");
    if (!data.length) {
      tabela.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Nenhum usuário encontrado.</td></tr>`;
      return;
    }

    tabela.innerHTML = data.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.groups.join(", ") || "-"}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger" data-id="${u.id}" data-name="${u.username}">
            <i class="bi bi-trash"></i> Excluir
          </button>
        </td>
      </tr>
    `).join("");

    // Adiciona eventos aos botões
    tabela.querySelectorAll("button[data-id]").forEach(btn => {
      btn.addEventListener("click", () => abrirConfirmacao(btn.dataset.id, btn.dataset.name));
    });
  } catch (err) {
    console.error(err);
    tabela.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Erro ao carregar usuários.</td></tr>`;
  }
}

// ===============================
// Modal de confirmação
// ===============================
function abrirConfirmacao(id, username) {
  confirmMessage.textContent = `Tem certeza que deseja excluir o usuário "${username}"? Essa ação não pode ser desfeita.`;
  confirmModal.show();

  // Remove event listeners antigos
  const novoBotao = confirmYes.cloneNode(true);
  confirmYes.parentNode.replaceChild(novoBotao, confirmYes);

  // Adiciona o novo evento
  novoBotao.addEventListener("click", async () => {
    try {
      await axios.delete(API_BASE + "users/" + id + "/");
      toast("Usuário removido com sucesso!", "success");
      confirmModal.hide();
      carregarUsuarios();
    } catch (err) {
      console.error(err);
      toast("Erro ao excluir usuário (verifique permissões).", "danger");
    }
  });
}

// ===============================
// Valida permissão do usuário
// ===============================
async function validarPermissao() {
  const data = await mostrarUsuarioLogado();
  const grupos = data.groups || [];

  if (data.is_superuser || grupos.includes("Moderadores")) {
    carregarUsuarios();
  } else {
    toast("Acesso negado. Apenas moderadores podem acessar.", "danger");
    setTimeout(() => (window.location.href = "index.html"), 2500);
  }
}

// ===============================
// Inicialização
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  validarPermissao();
});
