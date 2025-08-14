"use strict";

/* ===== Utils ===== */
const fmtTRY = (n) =>
  (Number(n) || 0).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
  });

const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
};

/* ===== Guard: sepet + login ===== */
function isLoggedIn() {
  return !!localStorage.getItem("tiksepet_token");
}

function guardCheckout() {
  const cart = getCart();
  if (!cart.length) {
    alert("Sepetiniz boş. Lütfen ürün ekleyin.");
    location.href = "products.html";
    return false;
  }
  if (!isLoggedIn()) {
    const ret = encodeURIComponent("checkout.html");
    location.href = `login.html?return=${ret}`;
    return false;
  }
  return true;
}

/* ===== Sipariş Özeti ===== */
function renderOrderSummary() {
  const listEl = document.getElementById("summary-list");
  const totalEl = document.getElementById("summary-total");
  if (!listEl || !totalEl) return;

  const cart = getCart();
  listEl.innerHTML = "";
  let total = 0;

  for (const item of cart) {
    const name = item.name || item.title || "Ürün";
    const qty = parseInt(item.quantity || 1, 10);
    const price = Number(item.price) || 0;
    const line = price * qty;
    total += line;

    const row = document.createElement("div");
    row.className = "summary-item";
    row.innerHTML = `
      <div>${name}</div>
      <div class="summary-qty">x${qty}</div>
      <div class="summary-line">${fmtTRY(line)}</div>
    `;
    listEl.appendChild(row);
  }

  totalEl.textContent = fmtTRY(total);
}

/* ===== Ödeme yöntemi alanları ===== */
function wirePaymentMethod() {
  const sel = document.getElementById("payment-method");
  const cardBox = document.getElementById("card-info");
  if (!sel || !cardBox) return;

  const toggle = () => {
    const useCard = sel.value === "card";
    cardBox.style.display = useCard ? "block" : "none";
  };
  sel.addEventListener("change", toggle);
  toggle(); // initial
}

/* ===== Maske/validasyon ===== */
function luhnCheck(num) {
  const s = (num || "").replace(/\s+/g, "");
  let sum = 0,
    alt = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = parseInt(s[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function wireMasks() {
  const phone = document.getElementById("phone");
  const cardNumber = document.getElementById("card-number");
  const expiry = document.getElementById("expiry");
  const cvv = document.getElementById("cvv");

  // Telefon: 4-3-2-2 (0534 896 84 32)
  if (phone) {
    phone.addEventListener("input", () => {
      const d = phone.value.replace(/\D/g, "").slice(0, 11);
      let parts;
      if (d.length <= 4) parts = [d];
      else if (d.length <= 7) parts = [d.slice(0, 4), d.slice(4)];
      else if (d.length <= 9)
        parts = [d.slice(0, 4), d.slice(4, 7), d.slice(7)];
      else parts = [d.slice(0, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9)];
      phone.value = parts.filter(Boolean).join(" ");
    });
  }

  if (cardNumber) {
    cardNumber.addEventListener("input", () => {
      let v = cardNumber.value.replace(/\D/g, "").slice(0, 16);
      cardNumber.value = v.replace(/(.{4})/g, "$1 ").trim();
    });
  }
  if (expiry) {
    expiry.addEventListener("input", () => {
      let v = expiry.value.replace(/\D/g, "").slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
      expiry.value = v;
    });
  }
  if (cvv) {
    cvv.addEventListener("input", () => {
      cvv.value = cvv.value.replace(/\D/g, "").slice(0, 4);
    });
  }
}

function validateCardFields() {
  const numRaw = document
    .getElementById("card-number")
    .value.trim()
    .replace(/\s/g, "");
  const expiry = document.getElementById("expiry").value.trim();
  const cvv = document.getElementById("cvv").value.trim();

  if (!numRaw || numRaw.length < 13 || !luhnCheck(numRaw)) {
    alert("Kart numarası geçersiz görünüyor. Lütfen kontrol edin.");
    return false;
  }
  const [mm, yy] = (expiry || "").split("/");
  const m = parseInt(mm, 10);
  const y = parseInt("20" + (yy || ""), 10);
  if (!(m >= 1 && m <= 12) || !y) {
    alert("Son kullanma tarihi hatalı. (AA/YY)");
    return false;
  }
  if (!(cvv.length === 3 || cvv.length === 4)) {
    alert("CVV 3 veya 4 haneli olmalı.");
    return false;
  }
  // Ay/yıl geçmiş mi kontrol (basit)
  const now = new Date();
  const exp = new Date(y, m - 1, 1);
  if (exp < new Date(now.getFullYear(), now.getMonth(), 1)) {
    alert("Kartın son kullanma tarihi geçmiş görünüyor.");
    return false;
  }
  return true;
}

/* ===== Form submit ===== */
function wireSubmit() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const city = document.getElementById("city").value.trim();
    const district = document.getElementById("district").value.trim();
    const address = document.getElementById("address").value.trim();
    const payment = document.getElementById("payment-method").value;

    if (
      !firstName ||
      !lastName ||
      !phone ||
      !email ||
      !city ||
      !district ||
      !address ||
      !payment
    ) {
      alert("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    if (payment === "card" && !validateCardFields()) return;

    const cart = getCart();
    let total = 0;
    for (const it of cart)
      total += (Number(it.price) || 0) * (parseInt(it.quantity || 1, 10) || 1);

    
    const nowISO = new Date().toISOString();

    const newOrder = {
      id: Date.now(),
      userId: localStorage.getItem("tiksepet_user")
        ? JSON.parse(localStorage.getItem("tiksepet_user")).id
        : "guest",
      name: `${firstName} ${lastName}`,
      email,
      phone,
      city,
      district,
      address,
      paymentMethod: payment,
      items: cart,
      total,
      // >>> tarih alanlarını uyumlu yaz
      date: nowISO,
      createdAt: nowISO,
      status: "pending",
    };

    // Şimdilik localStorage'a yazıyoruz (backend gelince API'ye göndereceğiz)
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.push(newOrder);
    localStorage.setItem("orders", JSON.stringify(orders));
    localStorage.setItem("latestOrder", JSON.stringify(newOrder));

    // Sepeti boşalt, özete geç
    localStorage.removeItem("cart");
    location.href = "order-confirmation.html";
  });
}

/* ===== INIT ===== */
document.addEventListener("DOMContentLoaded", () => {
  if (!guardCheckout()) return;

  renderOrderSummary();
  wirePaymentMethod();
  wireMasks();
  wireSubmit();
});
