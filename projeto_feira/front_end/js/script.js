// ==============================
// Configurações Globais
// ==============================
const API_BASE = "http://127.0.0.1:8000/api/";
const TOKEN_KEY = "token";
const USERNAME_KEY = "username";

// ==============================
// Helpers de Autenticação e UI
// ==============================
function isLogged() {
  return !!localStorage.getItem(TOKEN_KEY);
}

function updateAuthUI() {
  const loginBtn = document.getElementById("loginBtn");
  const loggedBox = document.getElementById("loggedBox");
  const whoami = document.getElementById("whoami");
  const novoProdutoBtn = document.getElementById("novoProdutoBtn");

  if (!loginBtn || !loggedBox || !whoami) return;

  if (isLogged()) {
    loginBtn.classList.add("d-none");
    loggedBox.classList.remove("d-none");
    whoami.textContent = `Logado: ${localStorage.getItem(USERNAME_KEY) || "usuário"}`;
    if (novoProdutoBtn) novoProdutoBtn.classList.remove("d-none");
  } else {
    loginBtn.classList.remove("d-none");
    loggedBox.classList.add("d-none");
    whoami.textContent = "";
    if (novoProdutoBtn) novoProdutoBtn.classList.add("d-none");
  }
}

function ensureAuthOrLogin() {
  if (!isLogged()) {
    bootstrap.Modal.getOrCreateInstance("#loginModal").show();
    return false;
  }
  return true;
}

// ==============================
// Toasts e Alertas
// ==============================
const alerts = document.getElementById("alerts");
function toast(type, msg) {
  if (!alerts) return;
  const el = document.createElement("div");
  el.className = `alert alert-${type} alert-dismissible fade show`;
  el.innerHTML = `${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  alerts.appendChild(el);
  setTimeout(() => {
    try { bootstrap.Alert.getOrCreateInstance(el).close(); } catch {}
  }, 4000);
}

// ==============================
// Axios - Interceptores
// ==============================
axios.interceptors.request.use((config) => {
  const isPublic = config.url?.includes("/api/register/") || config.url?.includes("/api/api-token-auth/");
  if (!isPublic) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers["Authorization"] = `Token ${token}`;
  } else {
    delete config.headers?.Authorization;
  }
  return config;
});

axios.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    const isPublic = url.includes("/api/register/") || url.includes("/api/api-token-auth/");

    if (!isPublic && (status === 401 || status === 403)) {
      bootstrap.Modal.getOrCreateInstance("#loginModal").show();
      toast("warning", "Faça login para continuar.");
    }
    return Promise.reject(error);
  }
);

// ==============================
// FEIRAS - com Skeleton Loader
// ==============================
async function carregarFeiras() {
  const container = document.getElementById("feirasContainer");
  if (!container) return;

  container.innerHTML = Array(3).fill(0).map(() => `
    <div class="col-md-6 col-lg-4">
      <div class="card border-0 shadow-sm p-3">
        <div class="skeleton skeleton-line medium"></div>
        <div class="skeleton skeleton-line short"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>
    </div>
  `).join("");

  try {
    const { data } = await axios.get(API_BASE + "feiras/");
    await new Promise(r => setTimeout(r, 600));
    if (!data.length) {
      container.innerHTML = `<div class="col-12 text-center text-muted">Nenhuma feira disponível no momento.</div>`;
      return;
    }

    container.innerHTML = data.map(f => `
      <div class="col-md-6 col-lg-4">
        <div class="card shadow-sm h-100 border-0 fade-in">
          <div class="card-body text-center">
            <h5 class="fw-semibold text-primary">${f.nome}</h5>
            <p class="text-secondary mb-1">${f.cidade}</p>
            <p class="small text-muted">${f.data}</p>
          </div>
        </div>
      </div>
    `).join("");
  } catch {
    container.innerHTML = `<div class="col-12 text-danger text-center">Erro ao carregar feiras.</div>`;
  }
}

// ==============================
// PRODUTOS - Scroll infinito
// ==============================
let produtosPagina = 0;
const produtosPorPagina = 8;
let todosProdutos = [];

async function carregarProdutos(inicial = false) {
  const container = document.getElementById("produtosContainer");
  if (!container) return;

  if (inicial) {
    container.innerHTML = Array(8).fill(0).map(() => `
      <div class="col-sm-6 col-lg-3">
        <div class="card border-0 shadow-sm p-3">
          <div class="skeleton skeleton-card mb-3"></div>
          <div class="skeleton skeleton-line medium"></div>
          <div class="skeleton skeleton-line short"></div>
        </div>
      </div>
    `).join("");
    produtosPagina = 0;
    todosProdutos = [];
  }

  try {
    if (inicial || todosProdutos.length === 0) {
      const { data } = await axios.get(API_BASE + "produtos/");
      await new Promise(r => setTimeout(r, 800));
      todosProdutos = data;
      container.innerHTML = "";
    }

    const inicio = produtosPagina * produtosPorPagina;
    const fim = inicio + produtosPorPagina;
    const pageItems = todosProdutos.slice(inicio, fim);
    if (!pageItems.length) return;

    pageItems.forEach(p => {
      const card = document.createElement("div");
      card.className = "col-sm-6 col-lg-3 fade-in";
      card.innerHTML = `
        <div class="card shadow-sm border-0 h-100">
          <div class="card-body">
            <h6 class="fw-semibold">${p.nome}</h6>
            <p class="text-muted mb-1">R$ ${Number(p.preco).toFixed(2)}</p>
            <p class="small mb-0">
              <span class="text-secondary">Feira:</span> ${p.feira_detalhes?.nome || "-"}<br>
              <span class="text-secondary">Produtor:</span> ${p.prod?.nome_fazenda || "-"}
            </p>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
    produtosPagina++;
  } catch {
    container.innerHTML = `<div class="col-12 text-danger text-center">Erro ao carregar produtos.</div>`;
  }
}

