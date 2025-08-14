// js/login.js
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // Basit kullanıcı doğrulama (şimdilik localStorage)
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const foundUser = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!foundUser) {
      alert("E-posta veya şifre hatalı!");
      return;
    }

    // Login kaydı
    localStorage.setItem("currentUserId", foundUser.id);

    // return parametresi varsa oraya git
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get("return");
    if (returnUrl) {
      window.location.href = returnUrl;
    } else {
      window.location.href = "index.html";
    }
  });
});
