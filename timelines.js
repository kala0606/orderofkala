// Timelines Page Control Logic
// Global state management for the timelines project

// State
let timelinesState = {
    mode: 'live', // 'live' or 'custom'
    customHours: 12,
    customMinutes: 0,
    customSeconds: 0,
    downloadWidth: 1920,
    downloadHeight: 1080,
    isCustomResolution: false
};

// Initialize controls after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeControls();
    initializeTimeDisplay();
    initializeHeaderThemeToggle();
    initializeScrollArrow();
    
    // Wait for p5 to be ready
    setTimeout(() => {
        if (window.timelinesSketch) {
            console.log('Timelines sketch loaded successfully');
        }
    }, 1000);
});

// Initialize scroll down arrow
function initializeScrollArrow() {
    const scrollArrow = document.getElementById('scroll-down-arrow');
    if (scrollArrow) {
        scrollArrow.addEventListener('click', () => {
            const controlPanel = document.getElementById('control-panel');
            if (controlPanel) {
                controlPanel.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
        
        // Hide arrow when user scrolls down
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                scrollArrow.style.opacity = '0';
                scrollArrow.style.pointerEvents = 'none';
            } else {
                scrollArrow.style.opacity = '0.8';
                scrollArrow.style.pointerEvents = 'auto';
            }
        });
    }
}

// Initialize header theme toggle
function initializeHeaderThemeToggle() {
    const themeToggleHeader = document.getElementById('theme-toggle-header');
    if (themeToggleHeader && typeof window.toggleTheme === 'function') {
        themeToggleHeader.addEventListener('click', window.toggleTheme);
    }
}

// Initialize all control event listeners
function initializeControls() {
    // Mode toggle buttons
    const liveModeBtn = document.getElementById('live-mode-btn');
    const customModeBtn = document.getElementById('custom-mode-btn');
    const customTimeControls = document.getElementById('custom-time-controls');
    
    if (liveModeBtn) {
        liveModeBtn.addEventListener('click', () => {
            setMode('live');
            liveModeBtn.classList.add('active');
            customModeBtn.classList.remove('active');
            if (customTimeControls) customTimeControls.style.display = 'none';
        });
    }
    
    if (customModeBtn) {
        customModeBtn.addEventListener('click', () => {
            setMode('custom');
            customModeBtn.classList.add('active');
            liveModeBtn.classList.remove('active');
            if (customTimeControls) customTimeControls.style.display = 'block';
        });
    }
    
    // Apply custom time button
    const applyTimeBtn = document.getElementById('apply-time-btn');
    if (applyTimeBtn) {
        applyTimeBtn.addEventListener('click', applyCustomTime);
    }
    
    // Time input change listeners
    const hoursInput = document.getElementById('hours-input');
    const minutesInput = document.getElementById('minutes-input');
    
    if (hoursInput) {
        hoursInput.addEventListener('input', (e) => {
            let value = parseInt(e.target.value) || 0;
            value = Math.max(0, Math.min(23, value));
            e.target.value = value;
            timelinesState.customHours = value;
        });
    }
    
    if (minutesInput) {
        minutesInput.addEventListener('input', (e) => {
            let value = parseInt(e.target.value) || 0;
            value = Math.max(0, Math.min(59, value));
            e.target.value = value;
            timelinesState.customMinutes = value;
        });
    }
    
    // Resolution buttons
    const resolutionBtns = document.querySelectorAll('.resolution-btn:not(.custom-res-btn)');
    resolutionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const width = parseInt(btn.dataset.width);
            const height = parseInt(btn.dataset.height);
            setResolution(width, height, false);
            
            // Update active state
            resolutionBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('custom-res-btn').classList.remove('active');
            document.getElementById('custom-resolution').style.display = 'none';
        });
    });
    
    // Custom resolution button
    const customResBtn = document.getElementById('custom-res-btn');
    const customResolution = document.getElementById('custom-resolution');
    
    if (customResBtn && customResolution) {
        customResBtn.addEventListener('click', () => {
            timelinesState.isCustomResolution = true;
            customResolution.style.display = 'block';
            
            // Update active state
            resolutionBtns.forEach(b => b.classList.remove('active'));
            customResBtn.classList.add('active');
            
            // Get custom values
            const width = parseInt(document.getElementById('custom-width').value) || 1920;
            const height = parseInt(document.getElementById('custom-height').value) || 1080;
            setResolution(width, height, true);
        });
    }
    
    // Custom resolution inputs
    const customWidthInput = document.getElementById('custom-width');
    const customHeightInput = document.getElementById('custom-height');
    
    if (customWidthInput) {
        customWidthInput.addEventListener('input', (e) => {
            let value = parseInt(e.target.value) || 1920;
            value = Math.max(100, Math.min(7680, value));
            timelinesState.downloadWidth = value;
        });
    }
    
    if (customHeightInput) {
        customHeightInput.addEventListener('input', (e) => {
            let value = parseInt(e.target.value) || 1080;
            value = Math.max(100, Math.min(4320, value));
            timelinesState.downloadHeight = value;
        });
    }
    
    // Download button
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadTimelines);
    }
}

