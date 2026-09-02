// Set current year
document.getElementById("year").textContent = new Date().getFullYear();

// Reveal animations on scroll
const revealElements = document.querySelectorAll('.fade-up, .scale-in');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.2 });

revealElements.forEach(el => observer.observe(el));
