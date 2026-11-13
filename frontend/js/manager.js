// ============================================
// manager.js – Manager and My Team functionality
// ============================================

// Only run My Team functionality when its elements exist
const teamList = document.getElementById("team-list");

if (teamList) {
  // ---------- Elements ----------
  const template = document.getElementById("team-template");
  const nameInput = document.getElementById("team-name");
  const generateBtn = document.getElementById("generate-btn");
  const totalTeamValue = document.querySelector(".total-team-value");

  // ---------- Pagination Elements ----------
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  const pageIndicator = document.getElementById("page-indicator");

  // ---------- Delete Modal Elements ----------
  const deleteModal = document.getElementById("delete-modal");
  const cancelDeleteBtn = document.getElementById("cancel-delete");
  const confirmDeleteBtn = document.getElementById("confirm-delete");

  // ---------- Copy Modal Elements ----------
  const copyModal = document.getElementById("copy-modal");
  const okayCopyBtn = document.getElementById("okay-copy");

  // ---------- Settings ----------
  const teamsPerPage = 3;
  let currentPage = 1;
  let selectedTeamId = null;

  // ---------- Data ----------
  function loadTeams() {
    try {
      const saved = JSON.parse(localStorage.getItem("teams"));

      if (Array.isArray(saved)) return saved;
    } catch (e) {
      console.error("Unable to load teams:", e);
    }

    return [
      { id: 1, name: "team 1", code: "TEAM-17686", members: 2 },
      { id: 2, name: "team 2", code: "TEAM-B1C0R", members: 1 },
    ];
  }

  let teams = loadTeams();

  // ---------- Save Teams ----------
  function saveTeams() {
    try {
      localStorage.setItem("teams", JSON.stringify(teams));
    } catch (e) {
      console.error("Unable to save teams:", e);
    }
  }

  // ---------- Generate Unique Team Code ----------
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

  // ---------- Count Total Teams ----------
  function countTeams() {
    if (totalTeamValue) {
      totalTeamValue.textContent = teams.length;
    }
  }

  // ---------- Calculate Total Pages ----------
  function getTotalPages() {
    return Math.max(1, Math.ceil(teams.length / teamsPerPage));
  }

  // ---------- Update Pagination ----------
  function updatePagination() {
    const totalPages = getTotalPages();

    currentPage = Math.max(1, Math.min(currentPage, totalPages));

    if (pageIndicator) {
      pageIndicator.textContent = `${currentPage} / ${totalPages}`;
    }

    if (prevBtn) {
      prevBtn.disabled = currentPage === 1;
    }

    if (nextBtn) {
      nextBtn.disabled = currentPage === totalPages;
    }
  }

  // ---------- Render Teams ----------
  function renderTeams() {
    teamList.innerHTML = "";

    countTeams();

    const start = (currentPage - 1) * teamsPerPage;
    const end = start + teamsPerPage;

    const visibleTeams = teams.slice(start, end);

    if (teams.length === 0) {
      const empty = document.createElement("li");

      empty.className = "team-empty";
      empty.textContent =
        "No teams yet. Generate a code to create your first team.";

      teamList.appendChild(empty);
    } else {
      visibleTeams.forEach((team) => {
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

        card.querySelector(".btn-details").href =
          "team-details.html?id=" + team.id;

        teamList.appendChild(card);
      });
    }

    updatePagination();

    if (window.lucide) {
      lucide.createIcons();
    }

    console.log("Total teams:", teams.length);
    console.log("Total pages:", getTotalPages());
    console.log("Current page:", currentPage);
  }

  // ---------- Create a Team ----------
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

    // Return to the first page after creating a team
    currentPage = 1;

    saveTeams();
    renderTeams();
  }

  // ---------- Generate Button ----------
  if (generateBtn) {
    generateBtn.addEventListener("click", createTeam);
  }

  // ---------- Enter Key ----------
  if (nameInput) {
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        createTeam();
      }
    });
  }

  // ---------- Copy and Open Delete Modal ----------
  teamList.addEventListener("click", (e) => {
    const copy = e.target.closest(".btn-copy");
    const del = e.target.closest(".btn-delete");

    // Copy team code
    if (copy) {
      navigator.clipboard
        .writeText(copy.dataset.code)
        .then(() => {
          if (copyModal) {
            copyModal.showModal();
          }
        })
        .catch(() => {
          alert("Unable to copy team code.");
        });
    }

    // Open delete confirmation modal
    if (del) {
      selectedTeamId = Number(del.dataset.id);

      if (deleteModal) {
        deleteModal.showModal();
      }
    }
  });

  // ---------- Close Copy Success Modal ----------
  if (okayCopyBtn && copyModal) {
    okayCopyBtn.addEventListener("click", () => {
      copyModal.close();
    });
  }

  // ---------- Cancel Delete ----------
  if (cancelDeleteBtn && deleteModal) {
    cancelDeleteBtn.addEventListener("click", () => {
      selectedTeamId = null;
      deleteModal.close();
    });
  }

  // ---------- Confirm Delete ----------
  if (confirmDeleteBtn && deleteModal) {
    confirmDeleteBtn.addEventListener("click", () => {
      if (selectedTeamId === null) return;

      teams = teams.filter((team) => team.id !== selectedTeamId);

      saveTeams();

      selectedTeamId = null;
      deleteModal.close();

      renderTeams();
    });
  }

  // ---------- Previous Page ----------
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderTeams();
      }
    });
  }

  // ---------- Next Page ----------
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentPage < getTotalPages()) {
        currentPage++;
        renderTeams();
      }
    });
  }

  // ---------- Initial Display ----------
  renderTeams();
}

// ============================================
// Recent Teams - Manager Dashboard
// ============================================

const recentTeamList = document.getElementById("recent-team-list");
const recentTeamTemplate = document.getElementById("recent-team-template");

if (recentTeamList && recentTeamTemplate) {
  const savedTeams = JSON.parse(localStorage.getItem("teams")) || [];

  // Display only the latest 3 teams
  const recentTeams = savedTeams.slice(0, 3);

  recentTeams.forEach((team) => {
    const card = recentTeamTemplate.content.cloneNode(true);

    card.querySelector(".recent-team-name").textContent = team.name;
    card.querySelector(".recent-team-code").textContent = team.code;

    card.querySelector(".recent-team-members").textContent =
      team.members + (team.members === 1 ? " member" : " members");

    card.querySelector(".recent-team-details").href =
      "team-details.html?id=" + team.id;

    recentTeamList.appendChild(card);
  });

  if (window.lucide) {
    lucide.createIcons();
  }
}
