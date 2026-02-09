// 懒加载服务模块
class LazyLoadService {
  constructor() {
    this.observer = null;
    this.initObserver();
  }
  
  // 初始化Intersection Observer
  initObserver() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '200px 0px', // 提前200px开始加载
        threshold: 0.1
      });
    }
  }
  
  // 加载图片
  loadImage(img) {
    if (!img) return;
    
    const src = img.getAttribute('data-src');
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
      
      // 添加加载完成的类
      img.onload = () => {
        img.classList.add('lazy-loaded');
      };
      
      // 处理加载失败
      img.onerror = () => {
        img.classList.add('lazy-error');
        // 可以设置一个默认占位图
        img.src = 'https://via.placeholder.com/150?text=Image+Error';
      };
    }
  }
  
  // 观察图片
  observeImages() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    if (this.observer) {
      lazyImages.forEach(img => {
        this.observer.observe(img);
      });
    } else {
      // 降级方案：直接加载所有图片
      lazyImages.forEach(img => {
        this.loadImage(img);
      });
    }
  }
  
  // 手动触发懒加载检查
  checkLazyLoad() {
    this.observeImages();
  }
  
  // 销毁Observer
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// 导出单例
const lazyLoad = new LazyLoadService();
export default lazyLoad;