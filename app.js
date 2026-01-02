// ========== 數據管理 ==========
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let accounts = JSON.parse(localStorage.getItem('accounts')) || [
  { id: 'default', name: '現金', type: 'cash', balance: 0 }
];
let currentAccount = localStorage.getItem('currentAccount') || 'default';
let theme = localStorage.getItem('theme') || 'light';
let currentView = localStorage.getItem('currentView') || 'home'; // 'home' 或帳戶 ID
let sidebarOpen = window.innerWidth > 768; // 桌面版預設展開

// ========== 成就系統 ==========
let achievementData = {
  totalPoints: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastRecordDate: null,
  totalRecords: 0,
  milestones: {
    streak7: false,
    streak14: false,
    streak21: false,
    streak30: false
  }
};

// 初始化成就系統
function initAchievements() {
  const saved = localStorage.getItem('achievementData');
  if (saved) {
    achievementData = JSON.parse(saved);
  }
  updateAchievementDisplay();
}

// 更新成就顯示
function updateAchievementDisplay() {
  const streakElement = document.getElementById('streak-days');
  const pointsElement = document.getElementById('total-points');
  const rocketIcon = document.getElementById('rocket-icon');

  if (streakElement) {
    streakElement.textContent = `${achievementData.currentStreak} 天`;
  }

  if (pointsElement) {
    pointsElement.textContent = `${achievementData.totalPoints} 積分`;
  }

  // 更新火箭等級
  updateRocketLevel(rocketIcon);

  // 更新軌跡星星
  updateProgressStars();
}

// 更新火箭等級
function updateRocketLevel(rocketIcon) {
  if (!rocketIcon) return;

  // 移除所有等級 class
  rocketIcon.classList.remove('level-2', 'level-3', 'level-4');

  const streak = achievementData.currentStreak;
  if (streak >= 22) {
    rocketIcon.classList.add('level-4');
  } else if (streak >= 15) {
    rocketIcon.classList.add('level-3');
  } else if (streak >= 8) {
    rocketIcon.classList.add('level-2');
  }
}

// 更新進度星星
function updateProgressStars() {
  const container = document.getElementById('progress-stars');
  if (!container) return;

  container.innerHTML = '';

  const streak = achievementData.currentStreak;
  const maxStars = 30; // 最多 30 顆星星（對應 30 天）
  const starCount = Math.min(streak, maxStars);

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'progress-star';
    star.textContent = '✨';

    // 沿著拋物線路徑定位星星
    const progress = i / maxStars;
    const x = progress * 100; // 0-100%
    const y = calculateParabolaY(progress); // 計算 Y 位置

    star.style.left = `${x}%`;
    star.style.top = `${y}%`;
    star.style.animationDelay = `${i * 0.1}s`;

    container.appendChild(star);
  }
}

// 計算拋物線 Y 座標
function calculateParabolaY(progress) {
  // 使用二次貝茲曲線公式
  // 起點: (0, 50), 控制點: (0.5, 10), 終點: (1, 50)
  const t = progress;
  const p0 = 50;
  const p1 = 10;
  const p2 = 50;

  const y = Math.pow(1 - t, 2) * p0 + 2 * (1 - t) * t * p1 + Math.pow(t, 2) * p2;
  return y;
}

// 檢查並更新連續天數
function checkAndUpdateStreak() {
  const today = new Date().toDateString();
  const lastDate = achievementData.lastRecordDate;

  if (!lastDate) {
    // 第一次記帳
    achievementData.currentStreak = 1;
    achievementData.lastRecordDate = today;
  } else if (lastDate === today) {
    // 今天已經記過帳了，不增加連續天數
    return;
  } else {
    const lastDateTime = new Date(lastDate);
    const todayTime = new Date(today);
    const diffTime = todayTime - lastDateTime;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // 連續記帳
      achievementData.currentStreak++;
      achievementData.lastRecordDate = today;

      // 檢查里程碑獎勵
      checkMilestones();
    } else {
      // 中斷了，重置連續天數
      achievementData.currentStreak = 1;
      achievementData.lastRecordDate = today;

      // 重置里程碑
      achievementData.milestones = {
        streak7: false,
        streak14: false,
        streak21: false,
        streak30: false
      };
    }
  }

  // 更新最長連續天數
  if (achievementData.currentStreak > achievementData.longestStreak) {
    achievementData.longestStreak = achievementData.currentStreak;
  }
}

