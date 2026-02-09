// 数据处理模块
import config from './config.js';
import api from './api.js';

class DataService {
  // 获取热门基金数据
  async getHotFunds() {
    try {
      // 检查缓存
      const cachedData = localStorage.getItem('hotFunds');
      const cacheTime = localStorage.getItem('hotFundsCacheTime');
      const now = Date.now();
      
      // 如果缓存数据存在且未过期，直接使用缓存
      if (cachedData && cacheTime && (now - parseInt(cacheTime)) < config.cache.funds) {
        return JSON.parse(cachedData);
      }
      
      // 批量获取基金数据
      const funds = await api.getBatchFundValuation(config.hotFunds);
      
      // 缓存数据
      localStorage.setItem('hotFunds', JSON.stringify(funds));
      localStorage.setItem('hotFundsCacheTime', now.toString());
      
      return funds;
    } catch (error) {
      console.error('获取热门基金失败:', error);
      return this.getMockHotFunds();
    }
  }
  
  // 获取涨跌榜数据
  async getRankingData() {
    try {
      // 检查缓存
      const cachedData = localStorage.getItem('rankingData');
      const cacheTime = localStorage.getItem('rankingCacheTime');
      const now = Date.now();
      
      // 如果缓存数据存在且未过期，直接使用缓存
      if (cachedData && cacheTime && (now - parseInt(cacheTime)) < config.cache.ranking) {
        return JSON.parse(cachedData);
      }
      
      // 批量获取基金数据
      const funds = await api.getBatchFundValuation(config.rankingFunds);
      
      // 按涨跌幅排序
      funds.sort((a, b) => b.dayChange - a.dayChange);
      
      // 分离上涨榜和下跌榜
      const upRanking = funds.filter(fund => fund.dayChange > 0).slice(0, 10);
      const downRanking = funds.filter(fund => fund.dayChange < 0).sort((a, b) => a.dayChange - b.dayChange).slice(0, 10);
      
      const rankingData = { upRanking, downRanking };
      
      // 缓存数据
      localStorage.setItem('rankingData', JSON.stringify(rankingData));
      localStorage.setItem('rankingCacheTime', now.toString());
      
      return rankingData;
    } catch (error) {
      console.error('获取涨跌榜数据失败:', error);
      return this.getMockRankingData();
    }
  }
  
  // 获取新闻数据
  async getNews() {
    try {
      // 检查缓存
      const cachedData = localStorage.getItem('newsData');
      const cacheTime = localStorage.getItem('newsCacheTime');
      const now = Date.now();
      
      // 如果缓存数据存在且未过期，直接使用缓存
      if (cachedData && cacheTime && (now - parseInt(cacheTime)) < config.cache.news) {
        return JSON.parse(cachedData);
      }
      
      // 获取新闻数据
      const news = await api.getNews();
      
      // 缓存数据
      localStorage.setItem('newsData', JSON.stringify(news));
      localStorage.setItem('newsCacheTime', now.toString());
      
      return news;
    } catch (error) {
      console.error('获取新闻数据失败:', error);
      return this.getMockNews();
    }
  }
  
  // 获取持仓数据
  getPositions() {
    try {
      const positions = localStorage.getItem('positionList');
      return positions ? JSON.parse(positions) : [];
    } catch (error) {
      console.error('获取持仓数据失败:', error);
      return [];
    }
  }
  
  // 保存持仓数据
  savePositions(positions) {
    try {
      localStorage.setItem('positionList', JSON.stringify(positions));
      localStorage.setItem('originalPositionList', JSON.stringify(positions));
      return true;
    } catch (error) {
      console.error('保存持仓数据失败:', error);
      return false;
    }
  }
  
  // 刷新持仓估值
  async refreshPositionValuations(positions) {
    try {
      const fundCodes = positions.map(pos => pos.code);
      const fundDataMap = {};
      
      // 获取所有基金的估值数据
      const fundDataList = await api.getBatchFundValuation(fundCodes);
      
      // 构建基金数据映射
      fundDataList.forEach(fund => {
        fundDataMap[fund.fundcode] = fund;
      });
      
      // 更新持仓估值
      positions.forEach(position => {
        const fundData = fundDataMap[position.code];
        if (fundData) {
          position.name = fundData.name;
          position.estimate = parseFloat(fundData.gsz);
          position.dayChange = fundData.dayChange;
        }
      });
      
      // 保存更新后的数据
      this.savePositions(positions);
      
      return positions;
    } catch (error) {
      console.error('刷新持仓估值失败:', error);
      return this.refreshPositionValuationsWithMock(positions);
    }
  }
  
