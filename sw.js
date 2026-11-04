// Cache simples: depois da primeira visita, o aplicativo abre mesmo sem internet.
const VERSAO = 'curriculo-justo-v1'
const ARQUIVOS = ['./', 'index.html', 'estilo.css', 'app.js', 'curriculo.js', 'manifest.webmanifest', 'icone.svg']

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(VERSAO).then((cache) => cache.addAll(ARQUIVOS)))
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(caches.keys().then((versoes) => Promise.all(versoes.filter((v) => v !== VERSAO).map((v) => caches.delete(v)))))
})

self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return
  evento.respondWith(caches.match(evento.request).then((guardada) => guardada ?? fetch(evento.request)))
})