// 檢查里程碑獎勵
function checkMilestones() {
  const streak = achievementData.currentStreak;

  if (streak === 7 && !achievementData.milestones.streak7) {
    achievementData.milestones.streak7 = true;
    achievementData.totalPoints += 10;
    showMilestoneNotification('🎉 連續記帳 7 天！獲得 10 積分獎勵！');
  } else if (streak === 14 && !achievementData.milestones.streak14) {
    achievementData.milestones.streak14 = true;
    achievementData.totalPoints += 20;
    showMilestoneNotification('🎊 連續記帳 14 天！獲得 20 積分獎勵！');
  } else if (streak === 21 && !achievementData.milestones.streak21) {
    achievementData.milestones.streak21 = true;
    achievementData.totalPoints += 30;
    showMilestoneNotification('🌟 連續記帳 21 天！獲得 30 積分獎勵！');
  } else if (streak === 30 && !achievementData.milestones.streak30) {
    achievementData.milestones.streak30 = true;
    achievementData.totalPoints += 50;
    showMilestoneNotification('🚀 連續記帳 30 天！火箭發射！獲得 50 積分獎勵！');
  }
}

// 顯示里程碑通知
function showMilestoneNotification(message) {
  // 簡單的 alert，可以之後改成更好看的通知
  setTimeout(() => {
    alert(message);
  }, 300);
}

// 添加記帳積分
function addRecordPoints() {
  achievementData.totalPoints += 1;
  achievementData.totalRecords += 1;
}

// 保存成就資料
function saveAchievementData() {
  localStorage.setItem('achievementData', JSON.stringify(achievementData));
}

// 更新成就系統（在新增記帳時調用）
function updateAchievements() {
  checkAndUpdateStreak();
  addRecordPoints();
  saveAchievementData();
  updateAchievementDisplay();
}


// 分類定義
// 預設類別（不可刪除）
const DEFAULT_CATEGORIES = {
  expense: ['食物', '交通', '娛樂', '購物', '醫療', '教育', '其他'],
  income: ['薪資', '獎金', '投資', '兼職', '其他']
};

// 自定義類別（可新增/刪除）
let customCategories = JSON.parse(localStorage.getItem('customCategories')) || {
  expense: [],
  income: []
};

// 合併後的完整類別列表
let CATEGORIES = {
  expense: [...DEFAULT_CATEGORIES.expense, ...customCategories.expense],
  income: [...DEFAULT_CATEGORIES.income, ...customCategories.income],
  transfer: ['轉帳']
};

// 帳戶類型
const ACCOUNT_TYPES = {
  cash: '現金',
  bank: '銀行帳戶',
  credit: '信用卡'
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  render();
  initCharts();
  initAchievements();

  // 監聽視窗大小改變，更新側邊欄按鈕狀態
  window.addEventListener('resize', () => {
    const openBtn = document.getElementById('sidebar-open-btn');
    const sidebar = document.getElementById('sidebar');

    if (openBtn && sidebar) {
      if (window.innerWidth <= 768) {
        // 手機版：始終顯示按鈕
        openBtn.classList.add('show');
      } else {
        // 桌面版：根據側邊欄狀態顯示/隱藏
        if (sidebar.classList.contains('collapsed')) {
          openBtn.classList.add('show');
        } else {
          openBtn.classList.remove('show');
        }
      }
    }
  });
});

// ========== 主題切換 ==========
function initTheme() {
  document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
  theme = theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);

  // 重新渲染圖表以適應新主題
  if (window.myPieChart) window.myPieChart.destroy();
  if (window.myLineChart) window.myLineChart.destroy();
  initCharts();
}

