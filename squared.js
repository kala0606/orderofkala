// Squared Page Control Logic
// Control panel interactions for the Squared generative sculpture

document.addEventListener('DOMContentLoaded', () => {
    initializeControls();
    initializeHeaderThemeToggle();
    initializeThemeObserver();
});

// Initialize header theme toggle
function initializeHeaderThemeToggle() {
    const themeToggleHeader = document.getElementById('theme-toggle-header');
    if (themeToggleHeader && typeof window.toggleTheme === 'function') {
        themeToggleHeader.addEventListener('click', window.toggleTheme);
    }
}

// Watch for theme changes and update canvas background
function initializeThemeObserver() {
    // Create a MutationObserver to watch for class changes on body
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                updateCanvasBackground();
            }
        });
    });
    
    observer.observe(document.body, { attributes: true });
    
    // Initial background update
    setTimeout(updateCanvasBackground, 100);
}

// Update canvas background based on theme
function updateCanvasBackground() {
    if (window.squaredAPI && window.squaredAPI.setBackgroundColor) {
        const isLightMode = document.body.classList.contains('light-mode');
        window.squaredAPI.setBackgroundColor(isLightMode ? 0xd0d0d0 : 0x2a2a2a);
    }
}

// Initialize all control event listeners
function initializeControls() {
    // Regenerate button
    const regenerateBtn = document.getElementById('regenerate');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', () => {
            if (window.squaredAPI) {
                window.squaredAPI.regenerate();
            }
        });
    }
    
    // Toggle Wireframe button
    const wireframeBtn = document.getElementById('toggleWireframe');
    if (wireframeBtn) {
        wireframeBtn.addEventListener('click', () => {
            if (window.squaredAPI) {
                const isWireframe = window.squaredAPI.toggleWireframe();
                wireframeBtn.classList.toggle('active', isWireframe);
            }
        });
    }
    
    // Toggle Rotation button
    const rotationBtn = document.getElementById('toggleRotation');
    const rotationText = document.getElementById('rotationText');
    if (rotationBtn) {
        rotationBtn.addEventListener('click', () => {
            if (window.squaredAPI) {
                const isRotating = window.squaredAPI.toggleRotation();
                rotationBtn.classList.toggle('active', isRotating);
                if (rotationText) {
                    rotationText.textContent = isRotating ? 'Rotating' : 'Paused';
                }
            }
        });
    }
    
    // Download Light button
    const downloadLightBtn = document.getElementById('downloadLight');
    if (downloadLightBtn) {
        downloadLightBtn.addEventListener('click', () => {
            if (window.squaredAPI) {
                window.squaredAPI.downloadLight();
            }
        });
    }
    
    // Download Dark button
    const downloadDarkBtn = document.getElementById('downloadDark');
    if (downloadDarkBtn) {
        downloadDarkBtn.addEventListener('click', () => {
            if (window.squaredAPI) {
                window.squaredAPI.downloadDark();
            }
        });
    }
}
