const STORAGE_KEY = "expense-tracker-transactions";

const form = document.getElementById("transactionForm");
const typeEl = document.getElementById("type");
const descEl = document.getElementById("description");
const amountEl = document.getElementById("amount");
const categoryEl = document.getElementById("category");
const dateEl = document.getElementById("date");
const errorEl = document.getElementById("error");
const filterEl = document.getElementById("filter");
const searchEl = document.getElementById("search");
const tableBody = document.getElementById("tableBody");

let toastTimer;
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast show " + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

let transactions = load();

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function today() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function money(n) {
  return "LKR " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function updateTotals() {
  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  document.getElementById("totalIncome").textContent = money(income);
  document.getElementById("totalExpenses").textContent = money(expenses);
  document.getElementById("balance").textContent = money(income - expenses);
}

function renderTable() {
  const filter = filterEl.value;
  const query = searchEl.value.trim().toLowerCase();

  const visible = transactions.filter(t => {
    const matchType = filter === "all" || t.type === filter;
    const matchSearch = !query ||
      t.description.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query);
    return matchType && matchSearch;
  });

  if (visible.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty">No transactions found.</td></tr>';
    return;
  }

  tableBody.innerHTML = visible.map(t => {
    const sign = t.type === "income" ? "+" : "−";
    return `<tr>
      <td>${t.date}</td>
      <td>${escapeHtml(t.description)}</td>
      <td><span class="badge ${t.type}">${t.type}</span></td>
      <td>${escapeHtml(t.category)}</td>
      <td class="right amount-${t.type}">${sign} ${money(t.amount)}</td>
      <td><button class="btn danger" data-id="${t.id}">Delete</button></td>
    </tr>`;
  }).join("");
}

function refresh() {
  updateTotals();
  renderTable();
}

function resetForm() {
  form.reset();
  dateEl.value = today();
  errorEl.textContent = "";
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const description = descEl.value.trim();
  const amount = parseFloat(amountEl.value);
  const category = categoryEl.value;
  const date = dateEl.value;

  if (!description || !category || !date || isNaN(amount)) {
    errorEl.textContent = "Please fill in all required fields.";
    showToast("Please fill in all required fields.", "error");
    return;
  }
  if (amount <= 0) {
    errorEl.textContent = "Amount must be greater than zero.";
    showToast("Amount must be greater than zero.", "error");
    return;
  }

  transactions.push({
    id: Date.now() + Math.random(),
    type: typeEl.value,
    description,
    amount,
    category,
    date
  });
  save();
  refresh();
  resetForm();
  showToast("Transaction added successfully!");
});

document.getElementById("clearBtn").addEventListener("click", resetForm);
filterEl.addEventListener("change", renderTable);
searchEl.addEventListener("input", renderTable);

tableBody.addEventListener("click", e => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  transactions = transactions.filter(t => t.id !== id);
  save();
  showToast("Transaction deleted.", "info");
  refresh();
});

dateEl.value = today();
refresh();