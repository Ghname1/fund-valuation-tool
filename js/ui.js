// UI交互模块
import config from './config.js';
import data from './data.js';

class UIService {
  // 显示Toast提示
  showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    toast.classList.remove('translate-x-full', 'opacity-0');
    
    // 3秒后自动隐藏
    setTimeout(() => {
      toast.classList.add('translate-x-full', 'opacity-0');
    }, config.timeout.toast);
  }
  
  // 切换选项卡
  switchTab(tab) {
    // 重置所有选项卡和面板
    const tabs = ['home', 'query', 'position', 'ranking', 'news', 'compare'];
    tabs.forEach(t => {
      const tabElement = document.getElementById(`tab-${t}`);
      const panelElement = document.getElementById(`panel-${t}`);
      
      if (tabElement) {
        tabElement.classList.remove('tab-active');
        tabElement.classList.add('text-gray-500', 'hover:text-gray-700');
      }
      
      if (panelElement) {
        panelElement.classList.add('hidden');
        panelElement.classList.remove('fade-enter-active');
      }
    });

    // 激活选中的选项卡和面板
    const activeTab = document.getElementById(`tab-${tab}`);
    const activePanel = document.getElementById(`panel-${tab}`);
    
    if (activeTab) {
      activeTab.classList.add('tab-active');
      activeTab.classList.remove('text-gray-500', 'hover:text-gray-700');
    }
    
    if (activePanel) {
      activePanel.classList.remove('hidden');
      activePanel.classList.add('fade-enter-active');
    }

    // 特殊处理
    if (tab === 'position') {
      console.log('切换到持仓选项卡');
      this.renderPositions();
      // 停止其他自动刷新
      this.stopRankingAutoRefresh();
      this.stopNewsAutoRefresh();
    } else if (tab === 'news') {
      console.log('切换到新闻资讯选项卡');
      this.refreshNews();
      this.startNewsAutoRefresh();
      // 停止其他自动刷新
      this.stopRankingAutoRefresh();
    } else if (tab === 'ranking') {
      console.log('切换到涨跌榜选项卡');
      this.refreshRanking();
      this.startRankingAutoRefresh();
      // 停止其他自动刷新
      this.stopNewsAutoRefresh();
    } else if (tab === 'compare') {
      console.log('切换到基金对比选项卡');
      this.renderCompareList();
      this.renderFundCompare();
      // 停止其他自动刷新
      this.stopRankingAutoRefresh();
      this.stopNewsAutoRefresh();
    } else {
      // 切换到首页或查询选项卡时停止所有自动刷新
      this.stopRankingAutoRefresh();
      this.stopNewsAutoRefresh();
    }
  }
  
  // 渲染对比列表
  renderCompareList() {
    const compareListElement = document.getElementById('compare-list');
    if (!compareListElement) return;
    
    // 导入compareService
    import('./compare.js').then(({ default: compareService }) => {
      const compareList = compareService.getCompareList();
      
      if (compareList.length === 0) {
        compareListElement.innerHTML = `
          <div class="p-6 text-center text-gray-500">
            <i class="fa fa-info-circle text-2xl mb-2"></i>
            <p>对比列表为空，请先添加基金到对比列表</p>
          </div>
        `;
        return;
      }
      
      compareListElement.innerHTML = `
        <div class="p-4 border-b border-gray-100">
          <div class="flex justify-between items-center">
            <h3 class="font-medium">对比列表</h3>
            <button class="btn btn-secondary text-xs py-1 px-3" onclick="clearCompareList()">
              <i class="fa fa-trash mr-1"></i>清空
            </button>
          </div>
        </div>
        <div class="divide-y divide-gray-100">
          ${compareList.map(fundCode => `
            <div class="p-4 flex justify-between items-center hover:bg-gray-50">
              <span class="text-sm">基金${fundCode}</span>
              <button class="text-danger hover:text-danger/80" onclick="removeFromCompare('${fundCode}')" title="移除">
                <i class="fa fa-times"></i>
              </button>
            </div>
          `).join('')}
        </div>
        <div class="p-4 border-t border-gray-100">
          <button class="btn btn-primary w-full" onclick="viewFundCompare()">
            <i class="fa fa-bar-chart mr-1"></i>查看对比
          </button>
        </div>
      `;
    });
  }
  
  // 渲染基金对比
  async renderFundCompare() {
    const compareContentElement = document.getElementById('compare-content');
    if (!compareContentElement) return;
    
    // 导入compareService
    import('./compare.js').then(({ default: compareService }) => {
      const compareList = compareService.getCompareList();
      
      if (compareList.length < 2) {
        compareContentElement.innerHTML = `
          <div class="p-8 text-center text-gray-500">
            <i class="fa fa-exclamation-circle text-2xl mb-2"></i>
            <p>至少需要添加2个基金才能进行对比</p>
          </div>
        `;
        return;
      }
      
      // 获取对比基金数据
      const fundsData = compareService.getCompareFundsMockData();
      
      if (fundsData.length < 2) {
        compareContentElement.innerHTML = `
          <div class="p-8 text-center text-gray-500">
            <i class="fa fa-exclamation-circle text-2xl mb-2"></i>
            <p>获取基金数据失败，请稍后重试</p>
          </div>
        `;
        return;
      }
      
      // 渲染对比表格
      compareContentElement.innerHTML = `
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white">
            <thead>
              <tr class="bg-gray-50">
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">指标</th>
                ${fundsData.map(fund => `
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ${fund.name}
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">基金代码</td>
                ${fundsData.map(fund => `
                  <td class="px-4 py-3 text-sm text-gray-500">${fund.fundcode}</td>
                `).join('')}
              </tr>
              <tr>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">单位净值</td>
                ${fundsData.map(fund => `
                  <td class="px-4 py-3 text-sm text-gray-500">¥${fund.dwjz}</td>
                `).join('')}
              </tr>
              <tr>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">实时估值</td>
                ${fundsData.map(fund => `
                  <td class="px-4 py-3 text-sm text-gray-500">¥${fund.gsz}</td>
                `).join('')}
              </tr>
              <tr>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">涨跌幅</td>
                ${fundsData.map(fund => `
                  <td class="px-4 py-3 text-sm ${fund.dayChange > 0 ? 'text-up' : fund.dayChange < 0 ? 'text-down' : 'text-flat'}">
                    ${fund.dayChange > 0 ? '+' : ''}${fund.dayChange.toFixed(2)}%
                  </td>
                `).join('')}
              </tr>
              <tr>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">估值时间</td>
                ${fundsData.map(fund => `
                  <td class="px-4 py-3 text-sm text-gray-500">${fund.gztime}</td>
                `).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      `;
    });
  }
  
  // 首页查询基金
  homeQueryFund() {
    const input = document.getElementById('home-fund-code');
    if (!input) return;
    
    const fundCode = input.value.trim();
    if (!fundCode) {
      this.showToast('请输入基金代码或基金名称');
      return;
    }
    
    this.viewFundDetail(fundCode);
  }
  
  // 查询基金估值
  async queryFund() {
    const fundCodeInput = document.getElementById('fund-code');
    const fundNameElement = document.getElementById('fund-name');
    const fundCodeDisplayElement = document.getElementById('fund-code-display');
    const netValueElement = document.getElementById('net-value');
    const navDateElement = document.getElementById('nav-date');
    const estimateValueElement = document.getElementById('estimate-value');
    const estimateTimeElement = document.getElementById('estimate-time');
    const dayChangeElement = document.getElementById('day-change');
    const errorElement = document.getElementById('error');
    const errorMessageElement = document.getElementById('error-message');
    const queryResultElement = document.getElementById('query-result');
    
    if (!fundCodeInput) return;
    
    const fundCode = fundCodeInput.value.trim();
    
    if (!fundCode || fundCode.length !== 6) {
      this.showToast('请输入6位数字基金代码');
      return;
    }
    
    // 显示加载状态
    this.showToast('正在查询基金估值...');
    
    try {
      // 模拟基金数据
      const mockFundData = {
        '000001': {
          name: '华夏成长混合',
          dwjz: '1.2332',
          gsz: '1.2456',
          gztime: '2026-02-06 15:00',
          dayChange: 0.90
        },
        '000020': {
          name: '景顺长城品质投资混合A',
          dwjz: '1.5678',
          gsz: '1.6234',
          gztime: '2026-02-06 15:00',
          dayChange: 3.55
        },
        '000030': {
          name: '华夏新能源车ETF联接A',
          dwjz: '2.1234',
          gsz: '2.2156',
          gztime: '2026-02-06 15:00',
          dayChange: 4.34
        },
        '000032': {
          name: '嘉实半导体ETF联接A',
          dwjz: '1.7678',
          gsz: '1.8432',
          gztime: '2026-02-06 15:00',
          dayChange: 4.41
        }
      };
      
      // 使用模拟数据
      const fundData = mockFundData[fundCode];
      
      if (fundData) {
        // 隐藏错误信息，显示查询结果
        if (errorElement) errorElement.classList.add('hidden');
        if (queryResultElement) queryResultElement.classList.remove('hidden');
        
        // 更新基金信息
        if (fundNameElement) fundNameElement.textContent = fundData.name;
        if (fundCodeDisplayElement) fundCodeDisplayElement.textContent = fundCode;
        if (netValueElement) netValueElement.textContent = `¥${fundData.dwjz}`;
        if (navDateElement) navDateElement.textContent = `更新时间: 2026-02-06`;
        if (estimateValueElement) estimateValueElement.textContent = `¥${fundData.gsz}`;
        if (estimateTimeElement) estimateTimeElement.textContent = fundData.gztime;
        if (dayChangeElement) {
          dayChangeElement.textContent = `${fundData.dayChange > 0 ? '+' : ''}${fundData.dayChange.toFixed(2)}%`;
          dayChangeElement.className = `text-lg font-semibold ${fundData.dayChange > 0 ? 'text-up' : fundData.dayChange < 0 ? 'text-down' : 'text-flat'}`;
        }
        
        // 添加到对比按钮
        const compareButtonElement = document.getElementById('add-to-compare-btn');
        if (compareButtonElement) {
          compareButtonElement.onclick = () => addToCompare(fundCode);
          compareButtonElement.style.display = 'block';
        }
        
        // 显示成功提示
        this.showToast('基金估值查询成功');
        
        // 初始化基金走势图
        this.initFundChart(fundCode, fundData);
        // 初始化业绩走势图表
        this.initPerformanceChart(fundCode, fundData);
      } else {
        // 显示错误信息
        if (errorElement) errorElement.classList.remove('hidden');
        if (errorMessageElement) errorMessageElement.textContent = `未找到基金代码 ${fundCode} 的数据`;
        if (queryResultElement) queryResultElement.classList.add('hidden');
        
        // 显示错误提示
        this.showToast('未找到该基金数据');
      }
    } catch (error) {
      console.error('查询基金估值失败:', error);
      
      // 显示错误信息
      if (errorElement) errorElement.classList.remove('hidden');
      if (errorMessageElement) errorMessageElement.textContent = '查询基金估值失败，请稍后重试';
      if (queryResultElement) queryResultElement.classList.add('hidden');
      
      // 显示错误提示
      this.showToast('查询基金估值失败，请稍后重试');
    }
  }
  
  // 查看基金详情
  viewFundDetail(fundCode) {
    if (!fundCode || fundCode.trim() === '') {
      this.showToast('基金代码无效');
      return;
    }
    
    // 切换到估值查询面板
    this.switchTab('query');
    
    // 填充基金代码到输入框
    const fundCodeInput = document.getElementById('fund-code');
    if (fundCodeInput) {
      fundCodeInput.value = fundCode;
    }
    
    // 触发查询操作
    this.queryFund();
  }
  
  // 查看指数详情
  viewIndexDetail(indexCode, indexName) {
    if (!indexCode || !indexName) {
      this.showToast('指数信息无效');
      return;
    }
    
    // 显示指数详情提示
    this.showToast(`正在加载${indexName}(${indexCode})的详情...`);
    
    // 模拟跳转到指数详情页面
    setTimeout(() => {
      this.showToast(`已加载${indexName}的详情数据`);
    }, 1000);
  }
  
  // 快速查询基金
  quickQueryFund(fundCode) {
    // 填充基金代码到输入框
    const fundCodeInput = document.getElementById('fund-code');
    if (fundCodeInput) {
      fundCodeInput.value = fundCode;
    }
    
    // 触发查询操作
    this.queryFund();
  }
  
  // 渲染持仓列表
  renderPositions() {
    const tableBody = document.getElementById('position-table-body');
    const emptyPosition = document.getElementById('empty-position');
    const emptyPositionTbody = emptyPosition ? emptyPosition.parentElement : null;
    
    if (!tableBody || !emptyPosition || !emptyPositionTbody) {
      console.error('表格元素不存在');
      return;
    }
    
    // 清空表格
    tableBody.innerHTML = '';
    
    // 获取持仓数据
    const positionList = data.getPositions();
    
    // 显示空状态
    if (positionList.length === 0) {
      console.log('显示空状态');
      emptyPositionTbody.classList.remove('hidden');
      this.updatePositionSummary([]);
      return;
    }

    // 隐藏空状态
    emptyPositionTbody.classList.add('hidden');
    console.log('隐藏空状态，开始渲染持仓项');
    
    // 渲染持仓列表
    try {
      positionList.forEach((position, index) => {
        console.log('处理持仓项', index, position);
        
        if (!position) {
          console.warn('持仓项为空', index);
          return;
        }
        
        const row = document.createElement('tr');
        row.className = 'card-hover';
        
        // 计算收益
        const estimate = position.estimate || position.cost || 0;
        const dayChange = position.dayChange || 0;
        const shares = position.shares || 0;
        const cost = position.cost || 0;
        const todayProfit = shares * (estimate - cost) * (dayChange / 100);
        const holdProfit = shares * (estimate - cost);
        
        // 设置涨跌颜色
        let dayChangeClass = 'text-flat';
        if (dayChange > 0) dayChangeClass = 'text-up';
        else if (dayChange < 0) dayChangeClass = 'text-down';

        let todayProfitClass = 'text-flat';
        if (todayProfit > 0) todayProfitClass = 'text-up';
        else if (todayProfit < 0) todayProfitClass = 'text-down';

        let holdProfitClass = 'text-flat';
        if (holdProfit > 0) holdProfitClass = 'text-up';
        else if (holdProfit < 0) holdProfitClass = 'text-down';

        // 计算持有天数
        function calculateHoldDays(tradeDate) {
          if (!tradeDate) return '-';
          const today = new Date();
          const trade = new Date(tradeDate);
          const diffTime = Math.abs(today - trade);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays;
        }

        const holdDays = calculateHoldDays(position.tradeDate);

        // 创建表格行内容
        row.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap">
            <input type="checkbox" class="position-checkbox" data-index="${index}" onchange="updateBatchDeleteButton()">
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium">
              <a href="javascript:void(0)" class="text-primary hover:text-primary/80" onclick="viewFundDetail('${position.code || ''}')">
                ${position.name || `基金${position.code || '未知'}`}
              </a>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-500">${position.code || '-'}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm">${shares.toFixed(2)}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm">¥${cost.toFixed(4)}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm">${position.tradeDate || '-'}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm">${holdDays}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm">¥${estimate.toFixed(4)}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm ${dayChangeClass}">${dayChange.toFixed(2)}%</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm ${todayProfitClass}">¥${todayProfit.toFixed(2)}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm ${holdProfitClass}">¥${holdProfit.toFixed(2)}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-primary hover:text-primary/80 mr-3" onclick="showEditPositionModal(${index})" title="编辑">
              <i class="fa fa-pencil"></i> 编辑
            </button>
            <button class="text-danger hover:text-danger/80" onclick="deletePosition(${index})" title="删除">
              <i class="fa fa-trash"></i> 删除
            </button>
          </td>
        `;
        
        tableBody.appendChild(row);
        console.log('添加持仓项到表格', index);
      });
    } catch (error) {
      console.error('渲染持仓列表时出错', error);
      // 显示错误状态
      emptyPositionTbody.classList.remove('hidden');
      emptyPosition.innerHTML = `
        <td colspan="12" class="px-6 py-12 text-center text-gray-500">
          <i class="fa fa-exclamation-circle text-3xl mb-2"></i>
          <p>渲染持仓列表时出错</p>
          <p class="text-sm mt-1">${error.message}</p>
        </td>
      `;
      return;
    }

    // 更新持仓汇总
    this.updatePositionSummary(positionList);
    console.log('持仓列表渲染完成');
  }
  
  // 更新持仓汇总
  updatePositionSummary(positions) {
    const totalPositionsElement = document.getElementById('total-positions');
    const upCountElement = document.getElementById('up-count');
    const downCountElement = document.getElementById('down-count');
    const todayProfitElement = document.getElementById('today-profit');
    const holdProfitElement = document.getElementById('hold-profit');
    const totalRateElement = document.getElementById('total-rate');
    const accountAssetElement = document.getElementById('account-asset');
    
    if (!totalPositionsElement || !upCountElement || !downCountElement || 
        !todayProfitElement || !holdProfitElement || !totalRateElement || !accountAssetElement) {
      return;
    }
    
    let totalPositions = positions.length;
    let upCount = 0;
    let downCount = 0;
    let todayProfit = 0;
    let holdProfit = 0;
    let totalCost = 0;
    let totalValue = 0;

    positions.forEach(position => {
      if (!position) return;
      
      if (position.dayChange > 0) upCount++;
      else if (position.dayChange < 0) downCount++;

      const estimate = position.estimate || position.cost || 0;
      const dayChange = position.dayChange || 0;
      const shares = position.shares || 0;
      const cost = position.cost || 0;
      
      todayProfit += shares * (estimate - cost) * (dayChange / 100);
      holdProfit += shares * (estimate - cost);
      totalCost += shares * cost;
      totalValue += shares * estimate;
    });

    const totalRate = totalCost > 0 ? (holdProfit / totalCost * 100) : 0;

    // 更新汇总数据
    totalPositionsElement.textContent = totalPositions;
    upCountElement.textContent = upCount;
    downCountElement.textContent = downCount;
    todayProfitElement.textContent = `¥${todayProfit.toFixed(2)}`;
    holdProfitElement.textContent = `¥${holdProfit.toFixed(2)}`;
    totalRateElement.textContent = `${totalRate.toFixed(2)}%`;
    accountAssetElement.textContent = `¥${totalValue.toFixed(2)}`;

    // 设置收益颜色
    if (todayProfit > 0) todayProfitElement.className = 'font-medium text-up';
    else if (todayProfit < 0) todayProfitElement.className = 'font-medium text-down';
    else todayProfitElement.className = 'font-medium text-flat';

    if (holdProfit > 0) holdProfitElement.className = 'font-medium text-up';
    else if (holdProfit < 0) holdProfitElement.className = 'font-medium text-down';
    else holdProfitElement.className = 'font-medium text-flat';

    if (totalRate > 0) totalRateElement.className = 'font-medium text-up';
    else if (totalRate < 0) totalRateElement.className = 'font-medium text-down';
    else totalRateElement.className = 'font-medium text-flat';
  }
  
  // 刷新持仓估值
  async refreshAllPositions() {
    const positionList = data.getPositions();
    
    if (positionList.length === 0) {
      this.showToast('暂无持仓数据');
      return;
    }

    // 显示加载状态
    this.showToast('正在刷新估值...');

    try {
      // 刷新持仓估值
      const updatedPositions = await data.refreshPositionValuations(positionList);
      
      // 刷新列表
      this.renderPositions();
      this.showToast('估值刷新完成');
    } catch (error) {
      console.error('刷新持仓估值失败:', error);
      this.showToast('估值刷新失败，请稍后重试');
    }
  }
  
  // 刷新涨跌榜
  async refreshRanking() {
    try {
      // 获取涨跌榜数据
      const rankingData = await data.getRankingData();
      
      // 渲染涨跌榜
      this.renderRanking('up-ranking-body', rankingData.upRanking, true);
      this.renderRanking('down-ranking-body', rankingData.downRanking, false);
    } catch (error) {
      console.error('刷新涨跌榜失败:', error);
      this.showToast('刷新涨跌榜失败，请稍后重试');
    }
  }
  
  // 渲染涨跌榜
  renderRanking(elementId, funds, isUp) {
    const tbody = document.getElementById(elementId);
    if (!tbody) return;
    
    // 清空表格
    tbody.innerHTML = '';
    
    // 显示空状态
    if (funds.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="5" class="px-4 py-8 text-center text-gray-500">
          <i class="fa fa-info-circle text-gray-400 text-xl mb-2"></i>
          <p>${isUp ? '暂无上涨基金数据' : '暂无下跌基金数据'}</p>
        </td>
      `;
      tbody.appendChild(row);
      return;
    }

    // 渲染涨跌榜数据
    funds.forEach((fund, index) => {
      const row = document.createElement('tr');
      row.className = 'card-hover';
      
      // 设置涨跌颜色
      let dayChangeClass = 'text-flat';
      if (fund.dayChange > 0) dayChangeClass = 'text-up';
      else if (fund.dayChange < 0) dayChangeClass = 'text-down';

      row.innerHTML = `
        <td class="px-4 py-3 whitespace-nowrap">
          <div class="text-sm font-medium">${index + 1}</div>
        </td>
        <td class="px-4 py-3 whitespace-nowrap">
          <div class="text-sm text-primary cursor-pointer hover:underline" onclick="viewFundDetail('${fund.fundcode || fund.code}')">${fund.name}</div>
        </td>
        <td class="px-4 py-3 whitespace-nowrap">
          <div class="text-sm text-gray-500">${fund.fundcode || fund.code}</div>
        </td>
        <td class="px-4 py-3 whitespace-nowrap">
          <div class="text-sm ${dayChangeClass}">${fund.dayChange.toFixed(2)}%</div>
        </td>
        <td class="px-4 py-3 whitespace-nowrap">
          <div class="text-sm">¥${fund.gsz || fund.estimate}</div>
        </td>
      `;
      
      tbody.appendChild(row);
    });
  }
  
  // 刷新新闻
  async refreshNews() {
    try {
      // 获取新闻数据
      const newsData = await data.getNews();
      
      // 渲染新闻列表
      this.renderNewsList(newsData);
    } catch (error) {
      console.error('刷新新闻失败:', error);
      this.showToast('刷新新闻失败，请稍后重试');
    }
  }
  
  // 渲染新闻列表
  renderNewsList(newsData) {
    const newsContent = document.getElementById('news-content');
    if (!newsContent) return;
    
    newsContent.innerHTML = '';
    
    newsData.forEach(news => {
      const newsItem = document.createElement('div');
      newsItem.className = 'p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors';
      
      // 构建新闻链接
      const newsLink = news.link || `https://www.baidu.com/s?wd=${encodeURIComponent(news.title)}`;
      
      newsItem.innerHTML = `
        <h4 class="font-medium text-gray-800 mb-2">
          <a href="${newsLink}" target="_blank" class="hover:text-primary transition-colors">
            ${news.title}
          </a>
        </h4>
        <div class="flex justify-between items-center text-xs text-gray-500 mb-2">
          <span>${news.source}</span>
          <span>${news.time}</span>
        </div>
        ${news.image ? `<img data-src="${news.image}" alt="${news.title}" class="w-full h-40 object-cover rounded-lg mb-2 lazy-image">` : ''}
        <p class="text-sm text-gray-600 line-clamp-2">${news.content.substring(0, 100)}...</p>
      `;
      
      newsContent.appendChild(newsItem);
    });
    
    // 导入并调用懒加载服务观察新添加的图片
    import('./lazyLoad.js').then(({ default: lazyLoad }) => {
      lazyLoad.observeImages();
    });
  }
  
  // 刷新热门基金
  async refreshHotFunds() {
    try {
      // 获取热门基金数据
      const hotFunds = await data.getHotFunds();
      
      // 渲染热门基金
      this.renderHotFunds(hotFunds);
      
      // 更新更新时间
      this.updateHotFundsUpdateTime();
    } catch (error) {
      console.error('刷新热门基金失败:', error);
    }
  }
  
  // 渲染热门基金
  renderHotFunds(hotFunds) {
    const container = document.getElementById('hot-funds-container');
    if (!container) return;

    container.innerHTML = '';

    hotFunds.forEach(fund => {
      const card = document.createElement('div');
      card.className = 'bg-gray-50 rounded-lg p-3 sm:p-4 min-w-[150px] sm:min-w-[180px] hover:bg-gray-100 transition-colors cursor-pointer';
      card.onclick = () => this.viewFundDetail(fund.code);

      // 设置涨跌颜色
      let dayChangeClass = 'text-flat';
      if (fund.dayChange > 0) dayChangeClass = 'text-up';
      else if (fund.dayChange < 0) dayChangeClass = 'text-down';

      card.innerHTML = `
        <h4 class="text-sm font-medium mb-2">${fund.name}</h4>
        <div class="flex justify-between items-center">
          <span class="text-xs text-gray-500">${fund.code}</span>
          <span class="text-xs font-semibold ${dayChangeClass}">${fund.dayChange.toFixed(2)}%</span>
        </div>
        <div class="mt-2">
          <span class="text-xs">估值: ¥${fund.estimate.toFixed(4)}</span>
        </div>
      `;

      container.appendChild(card);
    });
  }
  
  // 更新热门基金更新时间
  updateHotFundsUpdateTime() {
    const updateTimeElement = document.getElementById('hot-funds-update-time');
    if (!updateTimeElement) return;
    
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
    
    updateTimeElement.textContent = `最近更新：${timeString}`;
  }
  
  // 开始热门基金滚动
  startHotFundsScroll() {
    const container = document.getElementById('hot-funds-container');
    if (!container) return;

    // 清除之前的滚动定时器
    if (window.hotFundsScrollInterval) {
      clearInterval(window.hotFundsScrollInterval);
    }

    // 计算滚动步长和时间
    const cardWidth = 180 + 16; // 卡片宽度 + 间距
    const containerWidth = container.parentElement.clientWidth;
    const totalWidth = container.children.length * cardWidth;

    // 如果内容超出容器宽度，启动滚动
    if (totalWidth > containerWidth) {
      // 翻滚效果实现
      let scrollStep = 0;
      const scrollSpeed = 5; // 滚动速度
      const pauseTime = 2000; // 每张卡片停留时间
      let isPaused = false;

      window.hotFundsScrollInterval = setInterval(() => {
        if (isPaused) return;

        scrollStep += scrollSpeed;
        
        // 当滚动到一张卡片的宽度时，暂停并重置
        if (scrollStep >= cardWidth) {
          scrollStep = 0;
          isPaused = true;
          
          // 将第一个卡片移到最后面，实现循环翻滚
          const firstCard = container.firstElementChild;
          if (firstCard) {
            container.appendChild(firstCard);
            container.style.transform = 'translateX(0)';
          }

          // 暂停一段时间后继续滚动
          setTimeout(() => {
            isPaused = false;
          }, pauseTime);
        } else {
          container.style.transform = `translateX(-${scrollStep}px)`;
        }
      }, 30);
    }
  }
  
  // 初始化基金走势图
  initFundChart(fundCode, fundData) {
    const chartDom = document.getElementById('fund-chart');
    if (!chartDom) return;
    
    try {
      // 使用ECharts初始化图表
      const myChart = echarts.init(chartDom);
      
      // 模拟历史数据
      const dates = [];
      const values = [];
      const now = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dates.push(`${date.getMonth() + 1}/${date.getDate()}`);
        // 生成模拟数据
        const baseValue = parseFloat(fundData.dwjz);
        const randomChange = (Math.random() - 0.45) * 0.1; // -4.5% 到 5.5% 的随机变化
        values.push((baseValue * (1 + randomChange)).toFixed(4));
      }
      
      // 图表配置
      const option = {
        title: {
          text: '基金净值走势',
          left: 'center',
          textStyle: {
            fontSize: 14
          }
        },
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            return params[0].name + '<br/>净值: ¥' + params[0].value;
          }
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: {
            rotate: 45,
            fontSize: 10
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '¥{value}'
          }
        },
        series: [{
          data: values,
          type: 'line',
          smooth: true,
          lineStyle: {
            color: '#3b82f6'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ])
          }
        }]
      };
      
      // 设置图表配置
      myChart.setOption(option);
      
      // 响应式处理
      window.addEventListener('resize', function() {
        myChart.resize();
      });
    } catch (error) {
      console.error('初始化基金走势图失败:', error);
    }
  }
  
  // 初始化业绩走势图表
  initPerformanceChart(fundCode, fundData) {
    const chartDom = document.getElementById('performance-chart');
    if (!chartDom) return;
    
    try {
      // 使用ECharts初始化图表
      const myChart = echarts.init(chartDom);
      
      // 模拟业绩数据
      const periods = ['1周', '1月', '3月', '6月', '1年', '3年'];
      const returns = [];
      
      // 生成模拟数据
      for (let i = 0; i < periods.length; i++) {
        const baseReturn = fundData.dayChange * (i + 1);
        const randomAdjustment = (Math.random() - 0.5) * 5;
        returns.push((baseReturn + randomAdjustment).toFixed(2));
      }
      
      // 图表配置
      const option = {
        title: {
          text: '业绩表现',
          left: 'center',
          textStyle: {
            fontSize: 14
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params) {
            return params[0].name + '<br/>收益率: ' + params[0].value + '%';
          }
        },
        xAxis: {
          type: 'category',
          data: periods
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value}%'
          }
        },
        series: [{
          data: returns,
          type: 'bar',
          itemStyle: {
            color: function(params) {
              return parseFloat(params.value) >= 0 ? '#ef4444' : '#10b981';
            }
          }
        }]
      };
      
      // 设置图表配置
      myChart.setOption(option);
      
      // 响应式处理
      window.addEventListener('resize', function() {
        myChart.resize();
      });
    } catch (error) {
      console.error('初始化业绩走势图表失败:', error);
    }
  }
  
  // 切换主题
  toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle ? themeToggle.querySelector('i') : null;
    
    if (!body || !icon) return;
    
    // 切换主题类
    body.classList.toggle('dark-theme');
    
    // 切换图标
    if (icon.classList.contains('fa-sun-o')) {
      icon.classList.remove('fa-sun-o');
      icon.classList.add('fa-moon-o');
      // 应用深色主题样式
      body.classList.add('bg-gray-900', 'text-white');
      body.classList.remove('bg-gray-50', 'text-gray-800');
    } else {
      icon.classList.remove('fa-moon-o');
      icon.classList.add('fa-sun-o');
      // 应用浅色主题样式
      body.classList.add('bg-gray-50', 'text-gray-800');
      body.classList.remove('bg-gray-900', 'text-white');
    }
    
    // 保存主题设置到本地存储
    const isDark = icon.classList.contains('fa-moon-o');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }
  
  // 初始化主题
  initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle ? themeToggle.querySelector('i') : null;
    const body = document.body;
    
    if (!body || !icon) return;
    
    if (savedTheme === 'dark') {
      // 应用深色主题
      icon.classList.remove('fa-sun-o');
      icon.classList.add('fa-moon-o');
      body.classList.add('bg-gray-900', 'text-white');
      body.classList.remove('bg-gray-50', 'text-gray-800');
    } else {
      // 应用浅色主题
      icon.classList.remove('fa-moon-o');
      icon.classList.add('fa-sun-o');
      body.classList.add('bg-gray-50', 'text-gray-800');
      body.classList.remove('bg-gray-900', 'text-white');
    }
  }
  
  // 自动刷新相关
  startRankingAutoRefresh() {
    if (window.rankingAutoRefreshInterval) {
      clearInterval(window.rankingAutoRefreshInterval);
    }
    window.rankingAutoRefreshInterval = setInterval(() => this.refreshRanking(), config.autoRefresh.ranking);
  }
  
  stopRankingAutoRefresh() {
    if (window.rankingAutoRefreshInterval) {
      clearInterval(window.rankingAutoRefreshInterval);
      window.rankingAutoRefreshInterval = null;
    }
  }
  
  startNewsAutoRefresh() {
    if (window.newsAutoRefreshInterval) {
      clearInterval(window.newsAutoRefreshInterval);
    }
    window.newsAutoRefreshInterval = setInterval(() => this.refreshNews(), config.autoRefresh.news);
  }
  
  stopNewsAutoRefresh() {
    if (window.newsAutoRefreshInterval) {
      clearInterval(window.newsAutoRefreshInterval);
      window.newsAutoRefreshInterval = null;
    }
  }
}

export default new UIService();