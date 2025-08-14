// js/main.js (global, module değil)

// Header ve footer logolarını tema ile uyumlu tut
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

// Tema yönetimi
function applyTheme(theme) {
  const root = document.body;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  localStorage.setItem("tiksepet_theme", theme);
  updateHeaderLogo(theme);
  updateFooterLogo(theme);
}
function resolveInitialTheme() {
  const saved = localStorage.getItem("tiksepet_theme");
  if (saved === "light" || saved === "dark") return saved;
  const prefersDark = window.matchMedia?.(
    "(prefers-color-scheme: dark)"
  )?.matches;
  return prefersDark ? "dark" : "light";
}
function toggleTheme() {
  const root = document.body;
  const next = root.classList.contains("dark") ? "light" : "dark";
  applyTheme(next);
}

// Menü (mobil)
function toggleMenu() {
  const nav = document.getElementById("navLinks");
  if (nav) nav.classList.toggle("active");
}

// Sepet rozeti
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const el = document.getElementById("cart-count");
  if (!el) return;
  const totalQty = cart.reduce(
    (s, it) => s + (parseInt(it.quantity || 0, 10) || 0),
    0
  );
  el.textContent = String(totalQty);
}

// cart değişimlerini diğer sekmelere de ilet
(function patchCartEvents() {
  const _setItem = localStorage.setItem;
  const _removeItem = localStorage.removeItem;

  localStorage.setItem = function (key, value) {
    const oldVal = localStorage.getItem(key);
    _setItem.apply(this, arguments);
    if (key === "cart" && oldVal !== value)
      window.dispatchEvent(new Event("cart-changed"));
  };
  localStorage.removeItem = function (key) {
    _removeItem.apply(this, arguments);
    if (key === "cart") window.dispatchEvent(new Event("cart-changed"));
  };
  window.addEventListener("storage", (e) => {
    if (e.key === "cart") window.dispatchEvent(new Event("cart-changed"));
  });
})();

// INIT (tüm sayfalarda)
document.addEventListener("DOMContentLoaded", () => {
  // Tema
  applyTheme(resolveInitialTheme());
  document
    .getElementById("theme-toggle")
    ?.addEventListener("click", toggleTheme);

  // Hamburger
  const burger = document.getElementById("hamburger");
  if (burger) {
    const click = () => toggleMenu();
    burger.addEventListener("click", click);
    burger.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === " ") click();
    });
  }

  // Sepet rozeti
  updateCartCount();
});

// Loader
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
});

// Rozeti canlı tut
window.addEventListener("cart-changed", updateCartCount);

// Eski inline çağrımlar bozulmasın diye:
window.toggleTheme = toggleTheme;
window.toggleMenu = toggleMenu;