// ========== 帳戶管理 ==========
function renderSidebarAccounts() {
  const selector = document.getElementById('account-selector');
  if (!selector) return;

  selector.innerHTML = '';
  accounts.forEach(acc => {
    const option = document.createElement('option');
    option.value = acc.id;
    option.textContent = `${acc.name} (${ACCOUNT_TYPES[acc.type]})`;
    if (acc.id === currentAccount) option.selected = true;
    selector.appendChild(option);
  });
}

function switchAccount() {
  currentAccount = document.getElementById('account-selector').value;
  localStorage.setItem('currentAccount', currentAccount);
  render();
}

function showAccountManager() {
  const modal = document.getElementById('account-modal');
  if (modal) {
    modal.classList.remove('hidden');
    renderAccountList();
  }
}

function closeAccountManager() {
  const modal = document.getElementById('account-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function renderAccountList() {
  const list = document.getElementById('account-list');
  if (!list) return;

  list.innerHTML = '';
  accounts.forEach(acc => {
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center border-b py-3 px-2 list-item-hover';

    const balance = calculateAccountBalance(acc.id);

    li.innerHTML = `
      <div class="flex-1">
        <div class="font-medium">${acc.name}</div>
        <div class="text-sm text-gray-500">${ACCOUNT_TYPES[acc.type]}</div>
      </div>
      <div class="flex items-center gap-3">
        <span class="font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}">$${balance.toFixed(0)}</span>
        ${acc.id !== 'default' ? `<button onclick="deleteAccount('${acc.id}')" class="text-red-400 hover:text-red-600">✕</button>` : ''}
      </div>
    `;

    list.appendChild(li);
  });
}

function calculateAccountBalance(accountId) {
  const accountTransactions = transactions.filter(t => t.account === accountId);
  const income = accountTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = accountTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const transferIn = transactions.filter(t => t.type === 'transfer' && t.toAccount === accountId).reduce((sum, t) => sum + t.amount, 0);
  const transferOut = transactions.filter(t => t.type === 'transfer' && t.account === accountId).reduce((sum, t) => sum + t.amount, 0);

  return income - expense + transferIn - transferOut;
}

function addAccount() {
  const name = document.getElementById('new-account-name').value.trim();
  const type = document.getElementById('new-account-type').value;

  if (!name) {
    alert('請輸入帳戶名稱！');
    return;
  }

  const newAccount = {
    id: 'acc_' + Date.now(),
    name,
    type,
    balance: 0
  };

  accounts.push(newAccount);
  localStorage.setItem('accounts', JSON.stringify(accounts));

  document.getElementById('new-account-name').value = '';
  renderAccountList();
  renderSidebarAccounts();
}

function deleteAccount(accountId) {
  if (confirm('確定要刪除這個帳戶嗎？相關交易記錄將保留但無法再篩選。')) {
    accounts = accounts.filter(a => a.id !== accountId);
    localStorage.setItem('accounts', JSON.stringify(accounts));

    if (currentAccount === accountId) {
      currentAccount = 'default';
      localStorage.setItem('currentAccount', currentAccount);
    }

    renderAccountList();
    renderSidebarAccounts();
    render();
  }
}

// ========== 記帳功能 ==========
function addTransaction() {
  const name = document.getElementById('transaction-name').value.trim();
  const amount = parseFloat(document.getElementById('transaction-amount').value);
  const type = document.getElementById('transaction-type').value;
  const category = document.getElementById('transaction-category').value;
  const date = document.getElementById('transaction-date').value;

  if (!name || !amount || amount <= 0) {
    alert('請填寫完整的項目名稱和金額！');
    return;
  }

  const transaction = {
    id: Date.now(),
    name,
    amount,
    type,
    category,
    date: date || new Date().toISOString().split('T')[0],
    account: currentAccount
  };

  transactions.push(transaction);

  // 清空輸入
  document.getElementById('transaction-name').value = '';
  document.getElementById('transaction-amount').value = '';
  document.getElementById('transaction-date').value = '';
  // 更新成就系統
  updateAchievements();

  saveAndRender();
}

function addTransfer() {
  const amount = parseFloat(document.getElementById('transfer-amount').value);
  const fromAccount = document.getElementById('transfer-from').value;
  const toAccount = document.getElementById('transfer-to').value;
  const date = document.getElementById('transfer-date').value;
  const note = document.getElementById('transfer-note').value.trim() || '轉帳';

  if (!amount || amount <= 0) {
    alert('請輸入轉帳金額！');
    return;
  }

  if (fromAccount === toAccount) {
    alert('來源帳戶和目標帳戶不能相同！');
    return;
  }

  const transfer = {
    id: Date.now(),
    name: note,
    amount,
    type: 'transfer',
    category: '轉帳',
    date: date || new Date().toISOString().split('T')[0],
    account: fromAccount,
    toAccount: toAccount
  };

  transactions.push(transfer);

  // 清空輸入
  document.getElementById('transfer-amount').value = '';
  document.getElementById('transfer-note').value = '';

  closeTransferModal();
  saveAndRender();
}

function showTransferModal() {
  const modal = document.getElementById('transfer-modal');
  if (modal) {
    modal.classList.remove('hidden');

    // 更新帳戶選項
    const fromSelect = document.getElementById('transfer-from');
    const toSelect = document.getElementById('transfer-to');

    [fromSelect, toSelect].forEach(select => {
      select.innerHTML = '';
      accounts.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.id;
        option.textContent = acc.name;
        select.appendChild(option);
      });
    });

    fromSelect.value = currentAccount;
  }
}

