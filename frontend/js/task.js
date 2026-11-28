// ============================================
// TASK TABLE AND DETAILS MODAL
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

// Actual tasks retrieved from MySQL
let managerTasks = [];

// ============================================
// HELPER FUNCTIONS
// ============================================

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

function formatDeadline(dateString) {
  if (!dateString) return "No deadline";

  const datePart = String(dateString).slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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

// Calculate overall status from employee assignments
function getTaskStatus(task) {
  const members = task.assigned_members || [];

  if (
    members.length > 0 &&
    members.every((member) => member.status === "Completed")
  ) {
    return "Completed";
  }

  if (members.some((member) => member.status === "In Progress")) {
    return "In Progress";
  }

  return "Pending";
}

// ============================================
// LOAD MANAGER'S CREATED TASKS
// ============================================

async function loadManagerTasks() {
  taskList.innerHTML = `
    <tr>
      <td colspan="6">
        <div class="details-empty">Loading tasks...</div>
      </td>
    </tr>
  `;

  try {
    const response = await fetch("/api/tasks/my-created-tasks");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load tasks.");
    }

    managerTasks = data.tasks.map((task) => {
      let members = task.assigned_members;

      if (typeof members === "string") {
        members = JSON.parse(members);
      }

      return {
        ...task,
        assigned_members: Array.isArray(members) ? members : [],
        attachments: [],
        comments: [],
        submissions: [],
      };
    });

    renderTaskTable();
  } catch (error) {
    console.error("Loading manager tasks failed:", error);

    taskList.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="details-empty">
            Unable to load tasks.
          </div>
        </td>
      </tr>
    `;
  }
}

// ============================================
// DISPLAY TASKS IN TABLE
// ============================================

/* ============================================
   CREATE TASK FORM FUNCTIONALITY
============================================ */

// HTML elements
const createTaskButton = document.getElementById("new-task");
const createTaskDialog = document.getElementById("task-dialog");
const closeCreateTaskButton = document.getElementById("close-task");

const createTaskForm = document.getElementById("create-task-form");
const taskTeamSelect = document.getElementById("team");
const taskMemberSelection = document.getElementById("member-selection");

const createTaskSubmitButton = document.getElementById("create-task-btn");

let availableTeamMembers = [];

// ============================================
// OPEN AND CLOSE MODAL
// ============================================

createTaskButton.addEventListener("click", () => {
  createTaskDialog.showModal();
  loadManagerTeams();
});

closeCreateTaskButton.addEventListener("click", () => {
  createTaskDialog.close();
});

// ============================================
// LOAD MANAGER'S TEAMS
// ============================================

async function loadManagerTeams() {
  taskTeamSelect.innerHTML = `
    <option value="">Loading teams...</option>
  `;

  taskMemberSelection.innerHTML = `
    <p class="member-placeholder">Select a team first.</p>
  `;

  try {
    const response = await fetch("/api/teams");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load teams.");
    }

    const teams = Array.isArray(data) ? data : data.teams || [];

    taskTeamSelect.innerHTML = `
      <option value="">Select Team</option>
    `;

    if (teams.length === 0) {
      taskTeamSelect.innerHTML = `
        <option value="">No teams available</option>
      `;
      return;
    }

    // Populate team dropdown
    teams.forEach((team) => {
      const option = document.createElement("option");

      option.value = team.id;
      option.textContent = team.name;

      taskTeamSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading manager teams:", error);

    taskTeamSelect.innerHTML = `
      <option value="">Failed to load teams</option>
    `;
  }
}

// ============================================
// LOAD MEMBERS WHEN TEAM IS SELECTED
// ============================================

taskTeamSelect.addEventListener("change", async () => {
  const teamId = taskTeamSelect.value;

  availableTeamMembers = [];

  if (!teamId) {
    taskMemberSelection.innerHTML = `
      <p class="member-placeholder">Select a team first.</p>
    `;
    return;
  }

  taskMemberSelection.innerHTML = `
    <p class="member-placeholder">Loading team members...</p>
  `;

  try {
    const response = await fetch(
      `/api/teams/${encodeURIComponent(teamId)}/members`,
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load team members.");
    }

    const members = Array.isArray(data) ? data : data.members || [];

    availableTeamMembers = members;

    if (members.length === 0) {
      taskMemberSelection.innerHTML = `
        <p class="member-placeholder">This team has no members yet.</p>
      `;
      return;
    }

    // All checkbox
    let memberHTML = `
      <label class="member-option">
        <input
          type="checkbox"
          id="select-all-members"
        />
        <span>All Members</span>
      </label>
    `;

    // Individual employee checkboxes
    members.forEach((member) => {
      const memberId = member.user_id ?? member.id;

      const fullName = [member.first_name, member.last_name]
        .filter(Boolean)
        .join(" ");

      memberHTML += `
        <label class="member-option">
          <input
            type="checkbox"
            class="individual-member"
            value="${escapeHTML(memberId)}"
          />
          <span>${escapeHTML(fullName || "Unnamed Member")}</span>
        </label>
      `;
    });

    taskMemberSelection.innerHTML = memberHTML;

    // Select All functionality
    const selectAllCheckbox = document.getElementById("select-all-members");

    const individualCheckboxes =
      taskMemberSelection.querySelectorAll(".individual-member");

    selectAllCheckbox.addEventListener("change", () => {
      individualCheckboxes.forEach((checkbox) => {
        checkbox.checked = selectAllCheckbox.checked;
      });
    });

    // Update All checkbox when individual members change
    individualCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        selectAllCheckbox.checked = Array.from(individualCheckboxes).every(
          (item) => item.checked,
        );
      });
    });
  } catch (error) {
    console.error("Loading team members failed:", error);

    taskMemberSelection.innerHTML = `
      <p class="member-placeholder">
        Unable to load team members.
      </p>
    `;

    alert(error.message);
  }
});

// ============================================
// CREATE TASK AND SAVE TO MYSQL
// ============================================

createTaskForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const teamId = taskTeamSelect.value;
  const priority = document.getElementById("priority").value;
  const deadline = document.getElementById("deadline").value;

  // Get selected employee IDs
  const selectedMembers = Array.from(
    taskMemberSelection.querySelectorAll(".individual-member:checked"),
  ).map((checkbox) => Number(checkbox.value));

  // Validate fields
  if (!title || !teamId || !deadline) {
    alert("Please complete the required fields.");
    return;
  }

  if (selectedMembers.length === 0) {
    alert("Please select at least one team member.");
    return;
  }

  const taskData = {
    title,
    description,
    team_id: Number(teamId),
    priority,
    deadline,
    assigned_members: selectedMembers,
  };

  createTaskSubmitButton.disabled = true;
  createTaskSubmitButton.textContent = "Creating...";

  try {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to create task.");
    }

    alert("Task created successfully!");

    // Reset form and close modal
    createTaskForm.reset();

    availableTeamMembers = [];

    taskMemberSelection.innerHTML = `
      <p class="member-placeholder">Select a team first.</p>
    `;

    createTaskDialog.close();

    // Refresh manager's task table
    await loadManagerTasks();
  } catch (error) {
    console.error("Creating task failed:", error);
    alert(error.message);
  } finally {
    createTaskSubmitButton.disabled = false;
    createTaskSubmitButton.textContent = "Create Task";
  }
});

function renderTaskTable() {
  taskList.innerHTML = "";

  if (managerTasks.length === 0) {
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

  managerTasks.forEach((task) => {
    const row = document.createElement("tr");

    const members = task.assigned_members || [];

    const firstAssignee = members[0] ? members[0].first_name : "No assignee";

    const assigneeDisplay =
      members.length > 1 ? `${firstAssignee}...` : firstAssignee;

    const status = getTaskStatus(task);

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
        <span class="task-status ${getStatusClass(status)}">
          ${escapeHTML(status)}
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
  const task = managerTasks.find((item) => item.id === Number(taskId));

  if (!task) return;

  selectedTaskId = task.id;

  detailsTaskId.textContent = task.task_id;
  detailsTitle.textContent = task.title;
  detailsDescription.textContent =
    task.description || "No description provided.";

  detailsDeadline.textContent = formatDeadline(task.deadline);
  detailsPriority.textContent = task.priority;
  detailsStatus.textContent = getTaskStatus(task);

  // Display assigned employees
  detailsAssignees.innerHTML = "";

  if (task.assigned_members.length === 0) {
    detailsAssignees.innerHTML = `
      <div class="details-empty">No assignees.</div>
    `;
  } else {
    task.assigned_members.forEach((member) => {
      const assignee = document.createElement("div");

      assignee.className = "details-assignee";
      assignee.textContent = `${member.first_name} ${member.last_name}`;

      detailsAssignees.appendChild(assignee);
    });
  }

  // Display task attachments
  detailsAttachments.innerHTML = `
    <div class="details-empty">No attached files.</div>
  `;

  // Retrieve saved comments from MySQL
  loadTaskComments(task);

  // Retrieve submitted employee work
  renderSubmittedWork(task);

  taskDetailsDialog.showModal();
}

// ============================================
// LOAD COMMENTS FROM MYSQL
// ============================================

async function loadTaskComments(task) {
  detailsComments.innerHTML = `
    <div class="details-empty">Loading comments...</div>
  `;

  try {
    const response = await fetch(
      `/api/tasks/${encodeURIComponent(task.task_id)}/comments`,
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load comments.");
    }

    task.comments = Array.isArray(data) ? data : [];

    if (selectedTaskId === task.id) {
      renderComments(task);
    }
  } catch (error) {
    console.error("Loading comments failed:", error);

    if (selectedTaskId === task.id) {
      detailsComments.innerHTML = `
        <div class="details-empty">Unable to load comments.</div>
      `;
    }
  }
}

// ============================================
// DISPLAY COMMENTS
// ============================================

function renderComments(task) {
  detailsComments.innerHTML = "";

  if (task.comments.length === 0) {
    detailsComments.innerHTML = `
      <div class="details-empty">No comments yet.</div>
    `;

    return;
  }

  task.comments.forEach((comment) => {
    const commentElement = document.createElement("div");

    commentElement.className = "details-comment";

    const author = comment.first_name
      ? `${comment.first_name} ${comment.last_name}`
      : comment.author || "Unknown";

    const message = comment.comment ?? comment.message ?? "";
    const date = comment.created_at ?? comment.date ?? "";

    commentElement.innerHTML = `
      <strong>${escapeHTML(author)}</strong>
      <p>${escapeHTML(message)}</p>
      <small>${escapeHTML(date)}</small>
    `;

    detailsComments.appendChild(commentElement);
  });
}

// ============================================
// SEND FEEDBACK / COMMENT TO MYSQL
// ============================================

commentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = commentInput.value.trim();

  if (!message) return;

  const task = managerTasks.find((item) => item.id === selectedTaskId);

  if (!task) return;

  const submitButton = commentForm.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    const response = await fetch(
      `/api/tasks/${encodeURIComponent(task.task_id)}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: message,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to send comment.");
    }

    task.comments.push(data);

    renderComments(task);

    commentInput.value = "";
  } catch (error) {
    console.error("Sending comment failed:", error);
    alert(error.message);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
});

