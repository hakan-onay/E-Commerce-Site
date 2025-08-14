// js/register.js (module)
import { api } from "./api.js";
import { setAuth } from "./auth.js";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Backend yoksa local fallback kayıt
function localFallbackRegister({ name, email, password }) {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  if (users.some((u) => u.email === email)) {
    throw new Error("Bu e-posta ile zaten bir hesap var.");
  }
  const newUser = {
    id: Date.now(),
    name,
    email,
    password, // Demo: düz metin
    role: "user",
  };
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  // Otomatik login bilgileri
  const token = "local_" + Math.random().toString(36).slice(2);
  setAuth({ user: newUser, token });
}

function redirectAfterRegister() {
  const params = new URLSearchParams(location.search);
  const ret = params.get("return");
  location.href = ret || "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();
    const password2 = document.getElementById("password2").value.trim();

    if (!name || !email || !password || !password2) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }
    if (!validateEmail(email)) {
      alert("Geçerli bir e-posta girin.");
      return;
    }
    if (password.length < 6) {
      alert("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== password2) {
      alert("Şifreler eşleşmiyor.");
      return;
    }

    // Önce backend denemesi
    try {
      const data = await api("/auth/register", {
        method: "POST",
        body: { name, email, password },
      });
      if (!data?.token || !data?.user) throw new Error("Eksik yanıt");
      setAuth({ user: data.user, token: data.token });
      redirectAfterRegister();
      return;
    } catch (err) {
      // Backend yoksa local fallback
      try {
        localFallbackRegister({ name, email, password });
        redirectAfterRegister();
      } catch (localErr) {
        alert(localErr.message);
      }
    }
  });
});
