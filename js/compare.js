// 基金对比服务模块
import data from './data.js';

class CompareService {
  constructor() {
    this.compareList = [];
    this.maxCompareCount = 3; // 最多对比3个基金
    this.loadCompareList();
  }
  
  // 从本地存储加载对比列表
  loadCompareList() {
    try {
      const savedList = localStorage.getItem('compareList');
      if (savedList) {
        this.compareList = JSON.parse(savedList);
      }
    } catch (error) {
      console.error('加载对比列表失败:', error);
      this.compareList = [];
    }
  }
  
  // 保存对比列表到本地存储
  saveCompareList() {
    try {
      localStorage.setItem('compareList', JSON.stringify(this.compareList));
    } catch (error) {
      console.error('保存对比列表失败:', error);
    }
  }
  
  // 添加基金到对比列表
  addToCompare(fundCode) {
    if (!fundCode) return false;
    
    // 检查是否已在对比列表中
    if (this.compareList.includes(fundCode)) {
      return false;
    }
    
    // 检查对比列表是否已满
    if (this.compareList.length >= this.maxCompareCount) {
      return false;
    }
    
    // 添加到对比列表
    this.compareList.push(fundCode);
    this.saveCompareList();
    return true;
  }
  
  // 从对比列表中移除基金
  removeFromCompare(fundCode) {
    const index = this.compareList.indexOf(fundCode);
    if (index !== -1) {
      this.compareList.splice(index, 1);
      this.saveCompareList();
      return true;
    }
    return false;
  }
  
  // 清空对比列表
  clearCompareList() {
    this.compareList = [];
    this.saveCompareList();
  }
  
  // 获取对比列表
  getCompareList() {
    return this.compareList;
  }
  
  // 检查基金是否在对比列表中
  isInCompare(fundCode) {
    return this.compareList.includes(fundCode);
  }
  
  // 获取对比基金数据
  async getCompareFundsData() {
    try {
      const fundsData = [];
      
      for (const fundCode of this.compareList) {
        const fundData = await data.getFundValuation(fundCode);
        if (fundData) {
          fundsData.push(fundData);
        }
      }
      
      return fundsData;
    } catch (error) {
      console.error('获取对比基金数据失败:', error);
      return [];
    }
  }
  
  // 获取对比基金的模拟数据
  getCompareFundsMockData() {
    // 模拟基金数据
    const mockFundData = {
      '000001': {
        fundcode: '000001',
        name: '华夏成长混合',
        dwjz: '1.2332',
        gsz: '1.2456',
        dayChange: 0.90,
        gztime: '2026-02-06 15:00'
      },
      '000020': {
        fundcode: '000020',
        name: '景顺长城品质投资混合A',
        dwjz: '1.5678',
        gsz: '1.6234',
        dayChange: 3.55,
        gztime: '2026-02-06 15:00'
      },
      '000030': {
        fundcode: '000030',
        name: '华夏新能源车ETF联接A',
        dwjz: '2.1234',
        gsz: '2.2156',
        dayChange: 4.34,
        gztime: '2026-02-06 15:00'
      },
      '000032': {
        fundcode: '000032',
        name: '嘉实半导体ETF联接A',
        dwjz: '1.7678',
        gsz: '1.8432',
        dayChange: 4.41,
        gztime: '2026-02-06 15:00'
      }
    };
    
    const fundsData = [];
    for (const fundCode of this.compareList) {
      if (mockFundData[fundCode]) {
        fundsData.push(mockFundData[fundCode]);
      }
    }
    
    return fundsData;
  }
}

// 导出单例
const compareService = new CompareService();
export default compareService;