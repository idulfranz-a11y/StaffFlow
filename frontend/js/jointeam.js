const teamCodeInput = document.getElementById("team-code");
const joinButton = document.getElementById("join-btn");
const joinMessage = document.getElementById("join-message");

// Join team
joinButton.addEventListener("click", async () => {
  const access_code = teamCodeInput.value.trim();

  if (!access_code) {
    joinMessage.textContent = "Please enter a team code.";
    return;
  }

  joinButton.disabled = true;
  joinMessage.textContent = "Joining team...";

  try {
    const response = await fetch("/api/teams/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ access_code }),
    });

    const data = await response.json();

    if (!response.ok) {
      joinMessage.textContent = data.message || "Unable to join team.";
      return;
    }

    joinMessage.textContent = data.message;
    teamCodeInput.value = "";

    // Reload complete team information
    await loadMyTeam();
  } catch (error) {
    console.error("Join team error:", error);
    joinMessage.textContent = "Unable to connect to the server.";
  } finally {
    joinButton.disabled = false;
  }
});

// Load employee's team information
async function loadMyTeam() {
  try {
    const response = await fetch("/api/teams/my-team", {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Loading team failed:", data.message);
      return;
    }

    const teamTitle = document.querySelector(".header-current-team h1");

    const memberCount = document.getElementById("member-count");
    const memberTotal = document.querySelector(".team-members-header span");

    const memberList = document.getElementById("member-list");
    const memberTemplate = document.getElementById("member-template");

    // Remove previously displayed members
    memberList.querySelectorAll(".member-row").forEach((row) => {
      row.remove();
    });

    // Check if employee belongs to a team
    if (!data.team) {
      teamTitle.textContent = "No team yet";
      memberCount.textContent = "0";
      memberTotal.textContent = "0";
      return;
    }

    const team = data.team;

    // Display team name
    teamTitle.textContent = team.name;

    // Display member count
    memberCount.textContent = team.members.length;
    memberTotal.textContent = team.members.length;

    // Display each member
    team.members.forEach((member) => {
      const clone = memberTemplate.content.cloneNode(true);

      const initials = member.name
        .split(" ")
        .map((name) => name.charAt(0))
        .join("")
        .toUpperCase();

      clone.querySelector(".member-initials").textContent = initials;
      clone.querySelector(".member-name").textContent = member.name;
      clone.querySelector(".member-role").textContent = member.role;

      memberList.appendChild(clone);
    });
  } catch (error) {
    console.error("Load team error:", error);
  }
}

// Automatically load team when page opens
loadMyTeam();
