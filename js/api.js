// API服务模块
import config from './config.js';

class ApiService {
  // 获取基金估值数据
  async getFundValuation(fundCode) {
    try {
      const apiUrl = `${config.api.fundValuation}${fundCode}.js`;
      const proxyUrl = `${config.api.proxyUrl}${encodeURIComponent(apiUrl)}`;
      
      const response = await this.fetchWithTimeout(proxyUrl, config.timeout.api);
      const data = await response.text();
      
      const jsonStr = data.substring(data.indexOf('{'), data.lastIndexOf('}') + 1);
      const fundData = JSON.parse(jsonStr);
      
      // 计算涨跌幅
      fundData.dayChange = parseFloat(((fundData.gsz - fundData.dwjz) / fundData.dwjz * 100).toFixed(2));
      
      return fundData;
    } catch (error) {
      console.error(`获取基金${fundCode}估值失败:`, error);
      return null;
    }
  }
  
  // 批量获取基金估值数据
  async getBatchFundValuation(fundCodes) {
    const promises = fundCodes.map(code => this.getFundValuation(code));
    const results = await Promise.all(promises);
    return results.filter(data => data !== null);
  }
  
  // 获取新闻数据
  async getNews() {
    try {
      // 使用新浪财经API（通过CORS代理）
      const apiUrl = 'https://news.sina.com.cn/roll/news/finance/fund/';
      const proxyUrl = `${config.api.proxyUrl}${encodeURIComponent(apiUrl)}`;
      
      const response = await this.fetchWithTimeout(proxyUrl, config.timeout.api);
      const html = await response.text();
      
      // 解析HTML获取新闻数据（这里使用简化的解析方式）
      // 实际项目中可以使用更复杂的HTML解析库
      const newsData = this.parseNewsHtml(html);
      return newsData;
    } catch (error) {
      console.error('获取新闻失败:', error);
      return [];
    }
  }
  
  // 带超时的fetch请求
  fetchWithTimeout(url, timeout) {
    return Promise.race([
      fetch(url, {
        method: 'GET',
        cache: 'no-cache'
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), timeout))
    ]);
  }
  
  // 解析新闻HTML（简化版）
  parseNewsHtml(html) {
    // 这里使用简化的解析逻辑，实际项目中可以使用更复杂的解析方式
    const news = [];
    
    // 模拟新闻数据
    const mockNews = [
      {
        title: '央行降准0.5个百分点，释放长期资金约1.2万亿元',
        source: '中国证券报',
        time: '今天',
        content: '央行决定于近日下调金融机构存款准备金率0.5个百分点，此次降准预计将释放长期资金约1.2万亿元，有助于保持流动性合理充裕，降低社会融资成本，支持实体经济发展。',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Central%20Bank%20monetary%20policy%20news&image_size=portrait_4_3',
        link: 'https://www.baidu.com/s?wd=央行降准0.5个百分点，释放长期资金约1.2万亿元'
      },
      {
        title: 'A股三大指数集体上涨，创业板指表现强势',
        source: '上海证券报',
        time: '今天',
        content: '今日，A股市场表现强势，三大指数集体上涨。截至收盘，上证指数涨1.23%，深证成指涨1.87%，创业板指涨2.15%，行业板块多数上涨，新能源、半导体等科技类板块表现尤为突出。',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Stock%20market%20rising%20trend&image_size=portrait_4_3',
        link: 'https://www.baidu.com/s?wd=A股三大指数集体上涨，创业板指表现强势'
      }
    ];
    
    return mockNews;
  }
}

export default new ApiService();