function closeTransferModal() {
  const modal = document.getElementById('transfer-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function deleteTransaction(id) {
  if (confirm('確定要刪除這筆記錄嗎？')) {
    transactions = transactions.filter(t => t.id !== id);
    saveAndRender();
  }
}

function updateCategories() {
  const type = document.getElementById('transaction-type').value;
  const categorySelect = document.getElementById('transaction-category');
  categorySelect.innerHTML = '';

  CATEGORIES[type].forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

function filterTransactions() {
  const startDate = document.getElementById('filter-start').value;
  const endDate = document.getElementById('filter-end').value;

  if (!startDate || !endDate) {
    renderTransactions(getAccountTransactions());
    return;
  }

  const filtered = getAccountTransactions().filter(t => {
    return t.date >= startDate && t.date <= endDate;
  });

  renderTransactions(filtered);
  updateStats(filtered);
}

function clearFilter() {
  document.getElementById('filter-start').value = '';
  document.getElementById('filter-end').value = '';
  renderTransactions(getAccountTransactions());
  updateStats(getAccountTransactions());
}

function getAccountTransactions() {
  // 如果是主頁面視圖,返回所有交易
  if (currentView === 'home') {
    return transactions;
  }

  // 否則返回當前帳戶的交易
  return transactions.filter(t =>
    t.account === currentAccount ||
    (t.type === 'transfer' && t.toAccount === currentAccount)
  );
}

// ========== 待辦功能 ==========
function addTodo() {
  const text = document.getElementById('todo-input').value.trim();
  const priority = document.getElementById('todo-priority').value;
  const dueDate = document.getElementById('todo-due-date').value;

  if (!text) {
    alert('請輸入任務內容！');
    return;
  }

  const todo = {
    id: Date.now(),
    text,
    done: false,
    priority,
    dueDate: dueDate || null,
    createdAt: new Date().toISOString()
  };

  todos.push(todo);

  // 清空輸入
  document.getElementById('todo-input').value = '';
  document.getElementById('todo-due-date').value = '';

  saveAndRender();
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    saveAndRender();
  }
}

function deleteTodo(id) {
  if (confirm('確定要刪除這個任務嗎？')) {
    todos = todos.filter(t => t.id !== id);
    saveAndRender();
  }
}

function sortTodos() {
  const sortBy = document.getElementById('todo-sort').value;

  switch (sortBy) {
    case 'priority':
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      todos.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      break;
    case 'dueDate':
      todos.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
      break;
    case 'created':
      todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
  }

  renderTodos();
}

// ========== 數據匯入/匯出 ==========
function exportData() {
  const data = {
    transactions,
    todos,
    accounts,
    exportDate: new Date().toISOString()
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `生活助手數據_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportCSV() {
  let csv = '類型,項目,金額,分類,日期,帳戶\n';
  transactions.forEach(t => {
    const accountName = accounts.find(a => a.id === t.account)?.name || '未知';
    const typeText = t.type === 'income' ? '收入' : t.type === 'expense' ? '支出' : '轉帳';
    csv += `${typeText},${t.name},${t.amount},${t.category},${t.date},${accountName}\n`;
  });

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `記帳數據_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (confirm('匯入數據將覆蓋現有數據，確定要繼續嗎？')) {
          transactions = data.transactions || [];
          todos = data.todos || [];
          accounts = data.accounts || accounts;
          saveAndRender();
          renderSidebarAccounts();
          alert('數據匯入成功！');
        }
      } catch (error) {
        alert('檔案格式錯誤！');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ========== 渲染函數 ==========
function renderTransactions(data = getAccountTransactions()) {
  const list = document.getElementById('transaction-list');
  list.innerHTML = '';

  if (data.length === 0) {
    list.innerHTML = '<li class="text-center text-gray-500 py-4">尚無記錄</li>';
    return;
  }

  // 按日期排序（最新的在前）
  const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));

  sorted.forEach(t => {
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center border-b py-3 px-2 list-item-hover transition fade-in';

    let typeColor, typeSymbol, displayText;

    if (t.type === 'transfer') {
      if (t.account === currentAccount) {
        typeColor = 'text-orange-600';
        typeSymbol = '→';
        const toAcc = accounts.find(a => a.id === t.toAccount);
        displayText = `轉出至 ${toAcc?.name || '未知帳戶'}`;
      } else {
        typeColor = 'text-blue-600';
        typeSymbol = '←';
        const fromAcc = accounts.find(a => a.id === t.account);
        displayText = `從 ${fromAcc?.name || '未知帳戶'} 轉入`;
      }
    } else {
      typeColor = t.type === 'income' ? 'text-green-600' : 'text-red-600';
      typeSymbol = t.type === 'income' ? '+' : '-';
      displayText = t.name;
    }

    li.innerHTML = `
      <div class="flex-1">
        <div class="font-medium">${displayText}</div>
        <div class="text-sm text-gray-500">${t.category} • ${t.date}</div>
      </div>
      <div class="flex items-center gap-3">
        <span class="${typeColor} font-semibold">${typeSymbol}$${t.amount}</span>
        <button onclick="deleteTransaction(${t.id})" class="text-red-400 hover:text-red-600">✕</button>
      </div>
    `;

    list.appendChild(li);
  });
}

function renderTodos() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';

  if (todos.length === 0) {
    list.innerHTML = '<li class="text-center text-gray-500 py-4">尚無任務</li>';
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  todos.forEach(todo => {
    const li = document.createElement('li');
    const isOverdue = todo.dueDate && todo.dueDate < today && !todo.done;

    li.className = `flex items-center gap-3 border-b py-3 px-2 priority-${todo.priority} ${isOverdue ? 'overdue' : ''} list-item-hover transition fade-in`;

    const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' };
    const dueDateText = todo.dueDate ? `📅 ${todo.dueDate}` : '';

    li.innerHTML = `
      <input type="checkbox" ${todo.done ? 'checked' : ''} onchange="toggleTodo(${todo.id})" class="w-5 h-5 cursor-pointer">
      <div class="flex-1">
        <div class="${todo.done ? 'line-through text-gray-400 dark:text-gray-500' : ''}">${priorityEmoji[todo.priority]} ${todo.text}</div>
        ${dueDateText ? `<div class="text-sm text-gray-500 dark:text-gray-400 mt-1">${dueDateText}${isOverdue ? ' ⚠️ 已過期' : ''}</div>` : ''}
      </div>
      <button onclick="deleteTodo(${todo.id})" class="text-red-400 hover:text-red-600">✕</button>
    `;

    list.appendChild(li);
  });
}

function updateStats(data = getAccountTransactions()) {
  const income = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // 計算轉帳
  const transferIn = transactions.filter(t => t.type === 'transfer' && t.toAccount === currentAccount).reduce((sum, t) => sum + t.amount, 0);
  const transferOut = transactions.filter(t => t.type === 'transfer' && t.account === currentAccount).reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expense + transferIn - transferOut;

  document.getElementById('total-income').textContent = `$${income.toFixed(0)}`;
  document.getElementById('total-expense').textContent = `$${expense.toFixed(0)}`;
  document.getElementById('balance').textContent = `$${balance.toFixed(0)}`;
  document.getElementById('balance').className = balance >= 0 ? 'stat-value text-3xl font-bold text-green-600 mt-2' : 'stat-value text-3xl font-bold text-red-600 mt-2';
}

// ========== 圖表功能 ==========
function initCharts() {
  createExpensePieChart();
  createIncomePieChart();
  createLineChart();
}

function createExpensePieChart() {
  const ctx = document.getElementById('expensePieChart');
  if (!ctx) return;

  const accountData = getAccountTransactions();
  const expenseData = {};
  accountData.filter(t => t.type === 'expense').forEach(t => {
    expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
  });

  if (Object.keys(expenseData).length === 0) {
    // 沒有數據時銷毀現有圖表
    if (window.myExpensePieChart) {
      window.myExpensePieChart.destroy();
      window.myExpensePieChart = null;
    }
    return;
  }

  const isDark = theme === 'dark';
  const textColor = isDark ? '#f9fafb' : '#1f2937';

  if (window.myExpensePieChart) window.myExpensePieChart.destroy();

  window.myExpensePieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(expenseData),
      datasets: [{
        data: Object.values(expenseData),
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#14b8a6', '#f97316', '#84cc16'],
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor }
        },
        title: {
          display: true,
          text: '支出分類統計',
          color: textColor
        }
      }
    }
  });
}