  // 使用模拟数据刷新持仓估值
  refreshPositionValuationsWithMock(positions) {
    // 模拟基金数据
    const mockFundData = {
      '000001': { name: '华夏成长混合', gsz: '1.2456', dwjz: '1.2332', dayChange: 0.90 },
      '000020': { name: '景顺长城品质投资混合A', gsz: '1.6234', dwjz: '1.5678', dayChange: 3.55 },
      '000030': { name: '华夏新能源车ETF联接A', gsz: '2.2156', dwjz: '2.1234', dayChange: 4.34 },
      '000032': { name: '嘉实半导体ETF联接A', gsz: '1.8432', dwjz: '1.7678', dayChange: 4.41 }
    };
    
    positions.forEach(position => {
      if (mockFundData[position.code]) {
        const fundData = mockFundData[position.code];
        position.name = fundData.name;
        position.estimate = parseFloat(fundData.gsz);
        position.dayChange = fundData.dayChange;
      } else {
        // 为没有模拟数据的基金生成随机数据
        position.name = position.name || `基金${position.code}`;
        position.estimate = parseFloat((Math.random() * 0.5 + 0.8).toFixed(4));
        position.dayChange = parseFloat((Math.random() * 4 - 1).toFixed(2));
      }
    });
    
    // 保存更新后的数据
    this.savePositions(positions);
    
    return positions;
  }
  
  // 获取模拟热门基金数据
  getMockHotFunds() {
    return [
      { code: '000001', name: '华夏成长混合', dayChange: 0.90, estimate: 1.2456 },
      { code: '000020', name: '景顺长城品质投资混合A', dayChange: 3.55, estimate: 1.6234 },
      { code: '000030', name: '华夏新能源车ETF联接A', dayChange: 4.34, estimate: 2.2156 },
      { code: '000032', name: '嘉实半导体ETF联接A', dayChange: 4.41, estimate: 1.8432 },
      { code: '000022', name: '华夏创业板ETF联接A', dayChange: 3.68, estimate: 1.9456 },
      { code: '000024', name: '嘉实沪深300ETF联接A', dayChange: 2.70, estimate: 1.2678 },
      { code: '000026', name: '华夏上证50ETF联接A', dayChange: 3.23, estimate: 1.3890 },
      { code: '000028', name: '嘉实中证1000ETF联接A', dayChange: 3.25, estimate: 1.1345 },
      { code: '000041', name: '华夏全球科技先锋混合', dayChange: 5.20, estimate: 2.1567 },
      { code: '000051', name: '嘉实科技前沿股票', dayChange: 3.80, estimate: 1.9876 },
      { code: '000061', name: '华夏创新驱动混合', dayChange: 2.90, estimate: 1.4567 },
      { code: '000071', name: '嘉实新能源新材料股票', dayChange: 4.70, estimate: 2.3456 }
    ];
  }
  
  // 获取模拟涨跌榜数据
  getMockRankingData() {
    const mockFunds = this.getMockHotFunds();
    mockFunds.sort((a, b) => b.dayChange - a.dayChange);
    
    const upRanking = mockFunds.filter(fund => fund.dayChange > 0).slice(0, 10);
    const downRanking = mockFunds.filter(fund => fund.dayChange < 0).sort((a, b) => a.dayChange - b.dayChange).slice(0, 10);
    
    return { upRanking, downRanking };
  }
  
  // 获取模拟新闻数据
  getMockNews() {
    return [
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
        link: 'https://www.baidu.com/s?wd=A股三大指数集体上涨，创业板指表现强势'
      },
      {
        title: '新能源板块持续走强，多只基金净值大幅上涨',
        source: '证券时报',
        time: '今天',
        content: '受益于政策支持和行业景气度提升，新能源板块近期持续走强，多只新能源主题基金净值大幅上涨。业内人士表示，新能源行业长期发展空间广阔，建议投资者关注相关基金的投资机会。',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=New%20energy%20industry%20growth%20chart&image_size=portrait_4_3',
        link: 'https://www.baidu.com/s?wd=新能源板块持续走强，多只基金净值大幅上涨'
      }
    ];
  }
}

export default new DataService();