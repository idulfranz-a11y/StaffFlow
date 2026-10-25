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
const leftside = document.querySelector(".leftside");
const greetings = document.querySelector(".greetings");
const mama = document.querySelector(".mama");
const headerRightside = document.querySelector(".header-rightside");
const leftDescription = document.getElementById("left-description");
const allRight = document.getElementsByClassName("all-right");
const legitSignUp = document.getElementById("legitNaSignUp");
const legitSignIn = document.getElementById("signin");
const fillup = document.getElementById("fillup");
//animation starts here
//to remove all the elements in the left side(aside from the sign in button)

const signupBorder = document.querySelector(".signup-border");

signup.addEventListener("click", function () {
  signupBorder.classList.remove("reverse-animate");
  void signupBorder.offsetWidth;

  leftside.classList.add("move-right");
  signupBorder.classList.add("animate");
  signupBorder.classList.add("signup-position");

  leftside.style.zIndex = "-13";
  greetings.style.zIndex = "-13";
  mama.style.zIndex = "-13";

  signin.style.backgroundColor = "#3aac6c";
  signup.style.backgroundColor = "#2e8b57";

  headerRightside.style.zIndex = "3";
  leftDescription.style.zIndex = "3";

  // calling all the elements in sign up atay

  for (let i = 0; i < allRight.length; i++) {
    allRight[i].style.zIndex = "3";
  }
  signup.style.zIndex = "-3";
  legitSignUp.style.zIndex = "3";
  legitSignIn.style.zIndex = "-3";
  signin.style.zIndex = "3";
  fillup.style.zIndex = "3";
});

// goes back to original place

signin.addEventListener("click", function () {
  signupBorder.classList.remove("animate");
  void signupBorder.offsetWidth;

  signupBorder.classList.add("reverse-animate");
  signupBorder.classList.remove("signup-position");

  leftside.style.zIndex = "3";
  greetings.style.zIndex = "3";
  mama.style.zIndex = "3";

  signin.style.backgroundColor = "#2e8b57";
  signup.style.backgroundColor = "#3aac6c";

  headerRightside.style.zIndex = "-3";
  leftDescription.style.zIndex = "-3";

  //at nganyon tayo ay magluluto na
  for (let i = 0; i < allRight.length; i++) {
    allRight[i].style.zIndex = "-3";
  }
  signup.style.zIndex = "3";
  legitSignUp.style.zIndex = "-3";
  legitSignIn.style.zIndex = "3";
  signin.style.zIndex = "-3";
  fillup.style.zIndex = "-3";
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
    loginMessage.textContent = "Please enter your employee ID and password.";
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

    loginMessage.textContent = `Welcome, ${data.user.first_name}! Login successful.`;

    console.log("Logged-in user:", data.user);
  } catch (error) {
    console.error("Login request failed:", error);
    loginMessage.textContent =
      "Unable to connect to the server. Please try again.";
  } finally {
    loginButton.disabled = false;
  }
});
