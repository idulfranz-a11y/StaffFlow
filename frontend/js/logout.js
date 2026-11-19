const logoutDialog = document.getElementById("logout-button");
const logoutTrigger = document.getElementById("log-out");

const yesButton = document.getElementById("yes-btn");
const noButton = document.getElementById("no-btn");

console.log("Dialog:", logoutDialog);
console.log("Trigger:", logoutTrigger);
console.log("Yes:", yesButton);
console.log("No:", noButton);

// Open logout confirmation
logoutTrigger.addEventListener("click", (event) => {
  event.preventDefault();
  logoutDialog.showModal();
});

// Cancel logout
noButton.addEventListener("click", () => {
  logoutDialog.close();
});

// Confirm logout
yesButton.addEventListener("click", async () => {
  yesButton.disabled = true;
  console.log("YES BUTTON CLICKED");
  try {
    const response = await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Unable to log out.");
      return;
    }

    window.location.href = "/LogIn.html";
  } catch (error) {
    console.error("Logout error:", error);
    alert("Unable to connect to the server.");
  } finally {
    yesButton.disabled = false;
  }
});
