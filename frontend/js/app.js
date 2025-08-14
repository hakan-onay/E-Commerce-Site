// js/app.js
"use strict";

/* ========== Tema & Logo ========== */
function updateHeaderLogo(theme) {
  const logo = document.getElementById("site-logo");
  if (!logo) return;
  logo.src =
    theme === "dark"
      ? "assets/images/logos/logo_dark.png"
      : "assets/images/logos/logo_light.png";
}

function updateFooterLogo(theme) {
  const footerLogo = document.getElementById("footer-logo");
  if (!footerLogo) return;
  footerLogo.src =
    theme === "dark"
      ? "assets/images/logos/logo_dark.png"
      : "assets/images/logos/logo_light.png";
}

function applyTheme(theme) {
  if (theme === "dark") document.body.classList.add("dark");
  else document.body.classList.remove("dark");

  localStorage.setItem("theme", theme);
  updateHeaderLogo(theme);
  updateFooterLogo(theme);
}

function resolveInitialTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  // Kaydedilmiş tema yoksa sistem temasını kullan
  const prefersDark = window.matchMedia?.(
    "(prefers-color-scheme: dark)"
  )?.matches;
  return prefersDark ? "dark" : "light";
}

function toggleTheme() {
  const next = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(next);
}

/* ========== Menü ========== */
function toggleMenu() {
  const nav = document.getElementById("navLinks");
  if (nav) nav.classList.toggle("active");
}

/* ========== Sepet Rozeti (NAV) ========== */
export function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const cartCountElement = document.getElementById("cart-count");
  if (!cartCountElement) return;

  // Toplam adet (ürün sayısı değil, miktar toplamı)
  const totalQty = cart.reduce(
    (s, it) => s + (parseInt(it.quantity || 0, 10) || 0),
    0
  );
  cartCountElement.textContent = String(totalQty);
}

/* ========== cart değişimini yayınla (aynı/diğer sekmeler) ========== */
(function patchCartEvents() {
  const _setItem = localStorage.setItem;
  const _removeItem = localStorage.removeItem;

  localStorage.setItem = function (key, value) {
    const oldVal = localStorage.getItem(key);
    _setItem.apply(this, arguments);
    if (key === "cart" && oldVal !== value) {
      window.dispatchEvent(new Event("cart-changed"));
    }
  };

  localStorage.removeItem = function (key) {
    _removeItem.apply(this, arguments);
    if (key === "cart") {
      window.dispatchEvent(new Event("cart-changed"));
    }
  };

  window.addEventListener("storage", (e) => {
    if (e.key === "cart") window.dispatchEvent(new Event("cart-changed"));
  });
})();

/* ========== INIT (tüm sayfalarda ortak) ========== */
document.addEventListener("DOMContentLoaded", () => {
  // Tema yükle (kaydedilmiş yoksa sistem teması)
  const initialTheme = resolveInitialTheme();
  applyTheme(initialTheme);

  // Tema butonu
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

  // Hamburger menü
  const burger = document.getElementById("hamburger");
  if (burger) {
    const click = () => toggleMenu();
    burger.addEventListener("click", click);
    burger.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === " ") click();
    });
  }

  // Sepet rozeti ilk çizim
  updateCartCount();
});

/* ========== Loader ========== */
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
});

/* ========== Rozeti canlı tut ========== */
window.addEventListener("cart-changed", updateCartCount);

/* ========== Eski inline kullanımlar bozulmasın diye ========== */
// Eğer bazı HTML'lerde hâlâ onclick="toggleTheme()" / onclick="toggleMenu()" varsa:
window.toggleTheme = toggleTheme;
window.toggleMenu = toggleMenu;
