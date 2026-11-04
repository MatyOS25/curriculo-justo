// Usa a rede quando há conexão, para ninguém ficar preso a uma versão antiga, e o cache quando não há.
const VERSAO = 'curriculo-justo-v3'
const ARQUIVOS = ['./', 'index.html', 'estilo.css', 'app.js', 'curriculo.js', 'manifest.webmanifest', 'icone.svg']

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(VERSAO).then((cache) => cache.addAll(ARQUIVOS)))
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(caches.keys().then((versoes) => Promise.all(versoes.filter((v) => v !== VERSAO).map((v) => caches.delete(v)))))
})

self.addEventListener('fetch', (evento) => {
  const { request } = evento
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  evento.respondWith(
    fetch(request)
      .then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone()
          evento.waitUntil(caches.open(VERSAO).then((cache) => cache.put(request, copia)))
        }
        return resposta
      })
      .catch(() => caches.match(request).then((guardada) => guardada ?? Response.error())),
  )
})
