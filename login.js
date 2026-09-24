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
const signup = document.getElementById("sign-up-button");
const signin = document.getElementById("signin");
const leftside = document.querySelector(".leftside");
const greetings = document.querySelector(".greetings");
const mama = document.querySelector(".mama");

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
});
