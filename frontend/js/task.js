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
        submission: null,
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

  // Display attachments
  detailsAttachments.innerHTML = `
      <div class="details-empty">No attached files.</div>
    `;

  // Display comments
  renderComments(task);

  // Display submitted work
  renderSubmittedWork(task);

  taskDetailsDialog.showModal();
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

  const task = managerTasks.find((item) => item.id === selectedTaskId);

  if (!task) return;

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  task.comments.push({
    author: "You (Manager)",
    message,
    date: currentDate,
  });

  renderComments(task);

  commentInput.value = "";
});

// ============================================
// DISPLAY SUBMITTED WORK
// ============================================

function renderSubmittedWork(task) {
  submittedWork.innerHTML = `
      <div class="details-empty">
        No submitted work yet.
      </div>
    `;
}

// ============================================
// RETURN SUBMISSION FOR REVISION
// ============================================

submittedWork.addEventListener("click", (event) => {
  const button = event.target.closest(".return-revision-btn");

  if (!button) return;

  // Submission functionality will be connected
  // to the backend when submission data is loaded.
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