function createIncomePieChart() {
  const ctx = document.getElementById('incomePieChart');
  if (!ctx) return;

  const accountData = getAccountTransactions();
  const incomeData = {};
  accountData.filter(t => t.type === 'income').forEach(t => {
    incomeData[t.category] = (incomeData[t.category] || 0) + t.amount;
  });

  if (Object.keys(incomeData).length === 0) {
    // 沒有數據時銷毀現有圖表
    if (window.myIncomePieChart) {
      window.myIncomePieChart.destroy();
      window.myIncomePieChart = null;
    }
    return;
  }

  const isDark = theme === 'dark';
  const textColor = isDark ? '#f9fafb' : '#1f2937';

  if (window.myIncomePieChart) window.myIncomePieChart.destroy();

  window.myIncomePieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(incomeData),
      datasets: [{
        data: Object.values(incomeData),
        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6', '#f97316', '#84cc16', '#6b7280', '#ef4444'],
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor }
        },
        title: {
          display: true,
          text: '收入分類統計',
          color: textColor
        }
      }
    }
  });
}

function createLineChart() {
  const ctx = document.getElementById('lineChart');
  if (!ctx) return;

  const accountData = getAccountTransactions();

  // 按日期分組
  const dailyData = {};
  accountData.forEach(t => {
    if (!dailyData[t.date]) {
      dailyData[t.date] = { income: 0, expense: 0 };
    }
    if (t.type === 'income') {
      dailyData[t.date].income += t.amount;
    } else if (t.type === 'expense') {
      dailyData[t.date].expense += t.amount;
    }
  });

  const dates = Object.keys(dailyData).sort();

  if (dates.length === 0) {
    // 沒有數據時銷毀現有圖表
    if (window.myLineChart) {
      window.myLineChart.destroy();
      window.myLineChart = null;
    }
    return;
  }

  const incomeData = dates.map(d => dailyData[d].income);
  const expenseData = dates.map(d => dailyData[d].expense);

  const isDark = theme === 'dark';
  const textColor = isDark ? '#f9fafb' : '#1f2937';
  const gridColor = isDark ? '#4b5563' : '#e5e7eb';

  if (window.myLineChart) window.myLineChart.destroy();

  window.myLineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: '收入',
          data: incomeData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        },
        {
          label: '支出',
          data: expenseData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor }
        },
        title: {
          display: true,
          text: '收支趨勢',
          color: textColor
        }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        },
        y: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        }
      }
    }
  });
}

