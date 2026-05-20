const CACHE_NAME = 'wc2026-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
]

// Instalar: cachear assets estáticos
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activar: limpiar caches viejos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network first, cache fallback para navegación
self.addEventListener('fetch', (e) => {
  // Solo interceptar requests del mismo origen
  if (!e.request.url.startsWith(self.location.origin)) return
  // No interceptar requests a Supabase API
  if (e.request.url.includes('supabase.co')) return

  // Para navegación (HTML) → network first con fallback a index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    )
    return
  }

  // Para assets estáticos → cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  )
})
