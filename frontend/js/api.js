// js/api.js
export const API_BASE = "http://localhost:5000";

// URL'de ?demo=1 varsa backend yerine sahte (mock) veri döndür.
const DEMO = new URLSearchParams(location.search).has("demo");

// ---- DEMO VERİLERİ ----
const demoState = {
  user: { id: 1, name: "Admin", email: "admin@test.com", role: "admin" },
  products: [
    { id: 1, title: "Kulaklık Pro", description: "Kablosuz ANC kulaklık", price: 1899.9, image_url: "", stock: 42, rating: 4.5, category: "Elektronik" },
    { id: 2, title: "Spor Ayakkabı", description: "Günlük rahat model", price: 1299.0, image_url: "", stock: 15, rating: 4.2, category: "Giyim" },
    { id: 3, title: "Mouse", description: "Sessiz tıklama", price: 249.5, image_url: "", stock: 80, rating: 4.0, category: "Elektronik" },
  ],
  orders: [
    { id: 101, user_email: "ali@example.com", user_name: "Ali", total_amount: 2599.40, address: "Mahalle 1", city: "İstanbul", district: "Kadıköy", postal_code: "34710", phone: "0534 000 00 00", status: "pending", created_at: new Date().toISOString() },
    { id: 102, user_email: "ayse@example.com", user_name: "Ayşe", total_amount: 899.90, address: "Mahalle 2", city: "Ankara", district: "Çankaya", postal_code: "06420", phone: "0535 111 11 11", status: "paid", created_at: new Date(Date.now()-86400000).toISOString() },
  ],
};

// DEMO modunda tüm istekleri burada yakala
async function demoApi(path, { method = "GET", body } = {}) {
  // küçük yardımcı
  const ok = (data) => Promise.resolve(data);
  const notFound = () => Promise.reject(new Error("Bulunamadı"));

  // AUTH
  if (path === "/api/auth/me") return ok(demoState.user);

  // PRODUCTS
  if (path.startsWith("/api/products")) {
    const parts = path.split("?");
    const base = parts[0];
    if (method === "GET" && base === "/api/products") {
      // basit filtre: ?q= & ?category=
      let rows = [...demoState.products];
      const qs = new URLSearchParams(parts[1] || "");
      const q = (qs.get("q") || "").toLowerCase();
      const cat = (qs.get("category") || "").toLowerCase();
      if (q) rows = rows.filter(p => (p.title||"").toLowerCase().includes(q));
      if (cat) rows = rows.filter(p => (p.category||"").toLowerCase() === cat);
      return ok(rows);
    }
    if (method === "POST" && base === "/api/products") {
      const id = Math.max(0, ...demoState.products.map(p => p.id)) + 1;
      demoState.products.unshift({ id, ...body });
      return ok({ id });
    }
    // /api/products/:id
    const m = base.match(/^\/api\/products\/(\d+)$/);
    if (m) {
      const id = Number(m[1]);
      const idx = demoState.products.findIndex(p => p.id === id);
      if (idx === -1) return notFound();
      if (method === "PUT") {
        demoState.products[idx] = { ...demoState.products[idx], ...body };
        return ok({ ok: true });
      }
      if (method === "DELETE") {
        demoState.products.splice(idx, 1);
        return ok({ ok: true });
      }
    }
  }

  // ORDERS
  if (path.startsWith("/api/orders")) {
    const parts = path.split("?");
    const base = parts[0];
    if (method === "GET" && base === "/api/orders") {
      const qs = new URLSearchParams(parts[1] || "");
      const status = qs.get("status");
      let rows = [...demoState.orders];
      if (status) rows = rows.filter(o => o.status === status);
      return ok(rows);
    }
    // /api/orders/:id/status
    const m = base.match(/^\/api\/orders\/(\d+)\/status$/);
    if (m && method === "POST") {
      const id = Number(m[1]);
      const o = demoState.orders.find(o => o.id === id);
      if (!o) return notFound();
      o.status = body?.status || o.status;
      return ok({ ok: true });
    }
  }

  return notFound();
}

// ---- GERÇEK API SÜRÜMÜ ----
export async function api(path, { method = "GET", body, auth = false } = {}) {
  if (DEMO) {
    // Demo modunda mock veriyi kullan
    return demoApi(path, { method, body });
  }

  const headers = { "Content-Type": "application/json" };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  if (auth) {
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = "Bearer " + token;
  }

  const res = await fetch(API_BASE + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}
