// -------------------- Shared Helpers --------------------
function getTransactions() {
  return JSON.parse(localStorage.getItem("transactions")) || [];
}

function saveTransactions(transactions) {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// -------------------- Home Page --------------------
function initHome() {
  if (!document.getElementById("income-description")) return;

  let transactions = getTransactions();
  let balance = 0;
  let expenseData = { food: 0, transport: 0, entertainment: 0, utilities: 0 };

  function calculateBalance() {
    balance = 0;
    transactions.forEach(t => {
      balance += (t.type === "income" ? t.amount : -t.amount);
    });
    const balanceElement = document.getElementById("balance");
    balanceElement.textContent = "R" + balance.toFixed(2);
    balanceElement.classList.toggle("negative", balance < 0);
  }

  function displayTransactions() {
    let list = document.getElementById("transactionList");
    list.innerHTML = "";
    transactions.forEach(t => {
      let row = document.createElement("tr");
      row.innerHTML = `
        <td>${t.date}</td>
        <td>${t.description}</td>
        <td>${t.category || "-"}</td>
        <td>${t.type === "income" ? "+" : "-"} R${t.amount.toFixed(2)}</td>
      `;
      list.appendChild(row);
    });
  }

  function calculateExpenses() {
    expenseData = { food: 0, transport: 0, entertainment: 0, utilities: 0 };
    transactions.forEach(t => {
      if (t.type === "expense") expenseData[t.category] += t.amount;
    });
  }

  const ctx = document.getElementById("expenseChart")?.getContext("2d");
  let expenseChart = ctx && new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Food", "Transport", "Entertainment", "Utilities"],
      datasets: [{ data: [0, 0, 0, 0], backgroundColor: ["#4CAF50", "#FF9800", "#2196F3", "#9C27B0"] }]
    }
  });

  function updateChart() {
    if (!expenseChart) return;
    expenseChart.data.datasets[0].data = [
      expenseData.food, expenseData.transport, expenseData.entertainment, expenseData.utilities
    ];
    expenseChart.update();
  }

  window.addIncome = function() {
    console.log("income button clicked");
    let description = document.getElementById("income-description").value;
    let amount = parseFloat(document.getElementById("income-amount").value);
    if (description && amount > 0) {
      transactions.push({ type: "income", description, amount, date: new Date().toLocaleDateString() });
      saveTransactions(transactions);
      displayTransactions(); calculateBalance();
      document.getElementById("income-description").value = "";
      document.getElementById("income-amount").value = "";
    }
  };

  window.addExpense = function() {
    let description = document.getElementById("expense-description").value;
    let amount = parseFloat(document.getElementById("expense-amount").value);
    let category = document.getElementById("expense-category").value;
    if (description && amount > 0) {
      transactions.push({ type: "expense", description, amount, category, date: new Date().toLocaleDateString() });
      saveTransactions(transactions);
      displayTransactions(); calculateBalance(); calculateExpenses(); updateChart();
      document.getElementById("expense-description").value = "";
      document.getElementById("expense-amount").value = "";
    }
  };

  calculateBalance(); displayTransactions(); calculateExpenses(); updateChart();
}

// -------------------- Transactions Page --------------------
function initTransactions() {
  if (!document.getElementById("transactionList")) return;
  let transactions = getTransactions();

  function render(listData) {
    let list = document.getElementById("transactionList");
    list.innerHTML = "";
    listData.forEach(t => {
      let row = document.createElement("tr");
      row.innerHTML = `
        <td>${t.date}</td>
        <td>${t.description}</td>
        <td>${t.category || "-"}</td>
        <td>${t.type}</td>
        <td>${t.type === "income" ? "+" : "-"} R${t.amount.toFixed(2)}</td>
      `;
      list.appendChild(row);
    });
  }

  window.filterTransactions = function(type) {
    render(transactions.filter(t => t.type === type));
  };

  render(transactions);
}

// -------------------- Reports Page --------------------
function initReports() {
  if (!document.getElementById("monthlyChart")) return;
  let transactions = getTransactions();

  let totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  let totalExpenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  let savings = totalIncome - totalExpenses;

  document.getElementById("totalIncome").textContent = "R" + totalIncome.toFixed(2);
  document.getElementById("totalExpenses").textContent = "R" + totalExpenses.toFixed(2);
  document.getElementById("savings").textContent = "R" + savings.toFixed(2);

  let categories = {};
  transactions.forEach(t => { if (t.type === "expense") categories[t.category] = (categories[t.category] || 0) + t.amount; });

  new Chart(document.getElementById("categoryChart"), {
    type: "pie",
    data: { labels: Object.keys(categories), datasets: [{ data: Object.values(categories), backgroundColor: ["#4CAF50","#FF9800","#2196F3","#9C27B0"] }] }
  });

  let months = {};
  transactions.forEach(t => { if (t.type === "expense") {
    let month = new Date(t.date).toLocaleString("default", { month: "short", year: "numeric" });
    months[month] = (months[month] || 0) + t.amount;
  }});
  new Chart(document.getElementById("monthlyChart"), {
    type: "bar",
    data: { labels: Object.keys(months), datasets: [{ label: "Monthly Expenses", data: Object.values(months), backgroundColor: "#FF9800" }] }
  });

  window.exportCSV = function() {
    let csvContent = "data:text/csv;charset=utf-8,Date,Description,Category,Type,Amount\n";
    transactions.forEach(t => { csvContent += `${t.date},${t.description},${t.category || "-"},${t.type},${t.amount}\n`; });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
  };
}

