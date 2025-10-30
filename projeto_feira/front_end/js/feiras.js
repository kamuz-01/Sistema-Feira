const API_BASE = "http://127.0.0.1:8000/api/";
const TOKEN = localStorage.getItem("token");
axios.defaults.headers.common["Authorization"] = `Token ${TOKEN}`;

const tabela = document.querySelector("#tabelaFeiras tbody");
const feiraModal = new bootstrap.Modal("#feiraModal");
const form = document.getElementById("feiraForm");
const inputId = document.getElementById("feiraId");
const inputNome = document.getElementById("feiraNome");
const inputCidade = document.getElementById("feiraCidade");
const inputData = document.getElementById("feiraData");

// ===============================
// Mostrar nome do usuário logado
// ===============================
async function carregarUsuario() {
  const whoamiEl = document.getElementById("whoami");
  const token = localStorage.getItem("token");

  if (!token || !whoamiEl) return;

  try {
    const { data } = await axios.get("http://127.0.0.1:8000/api/whoami/", {
      headers: { Authorization: `Token ${token}` },
    });

    whoamiEl.textContent = `Logado como: ${data.username}`;
  } catch {
    whoamiEl.textContent = "Usuário não autenticado";
  }
}

// Toast helper
function toast(msg, type = "info") {
  const el = document.createElement("div");
  el.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 shadow`;
  el.style.zIndex = 2000;
  el.innerHTML = `${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  document.body.appendChild(el);
  setTimeout(() => bootstrap.Alert.getOrCreateInstance(el).close(), 4000);
}

// Carregar feiras
async function carregarFeiras() {
  tabela.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Carregando...</td></tr>`;
  try {
    const { data } = await axios.get(API_BASE + "feiras/");
    if (!data.length) {
      tabela.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhuma feira cadastrada.</td></tr>`;
      return;
    }

    tabela.innerHTML = data.map(f => `
      <tr>
        <td>${f.id}</td>
        <td>${f.nome}</td>
        <td>${f.cidade}</td>
        <td>${f.data}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-1" data-edit="${f.id}">Editar</button>
          <button class="btn btn-sm btn-outline-danger" data-del="${f.id}">Excluir</button>
        </td>
      </tr>
    `).join("");

    // Eventos editar e excluir
    tabela.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => editarFeira(btn.dataset.edit, data)));
    tabela.querySelectorAll("[data-del]").forEach(btn => {
      const feira = data.find(f => f.id == btn.dataset.del);
      btn.addEventListener("click", () => abrirConfirmacao(btn.dataset.del, feira?.nome || "Feira"));
  });

  } catch {
    tabela.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Erro ao carregar feiras.</td></tr>`;
  }
}

// Nova feira
document.getElementById("novaFeiraBtn")?.addEventListener("click", () => {
  form.reset();
  inputId.value = "";
  feiraModal.show();
});

// Editar
function editarFeira(id, lista) {
  const f = lista.find(x => String(x.id) === String(id));
  if (!f) return;
  inputId.value = f.id;
  inputNome.value = f.nome;
  inputCidade.value = f.cidade;
  inputData.value = f.data;
  feiraModal.show();
}

// Salvar
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    nome: inputNome.value.trim(),
    cidade: inputCidade.value.trim(),
    data: inputData.value,
  };
  try {
    if (inputId.value) {
      await axios.patch(API_BASE + `feiras/${inputId.value}/`, payload);
      toast("Feira atualizada com sucesso!", "success");
    } else {
      await axios.post(API_BASE + "feiras/", payload);
      toast("Feira criada com sucesso!", "success");
    }
    feiraModal.hide();
    carregarFeiras();
  } catch {
    toast("Erro ao salvar feira.", "danger");
  }
});

// ===============================
// Modal de confirmação de exclusão
// ===============================
const confirmModal = new bootstrap.Modal("#confirmModal");
const confirmMessage = document.getElementById("confirmMessage");
const confirmYes = document.getElementById("confirmYes");

function abrirConfirmacao(id, nome) {
  confirmMessage.textContent = `Deseja realmente excluir a feira "${nome}"? Esta ação não poderá ser desfeita.`;
  confirmModal.show();

  // remove event listeners antigos
  const novoBotao = confirmYes.cloneNode(true);
  confirmYes.parentNode.replaceChild(novoBotao, confirmYes);

  // adiciona novo evento
  novoBotao.addEventListener("click", async () => {
    try {
      await axios.delete(API_BASE + `feiras/${id}/`);
      toast("Feira removida com sucesso!", "success");
      confirmModal.hide();
      carregarFeiras();
    } catch {
      toast("Erro ao excluir feira.", "danger");
    }
  });
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  carregarFeiras();
  carregarUsuario();
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
  });
});
