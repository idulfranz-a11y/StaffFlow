const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const accountID = document.getElementById("id");
const Ypassword = document.getElementById("rightPassword");
const role = document.getElementById("selec-role");

const signupButton = document.getElementById("legitNaSignUp");

signupButton.addEventListener("click", async function (event) {
  const first = firstName.value.trim();
  const last = lastName.value.trim();
  const id = accountID.value.trim();
  const pass = Ypassword.value;
  const selectedRole = role.value;

  if (!first || !last || !id || !pass || !selectedRole) {
    alert("Please fill in all fields.");
    return;
  }

  // Public registration only allows manager and employee.
  const allowedRoles = ["manager", "employee"];

  if (!allowedRoles.includes(selectedRole)) {
    alert("Please select a valid account role.");
    return;
  }

  const namePattern = /^[a-zA-Z\s'-]+$/;

  if (!namePattern.test(first) || !namePattern.test(last)) {
    alert("Names must contain letters only.");
    return;
  }

  const signupData = {
    first_name: first,
    last_name: last,
    id_number: id,
    password: pass,
    role: selectedRole,
  };

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signupData),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Registration failed.");
      return;
    }

    alert(result.message);
  } catch (error) {
    console.error("Registration request failed:", error);
    alert("Unable to connect to the server. Please try again.");
  }
});
