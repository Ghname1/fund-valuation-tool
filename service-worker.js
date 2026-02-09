const CACHE_NAME = 'guzhibao-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/js/app.js',
  '/js/config.js',
  '/js/api.js',
  '/js/data.js',
  '/js/ui.js',
  '/js/lazyLoad.js',
  '/js/compare.js',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css',
  'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
];

// 安装Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// 激活Service Worker
self.addEventListener('activate', event => {
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

// 处理请求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          })
          .catch(() => {
            // 处理网络错误，返回缓存的页面
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// 后台同步功能
self.addEventListener('sync', event => {
  if (event.tag === 'sync-fund-data') {
    event.waitUntil(syncFundData());
  }
});

// 同步基金数据
async function syncFundData() {
  try {
    console.log('后台同步基金数据');
    // 这里可以实现后台同步基金数据的逻辑
    // 例如：获取最新的基金数据并更新缓存
  } catch (error) {
    console.error('后台同步失败:', error);
  }
}

// 推送通知功能
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Simple%20modern%20logo%20for%20financial%20tool%20called%20%22GuZhiBao%22%20with%20chart%20icon%20and%20blue%20color%20scheme&image_size=square',
    badge: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Simple%20modern%20logo%20for%20financial%20tool%20called%20%22GuZhiBao%22%20with%20chart%20icon%20and%20blue%20color%20scheme&image_size=square',
    data: {
      url: data.url
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});