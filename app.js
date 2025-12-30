// ========== 數據管理 ==========
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let accounts = JSON.parse(localStorage.getItem('accounts')) || [
  { id: 'default', name: '現金', type: 'cash', balance: 0 }
];
let currentAccount = localStorage.getItem('currentAccount') || 'default';
let theme = localStorage.getItem('theme') || 'light';

// 分類定義
const CATEGORIES = {
  expense: ['食物', '交通', '娛樂', '購物', '醫療', '教育', '居家', '寵物', '保險', '水電瓦斯', '綜合性', '電話網路', '貸款', '其他'],
  income: ['薪資', '獎金', '投資', '兼職', '教學鐘點費', '意外之喜', '人家轉帳的', '其他'],
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
  initAccountSelector();
  render();
  initCharts();
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
function initAccountSelector() {
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
  initAccountSelector();
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
    initAccountSelector();
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
          initAccountSelector();
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
  createPieChart();
  createLineChart();
}

function createPieChart() {
  const ctx = document.getElementById('pieChart');
  if (!ctx) return;

  const accountData = getAccountTransactions();
  const expenseData = {};
  accountData.filter(t => t.type === 'expense').forEach(t => {
    expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
  });

  if (Object.keys(expenseData).length === 0) {
    // 沒有數據時銷毀現有圖表
    if (window.myPieChart) {
      window.myPieChart.destroy();
      window.myPieChart = null;
    }
    return;
  }

  const isDark = theme === 'dark';
  const textColor = isDark ? '#f9fafb' : '#1f2937';

  if (window.myPieChart) window.myPieChart.destroy();

  window.myPieChart = new Chart(ctx, {
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
