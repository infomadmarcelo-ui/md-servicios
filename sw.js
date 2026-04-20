const CACHE_NAME = 'md-servicios-v1';
const ASSETS = [
  '/',
  '/index.html',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js'
];

// Instalar: cachear los assets principales
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(['/index.html']).catch(function(err){
        console.log('Cache parcial:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejos
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network first, fallback a cache
self.addEventListener('fetch', function(e){
  // Solo cachear requests GET
  if(e.request.method !== 'GET') return;
  
  // No interceptar requests de Firebase/Firestore (necesitan red)
  var url = e.request.url;
  if(url.includes('firestore.googleapis.com') || 
     url.includes('firebase') ||
     url.includes('identitytoolkit') ||
     url.includes('securetoken')){
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(function(response){
        // Guardar en cache si es exitoso
        if(response && response.status === 200){
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(function(){
        // Sin red: usar cache
        return caches.match(e.request).then(function(cached){
          return cached || new Response(
            '<h2 style="font-family:sans-serif;text-align:center;margin-top:40px">Sin conexión. Reconectate para usar la app.</h2>',
            {headers: {'Content-Type': 'text/html'}}
          );
        });
      })
  );
});
