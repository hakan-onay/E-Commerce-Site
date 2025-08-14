// js/login.js (module)
import { api } from "./api.js";
import { setAuth, getToken } from "./auth.js";

function redirectAfterLogin() {
  const params = new URLSearchParams(location.search);
  const ret = params.get("return");
  location.href = ret || "index.html";
}

// Backend yoksa: yerel users[] ile fallback login
function localFallbackLogin(email, password) {
  try {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const found = users.find(
      (u) => u.email === email && u.password === password
    );
    if (!found) return false;

    const user = {
      id: found.id || Date.now(),
      name: found.name || email.split("@")[0],
      email,
      role: found.role || "user",
    };
    const token = "local_" + Math.random().toString(36).slice(2);
    setAuth({ user, token });
    return true;
  } catch {
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Zaten girişliyse yönlendir
  if (getToken()) {
    redirectAfterLogin();
    return;
  }

  const form = document.getElementById("login-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const email = document.getElementById("email").value.trim().toLowerCase(); // önemli: register ile aynı
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Lütfen e-posta ve şifre girin.");
      return;
    }

    submitBtn?.setAttribute("disabled", "true");

    try {
      // Önce gerçek API
      const data = await api("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      if (!data?.token || !data?.user) throw new Error("Eksik yanıt");
      setAuth({ user: data.user, token: data.token });
      redirectAfterLogin();
    } catch {
      // API başarısızsa local fallback
      const ok = localFallbackLogin(email, password);
      if (!ok) {
        alert("E-posta veya şifre hatalı!");
        submitBtn?.removeAttribute("disabled");
        return;
      }
      redirectAfterLogin();
    }
  });
});
