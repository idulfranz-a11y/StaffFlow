// password method kato eye
const password = document.getElementById("password");
const togglePassword = document.getElementById("eye-icon");

togglePassword.addEventListener("click", function () {
  if (password.type === "password") {
    password.type = "text";
  } else {
    password.type = "password";
  }
});

console.log("dong rene");

const signup = document.getElementById("clickSignUP");
const signin = document.getElementById("clickSignIn");
const signupBorder = document.querySelector(".signup-border");
const legitSignUp = document.getElementById("legitNaSignUp");
const legitSignIn = document.getElementById("signin");
const fillup = document.getElementById("fillup");
const dontacc = document.getElementById("description");
const readytomanage = document.getElementById("readytomanage");

const rightside = document.querySelector(".rightside");
const leftside = document.querySelector(".leftside");

// SIGN UP
signup.addEventListener("click", function () {
  signupBorder.classList.remove("reverse-animate");
  void signupBorder.offsetWidth;

  signupBorder.classList.add("animate");
  signupBorder.classList.add("signup-position");

  //buttons ni siya
  signup.style.zIndex = "-3";
  legitSignUp.style.zIndex = "3";
  legitSignIn.style.zIndex = "-3";
  signin.style.zIndex = "3";

  dontacc.style.visibility = "hidden";
  readytomanage.style.visibility = "hidden";

  //calling all element in left
  rightside.style.visibility = "visible";
  leftside.style.visibility = "hidden";
});

// SIGN IN
signin.addEventListener("click", function () {
  signupBorder.classList.remove("animate");
  void signupBorder.offsetWidth;

  signupBorder.classList.add("reverse-animate");
  signupBorder.classList.remove("signup-position");

  signin.style.backgroundColor = "#2e8b57";
  signup.style.backgroundColor = "#3aac6c";

  signup.style.zIndex = "3";
  legitSignUp.style.zIndex = "-3";
  legitSignIn.style.zIndex = "3";
  signin.style.zIndex = "-3";
  dontacc.style.visibility = "visible";
  readytomanage.style.visibility = "visible";

  //display the elements
  rightside.style.visibility = "hidden";
  leftside.style.visibility = "visible";
});

//log in logic

const employeeId = document.getElementById("idNumber");
const loginPassword = document.getElementById("password");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("signin");

loginButton.addEventListener("click", async function () {
  const idNumber = employeeId.value.trim();
  const passwordValue = loginPassword.value;

  if (!idNumber || !passwordValue) {
    loginMessage.textContent = "yes";
    return;
  }

  loginMessage.textContent = "Checking your credentials...";
  loginButton.disabled = true;

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_number: idNumber,
        password: passwordValue,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      loginMessage.textContent =
        data.message || "Login failed. Please try again.";
      return;
    }
    loginMessage.textContent = `Welcome, ${data.user.first_name}!`;

    const role = data.user.role;

    if (role === "admin") {
      window.location.href = "/layout/adminEnd/dashboared.html";
    } else if (role === "manager") {
      window.location.href = "/layout/managerEnd/manager.html";
    } else if (role === "employee") {
      window.location.href = "/layout/employeeEnd/employedash.html";
    } else {
      loginMessage.textContent = "Your account has an unrecognized role.";
    }
  } catch (error) {
    console.error("Login request failed:", error);
    loginMessage.textContent =
      "Unable to connect to the server. Please try again.";
  } finally {
    loginButton.disabled = false;
  }
});
