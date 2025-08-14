// js/cart.js
import { updateCartCount } from "./app.js";

function fmtTry(n) {
  return (Number(n) || 0).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
  });
}

function renderCart() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const container = document.getElementById("cart-items");
  const empty = document.getElementById("cart-empty");
  const totalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");

  container.innerHTML = "";

  if (!cart.length) {
    empty.style.display = "block";
    totalEl.style.display = "none";
    checkoutBtn.style.display = "none";
    totalEl.textContent = "Toplam: ₺0,00";
    return;
  }

  empty.style.display = "none";
  totalEl.style.display = "block";
  checkoutBtn.style.display = "inline-block";

  for (const item of cart) {
    const id = String(item.id);
    const price = Number(item.price) || 0;
    const qty = parseInt(item.quantity || 1, 10);
    const name = item.name || item.title || "Ürün";
    const image =
      item.image || item.image_url || "assets/images/placeholders/product.png";

    const el = document.createElement("div");
    el.className = "cart-item";
    el.setAttribute("data-id", id);
    el.setAttribute("data-price", String(price));
    el.innerHTML = `
      <img src="${image}" alt="${name}" />
      <div class="cart-item-info">
        <div class="cart-item-title">${name}</div>
        <div class="cart-item-price">${fmtTry(price)}</div>
        <div class="cart-item-quantity">
          <button class="qty-btn decrease" type="button">-</button>
          <span class="item-qty">${qty}</span>
          <button class="qty-btn increase" type="button">+</button>
        </div>
      </div>
      <button class="cart-item-remove" type="button">Sil</button>
    `;
    container.appendChild(el);
  }

  wireItemEvents();
  updateCartTotal();
}

function updateCartTotal() {
  const items = Array.from(document.querySelectorAll(".cart-item"));
  let total = 0;
  for (const it of items) {
    const price = Number(it.getAttribute("data-price") || "0");
    const qty = parseInt(it.querySelector(".item-qty").textContent || "0", 10);
    total += price * qty;
  }
  document.getElementById("cart-total").textContent = `Toplam: ${fmtTry(
    total
  )}`;

  // Boş ise görünüm
  const empty = document.getElementById("cart-empty");
  const totalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");
  if (items.length === 0) {
    empty.style.display = "block";
    totalEl.style.display = "none";
    checkoutBtn.style.display = "none";
  } else {
    empty.style.display = "none";
    totalEl.style.display = "block";
    checkoutBtn.style.display = "inline-block";
  }
}

function saveQty(itemId, newQty) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const idx = cart.findIndex((x) => String(x.id) === String(itemId));
  if (idx !== -1) {
    cart[idx].quantity = newQty;
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
  }
}

function removeItem(itemId) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const next = cart.filter((x) => String(x.id) !== String(itemId));
  localStorage.setItem("cart", JSON.stringify(next));
  updateCartCount();
}

function wireItemEvents() {
  // Arttır
  document.querySelectorAll(".cart-item .increase").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const wrap = e.currentTarget.closest(".cart-item");
      const id = wrap.getAttribute("data-id");
      const qtyEl = wrap.querySelector(".item-qty");
      const qty = parseInt(qtyEl.textContent, 10) + 1;
      qtyEl.textContent = qty;
      saveQty(id, qty);
      updateCartTotal();
    });
  });

  // Azalt
  document.querySelectorAll(".cart-item .decrease").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const wrap = e.currentTarget.closest(".cart-item");
      const id = wrap.getAttribute("data-id");
      const qtyEl = wrap.querySelector(".item-qty");
      const cur = parseInt(qtyEl.textContent, 10);
      if (cur > 1) {
        const qty = cur - 1;
        qtyEl.textContent = qty;
        saveQty(id, qty);
        updateCartTotal();
      }
    });
  });

  // Sil
  document.querySelectorAll(".cart-item-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const wrap = e.currentTarget.closest(".cart-item");
      const id = wrap.getAttribute("data-id");
      wrap.remove();
      removeItem(id);
      updateCartTotal();
    });
  });
}

// Checkout
function wireCheckout() {
  const btn = document.getElementById("checkout-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      // backend hazır olunca doğruca /checkout.html
      window.location.href = "checkout.html";
    });
  }
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  wireCheckout();
});

// Dışarıdan sepet değişirse (başka sayfadan ürün eklendi/silindi)
window.addEventListener("cart-changed", () => {
  renderCart();
});