// ========== 保存與渲染 ==========
function saveAndRender() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('todos', JSON.stringify(todos));
  localStorage.setItem('accounts', JSON.stringify(accounts));
  render();
}

function render() {
  renderTransactions();
  renderTodos();
  updateStats();

  // 更新圖表
  if (window.myPieChart) window.myPieChart.destroy();
  if (window.myLineChart) window.myLineChart.destroy();
  initCharts();
}

// ========== 側邊欄功能 ==========

// 初始化側邊欄
function initSidebar() {
  renderSidebarAccounts();
  updateSidebarState();

  // 根據 currentView 設置初始狀態
  if (currentView !== 'home') {
    const todoSection = document.getElementById('todo-section');
    if (todoSection) {
      todoSection.style.display = 'none';
    }
  }

  // 在手機版確保側邊欄展開按鈕可見
  const openBtn = document.getElementById('sidebar-open-btn');
  if (openBtn && window.innerWidth <= 768) {
    openBtn.classList.add('show');
  }
}

// 渲染側邊欄帳戶列表
function renderSidebarAccounts() {
  const container = document.getElementById('sidebar-accounts');
  if (!container) return;

  container.innerHTML = accounts.map(account => {
    const balance = account.balance || 0;
    const balanceClass = balance >= 0 ? 'positive' : 'negative';
    const isActive = currentView === account.id;

    return `
            <button class="sidebar-item ${isActive ? 'active' : ''}" 
                    onclick="switchToAccount('${account.id}')">
                <span class="sidebar-icon">${getAccountIcon(account.type)}</span>
                <div style="flex: 1;">
                    <div class="sidebar-name">${account.name}</div>
                    <div class="sidebar-balance ${balanceClass}">$${balance.toFixed(2)}</div>
                </div>
            </button>
        `;
  }).join('');
}

