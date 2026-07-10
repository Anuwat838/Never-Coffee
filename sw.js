/* TeamWork Service Worker
   - เปิดใช้การติดตั้งเป็นแอป (PWA)
   - หน้าแอปใช้ network-first → อัปเดตเวอร์ชันใหม่ได้ทันทีที่ออนไลน์
   - ไอคอน/manifest ใช้ cache-first
   - ไม่ยุ่งกับ request ของ Firebase/ฟอนต์ (ปล่อยผ่านปกติ) */

const CACHE = "teamwork-v1";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Firebase, fonts, CDN → ปล่อยผ่าน

  // หน้าแอป: network-first (ได้เวอร์ชันล่าสุดเสมอ, ออฟไลน์ค่อยใช้ cache)
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(res => { caches.open(CACHE).then(c => c.put("./index.html", res.clone())); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // ไฟล์อื่นในโดเมนเรา (ไอคอน ฯลฯ): cache-first
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      caches.open(CACHE).then(c => c.put(req, res.clone()));
      return res;
    }))
  );
});