// -------------------- Settings Page --------------------
function initSettings() {
  if (!document.getElementById("currency")) return;

  function applyTheme(theme) {
    document.body.classList.toggle("dark-mode", theme === "dark");
  }

  function loadSettings() {
    const currency = localStorage.getItem("currency") || "R";
    const theme = localStorage.getItem("theme") || "light";
    document.getElementById("currency").value = currency;
    document.getElementById("theme").value = theme;
    applyTheme(theme);
  }

  window.saveSettings = function() {
    const currency = document.getElementById("currency").value;
    const theme = document.getElementById("theme").value;
    localStorage.setItem("currency", currency);
    localStorage.setItem("theme", theme);
    applyTheme(theme);
    alert("Settings saved!");
  };

  window.saveBudgetGoal = function() {
    const goal = document.getElementById("budgetGoal").value;
    localStorage.setItem("budgetGoal", goal);
    alert("Budget goal saved!");
  };

  window.toggleTheme = function() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
  };

  loadSettings();
}

// -------------------- Dashboard Page --------------------
function initDashboard() {
  if (!document.getElementById("balanceChart")) return;
  let transactions = getTransactions();

  let income = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  let expenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  let balance = income - expenses;

  document.getElementById("balance").textContent = "R" + balance.toFixed(2);
  document.getElementById("totalIncome").textContent = "R" + income.toFixed(2);
  document.getElementById("totalExpenses").textContent = "R" + expenses.toFixed(2);

  // Last 5 transactions
  let list = document.getElementById("transactionList");
  list.innerHTML = "";
  transactions.slice(-5).reverse().forEach(t => {
    let row = document.createElement("tr");
    row.innerHTML = `
      <td>${t.date}</td>
      <td>${t.description}</td>
      <td>${t.category || "-"}</td>
      <td>${t.type}</td>
      <td>${t.type === "income" ? "+" : "-"} R${t.amount.toFixed(2)}</td>
    `;
    list.appendChild(row);
  });

  // Expense chart
  let categories = {};
  transactions.forEach(t => {
    if (t.type === "expense") {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    }
  });
  const expenseChartEl = document.getElementById("expenseChart");
  if (expenseChartEl) {
    new Chart(expenseChartEl, {
      type: "pie",
      data: {
        labels: Object.keys(categories),
        datasets: [{ data: Object.values(categories), backgroundColor: ["#4CAF50","#FF9800","#2196F3","#9C27B0"] }]
      }
    });
  }

  // Balance over time chart
  const balanceChartEl = document.getElementById("balanceChart");
  if (balanceChartEl) {
    let runningBalance = 0;
    let balances = transactions.map(t => {
      runningBalance += (t.type === "income" ? t.amount : -t.amount);
      return runningBalance;
    });
    new Chart(balanceChartEl, {
      type: "line",
      data: {
        labels: transactions.map(t => t.date),
        datasets: [{ label: "Balance", data: balances, borderColor: "#2196F3", fill: false }]
      }
    });
  }
}

// -------------------- Initialize Pages --------------------
document.addEventListener("DOMContentLoaded", () => {
  initHome();
  initTransactions();
  initReports();
  initSettings();
  initDashboard();
});

// Inside displayTransactions() and initTransactions(), update row.innerHTML to:
row.innerHTML = `
  <td data-label="Date">${t.date}</td>
  <td data-label="Description">${t.description}</td>
  <td data-label="Category">${t.category || "-"}</td>
  <td data-label="Type">${t.type}</td>
  <td data-label="Amount">${t.type === "income" ? "+" : "-"} R${t.amount.toFixed(2)}</td>
`;

document.querySelectorAll("nav a").forEach(link => {
  link.addEventListener("click", () => {
    // Remove active from all links
    document.querySelectorAll("nav a").forEach(l => l.classList.remove("active"));
    link.classList.add("active");

    // Close menu on mobile
    const navMenu = document.getElementById("nav-menu");
    if (navMenu.classList.contains("show")) {
      navMenu.classList.remove("show");
    }
  });
});


function toggleMenu() {
  const navMenu = document.getElementById("nav-menu");
  navMenu.classList.toggle("show");
}

// Optional: Close menu when a link is clicked
document.querySelectorAll("#nav-menu a").forEach(link => {
  link.addEventListener("click", () => {
    document.getElementById("nav-menu").classList.remove("show");
  });
});

const currentPage = location.pathname.split("/").pop();
document.querySelectorAll("#nav-menu a").forEach(link => {
  if (link.getAttribute("href") === currentPage) {
    link.classList.add("active");
  }
});
document.addEventListener("DOMContentLoaded", () => {
  // toggleMenu code
});

 function toggleTheme() {
            document.body.classList.toggle("dark-mode");
            localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
        }

        // Load saved theme
const savedTheme = localStorage.getItem("theme") || "light";
if(savedTheme === "dark") document.body.classList.add("dark-mode");


function toggleMenu() {
            const navMenu = document.getElementById("nav-menu");
            navMenu.classList.toggle("show");
}