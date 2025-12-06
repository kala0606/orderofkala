// Theme switcher with auto-detection (AM/PM) and manual toggle
// AM = dark mode, PM = light mode
// Manual toggle overrides auto-detection temporarily

let manualOverride = false;
let manualTheme = null;

function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: 'light' } }));
    } else {
        document.body.classList.remove('light-mode');
        window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: 'dark' } }));
    }
}

function getAutoTheme() {
    const currentHour = new Date().getHours();
    return currentHour >= 12 ? 'light' : 'dark';
}

function updateTheme() {
    // If user has manually set a theme, use that
    if (manualOverride) {
        applyTheme(manualTheme);
    } else {
        // Otherwise use auto-detection based on time
        applyTheme(getAutoTheme());
    }
}

// Toggle theme manually
function toggleTheme() {
    const currentTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    manualOverride = true;
    manualTheme = newTheme;
    applyTheme(newTheme);
    
    // Reset manual override after 1 hour to return to auto-detection
    setTimeout(() => {
        manualOverride = false;
        updateTheme();
    }, 3600000); // 1 hour
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
    updateTheme();
    
    // Add click handler to theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});

// Check every minute to see if we've crossed from AM to PM or vice versa
setInterval(updateTheme, 60000);

// Export for use in other modules
window.getCurrentTheme = function() {
    return document.body.classList.contains('light-mode') ? 'light' : 'dark';
};

window.toggleTheme = toggleTheme;

