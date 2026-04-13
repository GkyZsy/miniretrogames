const panels = document.querySelectorAll('.panel');
const navButtons = document.querySelectorAll('.nav-pill');

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.panel;
    navButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
    panels.forEach((panel) => panel.classList.toggle('active', panel.id === target));
  });
});
