const registrationList = document.getElementById("registration-list");
const registrationTemplate = document.getElementById("registration-template");
const pendingCount = document.getElementById("pending-count");

// Retrieve and display pending accounts
async function renderRegistrationRequests() {
  registrationList.innerHTML = "";

  try {
    const response = await fetch("/api/admin/pending-accounts");

    if (!response.ok) {
      const errorDetails = await response.text();

      console.error("HTTP Status:", response.status);
      console.error("Server Response:", errorDetails);

      throw new Error("Unable to retrieve registration requests.");
    }

    const registrationRequests = await response.json();

    registrationRequests.forEach((account) => {
      const clone = registrationTemplate.content.cloneNode(true);

      const initials = `${account.first_name[0]}${account.last_name[0]}`;

      clone.querySelector(".registration-initials").textContent = initials;

      clone.querySelector(".registration-name").textContent =
        `${account.first_name} ${account.last_name}`;

      clone.querySelector(".requested-role").textContent = account.role;

      clone.querySelector(".registration-date").textContent = new Date(
        account.created_at,
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      clone.querySelector(".registration-status").textContent = account.status;

      // Approve button
      clone.querySelector(".approve-request").addEventListener("click", () => {
        updateAccountStatus(account.id, "approve");
      });

      // Reject button
      clone.querySelector(".reject-request").addEventListener("click", () => {
        updateAccountStatus(account.id, "reject");
      });

      registrationList.appendChild(clone);
    });

    pendingCount.textContent = `${registrationRequests.length} Pending`;
  } catch (error) {
    console.error("Registration loading failed:", error);
    pendingCount.textContent = "Unable to load";
  }
}

// Approve or reject an account
async function updateAccountStatus(accountId, action) {
  const confirmed = confirm(`Are you sure you want to ${action} this account?`);

  if (!confirmed) return;

  try {
    const response = await fetch(`/api/admin/${accountId}/${action}`, {
      method: "PATCH",
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Unable to update account.");
      return;
    }

    alert(result.message);

    // Refresh the registration list
    await renderRegistrationRequests();
  } catch (error) {
    console.error("Account update failed:", error);
    alert("Unable to connect to the server.");
  }
}

renderRegistrationRequests();