// ============================================
// LOAD AND DISPLAY SUBMITTED WORK
// ============================================

async function renderSubmittedWork(task) {
  submittedWork.innerHTML = `
    <div class="details-empty">Loading submitted files...</div>
  `;

  try {
    const response = await fetch(
      `/api/tasks/${encodeURIComponent(task.task_id)}/submissions`,
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load submitted files.");
    }

    const submissions = Array.isArray(data.submissions) ? data.submissions : [];

    task.submissions = submissions;

    // Prevent results from another task appearing in the open modal
    if (selectedTaskId !== task.id) return;

    if (submissions.length === 0) {
      submittedWork.innerHTML = `
        <div class="details-empty">
          No submitted work yet.
        </div>
      `;
      return;
    }

    submittedWork.innerHTML = "";

    submissions.forEach((file) => {
      const fileElement = document.createElement("div");
      fileElement.className = "details-submission";

      fileElement.innerHTML = `
        <div class="submission-info">
          <strong>${escapeHTML(file.file_name)}</strong>
          <p>Submitted by: ${escapeHTML(file.employee_name)}</p>
          <small>${escapeHTML(file.submitted_at || "")}</small>
          <span class="submission-status">
            ${escapeHTML(file.status)}
          </span>
        </div>

        <div class="submission-actions">
          <button
            type="button"
            class="view-submission-btn"
            data-version-id="${escapeHTML(file.version_id)}"
          >
            View File
          </button>

          <button
            type="button"
            class="download-submission-btn"
            data-version-id="${escapeHTML(file.version_id)}"
          >
            Download
          </button>

          ${
            file.status === "Submitted"
              ? `
                <button
                  type="button"
                  class="return-revision-btn"
                  data-version-id="${escapeHTML(file.version_id)}"
                >
                  Return for Revision
                </button>
              `
              : ""
          }
        </div>
      `;

      submittedWork.appendChild(fileElement);
    });
  } catch (error) {
    console.error("Loading submitted work failed:", error);

    if (selectedTaskId === task.id) {
      submittedWork.innerHTML = `
        <div class="details-empty">
          Unable to load submitted files.
        </div>
      `;
    }
  }
}

