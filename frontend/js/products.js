"use strict";

/* Yardımcılar */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
}
function setCart(arr) {
  localStorage.setItem("cart", JSON.stringify(arr)); // app.js cart-changed eventini tetikler
}
function fmtTRY(n) {
  return (Number(n) || 0).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
  });
}
function ensureToastContainer() {
  let c = document.getElementById("toast-container");
  if (!c) {
    c = document.createElement("div");
    c.id = "toast-container";
    document.body.appendChild(c);
  }
  return c;
}
function showToast(message) {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* Yıldız (rating) tıklama */
function wireRating() {
  document.querySelectorAll(".product-card .rating").forEach((wrap) => {
    wrap.addEventListener("click", (e) => {
      const star = e.target.closest(".star");
      if (!star) return;
      const stars = Array.from(wrap.querySelectorAll(".star"));
      const idx = stars.indexOf(star);
      stars.forEach((s, i) => s.classList.toggle("selected", i <= idx));
    });
  });
}

/* Sepete ekleme */
function wireAddToCart() {
  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Giriş kontrolü
      if (!localStorage.getItem("currentUserId")) {
        const ret = encodeURIComponent(location.pathname);
        location.href = `login.html?return=${ret}`;
        return;
      }

      const id = String(btn.dataset.id || "");
      const name = btn.dataset.name || "Ürün";
      const price = Number(btn.dataset.price || "0");
      const image =
        btn.dataset.image || "assets/images/placeholders/product.png";

      const cart = getCart();
      const i = cart.findIndex((x) => String(x.id) === id);
      if (i !== -1)
        cart[i].quantity = (parseInt(cart[i].quantity || 0, 10) || 0) + 1;
      else cart.push({ id, name, price, image, quantity: 1 });

      setCart(cart);
      showToast(
        `${name} sepete eklendi. Toplam: ${fmtTRY(
          cart.reduce(
            (s, it) => s + it.price * parseInt(it.quantity || 1, 10),
            0
          )
        )}`
      );
    });
  });
}

/* Arama + Kategori filtresi */
function wireFilters() {
  const searchInput = document.querySelector(".search-input");
  const categorySelect = document.querySelector(".category-filter");
  const productCards = Array.from(document.querySelectorAll(".product-card"));

  if (!searchInput || !categorySelect) return;

  function filterProducts() {
    const q = (searchInput.value || "").toLowerCase();
    const cat = (categorySelect.value || "all").toLowerCase();

    for (const card of productCards) {
      const name = (card.querySelector("h3")?.textContent || "").toLowerCase();
      const c = (card.getAttribute("data-category") || "all").toLowerCase();

      const matchesSearch = name.includes(q);
      const matchesCategory = cat === "all" || c === cat;

      card.style.display = matchesSearch && matchesCategory ? "block" : "none";
    }
  }

  // İlk filtre (boş arama)
  filterProducts();

  // Eventler
  let debounce;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(filterProducts, 200);
  });
  categorySelect.addEventListener("change", filterProducts);
}

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  wireRating();
  wireAddToCart();
  wireFilters();
});
