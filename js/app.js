// 应用主入口
import config from './config.js';
import data from './data.js';
import ui from './ui.js';
import lazyLoad from './lazyLoad.js';
import compareService from './compare.js';

// 全局变量
let positionList = [];
let originalPositionList = [];

// 初始化应用
function initApp() {
  // 初始化主题
  ui.initTheme();
  
  // 初始化持仓数据
  initPositionData();
  
  // 初始化热门基金
  initHotFunds();
  
  // 绑定事件
  bindEvents();
  
  // 初始化首页设置
  initHomeSettings();
  
  // 初始化懒加载
  lazyLoad.observeImages();
  
  console.log('应用初始化完成');
}

// 初始化持仓数据
function initPositionData() {
  positionList = data.getPositions();
  originalPositionList = JSON.parse(JSON.stringify(positionList));
}

// 初始化热门基金
async function initHotFunds() {
  try {
    await ui.refreshHotFunds();
    ui.startHotFundsScroll();
    
    // 设置定时更新
    setInterval(async () => {
      await ui.refreshHotFunds();
      ui.startHotFundsScroll();
    }, config.autoRefresh.hotFunds);
  } catch (error) {
    console.error('初始化热门基金失败:', error);
  }
}

// 绑定事件
function bindEvents() {
  // 点击遮罩关闭弹窗
  const positionModal = document.getElementById('position-modal');
  if (positionModal) {
    positionModal.addEventListener('click', function(e) {
      if (e.target === this) {
        closePositionModal();
      }
    });
  }
  
  // 基金筛选器滑块事件
  const returnRateSlider = document.getElementById('filter-return-rate');
  const returnRateValue = document.getElementById('filter-return-rate-value');
  if (returnRateSlider && returnRateValue) {
    returnRateSlider.addEventListener('input', function() {
      returnRateValue.textContent = this.value;
    });
  }
  
  const fundSizeSlider = document.getElementById('filter-fund-size');
  const fundSizeValue = document.getElementById('filter-fund-size-value');
  if (fundSizeSlider && fundSizeValue) {
    fundSizeSlider.addEventListener('input', function() {
      fundSizeValue.textContent = this.value;
    });
  }
  
  // 其他事件绑定...
}

// 显示添加持仓弹窗
function showAddPositionModal() {
  const modalTitle = document.getElementById('modal-title');
  const editIndex = document.getElementById('edit-index');
  const modalFundCode = document.getElementById('modal-fund-code');
  const modalShares = document.getElementById('modal-shares');
  const modalCost = document.getElementById('modal-cost');
  const modalTradeDate = document.getElementById('modal-trade-date');
  const modalFundNameDisplay = document.getElementById('modal-fund-name-display');
  const positionModal = document.getElementById('position-modal');
  
  if (!modalTitle || !editIndex || !modalFundCode || !modalShares || 
      !modalCost || !modalTradeDate || !modalFundNameDisplay || !positionModal) {
    return;
  }
  
  modalTitle.textContent = '添加持仓';
  editIndex.value = '';
  modalFundCode.value = '';
  modalShares.value = '';
  modalCost.value = '';
  modalTradeDate.value = '';
  modalFundNameDisplay.textContent = '';
  positionModal.classList.remove('hidden');
}

// 显示编辑持仓弹窗
function showEditPositionModal(index) {
  const position = positionList[index];
  // 确保position对象存在
  if (!position) {
    ui.showToast('持仓数据无效');
    return;
  }
  
  const modalTitle = document.getElementById('modal-title');
  const editIndex = document.getElementById('edit-index');
  const modalFundCode = document.getElementById('modal-fund-code');
  const modalShares = document.getElementById('modal-shares');
  const modalCost = document.getElementById('modal-cost');
  const modalTradeDate = document.getElementById('modal-trade-date');
  const modalFundNameDisplay = document.getElementById('modal-fund-name-display');
  const positionModal = document.getElementById('position-modal');
  
  if (!modalTitle || !editIndex || !modalFundCode || !modalShares || 
      !modalCost || !modalTradeDate || !modalFundNameDisplay || !positionModal) {
    return;
  }
  
  modalTitle.textContent = '编辑持仓';
  editIndex.value = index;
  modalFundCode.value = position.code || '';
  modalShares.value = position.shares || '';
  modalCost.value = position.cost || '';
  modalTradeDate.value = position.tradeDate || '';
  
  // 如果有基金代码，显示基金名称
  if (position.code) {
    getFundNameByCode(position.code);
  } else {
    modalFundNameDisplay.textContent = '';
  }
  
  positionModal.classList.remove('hidden');
}

// 关闭弹窗
function closePositionModal() {
  const positionModal = document.getElementById('position-modal');
  if (positionModal) {
    positionModal.classList.add('hidden');
  }
}

// 显示批量增加持仓弹窗
function showBatchAddPositionModal() {
  const batchPositionModal = document.getElementById('batch-position-modal');
  if (batchPositionModal) {
    batchPositionModal.classList.remove('hidden');
  }
}

// 关闭批量增加持仓弹窗
function closeBatchPositionModal() {
  const batchPositionModal = document.getElementById('batch-position-modal');
  if (batchPositionModal) {
    batchPositionModal.classList.add('hidden');
  }
}

// 保存批量持仓
function saveBatchPositions() {
  const batchInput = document.getElementById('batch-fund-input');
  if (!batchInput) return;
  
  const batchInputValue = batchInput.value.trim();
  
  if (!batchInputValue) {
    ui.showToast('请输入基金信息');
    return;
  }
  
  const lines = batchInputValue.split('\n').filter(line => line.trim() !== '');
  const newPositions = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const parts = line.split(',').map(part => part.trim());
    
    if (parts.length < 3) {
      ui.showToast(`第${i + 1}行格式错误，缺少必要信息`);
      return;
    }
    
    const [code, sharesStr, costStr, tradeDate] = parts;
    
    // 验证基金代码
    if (!/^\d{6}$/.test(code)) {
      ui.showToast(`第${i + 1}行基金代码格式错误`);
      return;
    }
    
    // 验证份额
    const shares = parseFloat(sharesStr);
    if (isNaN(shares) || shares <= 0) {
      ui.showToast(`第${i + 1}行持仓份额格式错误`);
      return;
    }
    
    // 验证成本价
    const cost = parseFloat(costStr);
    if (isNaN(cost) || cost <= 0) {
      ui.showToast(`第${i + 1}行成本价格式错误`);
      return;
    }
    
    // 验证交易时间
    if (tradeDate && !/^\d{4}-\d{2}-\d{2}$/.test(tradeDate)) {
      ui.showToast(`第${i + 1}行交易时间格式错误`);
      return;
    }
    
    // 检查是否重复
    if (positionList.some(pos => pos.code === code)) {
      ui.showToast(`基金${code}已在持仓列表中`);
      return;
    }
    
    newPositions.push({
      code,
      shares,
      cost,
      tradeDate: tradeDate || ''
    });
  }
  
  // 添加到持仓列表
  newPositions.forEach(position => {
    positionList.push(position);
  });
  
  // 保存到本地存储
  data.savePositions(positionList);
  originalPositionList = JSON.parse(JSON.stringify(positionList));
  
  // 关闭弹窗并刷新持仓列表
  closeBatchPositionModal();
  ui.renderPositions();
  ui.showToast(`成功添加${newPositions.length}个持仓`);
}

// 保存持仓
function savePosition() {
  const fundCodeInput = document.getElementById('modal-fund-code');
  const sharesInput = document.getElementById('modal-shares');
  const costInput = document.getElementById('modal-cost');
  const editIndexInput = document.getElementById('edit-index');
  
  if (!fundCodeInput || !sharesInput || !costInput || !editIndexInput) return;
  
  const fundCode = fundCodeInput.value.trim();
  const shares = parseFloat(sharesInput.value);
  const cost = parseFloat(costInput.value);
  const editIndexStr = editIndexInput.value;
  const editIndex = editIndexStr !== '' ? parseInt(editIndexStr, 10) : -1;

  // 校验输入
  if (!fundCode || fundCode.length !== 6) {
    ui.showToast('请输入6位数字基金代码');
    return;
  }

  if (!shares || shares <= 0) {
    ui.showToast('请输入有效的持仓份额');
    return;
  }

  if (!cost || cost <= 0) {
    ui.showToast('请输入有效的成本价');
    return;
  }

  // 检查是否重复添加
  if (editIndex === -1) {
    const isDuplicate = positionList.some(pos => pos.code === fundCode);
    if (isDuplicate) {
      ui.showToast('该基金已在持仓列表中');
      return;
    }
  }

  // 获取交易时间
  const tradeDateInput = document.getElementById('modal-trade-date');
  const tradeDate = tradeDateInput ? tradeDateInput.value : '';

  // 构建持仓对象
  const position = {
    code: fundCode,
    shares: shares,
    cost: cost,
    tradeDate: tradeDate
  };

  // 保存到持仓列表
  if (editIndex !== -1) {
    positionList[editIndex] = position;
    ui.showToast('持仓修改成功');
  } else {
    positionList.push(position);
    ui.showToast('持仓添加成功');
  }

  // 保存到本地存储
  data.savePositions(positionList);
  originalPositionList = JSON.parse(JSON.stringify(positionList));

  // 关闭弹窗并刷新持仓列表
  closePositionModal();
  ui.renderPositions();
}

