const CACHE_NAME = 'course-tracker-v2'; 
const urlsToCache = [
  '/',
  '/index.html'
];

// Step 1: Install and cache initial files
self.addEventListener('install', event => {
  // skipWaiting forces this new worker to activate immediately, 
  // bypassing the "waiting" state that normally blocks updates.
  self.skipWaiting(); 
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Step 2: Intercept network requests (Network First Strategy)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // We are online! We got a response from the network. 
        // Save a fresh copy to the cache silently in the background, then return it.
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // The network request failed (user is offline). 
        // Serve the most recent version we saved in the cache.
        return caches.match(event.request);
      })
  );
});

// Step 3: Clean up old caches and take control
self.addEventListener('activate', event => {
  // clients.claim ensures the new worker takes control of the page immediately 
  // without requiring the user to do a hard refresh.
  event.waitUntil(clients.claim());
  
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
