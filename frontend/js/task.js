// ============================================
// NEW TASK MODAL
// ============================================

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
// TASK MANAGEMENT - MANAGER
// ============================================

const teamSelect = document.getElementById("team");
const taskForm = document.getElementById("create-task-form");
const memberSelection = document.getElementById("member-selection");

// ============================================
// LOAD MANAGER'S TEAMS
// ============================================

async function loadTeamsForTask() {
  try {
    const response = await fetch("/api/teams");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load teams.");
    }

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

if (teamSelect) {
  loadTeamsForTask();
}

// ============================================
// LOAD MEMBERS WHEN TEAM IS SELECTED
// ============================================

async function loadTeamMembers(teamId) {
  memberSelection.innerHTML = "<p>Loading members...</p>";

  try {
    const response = await fetch(`/api/teams/${teamId}/members`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load team members.");
    }

    if (data.members.length === 0) {
      memberSelection.innerHTML = "<p>No members in this team yet.</p>";
      return;
    }

    // Main dropdown container
    const dropdown = document.createElement("div");
    dropdown.className = "member-dropdown";

    // Dropdown button
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "member-dropdown-toggle";
    toggle.setAttribute("aria-expanded", "false");

    toggle.innerHTML = `
      <span class="member-dropdown-summary">Select employees</span>
      <span class="member-dropdown-arrow">▾</span>
    `;

    // Options panel
    const options = document.createElement("div");
    options.className = "member-dropdown-options";
    options.hidden = true;

    // Select All option
    const allLabel = document.createElement("label");
    allLabel.className = "member-option member-select-all";

    const allCheckbox = document.createElement("input");
    allCheckbox.type = "checkbox";
    allCheckbox.id = "select-all-members";

    const allText = document.createElement("span");
    allText.textContent = "All";

    allLabel.append(allCheckbox, allText);
    options.appendChild(allLabel);

    // Individual employee options
    data.members.forEach((member) => {
      const label = document.createElement("label");
      label.className = "member-option";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "member-checkbox";
      checkbox.name = "assigned_members";
      checkbox.value = member.id;

      const name = document.createElement("span");
      name.textContent = `${member.first_name} ${member.last_name}`;

      label.append(checkbox, name);
      options.appendChild(label);
    });

    dropdown.append(toggle, options);

    memberSelection.innerHTML = "";
    memberSelection.appendChild(dropdown);
  } catch (error) {
    console.error("Loading team members failed:", error);

    memberSelection.innerHTML = "<p>Unable to load team members.</p>";
  }
}

// ============================================
// TEAM SELECTION EVENT
// ============================================

teamSelect.addEventListener("change", () => {
  const selectedTeamId = teamSelect.value;

  if (!selectedTeamId) {
    memberSelection.innerHTML = "<p>Select a team first.</p>";
    return;
  }

  loadTeamMembers(selectedTeamId);
});

// ============================================
// OPEN AND CLOSE EMPLOYEE DROPDOWN
// ============================================

memberSelection.addEventListener("click", (event) => {
  const toggle = event.target.closest(".member-dropdown-toggle");

  if (!toggle) return;

  const options = memberSelection.querySelector(".member-dropdown-options");

  options.hidden = !options.hidden;

  toggle.setAttribute("aria-expanded", String(!options.hidden));
});

// ============================================
// HANDLE EMPLOYEE SELECTION
// ============================================

memberSelection.addEventListener("change", (event) => {
  const allCheckbox = memberSelection.querySelector("#select-all-members");

  const memberCheckboxes = Array.from(
    memberSelection.querySelectorAll(".member-checkbox"),
  );

  if (!allCheckbox) return;

  // If All is clicked
  if (event.target.id === "select-all-members") {
    memberCheckboxes.forEach((checkbox) => {
      checkbox.checked = allCheckbox.checked;
    });
  }

  // Update All checkbox
  allCheckbox.checked =
    memberCheckboxes.length > 0 &&
    memberCheckboxes.every((checkbox) => checkbox.checked);

  // Get selected employee names
  const selected = memberCheckboxes
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.nextElementSibling.textContent);

  const summary = memberSelection.querySelector(".member-dropdown-summary");

  // Update dropdown text
  if (selected.length === 0) {
    summary.textContent = "Select employees";
  } else if (selected.length === memberCheckboxes.length) {
    summary.textContent = "All employees selected";
  } else {
    summary.textContent = selected.join(", ");
  }
});

