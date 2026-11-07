const hoverBox = document.querySelector(".box-hover");
const sideNav = document.getElementById("side-nav");
const links = document.querySelectorAll("#side-nav a[href]");

const currentPage = window.location.pathname.split("/").pop();

let activeLink = null;

links.forEach((link) => {
  const page = link.getAttribute("href").split("/").pop();

  if (page === currentPage) {
    activeLink = link;
  }
});

// Calculate position relative to the navigation container
function getPosition(link) {
  const linkRect = link.getBoundingClientRect();
  const navRect = sideNav.getBoundingClientRect();

  return linkRect.top - navRect.top + sideNav.scrollTop;
}

// Move indicator
function moveBox(link) {
  hoverBox.style.top = `${getPosition(link)}px`;
}

// Set initial position without animation
if (activeLink) {
  hoverBox.style.transition = "none";
  moveBox(activeLink);
}

// Handle navigation clicks
links.forEach((link) => {
  link.addEventListener("click", (event) => {
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }

    const destination = new URL(
      link.getAttribute("href"),
      window.location.href,
    );

    if (destination.pathname === window.location.pathname) {
      return;
    }

    event.preventDefault();

    hoverBox.style.transition = "top 0.4s ease";
    moveBox(link);

    setTimeout(() => {
      window.location.href = destination.href;
    }, 400);
  });
});

// Reposition when browser resizes
window.addEventListener("resize", () => {
  if (activeLink) {
    hoverBox.style.transition = "none";
    moveBox(activeLink);
  }
});

//basta kato mo move
