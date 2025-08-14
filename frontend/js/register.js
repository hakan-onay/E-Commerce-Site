// js/register.js
"use strict";

// Basit storage yardımcıları
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("users") || "[]");
  } catch {
    return [];
  }
}
function setUsers(arr) {
  localStorage.setItem("users", JSON.stringify(arr));
}

function validateEmail(email) {
  // Basit e-posta kontrolü
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();
    const password2 = document.getElementById("password2").value.trim();

    // Zorunlu alanlar
    if (!name || !email || !password || !password2) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }
    // Email format
    if (!validateEmail(email)) {
      alert("Geçerli bir e-posta girin.");
      return;
    }
    // Şifre kuralları
    if (password.length < 6) {
      alert("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== password2) {
      alert("Şifreler eşleşmiyor.");
      return;
    }

    // Var mı?
    const users = getUsers();
    if (users.some((u) => u.email === email)) {
      alert("Bu e-posta ile zaten bir hesap var.");
      return;
    }

    // Kullanıcıyı oluştur
    const newUser = {
      id: Date.now(),
      name,
      email,
      password, // DEMO amaçlı düz metin; backend gelince hash'leyeceğiz
      role: "user", // istersen buradan 'admin' atayarak admin test edebilirsin
    };
    users.push(newUser);
    setUsers(users);

    // Otomatik login
    localStorage.setItem("currentUserId", String(newUser.id));

    // return paramı varsa oraya dön, yoksa anasayfa
    const params = new URLSearchParams(location.search);
    const ret = params.get("return");
    location.href = ret ? decodeURIComponent(ret) : "index.html";
  });
});
