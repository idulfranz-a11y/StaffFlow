// ==================================
// TEMPORARY TASK DATA
// ==================================

// ==================================
// GET HTML ELEMENTS
// ==================================

const taskList = document.getElementById("mytask-list");
const taskCount = document.getElementById("task-count");

const taskModal = document.getElementById("task-modal");
const closeModal = document.getElementById("close-task-modal");

const modalTaskId = document.getElementById("modal-task-id");
const modalTaskTitle = document.getElementById("modal-task-title");

const modalDescription = document.getElementById("modal-description");
const modalAssignedBy = document.getElementById("modal-assigned-by");
const modalTeam = document.getElementById("modal-team");
const modalDeadline = document.getElementById("modal-deadline");
const modalPriority = document.getElementById("modal-priority");

const modalStatus = document.getElementById("modal-status");

const progressList = document.getElementById("progress-list");
const commentList = document.getElementById("comment-list");

const progressInput = document.getElementById("progress-input");
const commentInput = document.getElementById("comment-input");

const addProgress = document.getElementById("add-progress");
const addComment = document.getElementById("add-comment");

// Submission elements
const submissionStatus = document.getElementById("submission-status");
const submissionFile = document.getElementById("submission-file");
const selectedSubmissionFile = document.getElementById(
  "selected-submission-file",
);
const submitWork = document.getElementById("submit-work");
const unsubmitWork = document.getElementById("unsubmit-work");
let tasks = [];
let selectedTask = null;

// ==================================
// HELPER: PREVENT HTML INJECTION
// ==================================

function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}

// ==================================
// RENDER TASK TABLE
// ==================================

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const row = document.createElement("tr");

    row.classList.add("mytask-row");

    const priorityClass = task.priority.toLowerCase();
    const statusClass = task.status.toLowerCase().replace(" ", "-");

    row.innerHTML = `
      <td>
        <span class="task-name">
          ${escapeHTML(task.title)}
        </span>
      </td>

      <td>${escapeHTML(task.assignedBy)}</td>

      <td>${escapeHTML(task.deadline)}</td>

      <td>
        <span class="priority ${priorityClass}">
          ${escapeHTML(task.priority)}
        </span>
      </td>

      <td>
        <span class="status ${statusClass}">
          ${escapeHTML(task.status)}
        </span>
      </td>
    `;

    row.addEventListener("click", () => {
      openTaskModal(task.id);
    });

    taskList.appendChild(row);
  });

  taskCount.textContent = `${tasks.length} Tasks`;
}

// ==================================
// OPEN TASK MODAL
// ==================================

function openTaskModal(taskId) {
  selectedTask = tasks.find((task) => task.id === taskId);

  if (!selectedTask) return;

  modalTaskId.textContent = selectedTask.id;
  modalTaskTitle.textContent = selectedTask.title;

  modalDescription.textContent = selectedTask.description;

  modalAssignedBy.textContent = selectedTask.assignedBy;
  modalTeam.textContent = selectedTask.team;
  modalDeadline.textContent = selectedTask.deadline;
  modalPriority.textContent = selectedTask.priority;

  modalStatus.value = selectedTask.status;

  renderActivity();
  renderSubmission();

  taskModal.hidden = false;
  document.body.style.overflow = "hidden";
}

// ==================================
// CLOSE TASK MODAL
// ==================================

function closeTaskModal() {
  taskModal.hidden = true;

  document.body.style.overflow = "";

  selectedTask = null;
}

closeModal.addEventListener("click", closeTaskModal);

taskModal.addEventListener("click", (event) => {
  if (event.target === taskModal) {
    closeTaskModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !taskModal.hidden) {
    closeTaskModal();
  }
});

// ==================================
// UPDATE TASK STATUS
// ==================================

modalStatus.addEventListener("change", () => {
  if (!selectedTask) return;

  selectedTask.status = modalStatus.value;

  renderTasks();
});

// ==================================
// RENDER PROGRESS AND COMMENTS
// ==================================

function renderActivity() {
  if (!selectedTask) return;

  // Progress updates
  progressList.innerHTML = "";

  if (selectedTask.progress.length === 0) {
    progressList.innerHTML = `<p>No progress updates yet.</p>`;
  } else {
    selectedTask.progress.forEach((item) => {
      const activity = document.createElement("div");

      activity.classList.add("task-activity");

      activity.innerHTML = `
        <strong>${escapeHTML(item.author)}</strong>
        <p>${escapeHTML(item.message)}</p>
        <small>${escapeHTML(item.date)}</small>
      `;

      progressList.appendChild(activity);
    });
  }

  // Comments
  commentList.innerHTML = "";

  if (selectedTask.comments.length === 0) {
    commentList.innerHTML = `<p>No comments yet.</p>`;
  } else {
    selectedTask.comments.forEach((item) => {
      const activity = document.createElement("div");

      activity.classList.add("task-activity");

      activity.innerHTML = `
        <strong>${escapeHTML(item.author)}</strong>
        <p>${escapeHTML(item.message)}</p>
        <small>${escapeHTML(item.date)}</small>
      `;

      commentList.appendChild(activity);
    });
  }
}

