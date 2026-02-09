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