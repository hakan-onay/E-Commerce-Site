import { api } from "./api.js";
const DEMO = new URLSearchParams(location.search).has("demo");

export async function login(email, password) {
  if (DEMO) {
    localStorage.setItem("token", "demo-token");
    return "demo-token";
  }
  const { token } = await api("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  localStorage.setItem("token", token);
  return token;
}

export async function registerUser(data) {
  if (DEMO) {
    localStorage.setItem("token", "demo-token");
    return "demo-token";
  }
  const { token } = await api("/api/auth/register", {
    method: "POST",
    body: data,
  });
  localStorage.setItem("token", token);
  return token;
}

export async function me() {
  return await api("/api/auth/me", { auth: true }); // demoApi bu çağrıyı mock’luyor
}

export function logout() {
  localStorage.removeItem("token");
}

/* Local Storage Anahtarları */
const LS_USERS = "users";
const LS_CURRENT = "currentUserId";

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(LS_USERS) || "[]");
  } catch {
    return [];
  }
}
function setUsers(u) {
  localStorage.setItem(LS_USERS, JSON.stringify(u));
}
function getCurrentUser() {
  const id = localStorage.getItem(LS_CURRENT);
  if (!id) return null;
  return getUsers().find((u) => String(u.id) === String(id)) || null;
}
function loginByEmail(email, password) {
  const u = getUsers().find(
    (x) => x.email === email && x.password === password
  );
  if (!u) return false;
  localStorage.setItem(LS_CURRENT, String(u.id));
  window.dispatchEvent(new Event("auth-changed"));
  return true;
}
function logout() {
  localStorage.removeItem(LS_CURRENT);
  window.dispatchEvent(new Event("auth-changed"));
}
function mountAuthArea() {
  const navLinks = document.getElementById("navLinks");
  if (!navLinks) return;
  let li = document.getElementById("auth-area");
  if (!li) {
    li = document.createElement("li");
    li.id = "auth-area";
    navLinks.appendChild(li);
  }
  const u = getCurrentUser();
  if (u) {
    li.innerHTML = `<span>Hoş geldin, <strong>${u.name}</strong></span>  <a href="#" id="logout-link">Çıkış</a>`;
    li.querySelector("#logout-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  } else {
    li.innerHTML = `<a href="login.html">Giriş Yap</a>`;
  }
}
window.addEventListener("auth-changed", mountAuthArea);
document.addEventListener("DOMContentLoaded", mountAuthArea);
