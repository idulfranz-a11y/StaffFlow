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

// MANAGE ACCOUNTS

const accountList = document.getElementById("accounts-list");
const accountTemplate = document.getElementById("account-template");

const prevPage = document.getElementById("prev-page");
const nextPage = document.getElementById("next-page");
const pageIndicator = document.getElementById("page-indicator");

const searchInput = document.getElementById("accounts-search");
const accountCount = document.getElementById("account-count");

const allButton = document.getElementById("btn-all");
const adminButton = document.getElementById("btn-admin");
const managerButton = document.getElementById("btn-manager");
const employeeButton = document.getElementById("btn-employee");

const accountsPerPage = 4;

let allAccounts = [];
let filteredAccounts = [];
let accountCurrentPage = 1;
let currentRole = "all";

// DISPLAY ACCOUNTS

function displayAccounts(accounts) {
  allAccounts = accounts;
  filteredAccounts = [...allAccounts];

  accountCurrentPage = 1;

  renderAccounts();
}

// FILTER ACCOUNTS

function filterAccounts() {
  const searchValue = searchInput.value.toLowerCase().trim();

  filteredAccounts = allAccounts.filter((account) => {
    const fullName = `${account.first_name} ${account.last_name}`.toLowerCase();

    const matchesSearch = fullName.includes(searchValue);

    const matchesRole =
      currentRole === "all" || account.role.toLowerCase() === currentRole;

    return matchesSearch && matchesRole;
  });

  accountCurrentPage = 1;

  renderAccounts();
}

// UPDATE ACTIVE BUTTON

function updateActiveButton(activeButton) {
  [allButton, adminButton, managerButton, employeeButton].forEach((button) => {
    button.classList.remove("active");
  });

  activeButton.classList.add("active");
}

// RENDER ACCOUNTS

function renderAccounts() {
  // Calculate total pages
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAccounts.length / accountsPerPage),
  );

  // Make sure current page is valid
  accountCurrentPage = Math.min(accountCurrentPage, totalPages);

  // Calculate which accounts to display
  const start = (accountCurrentPage - 1) * accountsPerPage;
  const end = start + accountsPerPage;

  const visibleAccounts = filteredAccounts.slice(start, end);

  // Clear previous accounts
  accountList.querySelectorAll(".account-row").forEach((row) => {
    row.remove();
  });

  // Display accounts
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
  accountCount.textContent = filteredAccounts.length;

  // Update page indicator
  pageIndicator.textContent = `${accountCurrentPage} / ${totalPages}`;

  // Enable or disable pagination buttons
  prevPage.disabled = accountCurrentPage === 1;
  nextPage.disabled = accountCurrentPage === totalPages;
}

// SEARCH ACCOUNTS

searchInput.addEventListener("input", filterAccounts);

// ROLE FILTER BUTTONS

allButton.addEventListener("click", () => {
  currentRole = "all";
  updateActiveButton(allButton);
  filterAccounts();
});

adminButton.addEventListener("click", () => {
  currentRole = "admin";
  updateActiveButton(adminButton);
  filterAccounts();
});

managerButton.addEventListener("click", () => {
  currentRole = "manager";
  updateActiveButton(managerButton);
  filterAccounts();
});

employeeButton.addEventListener("click", () => {
  currentRole = "employee";
  updateActiveButton(employeeButton);
  filterAccounts();
});

// PREVIOUS PAGE

prevPage.addEventListener("click", () => {
  if (accountCurrentPage > 1) {
    accountCurrentPage--;

    renderAccounts();
  }
});

// NEXT PAGE

nextPage.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredAccounts.length / accountsPerPage);

  if (accountCurrentPage < totalPages) {
    accountCurrentPage++;

    renderAccounts();
  }
});

// FETCH ACCOUNTS FROM DATABASE

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

const diagram = document.getElementById("delete-dialog");

accountList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("#dl-btn-dia");

  if (!deleteButton) return;

  diagram.showModal();
});

const noDelete = document.getElementById("no-delete");

noDelete.addEventListener("click", () => {
  diagram.close();
});

/* registrition*/
