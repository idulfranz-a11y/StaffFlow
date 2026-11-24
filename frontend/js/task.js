// modal sa new task
const taskmodal = document.getElementById("task-dialog");
const btnOpen = document.getElementById("new-task");
const btnOut = document.getElementById("close-task");

btnOpen.addEventListener("click", () => {
  taskmodal.showModal();
});

btnOut.addEventListener("click", () => {
  taskmodal.close();
});

// ============================================
// Task Management - Manager
// ============================================

const teamSelect = document.getElementById("team");

// Load manager's teams from MySQL
async function loadTeamsForTask() {
  try {
    const response = await fetch("/api/teams");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load teams.");
    }

    // Remove old options, keeping the placeholder
    teamSelect.innerHTML = `
      <option value="">Select Team</option>
    `;

    data.teams.forEach((team) => {
      const option = document.createElement("option");

      option.value = team.id;
      option.textContent = team.team_name || team.name;

      teamSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Loading teams failed:", error);
    alert(error.message);
  }
}

// Initial loading
if (teamSelect) {
  loadTeamsForTask();
}
