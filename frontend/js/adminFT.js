const workers = {
  employees: 95,
  managers: 4,
  pending: 6,
  inactive: 10,
};

const total = Object.values(workers).reduce((sum, count) => sum + count, 0);

document.querySelectorAll(".bar").forEach((bar) => {
  const type = [...bar.classList].find((name) => workers[name] !== undefined);

  const percentage = total > 0 ? (workers[type] / total) * 100 : 0;

  bar.style.width = `${percentage}%`;
});

const accountList = document.getElementById("accounts-list");
const accountTemplate = document.getElementById("account-template");

const prevPage = document.getElementById("prev-page");
const nextPage = document.getElementById("next-page");
const pageIndicator = document.getElementById("page-indicator");

const accountsPerPage = 4;

let allAccounts = [];
let accountCurrentPage = 1;

function displayAccounts(accounts) {
  // Store all accounts
  allAccounts = accounts;

  // Reset to first page
  accountCurrentPage = 1;

  renderAccounts();
}

function renderAccounts() {
  // Calculate total pages
  const totalPages = Math.max(
    1,
    Math.ceil(allAccounts.length / accountsPerPage),
  );

  // Make sure current page is valid
  accountCurrentPage = Math.min(accountCurrentPage, totalPages);

  // Calculate which accounts to display
  const start = (accountCurrentPage - 1) * accountsPerPage;
  const end = start + accountsPerPage;

  const visibleAccounts = allAccounts.slice(start, end);

  // Clear previous accounts
  accountList.querySelectorAll(".account-row").forEach((row) => row.remove());

  // Display only the accounts for this page
  visibleAccounts.forEach((account) => {
    const clone = accountTemplate.content.cloneNode(true);

    const initials = clone.querySelector(".account-initials");
    const name = clone.querySelector(".account-name");
    const role = clone.querySelector(".account-role");
    const status = clone.querySelector(".account-status");

    initials.textContent = account.first_name[0] + account.last_name[0];

    name.textContent = account.first_name + " " + account.last_name;

    role.textContent = account.role;
    status.textContent = account.status || "Unknown";

    accountList.appendChild(clone);
  });

  // Update account count
  document.getElementById("account-count").textContent = allAccounts.length;

  // Update page indicator
  pageIndicator.textContent = `${accountCurrentPage} / ${totalPages}`;

  // Enable or disable buttons
  prevPage.disabled = accountCurrentPage === 1;
  nextPage.disabled = accountCurrentPage === totalPages;
}

// Previous page
prevPage.addEventListener("click", () => {
  if (accountCurrentPage > 1) {
    accountCurrentPage--;
    renderAccounts();
  }
});

// Next page
nextPage.addEventListener("click", () => {
  const totalPages = Math.ceil(allAccounts.length / accountsPerPage);

  if (accountCurrentPage < totalPages) {
    accountCurrentPage++;
    renderAccounts();
  }
});

// Fetch accounts from database
async function loadAccounts() {
  try {
    const response = await fetch("/api/users");

    if (!response.ok) {
      throw new Error("Failed to load accounts.");
    }

    const accounts = await response.json();

    displayAccounts(accounts);
  } catch (error) {
    console.error("Error loading accounts:", error);
  }
}

loadAccounts();