// Initialize time display updates
function initializeTimeDisplay() {
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000);
}

// Update the time display
function updateTimeDisplay() {
    const timeDisplay = document.getElementById('time-display');
    if (!timeDisplay) return;
    
    if (timelinesState.mode === 'live') {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    } else {
        const hours = String(timelinesState.customHours).padStart(2, '0');
        const minutes = String(timelinesState.customMinutes).padStart(2, '0');
        const seconds = String(timelinesState.customSeconds).padStart(2, '0');
        timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

// Set time mode
function setMode(mode) {
    timelinesState.mode = mode;
    
    // Update global variable for sketch.js
    if (window.setTimelineMode) {
        window.setTimelineMode(mode);
    }
    
    console.log('Mode set to:', mode);
}

// Apply custom time
function applyCustomTime() {
    const hours = timelinesState.customHours;
    const minutes = timelinesState.customMinutes;
    
    console.log('Applying custom time:', hours, ':', minutes);
    
    // Update global variables for sketch.js
    if (window.setCustomTime) {
        window.setCustomTime(hours, minutes, 0);
    }
    
    // Update display
    updateTimeDisplay();
    
    // Show feedback
    const btn = document.getElementById('apply-time-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Applied!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 1500);
}

// Set download resolution
function setResolution(width, height, isCustom) {
    timelinesState.downloadWidth = width;
    timelinesState.downloadHeight = height;
    timelinesState.isCustomResolution = isCustom;
    
    console.log('Resolution set to:', width, 'x', height);
}

// Download timelines as image
async function downloadTimelines() {
    console.log('Starting download...');
    showLoading();
    
    try {
        // Get the p5 instance
        if (!window.timelinesP5) {
            throw new Error('p5 instance not found');
        }
        
        if (!window.renderTimelinesAtResolution) {
            throw new Error('Render function not available');
        }
        
        const p5Instance = window.timelinesP5;
        
        // Get target dimensions
        const targetWidth = timelinesState.downloadWidth;
        const targetHeight = timelinesState.downloadHeight;
        
        console.log(`Generating ${targetWidth}x${targetHeight} image...`);
        
        // Store original dimensions and visibility
        const originalWidth = p5Instance.width;
        const originalHeight = p5Instance.height;
        const canvasContainer = document.getElementById('canvas-container');
        const originalDisplay = canvasContainer.style.display;
        
        // Hide the canvas container during rendering to avoid visual disruption
        canvasContainer.style.display = 'none';
        
        // Resize the canvas to target resolution
        p5Instance.resizeCanvas(targetWidth, targetHeight);
        
        // Wait a tick for resize to complete
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Render the sketch at the new resolution
        // This calls the exposed render function which redraws everything
        window.renderTimelinesAtResolution(targetWidth, targetHeight);
        
        // Wait for the render to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get the canvas and export
        const canvas = p5Instance.canvas;
        
        // Create download link
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            // Generate filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const timeStr = timelinesState.mode === 'live' ? 
                'live' : 
                `${String(timelinesState.customHours).padStart(2, '0')}-${String(timelinesState.customMinutes).padStart(2, '0')}`;
            link.download = `timelines-${timeStr}-${targetWidth}x${targetHeight}-${timestamp}.png`;
            
            link.href = url;
            link.click();
            
            // Cleanup
            URL.revokeObjectURL(url);
            
            // Restore original canvas size
            p5Instance.resizeCanvas(originalWidth, originalHeight);
            
            // Wait a tick for resize to complete
            setTimeout(() => {
                // Redraw at original size
                window.renderTimelinesAtResolution(originalWidth, originalHeight);
                
                // Restore visibility
                canvasContainer.style.display = originalDisplay;
                
                hideLoading();
                
                console.log('Download complete!');
            }, 100);
            
        }, 'image/png');
        
    } catch (error) {
        console.error('Download error:', error);
        
        // Restore visibility on error
        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer) {
            canvasContainer.style.display = '';
        }
        
        hideLoading();
        alert('Failed to download image. Please try again.');
    }
}

// Show loading overlay
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

// Hide loading overlay
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Export functions for use by sketch.js
window.getTimelinesMode = () => timelinesState.mode;
window.getCustomTime = () => ({
    hours: timelinesState.customHours,
    minutes: timelinesState.customMinutes,
    seconds: timelinesState.customSeconds
});

// Helper function to get current time based on mode
window.getCurrentTimeForTimelines = () => {
    if (timelinesState.mode === 'live') {
        const now = new Date();
        return {
            hours: now.getHours(),
            minutes: now.getMinutes(),
            seconds: now.getSeconds()
        };
    } else {
        return {
            hours: timelinesState.customHours,
            minutes: timelinesState.customMinutes,
            seconds: timelinesState.customSeconds
        };
    }
};

