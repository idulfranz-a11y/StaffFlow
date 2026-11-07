const workers = {
  employees: 95,
  managers: 4,
  pending: 6,
  inactive: 10,
};

const total = Object.values(workers).reduce((sum, count) => sum + count, 0);

document.querySelectorAll(".bar").forEach((bar) => {
  const type = [...bar.classList].find((name) => workers[name] !== undefined);

  const percentage = total > 0 ? (workers[type] / total) * 100 : 0;

  bar.style.width = `${percentage}%`;
});