// ============================================
// CREATE TASK - SEND DATA TO BACKEND
// ============================================

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Get selected employee IDs
  const assignedMembers = Array.from(
    memberSelection.querySelectorAll(".member-checkbox:checked"),
  ).map((checkbox) => Number(checkbox.value));

  // Validate employee selection
  if (assignedMembers.length === 0) {
    alert("Please select at least one employee.");
    return;
  }

  // Collect form data
  const taskData = {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    team_id: teamSelect.value,
    priority: document.getElementById("priority").value,
    deadline: document.getElementById("deadline").value,
    assigned_members: assignedMembers,
  };

  try {
    // Send task data to Express
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Task creation failed.");
    }

    console.log("Created task:", result.task);

    alert(result.message);

    // Reset form after successful creation
    taskForm.reset();

    memberSelection.innerHTML = "<p>Select a team first.</p>";

    taskmodal.close();
  } catch (error) {
    console.error("Task creation failed:", error);
    alert(error.message);
  }
});

// ============================================
// TASK TABLE AND DETAILS MODAL
// SAMPLE DATA FOR FRONTEND TESTING
// ============================================

const taskList = document.getElementById("task-list");

const taskDetailsDialog = document.getElementById("task-details-dialog");
const closeDetailsBtn = document.getElementById("close-details");

const detailsTaskId = document.getElementById("details-task-id");
const detailsTitle = document.getElementById("details-title");
const detailsDescription = document.getElementById("details-description");
const detailsDeadline = document.getElementById("details-deadline");
const detailsPriority = document.getElementById("details-priority");
const detailsStatus = document.getElementById("details-status");

const detailsAssignees = document.getElementById("details-assignees");
const detailsAttachments = document.getElementById("details-attachments");
const detailsComments = document.getElementById("details-comments");
const submittedWork = document.getElementById("submitted-work");

const commentForm = document.getElementById("comment-form");
const commentInput = document.getElementById("comment-input");

let selectedTaskId = null;

// ============================================
// SAMPLE TASK DATA
// ============================================

const sampleTasks = [
  {
    id: 1,
    task_id: "TASK-0001",
    title: "Design Login Page",
    description:
      "Create and finalize the login page design for StaffFlow. Ensure the layout is responsive and follows the approved design system.",
    deadline: "2026-11-30",
    priority: "High",
    status: "In Progress",

    assignees: [
      {
        first_name: "Juan",
        last_name: "Dela Cruz",
      },
      {
        first_name: "Maria",
        last_name: "Santos",
      },
    ],

    attachments: [
      {
        name: "design-reference.pdf",
        type: "PDF document",
      },
    ],

    comments: [
      {
        author: "Manager",
        message: "Please improve the spacing between the form fields.",
        date: "November 25, 2026",
      },
    ],

    submission: {
      file_name: "login-page-final.png",
      submitted_by: "Juan Dela Cruz",
      submitted_at: "November 28, 2026",
      status: "Submitted",
    },
  },

  {
    id: 2,
    task_id: "TASK-0002",
    title: "Prepare Weekly Report",
    description:
      "Prepare the weekly progress report and summarize the team's completed activities.",
    deadline: "2026-12-02",
    priority: "Medium",
    status: "Pending",

    assignees: [
      {
        first_name: "Alex",
        last_name: "Reyes",
      },
    ],

    attachments: [],
    comments: [],
    submission: null,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Prevent HTML injection when displaying text
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const characters = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return characters[character];
  });
}