// 切換到主頁面
function switchToHome() {
  currentView = 'home';
  localStorage.setItem('currentView', currentView);

  const todoSection = document.getElementById('todo-section');
  if (todoSection) {
    todoSection.style.display = 'block';
  }

  updateSidebarState();
  render();

  // 手機版自動關閉側邊欄
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
}

// 切換到帳戶視圖
function switchToAccount(accountId) {
  currentView = accountId;
  currentAccount = accountId;
  localStorage.setItem('currentView', currentView);
  localStorage.setItem('currentAccount', currentAccount);

  const todoSection = document.getElementById('todo-section');
  if (todoSection) {
    todoSection.style.display = 'none';
  }

  updateSidebarState();
  render();

  // 手機版自動關閉側邊欄
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
}

// 更新側邊欄狀態
function updateSidebarState() {
  // 更新主頁面按鈕狀態
  const homeBtn = document.querySelector('.sidebar-home');
  if (homeBtn) {
    if (currentView === 'home') {
      homeBtn.classList.add('active');
    } else {
      homeBtn.classList.remove('active');
    }
  }

  // 重新渲染帳戶列表
  renderSidebarAccounts();
}

// 側邊欄展開/收合
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  const overlay = document.getElementById('sidebar-overlay');
  const openBtn = document.getElementById('sidebar-open-btn');

  if (!sidebar || !mainContent) return;

  if (window.innerWidth <= 768) {
    // 手機版
    sidebar.classList.toggle('open');
    if (overlay) {
      overlay.classList.toggle('active');
    }
    // 手機版展開按鈕始終顯示（由 CSS 控制）
  } else {
    // 桌面版
    const isCollapsed = sidebar.classList.contains('collapsed');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('sidebar-collapsed');
    sidebarOpen = !sidebar.classList.contains('collapsed');

    // 控制展開按鈕的顯示
    if (openBtn) {
      if (sidebar.classList.contains('collapsed')) {
        // 側邊欄已收合，顯示展開按鈕
        openBtn.classList.add('show');
      } else {
        // 側邊欄已展開，隱藏展開按鈕
        openBtn.classList.remove('show');
      }
    }
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (sidebar) {
    sidebar.classList.remove('open');
  }
  if (overlay) {
    overlay.classList.remove('active');
  }
}

