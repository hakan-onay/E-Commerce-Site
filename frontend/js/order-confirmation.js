// js/order-confirmation.js
"use strict";

const fmtTRY = (n) =>
  (Number(n) || 0).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
  });

function safeParse(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // latestOrder yoksa anasayfaya dön
  const latest = safeParse("latestOrder");
  if (!latest) {
    location.href = "index.html";
    return;
  }

  // Alanlara yaz
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText("order-id", latest.id);
  setText(
    "order-date",
    new Date(latest.date || latest.createdAt).toLocaleString("tr-TR")
  );
  setText(
    "payment-method",
    latest.paymentMethod === "cash" ? "Kapıda Ödeme" : "Kart ile Ödeme"
  );
  setText("order-total", fmtTRY(latest.total));

  // Tek seferlik gösterim – birkaç saniye sonra temizle
  setTimeout(() => localStorage.removeItem("latestOrder"), 5000);
});
