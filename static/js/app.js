// Sidebar toggle
document.addEventListener('DOMContentLoaded', function() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
      mainContent.classList.toggle('expanded');
    });
  }

  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      document.documentElement.toggleAttribute('data-theme');
      const icon = themeToggle.querySelector('i');
      icon.classList.toggle('bi-moon-stars-fill');
      icon.classList.toggle('bi-sun-fill');
    });
  }
});

// Store low stock assets globally for notifications
window.low_stock_global = [];
