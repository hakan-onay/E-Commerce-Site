"use strict";

/* ========== Yardımcılar ========== */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
}
function setCart(arr) {
  localStorage.setItem("cart", JSON.stringify(arr));
  // Navbar sepet sayacı vb. için global sinyal
  document.dispatchEvent(
    new CustomEvent("cart-changed", { detail: { length: arr.length } })
  );
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

/* Türkçe uyumlu arama (İ/i, I/ı) + normalize */
function trNormalize(s) {
  return (s || "")
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* ========== Rating (yıldız) tıklama ========== */
function wireRating() {
  document.querySelectorAll(".product-card .rating").forEach((wrap) => {
    wrap.addEventListener("click", (e) => {
      const star = e.target.closest(".star");
      if (!star) return;

      const stars = Array.from(wrap.querySelectorAll(".star"));
      const idx = stars.indexOf(star);

      // Görsel seçim
      stars.forEach((s, i) => s.classList.toggle("selected", i <= idx));

      // Karta ve localStorage'a yaz
      const card = wrap.closest(".product-card");
      if (card) {
        const rating = idx + 1;
        card.dataset.rating = String(rating);

        const id = card.querySelector(".add-to-cart")?.dataset.id;
        if (id) {
          const ratings = JSON.parse(localStorage.getItem("ratings") || "{}");
          ratings[id] = rating;
          localStorage.setItem("ratings", JSON.stringify(ratings));
        }
      }
    });
  });
}

/* ========== Sepete ekleme ========== */
function userLoggedIn() {
  // Proje genelinde kullanılan anahtar: tiksepet_token
  return !!localStorage.getItem("tiksepet_token");
}
function wireAddToCart() {
  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Giriş kontrolü
      if (!userLoggedIn()) {
        const ret = encodeURIComponent(location.href);
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
      if (i !== -1) {
        cart[i].quantity = (parseInt(cart[i].quantity || 0, 10) || 0) + 1;
      } else {
        cart.push({ id, name, price, image, quantity: 1 });
      }

      setCart(cart);

      const toplam = cart.reduce(
        (s, it) =>
          s + (Number(it.price) || 0) * (parseInt(it.quantity || 1, 10) || 1),
        0
      );
      showToast(`${name} sepete eklendi. Toplam: ${fmtTRY(toplam)}`);
    });
  });
}

/* ========== Arama + Kategori filtresi (+ opsiyonel sıralama) ========== */
function wireFilters() {
  const searchInput = document.querySelector(".search-input");
  const categorySelect = document.querySelector(".category-filter");
  const sortSelect = document.querySelector(".sort-select"); // HTML'e eklersen çalışır
  const grid = document.querySelector(".product-grid");
  const productCards = Array.from(document.querySelectorAll(".product-card"));

  if (!searchInput || !categorySelect || !grid || productCards.length === 0)
    return;

  function applyNoMatchState() {
    const anyVisible = productCards.some((el) => el.style.display !== "none");
    grid.classList.toggle("no-match", !anyVisible);
  }

  function filterProducts() {
    const q = trNormalize(searchInput.value || "");
    const cat = trNormalize(categorySelect.value || "all");

    for (const card of productCards) {
      const name = trNormalize(card.querySelector("h3")?.textContent || "");
      const c = trNormalize(card.getAttribute("data-category") || "all");

      const matchesSearch = name.includes(q);
      const matchesCategory = cat === "all" || c === cat;

      // Grid’lerde "" / "none" en sağlıklısı
      card.style.display = matchesSearch && matchesCategory ? "" : "none";
    }
    applyNoMatchState();
  }

  function getPrice(card) {
    // En güvenlisi: butondaki data-price
    const p = Number(card.querySelector(".add-to-cart")?.dataset.price || "0");
    return Number.isFinite(p) ? p : 0;
  }

  function sortProducts() {
    if (!sortSelect) return; // eklenmediyse pas geç
    const mode = sortSelect.value; // "default" | "price-asc" | "price-desc"
    if (mode === "default") return;

    const visibleCards = productCards.filter((c) => c.style.display !== "none");
    visibleCards.sort((a, b) => {
      const pa = getPrice(a);
      const pb = getPrice(b);
      return mode === "price-asc" ? pa - pb : pb - pa;
    });

    // Görünenleri yeni sırayla ekle (gizlilerin yeri bozulmaz)
    for (const c of visibleCards) grid.appendChild(c);
  }

  // İlk çalışma
  filterProducts();

  // Eventler
  let debounce;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      filterProducts();
      sortProducts();
    }, 200);
  });
  categorySelect.addEventListener("change", () => {
    filterProducts();
    sortProducts();
  });
  sortSelect?.addEventListener("change", () => sortProducts());
}

/* ========== INIT ========== */
document.addEventListener("DOMContentLoaded", () => {
  wireRating();
  wireAddToCart();
  wireFilters();
});
