const API_BASE = "http://127.0.0.1:8000/api/";
const TOKEN = localStorage.getItem("token");
axios.defaults.headers.common["Authorization"] = `Token ${TOKEN}`;

// Bootstrap modal
const produtoModal = new bootstrap.Modal("#produtoModal");

// Elementos DOM
const tabela = document.querySelector("#tabelaProdutos tbody");
const form = document.getElementById("produtoForm");
const tituloModal = document.querySelector("#produtoModal .modal-title");
const inputId = document.getElementById("produtoId");
const inputNome = document.getElementById("produtoNome");
const inputPreco = document.getElementById("produtoPreco");
const selectFeira = document.getElementById("produtoFeira");

// ===============================
// Toast
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
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

// ===============================
// Carregar Feiras
// ===============================
async function carregarFeiras() {
  try {
    const { data } = await axios.get(API_BASE + "feiras/");
    selectFeira.innerHTML = data.map(f => `<option value="${f.id}">${f.nome} - ${f.cidade} (${f.data})</option>`).join("");
  } catch {
    selectFeira.innerHTML = `<option value="">Erro ao carregar feiras</option>`;
  }
}

// ===============================
// Carregar produtos do produtor logado
// ===============================
async function carregarMeusProdutos() {
  tabela.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Carregando...</td></tr>`;
  try {
    const { data } = await axios.get(API_BASE + "produtos/meus/");
    if (!data.length) {
      tabela.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhum produto cadastrado ainda.</td></tr>`;
      return;
    }

    tabela.innerHTML = data.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>${p.nome}</td>
        <td>R$ ${Number(p.preco).toFixed(2)}</td>
        <td>${p.feira_detalhes?.nome || "-"}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-1" data-edit="${p.id}">Editar</button>
          <button class="btn btn-sm btn-outline-danger" data-del="${p.id}">Excluir</button>
        </td>
      </tr>
    `).join("");

    // Botões editar
    tabela.querySelectorAll("[data-edit]").forEach(btn => {
      btn.addEventListener("click", () => abrirEdicao(btn.dataset.edit, data));
    });

    // Botões excluir
    tabela.querySelectorAll("[data-del]").forEach(btn => {
      const produto = data.find(p => String(p.id) === btn.dataset.del);
      btn.addEventListener("click", () => excluirProduto(produto.id, produto.nome));
  });
  } catch (err) {
    console.error(err);
    tabela.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Erro ao carregar produtos.</td></tr>`;
  }
}

// ===============================
// Abrir modal para novo produto
// ===============================
document.getElementById("btnNovoProduto")?.addEventListener("click", async () => {
  tituloModal.textContent = "Novo Produto";
  form.reset();
  inputId.value = "";
  await carregarFeiras();
  produtoModal.show();
});

// ===============================
// Editar produto existente
// ===============================
function abrirEdicao(id, lista) {
  const p = lista.find(x => String(x.id) === String(id));
  if (!p) return;
  tituloModal.textContent = `Editar Produto #${p.id}`;
  inputId.value = p.id;
  inputNome.value = p.nome;
  inputPreco.value = p.preco;
  carregarFeiras().then(() => {
    selectFeira.value = p.feira?.id || "";
  });
  produtoModal.show();
}

// ===============================
// Salvar (criar/editar)
// ===============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
  nome: inputNome.value.trim(),
  preco: inputPreco.value,
  feira: selectFeira.value,
};
  const id = inputId.value.trim();

  try {
    if (id) {
      await axios.patch(API_BASE + `produtos/${id}/`, payload);
      toast("Produto atualizado com sucesso!", "success");
    } else {
      await axios.post(API_BASE + "produtos/", payload);
      toast("Produto criado com sucesso!", "success");
    }
    produtoModal.hide();
    carregarMeusProdutos();
  } catch (err) {
    console.error(err);
    toast("Erro ao salvar produto (verifique permissões).", "danger");
  }
});

// ===============================
// Excluir (com modal de confirmação aprimorado)
// ===============================
let idParaExcluir = null;
let nomeParaExcluir = "";
const confirmModal = new bootstrap.Modal("#confirmModal");
const confirmMessage = document.getElementById("confirmMessage");
const confirmYes = document.getElementById("confirmYes");

function excluirProduto(id, nome = "") {
  idParaExcluir = id;
  nomeParaExcluir = nome;

  confirmMessage.innerHTML = `
    <p class="fs-6 text-secondary mb-2">
      Tem certeza que deseja excluir o produto <strong>${nomeParaExcluir || `#${idParaExcluir}`}</strong>?
    </p>
    <small class="text-muted">Essa ação não poderá ser desfeita.</small>
  `;
  confirmModal.show();
}

// Evento do botão "Confirmar exclusão"
confirmYes.addEventListener("click", async () => {
  if (!idParaExcluir) return;

  try {
    await axios.delete(API_BASE + `produtos/${idParaExcluir}/`);
    toast("Produto removido com sucesso!", "success");
    carregarMeusProdutos();
  } catch (err) {
    console.error(err);
    toast("Erro ao excluir produto.", "danger");
  } finally {
    idParaExcluir = null;
    nomeParaExcluir = "";
    confirmModal.hide();
  }
});

// ===============================
// Inicialização
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { data } = await axios.get(API_BASE + "whoami/");
    document.getElementById("whoami").textContent = `Produtor: ${data.username}`;
  } catch {
    toast("Sessão expirada. Faça login novamente.", "warning");
    localStorage.clear();
    window.location.href = "index.html";
    return;
  }

  carregarMeusProdutos();
});