// 删除持仓
function deletePosition(index) {
  if (confirm('确定要删除该持仓吗？')) {
    positionList.splice(index, 1);
    data.savePositions(positionList);
    originalPositionList = JSON.parse(JSON.stringify(positionList));
    ui.showToast('持仓删除成功');
    ui.renderPositions();
  }
}

// 获取基金名称
function getFundNameByCode(code) {
  const modalFundNameDisplay = document.getElementById('modal-fund-name-display');
  if (!modalFundNameDisplay) return;
  
  // 模拟基金数据
  const mockFundData = {
    '000001': { name: '华夏成长混合' },
    '000020': { name: '景顺长城品质投资混合A' },
    '000030': { name: '华夏新能源车ETF联接A' },
    '000032': { name: '嘉实半导体ETF联接A' }
  };
  
  if (mockFundData[code]) {
    modalFundNameDisplay.textContent = mockFundData[code].name;
  } else {
    modalFundNameDisplay.textContent = '查询中...';
    // 模拟API请求延迟
    setTimeout(() => {
      modalFundNameDisplay.textContent = `基金${code}`;
    }, 500);
  }
}

// 更新批量删除按钮状态
function updateBatchDeleteButton() {
  const checkboxes = document.querySelectorAll('.position-checkbox:checked');
  const batchDeleteBtn = document.getElementById('batch-delete-btn');
  if (batchDeleteBtn) {
    batchDeleteBtn.disabled = checkboxes.length === 0;
  }
  
  // 更新全选复选框状态
  const allCheckboxes = document.querySelectorAll('.position-checkbox');
  const selectAllCheckbox = document.getElementById('select-all-checkbox');
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = allCheckboxes.length > 0 && Array.from(allCheckboxes).every(cb => cb.checked);
  }
}

// 全选或取消全选所有持仓项
function selectAllPositions(checked) {
  const checkboxes = document.querySelectorAll('.position-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = checked;
  });
  updateBatchDeleteButton();
}

// 批量删除选中的持仓项
function batchDeletePositions() {
  const checkboxes = document.querySelectorAll('.position-checkbox:checked');
  if (checkboxes.length === 0) {
    ui.showToast('请先选择要删除的持仓项');
    return;
  }
  
  if (confirm(`确定要删除${checkboxes.length}个持仓项吗？`)) {
    // 获取选中的索引
    const indexes = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index, 10)).sort((a, b) => b - a);
    
    // 从后往前删除，避免索引错乱
    indexes.forEach(index => {
      positionList.splice(index, 1);
    });
    
    // 保存到本地存储
    data.savePositions(positionList);
    originalPositionList = JSON.parse(JSON.stringify(positionList));
    
    // 刷新持仓列表
    ui.renderPositions();
    ui.showToast(`成功删除${checkboxes.length}个持仓项`);
  }
}