let isLoading = false;
window.addEventListener("scroll", () => {
  if (isLoading) return;
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    isLoading = true;
    carregarProdutos(false).then(() => (isLoading = false));
  }
});

// ==============================
// LOGIN / LOGOUT / REDIRECT
// ==============================
const loginModal = new bootstrap.Modal("#loginModal");
const signupModal = new bootstrap.Modal("#signupModal");

document.getElementById("loginBtn")?.addEventListener("click", () => loginModal.show());

document.getElementById("signupBtn")?.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  delete axios.defaults.headers.common["Authorization"];
  updateAuthUI();

  const form = document.getElementById("signupForm");
  if (form) {
    form.reset();
    document.getElementById("su_produtor_fields")?.classList.add("d-none");
  }

  signupModal.show();
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

async function redirectAfterLogin() {
  try {
    const { data } = await axios.get(API_BASE + "whoami/");
    const grupos = data.groups || [];

    if (grupos.includes("Moderadores")) {
      window.location.href = "moderador.html";
    } else if (grupos.includes("Produtores")) {
      window.location.href = "produtor.html";
    } else if (grupos.includes("Consumidores")) {
      window.location.href = "consumidor.html";
    } else {
      window.location.href = "index.html";
    }
  } catch {
    window.location.href = "index.html";
  }
}

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  try {
    const { data } = await axios.post(API_BASE + "api-token-auth/", { username, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USERNAME_KEY, username);
    loginModal.hide();
    toast("success", "Login realizado. Redirecionando...");
    setTimeout(redirectAfterLogin, 1000);
  } catch {
    toast("danger", "Usuário ou senha inválidos.");
  }
});

// ==============================
// CADASTRO (corrigido)
// ==============================
const suRole = document.getElementById("su_role");
const suProdFields = document.getElementById("su_produtor_fields");

suRole?.addEventListener("change", () => {
  if (suRole.value === "PRODUTOR") suProdFields.classList.remove("d-none");
  else suProdFields.classList.add("d-none");
});

document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Garante ambiente limpo
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  delete axios.defaults.headers.common["Authorization"];

  const form = e.currentTarget;
  const username = document.getElementById("su_username").value.trim();
  const password = document.getElementById("su_password").value;
  const password2 = document.getElementById("su_password2").value;
  const role = document.getElementById("su_role").value;

  if (password !== password2) {
    toast("warning", "As senhas não conferem.");
    return;
  }

  const payload = { username, password, role };
  if (role === "PRODUTOR") {
    payload.nome_fazenda = document.getElementById("su_nome_fazenda").value.trim();
    payload.cidade = document.getElementById("su_cidade").value.trim();
  }

  try {
    await axios.post(API_BASE + "register/", payload, { headers: { Authorization: undefined } });

    // ✅ limpa o formulário
    form.reset();
    suProdFields?.classList.add("d-none");

    // ✅ exibe mensagem de sucesso elegante
    const tipoConta = role === "PRODUTOR" ? "Produtor" : "Consumidor";
    toast("success", `
      <div class="text-center">
        <strong>${tipoConta} cadastrado com sucesso!</strong><br>
        Faça login para continuar.
      </div>
    `);

    // ✅ fecha o modal de cadastro e abre o de login depois de 2s
    setTimeout(() => {
      signupModal.hide();
      const lm = bootstrap.Modal.getOrCreateInstance("#loginModal");
      lm.show();
    }, 2000);

  } catch (err) {
    console.error(err);
    const msg = err?.response?.data
      ? JSON.stringify(err.response.data)
      : "Erro ao cadastrar. Verifique os dados.";
    toast("danger", msg);
  }
});

// ==============================
// Inicialização
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
  carregarFeiras();
  carregarProdutos(true);
});