// ==================================
// ADD PROGRESS UPDATE
// ==================================

addProgress.addEventListener("click", () => {
  if (!selectedTask) return;

  const message = progressInput.value.trim();

  if (!message) {
    alert("Please enter a progress update.");
    return;
  }

  selectedTask.progress.push({
    author: "You",
    message: message,
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  });

  progressInput.value = "";

  renderActivity();
});

// ==================================
// ADD COMMENT
// ==================================

addComment.addEventListener("click", () => {
  if (!selectedTask) return;

  const message = commentInput.value.trim();

  if (!message) {
    alert("Please enter a comment.");
    return;
  }

  selectedTask.comments.push({
    author: "You",
    message: message,
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  });

  commentInput.value = "";

  renderActivity();
});

// ==================================
// RENDER WORK SUBMISSION
// ==================================

function renderSubmission() {
  if (!selectedTask) return;

  // Create submission data if it does not exist yet
  if (!selectedTask.submission) {
    selectedTask.submission = {
      file: null,
      status: "Not submitted",
      submittedAt: null,
    };
  }

  const submission = selectedTask.submission;
  const isSubmitted = submission.status === "Submitted";

  // Display submission status
  submissionStatus.innerHTML = "";

  const statusText = document.createElement("p");
  statusText.textContent = `Status: ${submission.status}`;

  submissionStatus.appendChild(statusText);

  // Display previously selected file
  selectedSubmissionFile.textContent = submission.file
    ? `Selected file: ${submission.file.name}`
    : "No file selected.";

  // Show the correct buttons
  submitWork.hidden = isSubmitted;
  unsubmitWork.hidden = !isSubmitted;

  // Change button label after withdrawal
  submitWork.textContent =
    submission.status === "Withdrawn" ? "Submit Work Again" : "Submit Work";

  // Do not allow replacing a file while it is submitted
  submissionFile.disabled = isSubmitted;
}

// ==================================
// SELECT WORK FILE
// ==================================

submissionFile.addEventListener("change", () => {
  if (!selectedTask) return;

  const file = submissionFile.files[0];

  if (!file) return;

  if (!selectedTask.submission) {
    selectedTask.submission = {
      file: null,
      status: "Not submitted",
      submittedAt: null,
    };
  }

  // Keep the selected file in temporary task data
  selectedTask.submission.file = file;

  renderSubmission();
});

// ==================================
// SUBMIT WORK
// ==================================

submitWork.addEventListener("click", () => {
  if (!selectedTask) return;

  const submission = selectedTask.submission;

  if (!submission || !submission.file) {
    alert("Please select a file before submitting your work.");
    return;
  }

  submission.status = "Submitted";

  submission.submittedAt = new Date().toLocaleString();

  renderSubmission();

  alert("Your work has been submitted successfully.");
});

// ==================================
// UNSUBMIT WORK
// ==================================

unsubmitWork.addEventListener("click", () => {
  if (!selectedTask) return;

  const submission = selectedTask.submission;

  if (!submission || submission.status !== "Submitted") return;

  const confirmUnsubmit = confirm(
    "Are you sure you want to unsubmit your work?",
  );

  if (!confirmUnsubmit) return;

  // Keep the previous file so the employee can submit it again
  submission.status = "Withdrawn";
  submission.submittedAt = null;

  // Clear the file input visually.
  // The previously selected File object remains in submission.file.
  submissionFile.value = "";

  renderSubmission();

  alert("Your submission has been withdrawn. You can submit it again.");
});

// ==================================
// LOAD TASKS FROM DATABASE
// ==================================

async function loadTasks() {
  try {
    const response = await fetch("/api/tasks/my-tasks");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load tasks.");
    }

    tasks = data.tasks.map((task) => ({
      ...task,
      status: "Pending",
      team: `Team ${task.team_id}`,
      progress: [],
      comments: [],
      submission: {
        file: null,
        status: "Not submitted",
        submittedAt: null,
      },
    }));

    renderTasks();
  } catch (error) {
    console.error("Task loading failed:", error);
    taskList.innerHTML = "<tr><td colspan='5'>Unable to load tasks.</td></tr>";
  }
}

// ==================================
// INITIALIZE
// ==================================

loadTasks();
