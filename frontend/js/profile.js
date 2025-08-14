// js/profile.js (module)
import { api } from "./api.js";
import { getAuth, clearAuth } from "./auth.js";

function fmtTRY(n) {
  return (Number(n) || 0).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
  });
}

async function loadUserData() {
  const auth = getAuth();
  if (!auth?.user || !auth?.token) {
    location.href = `login.html?return=${encodeURIComponent(
      location.pathname
    )}`;
    return;
  }

  // Kullanıcı bilgisi
  document.getElementById("u-name").textContent = auth.user.name || "—";
  document.getElementById("u-email").textContent = auth.user.email || "—";

  try {
    // Backend sipariş listesi denemesi
    const orders = await api("/orders/my", { token: auth.token });
    renderOrders(orders || []);
  } catch {
    // Backend yoksa local fallback
    const allOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    const myOrders = allOrders
      .filter((o) => String(o.userId) === String(auth.user.id))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    renderOrders(myOrders);
  }
}

function renderOrders(orderList) {
  const list = document.getElementById("order-list");
  const emptyState = document.getElementById("orders-empty");

  list.innerHTML = "";
  if (!orderList.length) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  orderList.forEach((o) => {
    const itemsCount = (o.items || []).reduce(
      (acc, it) => acc + (it.quantity || 1),
      0
    );
    const el = document.createElement("div");
    el.className = "order-item";
    el.innerHTML = `
      <div class="order-info">
        <div><strong>Sipariş No:</strong> ${o.id}</div>
        <div><strong>Tarih:</strong> ${new Date(
          o.date || o.createdAt
        ).toLocaleString("tr-TR")}</div>
        <div><strong>Ödeme:</strong> ${
          o.paymentMethod === "cash" ? "Kapıda Ödeme" : "Kart"
        }</div>
        <div><strong>Ürün Adedi:</strong> ${itemsCount}</div>
        <div><strong>Toplam:</strong> ${fmtTRY(o.total || 0)}</div>
      </div>
      <div class="order-actions">
        <a href="order-confirmation.html">Detay</a>
      </div>
    `;
    el.querySelector(".order-actions a").addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.setItem("latestOrder", JSON.stringify(o));
      location.href = "order-confirmation.html";
    });
    list.appendChild(el);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadUserData();
  document.getElementById("logout-btn")?.addEventListener("click", () => {
    clearAuth();
    location.href = "index.html";
  });
});
