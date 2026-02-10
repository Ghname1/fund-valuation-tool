const CACHE_NAME = 'guzhibao-v2';
const DATA_CACHE_NAME = 'guzhibao-data-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/js/app.js',
  '/js/config.js',
  '/js/api.js',
  '/js/data.js',
  '/js/ui.js',
  '/js/lazyLoad.js',
  '/js/compare.js',
  '/js/auth.js',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css',
  'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
];

// 基金代码列表（用于离线同步）
const FUND_CODES = [
  '000001', '000005', '000015', '000016', '000017',
  '000020', '000021', '000008', '000010', '000011',
  '000012', '000013', '000014', '000018', '000019',
  '000022', '000023', '000024', '000025', '000026'
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
  const cacheWhitelist = [CACHE_NAME, DATA_CACHE_NAME];
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
  const requestUrl = new URL(event.request.url);
  
  // 处理API请求，使用数据缓存
  if (requestUrl.pathname.includes('/api/') || requestUrl.hostname.includes('fundgz.1234567.com.cn') || requestUrl.hostname.includes('codetabs.com')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            // 返回缓存的响应，但同时在后台更新缓存
            fetchAndCacheData(event.request);
            return response;
          }
          // 缓存中没有，尝试网络请求
          return fetchAndCacheData(event.request)
            .catch(() => {
              // 网络错误时返回默认数据
              return new Response(JSON.stringify({ error: '网络错误，使用默认数据' }), {
                headers: { 'Content-Type': 'application/json' }
              });
            });
        })
    );
  } else {
    // 处理静态资源请求，使用资产缓存
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
  }
});

//  fetch并缓存数据
async function fetchAndCacheData(request) {
  try {
    const response = await fetch(request);
    if (!response || response.status !== 200) {
      throw new Error('网络请求失败');
    }
    
    const responseToCache = response.clone();
    const dataCache = await caches.open(DATA_CACHE_NAME);
    await dataCache.put(request, responseToCache);
    
    return response;
  } catch (error) {
    console.error('fetchAndCacheData失败:', error);
    throw error;
  }
}

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
    
    // 同步热门基金数据
    await syncHotFunds();
    
    // 同步持仓基金数据
    await syncPositionFunds();
    
    // 同步关注列表基金数据
    await syncWatchlistFunds();
    
    console.log('基金数据同步完成');
  } catch (error) {
    console.error('后台同步失败:', error);
  }
}

// 同步热门基金数据
async function syncHotFunds() {
  try {
    console.log('同步热门基金数据');
    
    // 获取热门基金数据
    for (const fundCode of FUND_CODES) {
      const apiUrl = `http://fundgz.1234567.com.cn/js/${fundCode}.js`;
      const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(apiUrl)}`;
      
      try {
        await fetchAndCacheData(new Request(proxyUrl));
      } catch (error) {
        console.error(`同步基金${fundCode}失败:`, error);
      }
    }
  } catch (error) {
    console.error('同步热门基金失败:', error);
  }
}

// 同步持仓基金数据
async function syncPositionFunds() {
  try {
    console.log('同步持仓基金数据');
    
    // 从IndexedDB获取持仓数据
    // 注意：在Service Worker中，我们无法直接访问localStorage，需要使用IndexedDB
    // 这里我们简化处理，使用模拟数据
    
    // 实际项目中，应该使用IndexedDB存储持仓数据
    // 并在后台同步时获取这些数据并更新
  } catch (error) {
    console.error('同步持仓基金失败:', error);
  }
}

// 同步关注列表基金数据
async function syncWatchlistFunds() {
  try {
    console.log('同步关注列表基金数据');
    
    // 从IndexedDB获取关注列表数据
    // 同样，这里我们简化处理，使用模拟数据
  } catch (error) {
    console.error('同步关注列表基金失败:', error);
  }
}

// 推送通知功能
self.addEventListener('push', event => {
  const data = event.data.json();
  
  // 构建通知选项
  const options = {
    body: data.body,
    icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Simple%20modern%20logo%20for%20financial%20tool%20called%20%22GuZhiBao%22%20with%20chart%20icon%20and%20blue%20color%20scheme&image_size=square',
    badge: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Simple%20modern%20logo%20for%20financial%20tool%20called%20%22GuZhiBao%22%20with%20chart%20icon%20and%20blue%20color%20scheme&image_size=square',
    data: {
      url: data.url || '/',
      fundCode: data.fundCode,
      type: data.type || 'info'
    },
    actions: [
      {
        action: 'view',
        title: '查看详情'
      },
      {
        action: 'close',
        title: '关闭'
      }
    ],
    requireInteraction: data.requireInteraction || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const notificationData = event.notification.data;
  let url = notificationData.url;
  
  // 根据通知类型和基金代码构建URL
  if (notificationData.fundCode) {
    url = `/index.html?tab=query&fundCode=${notificationData.fundCode}`;
  }
  
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then(windowClients => {
        // 检查是否已经有打开的窗口
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // 如果没有打开的窗口，创建一个新窗口
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// 通知关闭事件
self.addEventListener('notificationclose', event => {
  console.log('通知已关闭:', event.notification.data);
});