// 取得帳戶圖示
function getAccountIcon(type) {
  const icons = {
    cash: '💰',
    bank: '🏦',
    credit: '💳'
  };
  return icons[type] || '💰';
}


// ========== 類別管理功能 ==========

let currentCategoryTab = 'expense';

// 顯示類別管理器
function showCategoryManager() {
  document.getElementById('category-modal').classList.remove('hidden');
  switchCategoryTab('expense');
}

function closeCategoryManager() {
  document.getElementById('category-modal').classList.add('hidden');
}

// 切換分頁
function switchCategoryTab(type) {
  currentCategoryTab = type;

  // 更新分頁樣式
  const expenseTab = document.getElementById('tab-expense');
  const incomeTab = document.getElementById('tab-income');

  if (type === 'expense') {
    expenseTab.className = 'px-4 py-2 font-semibold border-b-2 border-blue-500 text-blue-600 dark:text-blue-400';
    incomeTab.className = 'px-4 py-2 font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300';
  } else {
    expenseTab.className = 'px-4 py-2 font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300';
    incomeTab.className = 'px-4 py-2 font-semibold border-b-2 border-blue-500 text-blue-600 dark:text-blue-400';
  }

  // 渲染類別列表
  renderCategoryList();
}

// 渲染類別列表
function renderCategoryList() {
  const container = document.getElementById('category-list');
  if (!container) return;

  const type = currentCategoryTab;
  const defaultCats = DEFAULT_CATEGORIES[type] || [];
  const customCats = customCategories[type] || [];

  container.innerHTML = [
    ...defaultCats.map(cat => `
            <span class="category-tag default">
                ${cat}
                <span class="category-badge">預設</span>
            </span>
        `),
    ...customCats.map(cat => `
            <span class="category-tag custom">
                ${cat}
                <button onclick="deleteCustomCategory('${cat}')" class="category-delete">×</button>
            </span>
        `)
  ].join('');
}

// 新增類別
function addCustomCategory() {
  const input = document.getElementById('new-category-name');
  const name = input.value.trim();
  const type = currentCategoryTab;

  if (!name) {
    alert('請輸入類別名稱！');
    return;
  }

  // 檢查是否已存在
  if (CATEGORIES[type].includes(name)) {
    alert('此類別已存在！');
    return;
  }

  // 新增到自定義類別
  customCategories[type].push(name);
  CATEGORIES[type].push(name);

  // 儲存並更新
  localStorage.setItem('customCategories', JSON.stringify(customCategories));
  input.value = '';
  renderCategoryList();
  updateCategories(); // 更新下拉選單
}

// 刪除類別
function deleteCustomCategory(name) {
  const type = currentCategoryTab;

  // 檢查是否有交易使用此類別
  const hasTransactions = transactions.some(t =>
    t.type === type && t.category === name
  );

  if (hasTransactions) {
    if (!confirm(`有交易記錄使用「${name}」類別，確定要刪除嗎？刪除後這些記錄的類別將變為「其他」。`)) {
      return;
    }

    // 將使用此類別的交易改為「其他」
    transactions.forEach(t => {
      if (t.type === type && t.category === name) {
        t.category = '其他';
      }
    });
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }

  // 從自定義類別中移除
  customCategories[type] = customCategories[type].filter(c => c !== name);
  CATEGORIES[type] = CATEGORIES[type].filter(c => c !== name);

  // 儲存並更新
  localStorage.setItem('customCategories', JSON.stringify(customCategories));
  renderCategoryList();
  updateCategories();
  render();
}

