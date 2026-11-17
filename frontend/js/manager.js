// ============================================
// My Team - Manager Functionality
// ============================================

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
  let teams = [];

  // ============================================
  // Format Team Data
  // ============================================

  function formatTeam(team) {
    return {
      id: team.id,
      name: team.name || team.team_name || "Unnamed Team",
      code: team.code || team.access_code || "",
      members: Number(team.members ?? 0),
    };
  }

  // ============================================
  // Load Teams from MySQL
  // ============================================

  async function loadTeams() {
    try {
      const response = await fetch("/api/teams");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load teams.");
      }

      teams = Array.isArray(data.teams) ? data.teams.map(formatTeam) : [];

      renderTeams();
    } catch (error) {
      console.error("Loading teams failed:", error);
      alert(error.message || "Unable to load teams.");
    }
  }

  // ============================================
  // Count Total Teams
  // ============================================

  function countTeams() {
    if (totalTeamValue) {
      totalTeamValue.textContent = teams.length;
    }
  }

  // ============================================
  // Calculate Total Pages
  // ============================================

  function getTotalPages() {
    return Math.max(1, Math.ceil(teams.length / teamsPerPage));
  }

  // ============================================
  // Update Pagination
  // ============================================

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

  // ============================================
  // Render Teams
  // ============================================

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
  }

  // ============================================
  // Create a Team in MySQL
  // ============================================

  async function createTeam() {
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

    try {
      generateBtn.disabled = true;

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team_name: name,
        }),
      });
      const responseText = await response.text();

      console.log("API Status:", response.status);
      console.log("API Response:", responseText);

      let data;

      try {
        data = JSON.parse(responseText);
      } catch (error) {
        throw new Error(
          "Server returned HTML instead of JSON. Check the API route.",
        );
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to create team.");
      }

      if (!data.team) {
        throw new Error("The server did not return the created team.");
      }

      // Format the team data before adding it
      const newTeam = formatTeam(data.team);

      teams.unshift(newTeam);

      nameInput.value = "";
      currentPage = 1;

      renderTeams();

      // No success alert here.
      // The new team card confirms successful creation.
    } catch (error) {
      console.error("Creating team failed:", error);
      alert(error.message || "Unable to create team.");
    } finally {
      generateBtn.disabled = false;
    }
  }

  // ============================================
  // Generate Button
  // ============================================

  if (generateBtn) {
    generateBtn.addEventListener("click", createTeam);
  }

  // ============================================
  // Enter Key
  // ============================================

  if (nameInput) {
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        createTeam();
      }
    });
  }

  // ============================================
  // Copy Team Code and Open Delete Modal
  // ============================================

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

  // ============================================
  // Close Copy Success Modal
  // ============================================

  if (okayCopyBtn && copyModal) {
    okayCopyBtn.addEventListener("click", () => {
      copyModal.close();
    });
  }

  // ============================================
  // Cancel Delete
  // ============================================

  if (cancelDeleteBtn && deleteModal) {
    cancelDeleteBtn.addEventListener("click", () => {
      selectedTeamId = null;
      deleteModal.close();
    });
  }

  // ============================================
  // Delete Confirmation (Not Connected Yet)
  // ============================================

  if (confirmDeleteBtn && deleteModal) {
    confirmDeleteBtn.addEventListener("click", () => {
      alert("Team deletion will be connected to MySQL in the next step.");

      selectedTeamId = null;
      deleteModal.close();
    });
  }

  // ============================================
  // Previous Page
  // ============================================

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderTeams();
      }
    });
  }

  // ============================================
  // Next Page
  // ============================================

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentPage < getTotalPages()) {
        currentPage++;
        renderTeams();
      }
    });
  }

  // ============================================
  // Initial Display
  // ============================================

  loadTeams();
}
