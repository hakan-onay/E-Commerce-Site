// js/checkout.js
import { updateCartCount } from "./app.js";
import { api } from "./api.js"; // ileride backend bağlayınca kullanacağız
import { me } from "./auth.js"; // login kontrolü

const DEMO = new URLSearchParams(location.search).has("demo");

const fmtTRY = (n) =>
  (Number(n) || 0).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
  });
const getCart = () => JSON.parse(localStorage.getItem("cart") || "[]");

// --- Guard: sepet boşsa veya login yoksa yönlendir ---
async function guardCheckout() {
  const cart = getCart();
  if (!cart.length) {
    alert("Sepetiniz boş. Lütfen ürün ekleyin.");
    location.href = "products.html";
    return false;
  }

  // Login kontrolü (demo'da token gerekmiyor; me() mock döner)
  try {
    await me(); // başarısız olursa catch'e düşer
  } catch {
    const ret = encodeURIComponent("checkout.html");
    location.href = `login.html?return=${ret}`;
    return false;
  }
  return true;
}

// --- Sipariş Özeti ---
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

// --- Ödeme yöntemi alanları ---
function wirePaymentMethod() {
  const sel = document.getElementById("payment-method");
  const cardBox = document.getElementById("card-info");
  if (!sel || !cardBox) return;
  sel.addEventListener("change", () => {
    cardBox.style.display = sel.value === "card" ? "block" : "none";
  });
}

// --- Kart validasyon/mask ---
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

  if (phone) {
    phone.addEventListener("input", () => {
      let v = phone.value.replace(/\D/g, "").slice(0, 10);
      if (v.length > 3) v = v.slice(0, 3) + " " + v.slice(3);
      if (v.length > 7) v = v.slice(0, 7) + " " + v.slice(7);
      phone.value = v;
    });
  }
  if (cardNumber) {
    cardNumber.addEventListener("input", () => {
      let v = cardNumber.value.replace(/\D/g, "").slice(0, 19);
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
  const cardNumber = document.getElementById("card-number").value.trim();
  const expiry = document.getElementById("expiry").value.trim();
  const cvv = document.getElementById("cvv").value.trim();

  const num = cardNumber.replace(/\s/g, "");
  if (!num || num.length < 13 || !luhnCheck(num)) {
    alert("Kart numarası geçersiz görünüyor. Lütfen kontrol edin.");
    return false;
  }
  const [mm, yy] = (expiry || "").split("/");
  const m = parseInt(mm, 10),
    y = parseInt("20" + (yy || ""), 10);
  if (!(m >= 1 && m <= 12) || !y) {
    alert("Son kullanma tarihi hatalı. (AA/YY)");
    return false;
  }
  if (!(cvv.length === 3 || cvv.length === 4)) {
    alert("CVV 3 veya 4 haneli olmalı.");
    return false;
  }
  return true;
}

// --- Form submit ---
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
      total += (Number(it.price) || 0) * parseInt(it.quantity || 1, 10);

    const newOrder = {
      id: Date.now(),
      userId: localStorage.getItem("currentUserId") || "guest",
      name: `${firstName} ${lastName}`,
      email,
      phone,
      address: `${city}/${district} - ${address}`,
      paymentMethod: payment,
      items: cart,
      total,
      date: new Date().toISOString(),
      status: "pending",
    };

    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.push(newOrder);
    localStorage.setItem("orders", JSON.stringify(orders));
    localStorage.setItem("latestOrder", JSON.stringify(newOrder));

    localStorage.removeItem("cart");
    location.href = "order-confirmation.html";
  });
}

// --- INIT ---
document.addEventListener("DOMContentLoaded", async () => {
  const ok = await guardCheckout();
  if (!ok) return;

  renderOrderSummary();
  wirePaymentMethod();
  wireMasks();
  wireSubmit();
});