// ============================================
// SUBMISSION BUTTON EVENTS
// VIEW, DOWNLOAD, AND RETURN
// ============================================

submittedWork.addEventListener("click", async (event) => {
  const viewButton = event.target.closest(".view-submission-btn");
  const downloadButton = event.target.closest(".download-submission-btn");
  const returnButton = event.target.closest(".return-revision-btn");

  const task = managerTasks.find((item) => item.id === selectedTaskId);

  if (!task) return;

  // VIEW FILE
  if (viewButton) {
    const versionId = viewButton.dataset.versionId;

    const url =
      `/api/tasks/${encodeURIComponent(task.task_id)}` +
      `/submissions/${encodeURIComponent(versionId)}/preview`;

    window.open(url, "_blank", "noopener");
    return;
  }

  // DOWNLOAD FILE
  if (downloadButton) {
    const versionId = downloadButton.dataset.versionId;

    const url =
      `/api/tasks/${encodeURIComponent(task.task_id)}` +
      `/submissions/${encodeURIComponent(versionId)}/download`;

    window.open(url, "_blank", "noopener");
    return;
  }

  // RETURN FILE FOR REVISION
  if (returnButton) {
    const versionId = returnButton.dataset.versionId;

    const confirmed = confirm(
      "Are you sure you want to return this submission for revision?",
    );

    if (!confirmed) return;

    returnButton.disabled = true;

    try {
      const response = await fetch(
        `/api/tasks/${encodeURIComponent(task.task_id)}` +
          `/submissions/${encodeURIComponent(versionId)}/return`,
        {
          method: "PATCH",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to return submission.");
      }

      alert("Submission returned for revision.");

      await renderSubmittedWork(task);
    } catch (error) {
      console.error("Returning submission failed:", error);
      alert(error.message);

      returnButton.disabled = false;
    }
  }
});

// ============================================
// TASK TABLE BUTTON EVENTS
// DETAILS AND DELETE
// ============================================

taskList.addEventListener("click", (event) => {
  const detailsButton = event.target.closest(".task-details-btn");

  if (detailsButton) {
    openTaskDetails(detailsButton.dataset.taskId);
    return;
  }

  const deleteButton = event.target.closest(".task-delete-btn");

  if (deleteButton) {
    alert("Task deletion is not connected to the backend yet.");
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

loadManagerTasks();
