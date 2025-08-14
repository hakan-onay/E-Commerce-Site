/* Admin Panel Script (DEMO destekli) */
import { api } from "./api.js";
import { me } from "./auth.js";

const DEMO = new URLSearchParams(location.search).has("demo");

let editingId = null;

// Basit yardımcılar
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const fmt = (n) =>
  (Number(n) || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// --- Admin kontrolü (demo'da sahte admin) ---
async function requireAdmin() {
  try {
    let u;
    if (DEMO) {
      u = { id: 1, name: "Admin", email: "admin@test.com", role: "admin" };
    } else {
      u = await me(); // gerçek backend varsa
    }

    if (u?.role !== "admin") throw new Error("not-admin");

    $("#admin-content").classList.remove("hidden");
    $("#admin-guard").classList.add("hidden");
    const navName = $("#nav-username");
    if (navName) navName.textContent = `Admin: ${u.name || u.email}`;
  } catch {
    $("#admin-content").classList.add("hidden");
    $("#admin-guard").classList.remove("hidden");
    throw new Error("unauthorized");
  }
}

// -------- ÜRÜNLER --------
async function fetchProducts() {
  const q = $("#search-input")?.value?.trim();
  const category = $("#category-filter")?.value || "";
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  return await api(`/api/products?${params.toString()}`, {
    method: "GET",
    auth: true,
  });
}

function renderProducts(rows = []) {
  const tb = $("#products-table tbody");
  tb.innerHTML = "";
  if (!rows.length) {
    $("#products-empty").classList.remove("hidden");
    return;
  }
  $("#products-empty").classList.add("hidden");

  // Kategori filtresi (benzersiz)
  const categories = [...new Set(rows.map((r) => r.category).filter(Boolean))];
  const sel = $("#category-filter");
  if (sel && sel.options.length <= 1) {
    for (const c of categories) {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      sel.appendChild(o);
    }
  }

  for (const p of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td><strong>${p.title}</strong><div class="muted">${
        p.description ? p.description.slice(0, 80) : ""
      }</div></td>
      <td>${p.category || "-"}</td>
      <td class="right">₺${fmt(p.price)}</td>
      <td>${p.stock ?? 0}</td>
      <td>${p.rating ?? 0}</td>
      <td>${p.image_url ? `<a href="${p.image_url}" target="_blank">Gör</a>` : "-"}</td>
      <td class="right">
        <button class="btn ghost btn-edit" data-id="${p.id}">Düzenle</button>
        <button class="btn warn btn-del" data-id="${p.id}">Sil</button>
      </td>
    `;
    tb.appendChild(tr);
  }

  // Events
  $$(".btn-edit").forEach((b) =>
    b.addEventListener("click", () => openEdit(b.dataset.id))
  );
  $$(".btn-del").forEach((b) =>
    b.addEventListener("click", () => delProduct(b.dataset.id))
  );
}

async function loadProducts() {
  try {
    const rows = await fetchProducts();
    renderProducts(rows);
  } catch (e) {
    alert("Ürünleri çekerken hata: " + (e.message || e));
  }
}

function openModal() {
  $("#modal-backdrop").style.display = "flex";
}
function closeModal() {
  $("#modal-backdrop").style.display = "none";
  editingId = null;
  clearForm();
}

function clearForm() {
  $("#p-title").value = "";
  $("#p-category").value = "";
  $("#p-price").value = "";
  $("#p-stock").value = "";
  $("#p-rating").value = "";
  $("#p-image").value = "";
  $("#p-desc").value = "";
}

function fillForm(p) {
  $("#p-title").value = p.title || "";
  $("#p-category").value = p.category || "";
  $("#p-price").value = p.price || "";
  $("#p-stock").value = p.stock || 0;
  $("#p-rating").value = p.rating || 0;
  $("#p-image").value = p.image_url || "";
  $("#p-desc").value = p.description || "";
}

function getFormData() {
  return {
    title: $("#p-title").value.trim(),
    category: $("#p-category").value.trim() || null,
    price: parseFloat($("#p-price").value || "0"),
    stock: parseInt($("#p-stock").value || "0", 10),
    rating: parseFloat($("#p-rating").value || "0"),
    image_url: $("#p-image").value.trim() || null,
    description: $("#p-desc").value.trim() || null,
  };
}

async function saveProduct() {
  const data = getFormData();
  try {
    if (!data.title || !data.price) {
      alert("Başlık ve fiyat zorunludur.");
      return;
    }
    if (editingId) {
      await api(`/api/products/${editingId}`, {
        method: "PUT",
        auth: true,
        body: data,
      });
    } else {
      await api("/api/products", { method: "POST", auth: true, body: data });
    }
    await loadProducts();
    closeModal();
  } catch (e) {
    alert("Kaydetme hatası: " + (e.message || e));
  }
}

async function openEdit(id) {
  try {
    const rows = await api(`/api/products`, { auth: true });
    const p = rows.find((r) => r.id == id);
    if (!p) return alert("Ürün bulunamadı");
    editingId = id;
    $("#modal-title").textContent = `Ürün Düzenle #${id}`;
    fillForm(p);
    openModal();
  } catch (e) {
    alert("Düzenleme hatası: " + (e.message || e));
  }
}

async function delProduct(id) {
  if (!confirm(`#${id} ürün silinsin mi?`)) return;
  try {
    await api(`/api/products/${id}`, { method: "DELETE", auth: true });
    await loadProducts();
  } catch (e) {
    alert("Silme hatası: " + (e.message || e));
  }
}

// -------- SİPARİŞLER --------
async function fetchOrders() {
  const status = $("#status-filter")?.value || "";
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  return await api(`/api/orders?${params.toString()}`, { auth: true });
}

function renderOrders(rows = []) {
  const tb = $("#orders-table tbody");
  tb.innerHTML = "";
  if (!rows.length) {
    $("#orders-empty").classList.remove("hidden");
    return;
  }
  $("#orders-empty").classList.add("hidden");

  for (const o of rows) {
    const tr = document.createElement("tr");
    const addr = [o.address, o.district, o.city, o.postal_code]
      .filter(Boolean)
      .join(", ");
    tr.innerHTML = `
      <td>${o.id}</td>
      <td>${o.user_email || o.user_name || "-"}</td>
      <td>₺${fmt(o.total_amount)}</td>
      <td><div class="muted">${addr || "-"}</div><div class="muted">${
        o.phone || ""
      }</div></td>
      <td><span class="badge">${o.status}</span></td>
      <td>${new Date(o.created_at).toLocaleString("tr-TR")}</td>
      <td class="right">
        <select class="order-status" data-id="${o.id}">
          ${["pending","paid","shipped","delivered","cancelled"]
            .map((s) => `<option value="${s}" ${o.status===s?"selected":""}>${s}</option>`)
            .join("")}
        </select>
        <button class="btn ghost btn-update-status" data-id="${o.id}">Güncelle</button>
      </td>
    `;
    tb.appendChild(tr);
  }

  $$(".btn-update-status").forEach((b) =>
    b.addEventListener("click", async () => {
      const id = b.dataset.id;
      const sel = $(`select.order-status[data-id="${id}"]`);
      const status = sel.value;
      try {
        await api(`/api/orders/${id}/status`, {
          method: "POST",
          auth: true,
          body: { status },
        });
        await loadOrders();
      } catch (e) {
        alert("Durum güncellenemedi: " + (e.message || e));
      }
    })
  );
}

async function loadOrders() {
  try {
    const rows = await fetchOrders();
    renderOrders(rows);
  } catch (e) {
    alert("Siparişleri çekerken hata: " + (e.message || e));
  }
}

// -------- INIT --------
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await requireAdmin();
  } catch {
    return; // admin değilse sayfa kilit
  }

  // Ürünler
  $("#btn-new-product").addEventListener("click", () => {
    editingId = null;
    $("#modal-title").textContent = "Yeni Ürün";
    clearForm();
    openModal();
  });
  $("#btn-refresh-products").addEventListener("click", loadProducts);
  $("#search-input").addEventListener("input", () => {
    clearTimeout(window._pdebounce);
    window._pdebounce = setTimeout(loadProducts, 300);
  });
  $("#category-filter").addEventListener("change", loadProducts);
  $("#btn-save").addEventListener("click", saveProduct);
  $("#btn-cancel").addEventListener("click", closeModal);
  $("#modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  // Siparişler
  $("#btn-refresh-orders").addEventListener("click", loadOrders);
  $("#status-filter").addEventListener("change", loadOrders);

  // Başlangıç yüklemeleri
  await loadProducts();
  await loadOrders();
});