// Format deadline
function formatDeadline(dateString) {
  if (!dateString) return "No deadline";

  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Get priority CSS class
function getPriorityClass(priority) {
  switch (priority) {
    case "High":
      return "priority-high";

    case "Medium":
      return "priority-medium";

    case "Low":
      return "priority-low";

    default:
      return "";
  }
}

// Get status CSS class
function getStatusClass(status) {
  switch (status) {
    case "Pending":
      return "status-pending";

    case "In Progress":
      return "status-progress";

    case "Completed":
      return "status-completed";

    default:
      return "";
  }
}

// ============================================
// DISPLAY TASKS IN TABLE
// ============================================

function renderTaskTable() {
  taskList.innerHTML = "";

  if (sampleTasks.length === 0) {
    taskList.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="details-empty">
            No tasks have been created yet.
          </div>
        </td>
      </tr>
    `;

    return;
  }

  sampleTasks.forEach((task) => {
    const row = document.createElement("tr");

    // Show first name only.
    // Add ... if there is more than one assignee.
    const firstAssignee = task.assignees[0]
      ? task.assignees[0].first_name
      : "No assignee";

    const assigneeDisplay =
      task.assignees.length > 1 ? `${firstAssignee}...` : firstAssignee;

    row.innerHTML = `
      <td>${escapeHTML(task.title)}</td>

      <td>${escapeHTML(assigneeDisplay)}</td>

      <td>${escapeHTML(formatDeadline(task.deadline))}</td>

      <td>
        <span class="task-priority ${getPriorityClass(task.priority)}">
          ${escapeHTML(task.priority)}
        </span>
      </td>

      <td>
        <span class="task-status ${getStatusClass(task.status)}">
          ${escapeHTML(task.status)}
        </span>
      </td>

      <td>
        <div class="task-actions">
          <button
            type="button"
            class="task-details-btn"
            data-task-id="${task.id}"
          >
            Details
          </button>

          <button
            type="button"
            class="task-delete-btn"
            data-task-id="${task.id}"
          >
            Delete
          </button>
        </div>
      </td>
    `;

    taskList.appendChild(row);
  });
}

// ============================================
// OPEN TASK DETAILS
// ============================================

function openTaskDetails(taskId) {
  const task = sampleTasks.find((item) => item.id === Number(taskId));

  if (!task) return;

  selectedTaskId = task.id;

  // Task information
  detailsTaskId.textContent = task.task_id;
  detailsTitle.textContent = task.title;
  detailsDescription.textContent =
    task.description || "No description provided.";

  detailsDeadline.textContent = formatDeadline(task.deadline);
  detailsPriority.textContent = task.priority;
  detailsStatus.textContent = task.status;

  // ==========================================
  // DISPLAY ASSIGNEES
  // ==========================================

  detailsAssignees.innerHTML = "";

  if (task.assignees.length === 0) {
    detailsAssignees.innerHTML = `
      <div class="details-empty">No assignees.</div>
    `;
  } else {
    task.assignees.forEach((member) => {
      const assignee = document.createElement("div");

      assignee.className = "details-assignee";

      assignee.textContent = `${member.first_name} ${member.last_name}`;

      detailsAssignees.appendChild(assignee);
    });
  }

  // ==========================================
  // DISPLAY ATTACHED FILES
  // ==========================================

  detailsAttachments.innerHTML = "";

  if (task.attachments.length === 0) {
    detailsAttachments.innerHTML = `
      <div class="details-empty">No attached files.</div>
    `;
  } else {
    task.attachments.forEach((file) => {
      const fileElement = document.createElement("div");

      fileElement.className = "details-file";

      fileElement.innerHTML = `
        <span class="details-file-name">
          ${escapeHTML(file.name)}
        </span>

        <span>${escapeHTML(file.type)}</span>
      `;

      detailsAttachments.appendChild(fileElement);
    });
  }

  // ==========================================
  // DISPLAY COMMENTS
  // ==========================================

  renderComments(task);

  // ==========================================
  // DISPLAY SUBMITTED WORK
  // ==========================================

  renderSubmittedWork(task);

  // Open modal
  taskDetailsDialog.showModal();
}

// ============================================
// DISPLAY COMMENTS
// ============================================

function renderComments(task) {
  detailsComments.innerHTML = "";

  if (task.comments.length === 0) {
    detailsComments.innerHTML = `
      <div class="details-empty">
        No comments yet.
      </div>
    `;

    return;
  }

  task.comments.forEach((comment) => {
    const commentElement = document.createElement("div");

    commentElement.className = "details-comment";

    commentElement.innerHTML = `
      <strong>${escapeHTML(comment.author)}</strong>

      <p>${escapeHTML(comment.message)}</p>

      <small>${escapeHTML(comment.date)}</small>
    `;

    detailsComments.appendChild(commentElement);
  });
}

// ============================================
// SEND FEEDBACK / COMMENT
// ============================================

commentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = commentInput.value.trim();

  if (!message) return;

  const task = sampleTasks.find((item) => item.id === selectedTaskId);

  if (!task) return;

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Add comment to sample data
  task.comments.push({
    author: "You (Manager)",
    message: message,
    date: currentDate,
  });

  // Refresh comments
  renderComments(task);

  // Clear input
  commentInput.value = "";
});

// ============================================
// DISPLAY SUBMITTED WORK
// ============================================

function renderSubmittedWork(task) {
  submittedWork.innerHTML = "";

  if (!task.submission) {
    submittedWork.innerHTML = `
      <div class="details-empty">
        No submitted work yet.
      </div>
    `;

    return;
  }

  const submission = task.submission;

  const submissionElement = document.createElement("div");

  submissionElement.className = "submitted-file";

  submissionElement.innerHTML = `
    <div class="submitted-file-info">

      <div>
        <div class="submitted-file-name">
          ${escapeHTML(submission.file_name)}
        </div>

        <small>
          Submitted by ${escapeHTML(submission.submitted_by)}
        </small>

        <small>
          ${escapeHTML(submission.submitted_at)}
        </small>
      </div>

      <span class="task-status ${
        submission.status === "Submitted"
          ? "status-completed"
          : "status-pending"
      }">
        ${escapeHTML(submission.status)}
      </span>

    </div>

    ${
      submission.status === "Submitted"
        ? `
          <button
            type="button"
            class="unsubmit-btn"
            data-task-id="${task.id}"
          >
            Unsubmit
          </button>
        `
        : `
          <p class="details-empty">
            This submission has been returned for revision.
          </p>
        `
    }
  `;

  submittedWork.appendChild(submissionElement);
}

// ============================================
// UNSUBMIT WORK
// RETURN SUBMISSION FOR REVISION
// ============================================

submittedWork.addEventListener("click", (event) => {
  const button = event.target.closest(".unsubmit-btn");

  if (!button) return;

  const taskId = Number(button.dataset.taskId);

  const task = sampleTasks.find((item) => item.id === taskId);

  if (!task || !task.submission) return;

  const confirmUnsubmit = confirm(
    "Are you sure you want to return this submission for revision?",
  );

  if (!confirmUnsubmit) return;

  // Change submission status
  task.submission.status = "Returned for revision";

  // Return task to In Progress
  task.status = "In Progress";

  // Update modal
  detailsStatus.textContent = task.status;

  // Update submission display
  renderSubmittedWork(task);

  // Update table
  renderTaskTable();

  alert("The submission has been returned for revision.");
});

// ============================================
// TASK TABLE BUTTON EVENTS
// DETAILS AND DELETE
// ============================================

taskList.addEventListener("click", (event) => {
  // Details button
  const detailsButton = event.target.closest(".task-details-btn");

  if (detailsButton) {
    openTaskDetails(detailsButton.dataset.taskId);
    return;
  }

  // Delete button
  const deleteButton = event.target.closest(".task-delete-btn");

  if (deleteButton) {
    const taskId = Number(deleteButton.dataset.taskId);

    const confirmDelete = confirm("Are you sure you want to delete this task?");

    if (!confirmDelete) return;

    const index = sampleTasks.findIndex((task) => task.id === taskId);

    if (index !== -1) {
      sampleTasks.splice(index, 1);

      renderTaskTable();

      alert("Sample task deleted successfully.");
    }
  }
});

// ============================================
// CLOSE TASK DETAILS MODAL
// ============================================

closeDetailsBtn.addEventListener("click", () => {
  taskDetailsDialog.close();
});

// ============================================
// INITIALIZE TASK TABLE
// ============================================

renderTaskTable();
