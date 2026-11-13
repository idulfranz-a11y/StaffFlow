// ============================================
// myTeam.js – create, copy and delete teams
// ============================================

// ---------- Elements ----------
const list = document.getElementById("team-list");
const template = document.getElementById("team-template");
const nameInput = document.getElementById("team-name");
const generateBtn = document.getElementById("generate-btn");

// ---------- Data ----------
// Loads saved teams. If there are none, starts with these two examples.
function loadTeams() {
  try {
    const saved = JSON.parse(localStorage.getItem("teams"));
    if (Array.isArray(saved)) return saved;
  } catch (e) {}
  return [
    { id: 1, name: "team 1", code: "TEAM-17686", members: 2 },
    { id: 2, name: "team 2", code: "TEAM-B1C0R", members: 1 },
  ];
}

function saveTeams() {
  try {
    localStorage.setItem("teams", JSON.stringify(teams));
  } catch (e) {}
}

let teams = loadTeams();

// ---------- Helpers ----------
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code;

  do {
    code = "TEAM-";

    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (teams.some((team) => team.code === code));

  return code;
}

// ---------- Draw the list ----------
function renderTeams() {
  list.innerHTML = "";

  if (teams.length === 0) {
    const empty = document.createElement("li");
    empty.className = "team-empty";
    empty.textContent =
      "No teams yet. Generate a code to create your first team.";
    list.appendChild(empty);
    return;
  }

  teams.forEach((team) => {
    const card = template.content.cloneNode(true);

    card.querySelector(".team-name").textContent = team.name;
    card.querySelector(".team-code").textContent = team.code;
    card.querySelector(".team-members").textContent =
      team.members + (team.members === 1 ? " member" : " members");

    const copyBtn = card.querySelector(".btn-copy");
    copyBtn.dataset.code = team.code;

    const delBtn = card.querySelector(".btn-delete");
    delBtn.dataset.id = team.id;
    delBtn.setAttribute("aria-label", "Delete " + team.name);

    card.querySelector(".btn-details").href = "team-details.html?id=" + team.id;

    list.appendChild(card);
  });

  // Draw the lucide icons (trash icon) if the library is loaded
  if (window.lucide) lucide.createIcons();
}

// ---------- Create a team ----------
function createTeam() {
  const name = nameInput.value.trim();

  if (!name) {
    nameInput.focus();
    return;
  }

  if (name.length > 30) {
    alert("Team name must not exceed 30 characters.");
    nameInput.focus();
    return;
  }

  teams.unshift({
    id: Date.now(),
    name: name,
    code: generateCode(),
    members: 0,
  });

  nameInput.value = "";
  saveTeams();
  renderTeams();
}

generateBtn.addEventListener("click", createTeam);

// Pressing Enter in the input also creates the team
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") createTeam();
});

// ---------- Copy and delete buttons ----------
// One listener on the list handles every box, including new ones.
list.addEventListener("click", (e) => {
  const copy = e.target.closest(".btn-copy");
  const del = e.target.closest(".btn-delete");

  if (copy) {
    navigator.clipboard
      .writeText(copy.dataset.code)
      .then(() => {
        copy.textContent = "Copied!";

        setTimeout(() => {
          copy.textContent = "Copy code";
        }, 1500);
      })
      .catch(() => {
        alert("Unable to copy team code.");
      });
  }

  if (del) {
    teams = teams.filter((t) => t.id !== Number(del.dataset.id));
    saveTeams();
    renderTeams();
  }
});

// ---------- Start ----------
renderTeams();
