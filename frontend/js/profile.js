"use strict";

// JSON parse güvenli
function safeParse(key, def = null) {
  try {
    return JSON.parse(
      localStorage.getItem(key) || (def === null ? "null" : JSON.stringify(def))
    );
  } catch {
    return def;
  }
}

function fmtTRY(n) {
  return (Number(n) || 0).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Kullanıcı giriş kontrolü
  const currentUserId = localStorage.getItem("currentUserId");
  if (!currentUserId) {
    const ret = encodeURIComponent(location.pathname);
    location.href = `login.html?return=${ret}`;
    return;
  }

  // Kullanıcı bilgilerini göster
  const users = safeParse("users", []);
  const user = users.find((u) => String(u.id) === String(currentUserId));
  if (!user) {
    localStorage.removeItem("currentUserId");
    location.href = "login.html";
    return;
  }
  document.getElementById("u-name").textContent = user.name || "—";
  document.getElementById("u-email").textContent = user.email || "—";

  // Sipariş geçmişi
  renderOrders(currentUserId);

  // Çıkış butonu
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("currentUserId");
    location.href = "index.html";
  });
});

function renderOrders(userId) {
  const orders = safeParse("orders", []);
  const myOrders = orders
    .filter((o) => String(o.userId) === String(userId))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const list = document.getElementById("order-list");
  const emptyState = document.getElementById("orders-empty");

  list.innerHTML = "";
  if (myOrders.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  myOrders.forEach((o) => {
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
