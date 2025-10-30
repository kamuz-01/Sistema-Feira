const API_BASE = "http://127.0.0.1:8000/api/";
const TOKEN = localStorage.getItem("token");
axios.defaults.headers.common["Authorization"] = `Token ${TOKEN}`;

// ===============================
// Helpers UI
// ===============================
function toast(msg, type = "info") {
  const alertBox = document.createElement("div");
  alertBox.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 shadow`;
  alertBox.style.zIndex = 1055;
  alertBox.innerHTML = `
    ${msg}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(alertBox);
  setTimeout(() => bootstrap.Alert.getOrCreateInstance(alertBox).close(), 4000);
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

// ===============================
// Carregar Produtos
// ===============================
async function carregarProdutos(nome = "", preco_max = "") {
  const container = document.getElementById("produtosContainer");
  container.innerHTML = `<div class="col-12 text-center text-muted">Carregando...</div>`;

  try {
    let url = API_BASE + "produtos/";
    const params = [];
    if (nome) params.push(`nome=${encodeURIComponent(nome)}`);
    if (preco_max) params.push(`preco_max=${preco_max}`);
    if (params.length) url += "?" + params.join("&");

    const { data } = await axios.get(url);
    if (!data.length) {
      container.innerHTML = `<div class="col-12 text-center text-muted">Nenhum produto encontrado.</div>`;
      return;
    }

    container.innerHTML = data.map(p => `
      <div class="col-sm-6 col-lg-3 fade-in">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-body text-center">
            <h6 class="fw-semibold">${p.nome}</h6>
            <p class="text-muted mb-1">R$ ${Number(p.preco).toFixed(2)}</p>
            <p class="small mb-0">
              <span class="text-secondary">Feira:</span> ${p.feira_detalhes?.nome || "-"}<br>
              <span class="text-secondary">Produtor:</span> ${p.prod?.nome_fazenda || "-"}
            </p>
          </div>
        </div>
      </div>
    `).join("");
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="col-12 text-danger text-center">Erro ao carregar produtos.</div>`;
  }
}

// ===============================
// Filtro
// ===============================
document.getElementById("btnFiltrar")?.addEventListener("click", () => {
  const nome = document.getElementById("filtroNome").value.trim();
  const preco = document.getElementById("filtroPreco").value.trim();
  carregarProdutos(nome, preco);
});

// ===============================
// Exibir nome do usuário logado
// ===============================
async function carregarUsuario() {
  try {
    const { data } = await axios.get(API_BASE + "whoami/");
    document.getElementById("whoami").textContent = `Consumidor: ${data.username}`;
  } catch {
    document.getElementById("whoami").textContent = "";
  }
}

// ===============================
// Inicialização
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  carregarUsuario();
  carregarProdutos();
});