// 排序持仓
function sortPositions() {
  const sortBySelect = document.getElementById('sort-by');
  const sortOrderSelect = document.getElementById('sort-order');
  
  if (!sortBySelect || !sortOrderSelect) return;
  
  const sortBy = sortBySelect.value;
  const sortOrder = sortOrderSelect.value;

  if (sortBy === 'default') {
    positionList = JSON.parse(JSON.stringify(originalPositionList));
  } else {
    positionList.sort((a, b) => {
      let aValue = a[sortBy] || 0;
      let bValue = b[sortBy] || 0;
      
      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }

  ui.renderPositions();
}

// 分享应用
function shareApp() {
  // 检查是否在本地运行
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
  
  if (isLocal) {
    // 本地运行，提示用户如何分享
    ui.showToast('本地运行模式，无法直接分享。请部署到网络服务器后再使用分享功能。');
    return;
  }
  
  // 构建分享URL
  const shareUrl = window.location.href;
  
  // 尝试使用Web Share API
  if (navigator.share) {
    navigator.share({
      title: '基金估值查询工具',
      text: '实时查询基金估值，管理你的投资组合',
      url: shareUrl
    })
    .then(() => ui.showToast('分享成功'))
    .catch(error => {
      console.error('分享失败:', error);
      // 降级到复制链接
      copyShareLink(shareUrl);
    });
  } else {
    // 不支持Web Share API，降级到复制链接
    copyShareLink(shareUrl);
  }
}

// 复制分享链接
function copyShareLink(url) {
  navigator.clipboard.writeText(url)
    .then(() => {
      ui.showToast('分享链接已复制到剪贴板');
    })
    .catch(error => {
      console.error('复制失败:', error);
      ui.showToast('复制失败，请手动复制链接');
    });
}

// 切换资产显示
let isAssetVisible = true;
function toggleAssetVisibility() {
  isAssetVisible = !isAssetVisible;
  const toggleBtn = document.getElementById('asset-toggle');
  const accountAssetElement = document.getElementById('account-asset');
  
  if (!toggleBtn || !accountAssetElement) return;
  
  if (isAssetVisible) {
    toggleBtn.innerHTML = '<i class="fa fa-eye mr-1"></i>隐藏资产';
    accountAssetElement.textContent = originalAccountAsset || '¥0.00';
    // 显示持仓列表份额
    const shareCells = document.querySelectorAll('#position-table-body td:nth-child(4)');
    shareCells.forEach(cell => {
      cell.textContent = cell.dataset.originalShare || '';
    });
    // 显示基金走势图和业绩走势
    const charts = document.querySelectorAll('#fund-chart, #performance-chart');
    charts.forEach(chart => {
      chart.style.display = 'block';
    });
  } else {
    toggleBtn.innerHTML = '<i class="fa fa-eye-slash mr-1"></i>显示资产';
    // 保存原始账户资产
    window.originalAccountAsset = accountAssetElement.textContent;
    // 显示***
    accountAssetElement.textContent = '***';
    // 隐藏持仓列表份额
    const shareCells = document.querySelectorAll('#position-table-body td:nth-child(4)');
    shareCells.forEach(cell => {
      cell.dataset.originalShare = cell.textContent;
      cell.textContent = '***';
    });
    // 隐藏基金走势图和业绩走势
    const charts = document.querySelectorAll('#fund-chart, #performance-chart');
    charts.forEach(chart => {
      chart.style.display = 'none';
    });
  }
}

// 添加基金到对比列表
function addToCompare(fundCode) {
  const result = compareService.addToCompare(fundCode);
  if (result) {
    ui.showToast('基金已添加到对比列表');
  } else {
    if (compareService.isInCompare(fundCode)) {
      ui.showToast('该基金已在对比列表中');
    } else {
      ui.showToast(`对比列表已满，最多只能对比${compareService.maxCompareCount}个基金`);
    }
  }
  // 刷新对比列表显示
  ui.renderCompareList();
}

// 从对比列表中移除基金
function removeFromCompare(fundCode) {
  const result = compareService.removeFromCompare(fundCode);
  if (result) {
    ui.showToast('基金已从对比列表中移除');
    // 刷新对比列表显示
    ui.renderCompareList();
  }
}

// 清空对比列表
function clearCompareList() {
  compareService.clearCompareList();
  ui.showToast('对比列表已清空');
  // 刷新对比列表显示
  ui.renderCompareList();
}

// 查看基金对比
function viewFundCompare() {
  const compareList = compareService.getCompareList();
  if (compareList.length < 2) {
    ui.showToast('至少需要添加2个基金才能进行对比');
    return;
  }
  
  // 切换到对比选项卡
  ui.switchTab('compare');
  // 渲染对比数据
  ui.renderFundCompare();
}

// 显示更多历史净值
function showMoreHistory() {
  // 这里可以实现显示更多历史净值的功能
  // 例如打开一个模态框，显示更长时间范围的历史净值数据
  ui.showToast('显示更多历史净值功能开发中');
}

// 截图功能
function screenshotFundData() {
  const queryResult = document.getElementById('query-result');
  if (!queryResult) {
    ui.showToast('请先查询基金估值');
    return;
  }
  
  // 显示加载提示
  ui.showToast('正在生成截图...');
  
  // 使用html2canvas库生成截图
  html2canvas(queryResult, {
    scale: 2, // 提高清晰度
    useCORS: true, // 允许加载跨域图片
    logging: false,
    backgroundColor: '#ffffff'
  }).then(canvas => {
    // 创建下载链接
    const link = document.createElement('a');
    link.download = `fund_${document.getElementById('fund-code').value}_${new Date().toISOString().slice(0,10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    // 显示成功提示
    ui.showToast('截图生成成功');
  }).catch(error => {
    console.error('截图失败:', error);
    ui.showToast('截图生成失败，请重试');
  });
}

// 基金筛选器相关函数
function filterFunds() {
  // 获取筛选条件
  const fundType = document.getElementById('filter-fund-type').value;
  const riskLevel = document.getElementById('filter-risk-level').value;
  const returnRate = parseFloat(document.getElementById('filter-return-rate').value);
  const fundSize = parseFloat(document.getElementById('filter-fund-size').value);
  const establishTime = document.getElementById('filter-establish-time').value;
  
  // 模拟基金数据
  const mockFunds = [
    { code: '000001', name: '华夏成长混合', type: 'mixed', risk: 'medium', returnRate: 12.5, size: 15.2, establishTime: '2001-12-18' },
    { code: '000020', name: '景顺长城品质投资混合A', type: 'mixed', risk: 'high', returnRate: 18.7, size: 22.6, establishTime: '2008-05-28' },
    { code: '000030', name: '华夏新能源车ETF联接A', type: 'index', risk: 'high', returnRate: 25.3, size: 35.8, establishTime: '2015-03-12' },
    { code: '000032', name: '嘉实半导体ETF联接A', type: 'index', risk: 'high', returnRate: 32.1, size: 42.3, establishTime: '2016-06-08' },
    { code: '000008', name: '嘉实中证500ETF联接A', type: 'index', risk: 'medium', returnRate: 8.9, size: 56.7, establishTime: '2009-10-14' },
    { code: '000022', name: '华夏创业板ETF联接A', type: 'index', risk: 'high', returnRate: 15.6, size: 28.9, establishTime: '2011-06-30' },
    { code: '000041', name: '华夏全球科技先锋混合A', type: 'mixed', risk: 'high', returnRate: 22.4, size: 18.5, establishTime: '2018-07-25' },
    { code: '000051', name: '华夏新经济灵活配置混合A', type: 'mixed', risk: 'medium', returnRate: 9.8, size: 12.3, establishTime: '2016-01-15' },
    { code: '000061', name: '华夏创新驱动混合A', type: 'mixed', risk: 'high', returnRate: 16.7, size: 24.8, establishTime: '2017-03-20' },
    { code: '000071', name: '华夏医疗健康混合A', type: 'mixed', risk: 'medium', returnRate: 11.2, size: 31.5, establishTime: '2015-04-09' }
  ];
  
  // 筛选基金
  let filteredFunds = mockFunds.filter(fund => {
    // 基金类型筛选
    if (fundType !== 'all' && fund.type !== fundType) return false;
    
    // 风险等级筛选
    if (riskLevel !== 'all' && fund.risk !== riskLevel) return false;
    
    // 收益率筛选
    if (fund.returnRate < returnRate) return false;
    
    // 基金规模筛选
    if (fund.size < fundSize) return false;
    
    // 成立时间筛选
    if (establishTime !== 'all') {
      const fundAge = new Date().getFullYear() - new Date(fund.establishTime).getFullYear();
      if (establishTime === '1' && fundAge > 1) return false;
      if (establishTime === '3' && fundAge > 3) return false;
      if (establishTime === '5' && fundAge > 5) return false;
      if (establishTime === '10' && fundAge > 10) return false;
      if (establishTime === '10+' && fundAge <= 10) return false;
    }
    
    return true;
  });
  
  // 渲染筛选结果
  const resultBody = document.getElementById('filter-result-body');
  const resultCount = document.getElementById('filter-result-count');
  
  if (filteredFunds.length === 0) {
    resultBody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-gray-500">
          <i class="fa fa-search text-xl mb-2"></i>
          <p>未找到符合条件的基金</p>
        </td>
      </tr>
    `;
  } else {
    resultBody.innerHTML = filteredFunds.map(fund => `
      <tr class="border-b border-gray-200 hover:bg-gray-50">
        <td class="py-2">
          <a href="javascript:void(0)" class="text-primary hover:text-primary/80" onclick="viewFundDetail('${fund.code}')">
            ${fund.name}
          </a>
        </td>
        <td class="py-2">${fund.code}</td>
        <td class="py-2">${fund.type === 'stock' ? '股票型' : fund.type === 'mixed' ? '混合型' : fund.type === 'bond' ? '债券型' : fund.type === 'money' ? '货币型' : fund.type === 'index' ? '指数型' : fund.type === 'qdii' ? 'QDII' : '其他'}</td>
        <td class="py-2 text-up">${fund.returnRate.toFixed(2)}%</td>
        <td class="py-2">${fund.size.toFixed(1)}</td>
        <td class="py-2">${fund.establishTime}</td>
        <td class="py-2">
          <button class="btn btn-secondary text-xs py-1 px-3" onclick="addToWatchlist('${fund.code}', '${fund.name}')">
            <i class="fa fa-star-o mr-1"></i> 关注
          </button>
        </td>
      </tr>
    `).join('');
  }
  
  resultCount.textContent = `共 ${filteredFunds.length} 只基金`;
  ui.showToast(`筛选完成，找到 ${filteredFunds.length} 只符合条件的基金`);
}

function resetFilter() {
  // 重置筛选条件
  document.getElementById('filter-fund-type').value = 'all';
  document.getElementById('filter-risk-level').value = 'all';
  document.getElementById('filter-return-rate').value = -50;
  document.getElementById('filter-return-rate-value').textContent = -50;
  document.getElementById('filter-fund-size').value = 0;
  document.getElementById('filter-fund-size-value').textContent = 0;
  document.getElementById('filter-establish-time').value = 'all';
  
  // 重置结果
  const resultBody = document.getElementById('filter-result-body');
  const resultCount = document.getElementById('filter-result-count');
  
  resultBody.innerHTML = `
    <tr>
      <td colspan="7" class="py-8 text-center text-gray-500">
        <i class="fa fa-filter text-xl mb-2"></i>
        <p>请设置筛选条件并点击"开始筛选"按钮</p>
      </td>
    </tr>
  `;
  
  resultCount.textContent = '共 0 只基金';
  ui.showToast('筛选条件已重置');
}

// 关注列表相关函数
function showAddToWatchlistModal() {
  const modal = document.getElementById('watchlist-modal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closeAddToWatchlistModal() {
  const modal = document.getElementById('watchlist-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function addToWatchlist(fundCode, fundName) {
  // 从本地存储获取关注列表
  let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
  
  // 检查是否已经在关注列表中
  if (watchlist.some(item => item.code === fundCode)) {
    ui.showToast('该基金已在关注列表中');
    return;
  }
  
  // 添加到关注列表
  watchlist.push({ code: fundCode, name: fundName });
  
  // 保存到本地存储
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  
  // 渲染关注列表
  renderWatchlist();
  
  // 关闭弹窗
  closeAddToWatchlistModal();
  
  ui.showToast('基金已添加到关注列表');
}

function renderWatchlist() {
  const watchlistContent = document.getElementById('watchlist-content');
  const emptyWatchlist = document.getElementById('empty-watchlist');
  
  // 从本地存储获取关注列表
  let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
  
  if (watchlist.length === 0) {
    if (emptyWatchlist) {
      emptyWatchlist.classList.remove('hidden');
    }
    return;
  }
  
  if (emptyWatchlist) {
    emptyWatchlist.classList.add('hidden');
  }
  
  // 渲染关注列表
  watchlistContent.innerHTML = watchlist.map(item => `
    <div class="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
      <div class="flex justify-between items-center">
        <div>
          <h4 class="font-medium text-primary hover:underline cursor-pointer" onclick="viewFundDetail('${item.code}')">${item.name}</h4>
          <p class="text-xs text-gray-500">${item.code}</p>
        </div>
        <button class="btn btn-danger text-xs py-1 px-3" onclick="removeFromWatchlist('${item.code}')">
          <i class="fa fa-trash mr-1"></i> 移除
        </button>
      </div>
    </div>
  `).join('');
}

function removeFromWatchlist(fundCode) {
  // 从本地存储获取关注列表
  let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
  
  // 过滤掉要移除的基金
  watchlist = watchlist.filter(item => item.code !== fundCode);
  
  // 保存到本地存储
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  
  // 渲染关注列表
  renderWatchlist();
  
  ui.showToast('基金已从关注列表中移除');
}

// 定投计算器相关函数
function calculateInvestment() {
  // 获取输入参数
  const monthlyInvestment = parseFloat(document.getElementById('monthly-investment').value);
  const investmentYears = parseFloat(document.getElementById('investment-years').value);
  const expectedReturnRate = parseFloat(document.getElementById('expected-return-rate').value) / 100;
  const investmentStartDate = document.getElementById('investment-start-date').value;
  
  // 计算总投资期数（月）
  const totalMonths = investmentYears * 12;
  
  // 计算月收益率
  const monthlyReturnRate = expectedReturnRate / 12;
  
  // 计算到期总资产（使用复利公式）
  let totalAsset = 0;
  for (let i = 0; i < totalMonths; i++) {
    totalAsset = (totalAsset + monthlyInvestment) * (1 + monthlyReturnRate);
  }
  
  // 计算总投入
  const totalInvestment = monthlyInvestment * totalMonths;
  
  // 计算预期收益
  const expectedProfit = totalAsset - totalInvestment;
  
  // 计算收益倍数
  const profitMultiple = totalAsset / totalInvestment;
  
  // 更新结果
  document.getElementById('total-investment').textContent = `¥${totalInvestment.toFixed(2)}`;
  document.getElementById('expected-profit').textContent = `¥${expectedProfit.toFixed(2)}`;
  document.getElementById('total-asset').textContent = `¥${totalAsset.toFixed(2)}`;
  document.getElementById('profit-multiple').textContent = profitMultiple.toFixed(2);
  
  // 生成收益走势图
  generateInvestmentChart(monthlyInvestment, investmentYears, expectedReturnRate);
  
  ui.showToast('计算完成');
}

function generateInvestmentChart(monthlyInvestment, investmentYears, expectedReturnRate) {
  const chartDom = document.getElementById('investment-chart');
  if (!chartDom) return;
  
  try {
    // 使用ECharts初始化图表
    const myChart = echarts.init(chartDom);
    
    // 计算数据
    const totalMonths = investmentYears * 12;
    const monthlyReturnRate = expectedReturnRate / 12;
    
    const labels = [];
    const investmentData = [];
    const assetData = [];
    
    let totalInvestment = 0;
    let totalAsset = 0;
    
    for (let i = 0; i <= totalMonths; i += 12) {
      const year = i / 12;
      labels.push(`${year}年`);
      
      // 计算到第i个月的总投资
      totalInvestment = monthlyInvestment * i;
      investmentData.push(totalInvestment);
      
      // 计算到第i个月的总资产
      totalAsset = 0;
      for (let j = 0; j < i; j++) {
        totalAsset = (totalAsset + monthlyInvestment) * (1 + monthlyReturnRate);
      }
      assetData.push(totalAsset);
    }
    
    // 图表配置
    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          let result = params[0].name + '<br/>';
          params.forEach(param => {
            result += `${param.marker}${param.seriesName}: ¥${param.value.toFixed(2)}<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ['总投入', '总资产'],
        bottom: 0
      },
      xAxis: {
        type: 'category',
        data: labels
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '¥{value}'
        }
      },
      series: [
        {
          name: '总投入',
          data: investmentData,
          type: 'line',
          smooth: true,
          lineStyle: {
            color: '#64748b'
          }
        },
        {
          name: '总资产',
          data: assetData,
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
        }
      ]
    };
    
    // 设置图表配置
    myChart.setOption(option);
    
    // 响应式处理
    window.addEventListener('resize', function() {
      myChart.resize();
    });
  } catch (error) {
    console.error('生成投资图表失败:', error);
  }
}

function resetCalculator() {
  // 重置输入参数
  document.getElementById('monthly-investment').value = 1000;
  document.getElementById('investment-years').value = 5;
  document.getElementById('expected-return-rate').value = 8;
  document.getElementById('investment-start-date').value = '2024-01-01';
  
  // 重置结果
  document.getElementById('total-investment').textContent = '¥0';
  document.getElementById('expected-profit').textContent = '¥0';
  document.getElementById('total-asset').textContent = '¥0';
  document.getElementById('profit-multiple').textContent = '0';
  
  // 清空图表
  const chartDom = document.getElementById('investment-chart');
  if (chartDom) {
    try {
      const myChart = echarts.init(chartDom);
      myChart.setOption({});
    } catch (error) {
      console.error('重置图表失败:', error);
    }
  }
  
  ui.showToast('计算器已重置');
}

// 持仓分析相关函数
function refreshAnalysis() {
  // 显示加载状态
  ui.showToast('正在分析持仓数据...');
  
  // 计算分析数据
  setTimeout(() => {
    calculateAnalysis();
    ui.showToast('持仓分析完成');
  }, 500);
}

function calculateAnalysis() {
  // 从本地存储获取持仓数据
  let positions = JSON.parse(localStorage.getItem('positions') || '[]');
  
  // 模拟持仓数据（如果没有真实数据）
  if (positions.length === 0) {
    positions = [
      { code: '000001', name: '华夏成长混合', shares: 1000, cost: 1.2, estimate: 1.35, industry: 'Technology', risk: 'medium' },
      { code: '000030', name: '华夏新能源车ETF联接A', shares: 2000, cost: 1.5, estimate: 1.8, industry: 'Auto', risk: 'high' },
      { code: '000032', name: '嘉实半导体ETF联接A', shares: 1500, cost: 1.8, estimate: 2.1, industry: 'Technology', risk: 'high' },
      { code: '000008', name: '嘉实中证500ETF联接A', shares: 3000, cost: 1.1, estimate: 1.15, industry: 'Broad Market', risk: 'medium' },
      { code: '000071', name: '华夏医疗健康混合A', shares: 1200, cost: 2.2, estimate: 2.3, industry: 'Healthcare', risk: 'medium' }
    ];
  }
  
  // 计算分析数据
  const analysisData = {
    fundCount: positions.length,
    totalMarketValue: positions.reduce((sum, pos) => sum + pos.shares * pos.estimate, 0),
    overallProfit: positions.reduce((sum, pos) => sum + pos.shares * (pos.estimate - pos.cost), 0),
    industryDistribution: {},
    riskDistribution: {}
  };
  
  // 计算行业分布
  positions.forEach(pos => {
    const industry = pos.industry || 'Other';
    const marketValue = pos.shares * pos.estimate;
    if (!analysisData.industryDistribution[industry]) {
      analysisData.industryDistribution[industry] = 0;
    }
    analysisData.industryDistribution[industry] += marketValue;
  });
  
  // 计算风险分布
  positions.forEach(pos => {
    const risk = pos.risk || 'low';
    const marketValue = pos.shares * pos.estimate;
    if (!analysisData.riskDistribution[risk]) {
      analysisData.riskDistribution[risk] = 0;
    }
    analysisData.riskDistribution[risk] += marketValue;
  });
  
  // 计算整体风险等级
  let totalRiskScore = 0;
  let totalWeight = 0;
  positions.forEach(pos => {
    const riskScore = pos.risk === 'low' ? 1 : pos.risk === 'medium' ? 2 : 3;
    const weight = pos.shares * pos.estimate;
    totalRiskScore += riskScore * weight;
    totalWeight += weight;
  });
  const avgRiskScore = totalWeight > 0 ? totalRiskScore / totalWeight : 1;
  let riskLevel = '低';
  if (avgRiskScore > 2.5) riskLevel = '高';
  else if (avgRiskScore > 1.5) riskLevel = '中';
  
  // 更新分析摘要
  document.getElementById('fund-count').textContent = analysisData.fundCount;
  document.getElementById('total-market-value').textContent = `¥${analysisData.totalMarketValue.toFixed(2)}`;
  document.getElementById('overall-profit').textContent = `¥${analysisData.overallProfit.toFixed(2)}`;
  document.getElementById('risk-level').textContent = riskLevel;
  
  // 生成行业分布图表
  generateIndustryChart(analysisData.industryDistribution);
  
  // 生成风险分布图表
  generateRiskChart(analysisData.riskDistribution);
  
  // 渲染分析表格
  renderAnalysisTable(positions);
}

function generateIndustryChart(industryDistribution) {
  const chartDom = document.getElementById('industry-chart');
  if (!chartDom) return;
  
  try {
    // 使用ECharts初始化图表
    const myChart = echarts.init(chartDom);
    
    // 准备数据
    const industries = Object.keys(industryDistribution);
    const values = Object.values(industryDistribution);
    
    // 图表配置
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: industries
      },
      series: [
        {
          name: '行业分布',
          type: 'pie',
          radius: '60%',
          data: industries.map((industry, index) => ({
            value: values[index],
            name: industry
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
    
    // 设置图表配置
    myChart.setOption(option);
    
    // 响应式处理
    window.addEventListener('resize', function() {
      myChart.resize();
    });
  } catch (error) {
    console.error('生成行业分布图表失败:', error);
  }
}

function generateRiskChart(riskDistribution) {
  const chartDom = document.getElementById('risk-chart');
  if (!chartDom) return;
  
  try {
    // 使用ECharts初始化图表
    const myChart = echarts.init(chartDom);
    
    // 准备数据
    const risks = Object.keys(riskDistribution).map(risk => {
      if (risk === 'low') return '低风险';
      if (risk === 'medium') return '中风险';
      if (risk === 'high') return '高风险';
      return risk;
    });
    const values = Object.values(riskDistribution);
    
    // 图表配置
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: risks
      },
      series: [
        {
          name: '风险分布',
          type: 'pie',
          radius: '60%',
          data: risks.map((risk, index) => ({
            value: values[index],
            name: risk
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
    
    // 设置图表配置
    myChart.setOption(option);
    
    // 响应式处理
    window.addEventListener('resize', function() {
      myChart.resize();
    });
  } catch (error) {
    console.error('生成风险分布图表失败:', error);
  }
}

function renderAnalysisTable(positions) {
  const tableBody = document.getElementById('analysis-table-body');
  if (!tableBody) return;
  
  if (positions.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-gray-500">
          <i class="fa fa-info-circle text-xl mb-2"></i>
          <p>暂无持仓数据，请先添加基金到持仓</p>
        </td>
      </tr>
    `;
    return;
  }
  
  // 计算总市值
  const totalMarketValue = positions.reduce((sum, pos) => sum + pos.shares * pos.estimate, 0);
  
  // 渲染表格
  tableBody.innerHTML = positions.map(pos => {
    const marketValue = pos.shares * pos.estimate;
    const proportion = totalMarketValue > 0 ? (marketValue / totalMarketValue * 100).toFixed(2) : '0.00';
    const dayChange = ((pos.estimate - pos.cost) / pos.cost * 100).toFixed(2);
    const dayChangeClass = parseFloat(dayChange) >= 0 ? 'text-up' : 'text-down';
    
    return `
      <tr class="border-b border-gray-200 hover:bg-gray-50">
        <td class="py-2">
          <a href="javascript:void(0)" class="text-primary hover:underline" onclick="viewFundDetail('${pos.code}')">${pos.name}</a>
        </td>
        <td class="py-2">${pos.code}</td>
        <td class="py-2">${proportion}%</td>
        <td class="py-2">${pos.industry || 'Other'}</td>
        <td class="py-2">${pos.risk === 'low' ? '低' : pos.risk === 'medium' ? '中' : '高'}</td>
        <td class="py-2 ${dayChangeClass}">${dayChange}%</td>
      </tr>
    `;
  }).join('');
}

// 自定义首页相关函数
function showCustomizeModal() {
  const modal = document.getElementById('customize-modal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closeCustomizeModal() {
  const modal = document.getElementById('customize-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function saveHomeSettings() {
  // 获取设置
  const showHotFunds = document.getElementById('show-hot-funds').checked;
  const showMarketOverview = document.getElementById('show-market-overview').checked;
  const showNews = document.getElementById('show-news').checked;
  
  // 保存到本地存储
  const settings = {
    showHotFunds,
    showMarketOverview,
    showNews
  };
  
  localStorage.setItem('homeSettings', JSON.stringify(settings));
  
  // 应用设置
  applyHomeSettings();
  
  // 关闭弹窗
  closeCustomizeModal();
  
  ui.showToast('首页设置已保存');
}

function getHomeSettings() {
  // 从本地存储获取设置
  const settings = JSON.parse(localStorage.getItem('homeSettings') || '{}');
  
  // 返回默认设置（如果没有保存的设置）
  return {
    showHotFunds: settings.showHotFunds !== false,
    showMarketOverview: settings.showMarketOverview !== false,
    showNews: settings.showNews !== false
  };
}

function applyHomeSettings() {
  const settings = getHomeSettings();
  
  // 应用设置
  const hotFundsSection = document.getElementById('hot-funds-section');
  const marketOverviewSection = document.getElementById('market-overview-section');
  const newsSection = document.getElementById('news-section');
  
  if (hotFundsSection) {
    hotFundsSection.style.display = settings.showHotFunds ? 'block' : 'none';
  }
  
  if (marketOverviewSection) {
    marketOverviewSection.style.display = settings.showMarketOverview ? 'block' : 'none';
  }
  
  if (newsSection) {
    newsSection.style.display = settings.showNews ? 'block' : 'none';
  }
}

function initHomeSettings() {
  // 应用首页设置
  applyHomeSettings();
  
  // 初始化设置弹窗
  const showHotFundsCheckbox = document.getElementById('show-hot-funds');
  const showMarketOverviewCheckbox = document.getElementById('show-market-overview');
  const showNewsCheckbox = document.getElementById('show-news');
  
  if (showHotFundsCheckbox && showMarketOverviewCheckbox && showNewsCheckbox) {
    const settings = getHomeSettings();
    showHotFundsCheckbox.checked = settings.showHotFunds;
    showMarketOverviewCheckbox.checked = settings.showMarketOverview;
    showNewsCheckbox.checked = settings.showNews;
  }
}

// 登录相关函数
function toggleAuthMode() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authTitle = document.querySelector('#panel-auth h2');
  const toggleButton = document.querySelector('#panel-auth button');
  
  if (loginForm.classList.contains('hidden')) {
    // 切换到登录模式
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    if (authTitle) authTitle.textContent = '用户登录';
    if (toggleButton) toggleButton.textContent = '切换到注册';
  } else {
    // 切换到注册模式
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    if (authTitle) authTitle.textContent = '用户注册';
    if (toggleButton) toggleButton.textContent = '切换到登录';
  }
}

function loginUser() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const rememberMe = document.getElementById('remember-me').checked;
  
  // 简单验证
  if (!email || !password) {
    ui.showToast('请输入邮箱和密码');
    return;
  }
  
  // 模拟登录
  setTimeout(() => {
    // 保存登录状态
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    
    // 更新UI
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
      authBtn.innerHTML = `<i class="fa fa-user mr-1"></i> ${email}`;
      authBtn.onclick = () => switchTab('auth');
    }
    
    ui.showToast('登录成功');
  }, 500);
}

function registerUser() {
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  
  // 简单验证
  if (!name || !email || !password || !confirmPassword) {
    ui.showToast('请填写所有字段');
    return;
  }
  
  if (password !== confirmPassword) {
    ui.showToast('两次输入的密码不一致');
    return;
  }
  
  if (password.length < 6) {
    ui.showToast('密码长度至少为6个字符');
    return;
  }
  
  // 模拟注册
  setTimeout(() => {
    ui.showToast('注册成功，请登录');
    toggleAuthMode();
  }, 500);
}

// 市场热点追踪相关函数
function refreshHotTopics() {
  // 显示加载状态
  ui.showToast('正在获取市场热点数据...');
  
  // 模拟获取热点数据
  setTimeout(() => {
    // 生成热点板块数据
    const hotSectors = generateHotSectors();
    // 渲染热点板块
    renderHotSectors(hotSectors);
    // 生成热点板块走势图
    generateHotSectorsChart(hotSectors);
    // 生成热点相关基金
    const hotFunds = generateHotFunds(hotSectors);
    // 渲染热点相关基金
    renderHotFunds(hotFunds);
    
    ui.showToast('市场热点数据更新完成');
  }, 800);
}

function generateHotSectors() {
  // 模拟热点板块数据
  return [
    { name: '新能源', change: 5.23, volume: 1250000, marketValue: 520000000000, trend: [3.2, 4.1, 3.8, 4.5, 5.23] },
    { name: '半导体', change: 4.87, volume: 980000, marketValue: 480000000000, trend: [2.5, 3.2, 3.9, 4.3, 4.87] },
    { name: '人工智能', change: 4.56, volume: 1100000, marketValue: 450000000000, trend: [2.8, 3.5, 4.0, 4.2, 4.56] },
    { name: '医疗健康', change: 3.89, volume: 850000, marketValue: 380000000000, trend: [2.0, 2.5, 3.0, 3.5, 3.89] },
    { name: '消费升级', change: 3.45, volume: 720000, marketValue: 340000000000, trend: [1.8, 2.2, 2.8, 3.1, 3.45] },
    { name: '金融科技', change: 3.12, volume: 680000, marketValue: 310000000000, trend: [1.5, 2.0, 2.5, 2.8, 3.12] },
    { name: '绿色环保', change: 2.98, volume: 650000, marketValue: 290000000000, trend: [1.2, 1.8, 2.2, 2.6, 2.98] },
    { name: '高端制造', change: 2.76, volume: 600000, marketValue: 270000000000, trend: [1.0, 1.5, 2.0, 2.4, 2.76] }
  ];
}

function renderHotSectors(sectors) {
  const sectorsList = document.getElementById('hot-sectors-list');
  if (!sectorsList) return;
  
  sectorsList.innerHTML = sectors.map((sector, index) => `
    <div class="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-center">
        <div class="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full text-sm font-bold mr-3">
          ${index + 1}
        </div>
        <div>
          <h4 class="font-medium">${sector.name}</h4>
          <div class="flex items-center text-xs text-gray-500 mt-1">
            <span class="mr-3">成交量: ${(sector.volume / 10000).toFixed(1)}万手</span>
            <span>市值: ${(sector.marketValue / 100000000).toFixed(0)}亿</span>
          </div>
        </div>
      </div>
      <div class="text-right">
        <p class="text-lg font-bold text-up">+${sector.change.toFixed(2)}%</p>
        <div class="flex items-center justify-end mt-1">
          <i class="fa fa-arrow-up text-up mr-1"></i>
          <span class="text-xs text-up">${sector.trend[4] - sector.trend[3] > 0 ? '上涨' : '下跌'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function generateHotSectorsChart(sectors) {
  const chartDom = document.getElementById('hot-sectors-chart');
  if (!chartDom) return;
  
  try {
    // 使用ECharts初始化图表
    const myChart = echarts.init(chartDom);
    
    // 准备数据
    const sectorNames = sectors.slice(0, 4).map(sector => sector.name);
    const sectorData = sectors.slice(0, 4).map(sector => sector.trend);
    const dates = ['5日前', '4日前', '3日前', '2日前', '今日'];
    
    // 图表配置
    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          let result = params[0].name + '<br/>';
          params.forEach(param => {
            result += `${param.marker}${param.seriesName}: ${param.value}%<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: sectorNames,
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: sectorNames.map((name, index) => ({
        name: name,
        type: 'line',
        stack: 'Total',
        data: sectorData[index],
        smooth: true,
        lineStyle: {
          width: 2
        }
      }))
    };
    
    // 设置图表配置
    myChart.setOption(option);
    
    // 响应式处理
    window.addEventListener('resize', function() {
      myChart.resize();
    });
  } catch (error) {
    console.error('生成热点板块走势图失败:', error);
  }
}

function generateHotFunds(sectors) {
  // 模拟热点相关基金数据
  const funds = [];
  
  // 为每个热点板块生成相关基金
  sectors.forEach(sector => {
    // 为每个板块生成2-3只相关基金
    const fundCount = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < fundCount; i++) {
      // 生成随机基金代码
      const fundCode = (Math.floor(Math.random() * 900000) + 100000).toString();
      
      funds.push({
        code: fundCode,
        name: `${sector.name}${i === 0 ? '主题' : i === 1 ? '精选' : '龙头'}混合`,
        sector: sector.name,
        dayChange: (Math.random() * 3 + sector.change - 1.5).toFixed(2),
        weekChange: (Math.random() * 5 + sector.change * 2).toFixed(2),
        monthChange: (Math.random() * 10 + sector.change * 4).toFixed(2)
      });
    }
  });
  
  return funds;
}

function renderHotFunds(funds) {
  const fundsBody = document.getElementById('hot-funds-body');
  const fundsCount = document.getElementById('hot-funds-count');
  
  if (!fundsBody || !fundsCount) return;
  
  fundsCount.textContent = `共 ${funds.length} 只基金`;
  
  if (funds.length === 0) {
    fundsBody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-gray-500">
          <i class="fa fa-line-chart text-xl mb-2"></i>
          <p>暂无热点相关基金数据</p>
        </td>
      </tr>
    `;
    return;
  }
  
  fundsBody.innerHTML = funds.map(fund => {
    const dayChangeClass = parseFloat(fund.dayChange) >= 0 ? 'text-up' : 'text-down';
    const weekChangeClass = parseFloat(fund.weekChange) >= 0 ? 'text-up' : 'text-down';
    const monthChangeClass = parseFloat(fund.monthChange) >= 0 ? 'text-up' : 'text-down';
    
    return `
      <tr class="border-b border-gray-200 hover:bg-gray-50">
        <td class="py-2">
          <a href="javascript:void(0)" class="text-primary hover:underline" onclick="viewFundDetail('${fund.code}')">${fund.name}</a>
        </td>
        <td class="py-2">${fund.code}</td>
        <td class="py-2">${fund.sector}</td>
        <td class="py-2 ${dayChangeClass}">${fund.dayChange}%</td>
        <td class="py-2 ${weekChangeClass}">${fund.weekChange}%</td>
        <td class="py-2 ${monthChangeClass}">${fund.monthChange}%</td>
        <td class="py-2">
          <button class="btn btn-secondary text-xs py-1 px-3" onclick="addToWatchlist('${fund.code}', '${fund.name}')">
            <i class="fa fa-star-o mr-1"></i> 关注
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// 个性化推荐相关函数
function refreshRecommendations() {
  // 显示加载状态
  ui.showToast('正在生成个性化推荐...');
  
  // 模拟获取推荐数据
  setTimeout(() => {
    // 生成推荐基金数据
    const recommendations = generateRecommendations();
    // 渲染推荐基金
    renderRecommendations(recommendations);
    
    ui.showToast('个性化推荐更新完成');
  }, 800);
}

function generateRecommendations() {
  // 从本地存储获取用户数据
  const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
  const positions = JSON.parse(localStorage.getItem('positions') || '[]');
  const browseHistory = JSON.parse(localStorage.getItem('browseHistory') || '[]');
  
  // 模拟推荐基金数据
  const recommendations = [
    {
      code: '000001',
      name: '华夏成长混合',
      reason: '基于您关注的科技类基金',
      similarity: 95,
      dayChange: '1.25',
      weekChange: '3.42',
      monthChange: '8.76',
      category: '科技成长'
    },
    {
      code: '000030',
      name: '华夏新能源车ETF联接A',
      reason: '基于您的持仓结构补充',
      similarity: 92,
      dayChange: '2.34',
      weekChange: '5.67',
      monthChange: '12.34',
      category: '新能源'
    },
    {
      code: '000032',
      name: '嘉实半导体ETF联接A',
      reason: '基于您最近浏览的半导体基金',
      similarity: 88,
      dayChange: '3.12',
      weekChange: '7.89',
      monthChange: '15.67',
      category: '半导体'
    },
    {
      code: '000008',
      name: '嘉实中证500ETF联接A',
      reason: '基于您的分散投资需求',
      similarity: 85,
      dayChange: '0.89',
      weekChange: '2.34',
      monthChange: '6.78',
      category: '宽基指数'
    },
    {
      code: '000071',
      name: '华夏医疗健康混合A',
      reason: '基于当前市场热点',
      similarity: 82,
      dayChange: '1.56',
      weekChange: '4.56',
      monthChange: '9.87',
      category: '医疗健康'
    }
  ];
  
  return recommendations;
}

function renderRecommendations(recommendations) {
  const recommendList = document.getElementById('recommend-list');
  const recommendCount = document.getElementById('recommend-count');
  
  if (!recommendList || !recommendCount) return;
  
  recommendCount.textContent = `共 ${recommendations.length} 只基金`;
  
  if (recommendations.length === 0) {
    recommendList.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fa fa-thumbs-up text-xl mb-2"></i>
        <p>暂无个性化推荐数据</p>
      </div>
    `;
    return;
  }
  
  recommendList.innerHTML = recommendations.map((fund, index) => {
    const dayChangeClass = parseFloat(fund.dayChange) >= 0 ? 'text-up' : 'text-down';
    const weekChangeClass = parseFloat(fund.weekChange) >= 0 ? 'text-up' : 'text-down';
    const monthChangeClass = parseFloat(fund.monthChange) >= 0 ? 'text-up' : 'text-down';
    
    return `
      <div class="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start mb-3">
          <div>
            <div class="flex items-center">
              <h4 class="font-medium text-primary hover:underline cursor-pointer" onclick="viewFundDetail('${fund.code}')">${fund.name}</h4>
              <span class="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">${fund.category}</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">${fund.code}</p>
          </div>
          <div class="flex items-center">
            <div class="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full text-xs font-bold mr-2">
              ${index + 1}
            </div>
            <div class="text-right">
              <p class="text-xs text-gray-500">匹配度</p>
              <p class="text-sm font-bold text-primary">${fund.similarity}%</p>
            </div>
          </div>
        </div>
        
        <div class="flex items-center mb-3">
          <div class="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary rounded-full mr-2">
            <i class="fa fa-lightbulb-o text-xs"></i>
          </div>
          <p class="text-sm text-gray-600">${fund.reason}</p>
        </div>
        
        <div class="grid grid-cols-3 gap-4 mb-3">
          <div class="text-center">
            <p class="text-xs text-gray-500">日涨跌幅</p>
            <p class="text-sm font-medium ${dayChangeClass}">${fund.dayChange}%</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500">近1周</p>
            <p class="text-sm font-medium ${weekChangeClass}">${fund.weekChange}%</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500">近1月</p>
            <p class="text-sm font-medium ${monthChangeClass}">${fund.monthChange}%</p>
          </div>
        </div>
        
        <div class="flex justify-end gap-2">
          <button class="btn btn-secondary text-xs py-1 px-3" onclick="addToWatchlist('${fund.code}', '${fund.name}')">
            <i class="fa fa-star-o mr-1"></i> 关注
          </button>
          <button class="btn btn-primary text-xs py-1 px-3" onclick="viewFundDetail('${fund.code}')">
            <i class="fa fa-search mr-1"></i> 查看
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// 记录浏览历史
function recordBrowseHistory(fundCode, fundName) {
  // 从本地存储获取浏览历史
  let browseHistory = JSON.parse(localStorage.getItem('browseHistory') || '[]');
  
  // 移除已存在的相同基金
  browseHistory = browseHistory.filter(item => item.code !== fundCode);
  
  // 添加新的浏览记录到开头
  browseHistory.unshift({
    code: fundCode,
    name: fundName,
    timestamp: new Date().getTime()
  });
  
  // 限制浏览历史数量
  if (browseHistory.length > 20) {
    browseHistory = browseHistory.slice(0, 20);
  }
  
  // 保存到本地存储
  localStorage.setItem('browseHistory', JSON.stringify(browseHistory));
}

// 导出函数
window.initApp = initApp;
window.showAddPositionModal = showAddPositionModal;
window.showEditPositionModal = showEditPositionModal;
window.closePositionModal = closePositionModal;
window.showBatchAddPositionModal = showBatchAddPositionModal;
window.closeBatchPositionModal = closeBatchPositionModal;
window.saveBatchPositions = saveBatchPositions;
window.savePosition = savePosition;
window.deletePosition = deletePosition;
window.getFundNameByCode = getFundNameByCode;
window.updateBatchDeleteButton = updateBatchDeleteButton;
window.selectAllPositions = selectAllPositions;
window.batchDeletePositions = batchDeletePositions;
window.sortPositions = sortPositions;
window.shareApp = shareApp;
window.copyShareLink = copyShareLink;
window.toggleAssetVisibility = toggleAssetVisibility;
// 基金对比相关函数
window.addToCompare = addToCompare;
window.removeFromCompare = removeFromCompare;
window.clearCompareList = clearCompareList;
window.viewFundCompare = viewFundCompare;
// 新增函数
window.showMoreHistory = showMoreHistory;
window.screenshotFundData = screenshotFundData;

// 导出UI函数
window.switchTab = ui.switchTab.bind(ui);
window.homeQueryFund = ui.homeQueryFund.bind(ui);
window.queryFund = ui.queryFund.bind(ui);
window.viewFundDetail = ui.viewFundDetail.bind(ui);
window.viewIndexDetail = ui.viewIndexDetail.bind(ui);
window.quickQueryFund = ui.quickQueryFund.bind(ui);
window.refreshAllPositions = ui.refreshAllPositions.bind(ui);
window.refreshRanking = ui.refreshRanking.bind(ui);
window.refreshNews = ui.refreshNews.bind(ui);
window.toggleTheme = ui.toggleTheme.bind(ui);

// 基金筛选器相关函数
window.filterFunds = filterFunds;
window.resetFilter = resetFilter;

// 关注列表相关函数
window.showAddToWatchlistModal = showAddToWatchlistModal;
window.closeAddToWatchlistModal = closeAddToWatchlistModal;
window.addToWatchlist = addToWatchlist;
window.renderWatchlist = renderWatchlist;
window.removeFromWatchlist = removeFromWatchlist;

// 定投计算器相关函数
window.calculateInvestment = calculateInvestment;
window.generateInvestmentChart = generateInvestmentChart;
window.resetCalculator = resetCalculator;

// 持仓分析相关函数
window.refreshAnalysis = refreshAnalysis;
window.calculateAnalysis = calculateAnalysis;
window.generateIndustryChart = generateIndustryChart;
window.generateRiskChart = generateRiskChart;
window.renderAnalysisTable = renderAnalysisTable;

// 自定义首页相关函数
window.showCustomizeModal = showCustomizeModal;
window.closeCustomizeModal = closeCustomizeModal;
window.saveHomeSettings = saveHomeSettings;
window.getHomeSettings = getHomeSettings;
window.applyHomeSettings = applyHomeSettings;
window.initHomeSettings = initHomeSettings;

// 登录相关函数
window.toggleAuthMode = toggleAuthMode;
window.loginUser = loginUser;
window.registerUser = registerUser;

// 市场热点追踪相关函数
window.refreshHotTopics = refreshHotTopics;

// 个性化推荐相关函数
window.refreshRecommendations = refreshRecommendations;
window.recordBrowseHistory = recordBrowseHistory;

// 投资组合分享相关函数
function generateShareablePortfolio() {
  // 获取持仓数据
  const positions = JSON.parse(localStorage.getItem('positions') || '[]');
  
  // 检查是否有持仓数据
  if (positions.length === 0) {
    ui.showToast('暂无持仓数据，请先添加基金到持仓');
    return;
  }
  
  // 获取分享选项
  const title = document.getElementById('share-title').value || '我的投资组合';
  const description = document.getElementById('share-description').value || '我的精选基金组合';
  const visibility = document.getElementById('share-visibility').value || 'public';
  
  // 生成投资组合数据
  const portfolio = {
    title,
    description,
    visibility,
    createdAt: new Date().toISOString(),
    positions: positions.map(pos => ({
      code: pos.code,
      name: pos.name || `基金${pos.code}`,
      shares: pos.shares,
      cost: pos.cost,
      estimate: pos.estimate || pos.cost
    })),
    totalValue: positions.reduce((sum, pos) => {
      const estimate = pos.estimate || pos.cost || 0;
      const shares = pos.shares || 0;
      return sum + shares * estimate;
    }, 0)
  };
  
  // 生成分享链接
  const shareData = btoa(JSON.stringify(portfolio));
  const shareUrl = `${window.location.origin}${window.location.pathname}?portfolio=${shareData}`;
  
  // 渲染投资组合预览
  renderPortfolioPreview(portfolio);
  
  // 显示分享结果
  const shareResult = document.getElementById('share-result');
  const shareUrlInput = document.getElementById('share-url');
  if (shareResult && shareUrlInput) {
    shareResult.classList.remove('hidden');
    shareUrlInput.value = shareUrl;
  }
  
  // 保存到分享历史
  saveShareHistory(portfolio, shareUrl);
  
  // 显示成功提示
  ui.showToast('投资组合分享链接已生成');
}

function renderPortfolioPreview(portfolio) {
  const previewElement = document.getElementById('portfolio-preview');
  if (!previewElement) return;
  
  previewElement.innerHTML = `
    <div class="bg-white rounded-lg p-4 shadow-sm">
      <h4 class="font-medium text-lg mb-2">${portfolio.title}</h4>
      <p class="text-sm text-gray-600 mb-3">${portfolio.description}</p>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <div class="bg-gray-50 p-2 rounded">
          <span class="text-xs text-gray-500">总市值</span>
          <p class="font-medium">¥${portfolio.totalValue.toFixed(2)}</p>
        </div>
        <div class="bg-gray-50 p-2 rounded">
          <span class="text-xs text-gray-500">持仓基金数</span>
          <p class="font-medium">${portfolio.positions.length}只</p>
        </div>
      </div>
      <h5 class="font-medium text-sm mb-2">持仓明细</h5>
      <div class="space-y-2 max-h-48 overflow-y-auto">
        ${portfolio.positions.map(pos => {
          const profit = (pos.estimate - pos.cost) * pos.shares;
          const profitClass = profit >= 0 ? 'text-up' : 'text-down';
          return `
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <p class="text-sm font-medium">${pos.name}</p>
                <p class="text-xs text-gray-500">${pos.code}</p>
              </div>
              <div class="text-right">
                <p class="text-sm">${pos.shares.toFixed(2)}份</p>
                <p class="text-xs ${profitClass}">${profit >= 0 ? '+' : ''}¥${profit.toFixed(2)}</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function saveShareHistory(portfolio, shareUrl) {
  // 从本地存储获取分享历史
  let history = JSON.parse(localStorage.getItem('shareHistory') || '[]');
  
  // 添加新记录
  history.unshift({
    id: Date.now().toString(),
    title: portfolio.title,
    url: shareUrl,
    createdAt: portfolio.createdAt,
    positionCount: portfolio.positions.length
  });
  
  // 限制历史记录数量
  history = history.slice(0, 10);
  
  // 保存到本地存储
  localStorage.setItem('shareHistory', JSON.stringify(history));
  
  // 渲染分享历史
  renderShareHistory(history);
}

function renderShareHistory(history) {
  const historyElement = document.getElementById('share-history');
  if (!historyElement) return;
  
  if (history.length === 0) {
    historyElement.innerHTML = `
      <div class="text-center py-6 text-gray-500">
        <i class="fa fa-history text-2xl mb-2"></i>
        <p>暂无分享记录</p>
      </div>
    `;
    return;
  }
  
  historyElement.innerHTML = history.map(item => `
    <div class="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-medium">${item.title}</h4>
          <p class="text-xs text-gray-500 mt-1">${new Date(item.createdAt).toLocaleString()}</p>
          <p class="text-xs text-gray-500">包含 ${item.positionCount} 只基金</p>
        </div>
        <div>
          <button class="btn btn-secondary text-xs py-1 px-3 mb-2" onclick="copyShareUrlToClipboard('${item.url}')">
            <i class="fa fa-copy mr-1"></i> 复制链接
          </button>
          <button class="btn btn-danger text-xs py-1 px-3" onclick="deleteShareHistory('${item.id}')">
            <i class="fa fa-trash mr-1"></i> 删除
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function copyShareUrl() {
  const shareUrlInput = document.getElementById('share-url');
  if (shareUrlInput) {
    shareUrlInput.select();
    document.execCommand('copy');
    ui.showToast('分享链接已复制到剪贴板');
  }
}

function copyShareUrlToClipboard(url) {
  navigator.clipboard.writeText(url)
    .then(() => {
      ui.showToast('分享链接已复制到剪贴板');
    })
    .catch(err => {
      console.error('复制失败:', err);
      ui.showToast('复制失败，请手动复制链接');
    });
}

function shareToWechat() {
  const shareUrl = document.getElementById('share-url').value;
  if (shareUrl) {
    // 模拟微信分享
    ui.showToast('微信分享功能已触发，请在弹出的窗口中完成分享');
    // 实际项目中可以使用微信JS-SDK
  }
}

function shareToWeibo() {
  const shareUrl = document.getElementById('share-url').value;
  const title = document.getElementById('share-title').value;
  if (shareUrl && title) {
    // 构建微博分享链接
    const weiboUrl = `http://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`;
    window.open(weiboUrl, '_blank', 'width=600,height=400');
    ui.showToast('已打开微博分享窗口');
  }
}

function downloadPortfolioImage() {
  const previewElement = document.getElementById('portfolio-preview');
  if (!previewElement) return;
  
  // 显示加载提示
  ui.showToast('正在生成投资组合图片...');
  
  // 使用html2canvas生成图片
  html2canvas(previewElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  }).then(canvas => {
    // 创建下载链接
    const link = document.createElement('a');
    link.download = `投资组合_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    // 显示成功提示
    ui.showToast('投资组合图片已下载');
  }).catch(error => {
    console.error('生成图片失败:', error);
    ui.showToast('生成图片失败，请重试');
  });
}

function deleteShareHistory(id) {
  if (confirm('确定要删除这条分享记录吗？')) {
    // 从本地存储获取分享历史
    let history = JSON.parse(localStorage.getItem('shareHistory') || '[]');
    
    // 过滤掉要删除的记录
    history = history.filter(item => item.id !== id);
    
    // 保存到本地存储
    localStorage.setItem('shareHistory', JSON.stringify(history));
    
    // 渲染分享历史
    renderShareHistory(history);
    
    // 显示成功提示
    ui.showToast('分享记录已删除');
  }
}

// 暴露投资组合分享相关函数
window.generateShareablePortfolio = generateShareablePortfolio;
window.copyShareUrl = copyShareUrl;
window.copyShareUrlToClipboard = copyShareUrlToClipboard;
window.shareToWechat = shareToWechat;
window.shareToWeibo = shareToWeibo;
window.downloadPortfolioImage = downloadPortfolioImage;
window.deleteShareHistory = deleteShareHistory;

// 基金深度分析相关函数
function analyzeFund() {
  // 获取基金代码
  const fundCode = document.getElementById('deep-analysis-fund-code').value.trim();
  
  // 检查基金代码
  if (!fundCode || fundCode.length !== 6) {
    ui.showToast('请输入6位数字基金代码');
    return;
  }
  
  // 显示加载提示
  ui.showToast('正在分析基金数据...');
  
  // 模拟分析过程
  setTimeout(() => {
    // 生成分析数据
    const analysisData = generateFundAnalysis(fundCode);
    
    // 渲染分析结果
    renderFundAnalysis(analysisData);
    
    // 显示成功提示
    ui.showToast('基金分析完成');
  }, 1500);
}

function generateFundAnalysis(fundCode) {
  // 模拟基金分析数据
  return {
    fundInfo: {
      code: fundCode,
      name: `华夏成长混合`,
      type: '混合型',
      establishDate: '2001-12-18',
      manager: '张三',
      scale: '15.2亿',
      recentNav: '1.2345',
      dayChange: '2.35%'
    },
    performance: {
      day: '2.35%',
      week: '5.67%',
      month: '12.34%',
      quarter: '18.76%',
      year: '32.45%',
      threeYear: '67.89%',
      fiveYear: '123.45%'
    },
    risk: {
      riskLevel: '中风险',
      sharpeRatio: '1.23',
      maxDrawdown: '-23.45%',
      volatility: '18.76%',
      beta: '0.98',
      alpha: '0.05'
    },
    portfolio: {
      stockRatio: '65%',
      bondRatio: '25%',
      cashRatio: '10%',
      topHoldings: [
        { name: '贵州茅台', ratio: '8.76%', industry: '白酒' },
        { name: '宁德时代', ratio: '6.54%', industry: '新能源' },
        { name: '腾讯控股', ratio: '5.32%', industry: '互联网' },
        { name: '阿里巴巴', ratio: '4.98%', industry: '互联网' },
        { name: '比亚迪', ratio: '4.65%', industry: '新能源' }
      ],
      industryDistribution: [
        { name: '科技', ratio: '35%' },
        { name: '消费', ratio: '25%' },
        { name: '新能源', ratio: '20%' },
        { name: '医药', ratio: '10%' },
        { name: '其他', ratio: '10%' }
      ]
    },
    manager: {
      name: '张三',
      tenure: '5年',
      totalReturn: '156.78%',
      annualizedReturn: '18.9%',
      fundsManaged: 3,
      description: '张三先生拥有10年基金管理经验，专注于成长股投资，擅长挖掘科技和消费领域的优质企业。'
    },
    evaluation: {
      rating: 4.5,
      strength: ['长期业绩优异', '行业配置均衡', '风险管理能力强', '基金经理经验丰富'],
      weakness: ['短期波动较大', '规模增长较快', '费率相对较高'],
      conclusion: '该基金长期业绩表现优异，基金经理投资能力强，行业配置均衡，适合长期持有。虽然短期波动较大，但在风险可控范围内，是一只值得关注的优质基金。'
    }
  };
}

function renderFundAnalysis(analysisData) {
  const resultElement = document.getElementById('deep-analysis-result');
  if (!resultElement) return;
  
  resultElement.innerHTML = `
    <!-- 基金基本信息 -->
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="text-md font-medium mb-3">基金基本信息</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-gray-600">基金名称</p>
          <p class="font-medium">${analysisData.fundInfo.name}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">基金代码</p>
          <p class="font-medium">${analysisData.fundInfo.code}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">基金类型</p>
          <p class="font-medium">${analysisData.fundInfo.type}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">成立日期</p>
          <p class="font-medium">${analysisData.fundInfo.establishDate}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">基金经理</p>
          <p class="font-medium">${analysisData.fundInfo.manager}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">基金规模</p>
          <p class="font-medium">${analysisData.fundInfo.scale}</p>
        </div>
      </div>
    </div>
    
    <!-- 业绩表现 -->
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="text-md font-medium mb-3">业绩表现</h3>
      <div class="grid grid-cols-3 md:grid-cols-7 gap-3">
        <div class="text-center">
          <p class="text-xs text-gray-600">日涨跌幅</p>
          <p class="font-medium text-up">${analysisData.performance.day}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-600">周涨跌幅</p>
          <p class="font-medium text-up">${analysisData.performance.week}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-600">月涨跌幅</p>
          <p class="font-medium text-up">${analysisData.performance.month}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-600">季涨跌幅</p>
          <p class="font-medium text-up">${analysisData.performance.quarter}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-600">年涨跌幅</p>
          <p class="font-medium text-up">${analysisData.performance.year}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-600">3年涨跌幅</p>
          <p class="font-medium text-up">${analysisData.performance.threeYear}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-600">5年涨跌幅</p>
          <p class="font-medium text-up">${analysisData.performance.fiveYear}</p>
        </div>
      </div>
    </div>
    
    <!-- 风险分析 -->
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="text-md font-medium mb-3">风险分析</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-gray-600">风险等级</p>
          <p class="font-medium">${analysisData.risk.riskLevel}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">夏普比率</p>
          <p class="font-medium">${analysisData.risk.sharpeRatio}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">最大回撤</p>
          <p class="font-medium text-down">${analysisData.risk.maxDrawdown}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">波动率</p>
          <p class="font-medium">${analysisData.risk.volatility}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">贝塔系数</p>
          <p class="font-medium">${analysisData.risk.beta}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">阿尔法系数</p>
          <p class="font-medium">${analysisData.risk.alpha}</p>
        </div>
      </div>
    </div>
    
    <!-- 投资组合 -->
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="text-md font-medium mb-3">投资组合</h3>
      
      <!-- 资产配置 -->
      <div class="mb-4">
        <h4 class="text-sm font-medium mb-2">资产配置</h4>
        <div class="grid grid-cols-3 gap-3">
          <div class="text-center">
            <p class="text-xs text-gray-600">股票</p>
            <p class="font-medium">${analysisData.portfolio.stockRatio}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-600">债券</p>
            <p class="font-medium">${analysisData.portfolio.bondRatio}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-600">现金</p>
            <p class="font-medium">${analysisData.portfolio.cashRatio}</p>
          </div>
        </div>
      </div>
      
      <!-- 前十大重仓股 -->
      <div class="mb-4">
        <h4 class="text-sm font-medium mb-2">前五大重仓股</h4>
        <div class="space-y-2">
          ${analysisData.portfolio.topHoldings.map((holding, index) => `
            <div class="flex justify-between items-center p-2 bg-white rounded">
              <div>
                <p class="text-sm font-medium">${index + 1}. ${holding.name}</p>
                <p class="text-xs text-gray-500">${holding.industry}</p>
              </div>
              <p class="font-medium">${holding.ratio}</p>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- 行业分布 -->
      <div>
        <h4 class="text-sm font-medium mb-2">行业分布</h4>
        <div id="industry-distribution-chart" class="w-full h-64"></div>
      </div>
    </div>
    
    <!-- 基金经理分析 -->
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="text-md font-medium mb-3">基金经理分析</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p class="text-sm text-gray-600">基金经理</p>
          <p class="font-medium">${analysisData.manager.name}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">任职年限</p>
          <p class="font-medium">${analysisData.manager.tenure}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">总收益率</p>
          <p class="font-medium text-up">${analysisData.manager.totalReturn}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">年化收益率</p>
          <p class="font-medium text-up">${analysisData.manager.annualizedReturn}</p>
        </div>
      </div>
      <div>
        <p class="text-sm text-gray-600 mb-1">管理基金数</p>
        <p class="font-medium mb-3">${analysisData.manager.fundsManaged}只</p>
        <p class="text-sm text-gray-600 mb-1">个人简介</p>
        <p class="text-sm">${analysisData.manager.description}</p>
      </div>
    </div>
    
    <!-- 综合评价 -->
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="text-md font-medium mb-3">综合评价</h3>
      <div class="mb-4">
        <p class="text-sm text-gray-600 mb-1">评分</p>
        <div class="flex items-center">
          <div class="flex">
            ${Array(5).fill().map((_, index) => `
              <i class="fa fa-star ${index < Math.floor(analysisData.evaluation.rating) ? 'text-warning' : 'text-gray-300'}"></i>
            `).join('')}
          </div>
          <span class="ml-2 font-medium">${analysisData.evaluation.rating}/5</span>
        </div>
      </div>
      <div class="mb-4">
        <p class="text-sm text-gray-600 mb-1">优势</p>
        <ul class="list-disc list-inside text-sm space-y-1">
          ${analysisData.evaluation.strength.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      <div class="mb-4">
        <p class="text-sm text-gray-600 mb-1">劣势</p>
        <ul class="list-disc list-inside text-sm space-y-1">
          ${analysisData.evaluation.weakness.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      <div>
        <p class="text-sm text-gray-600 mb-1">结论</p>
        <p class="text-sm">${analysisData.evaluation.conclusion}</p>
      </div>
    </div>
  `;
  
  // 生成行业分布图表
  setTimeout(() => {
    generateIndustryDistributionChart(analysisData.portfolio.industryDistribution);
  }, 100);
}

function generateIndustryDistributionChart(industryData) {
  const chartDom = document.getElementById('industry-distribution-chart');
  if (!chartDom) return;
  
  try {
    // 使用ECharts初始化图表
    const myChart = echarts.init(chartDom);
    
    // 准备数据
    const industries = industryData.map(item => item.name);
    const values = industryData.map(item => parseFloat(item.ratio));
    
    // 图表配置
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}%'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        data: industries
      },
      series: [
        {
          name: '行业分布',
          type: 'pie',
          radius: '60%',
          data: industryData.map(item => ({
            value: parseFloat(item.ratio),
            name: item.name
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
    
    // 设置图表配置
    myChart.setOption(option);
    
    // 响应式处理
    window.addEventListener('resize', function() {
      myChart.resize();
    });
  } catch (error) {
    console.error('生成行业分布图表失败:', error);
  }
}

// 暴露基金深度分析相关函数
window.analyzeFund = analyzeFund;

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

export default {
  initApp,
  positionList,
  originalPositionList
};