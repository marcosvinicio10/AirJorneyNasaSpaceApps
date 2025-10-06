/**
 * Background Audio - Only on Importance Page
 * Plays low music only on importance.html page
 */

// Global variable for audio
let importanceAudio = null;

/**
 * Initialize audio only on importance page
 */
function initImportanceAudio() {
    // Check if we're on the importance page
    const currentPage = getCurrentPage();
    if (currentPage !== 'importance') {
        return;
    }
    
    
    // Create audio element
    importanceAudio = new Audio();
    importanceAudio.src = '../assets/audio/background_som.mp3';
    importanceAudio.loop = true;
    importanceAudio.volume = 0.2; // Low volume (20%)
    importanceAudio.preload = 'auto';
    
    // Event listeners
    importanceAudio.addEventListener('canplaythrough', () => {
        tryPlayImportanceAudio();
    });
    
    importanceAudio.addEventListener('error', (e) => {
    });
    
    importanceAudio.addEventListener('play', () => {
    });
    
    importanceAudio.addEventListener('pause', () => {
    });
}

/**
 * Detect current page
 */
function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop().replace('.html', '');
    
    if (filename === 'importance' || path.includes('importance.html')) {
        return 'importance';
    }
    
    return 'other';
}

/**
 * Try to play importance page audio
 */
function tryPlayImportanceAudio() {
    if (!importanceAudio) {
        return;
    }
    
    // Verifica se já está tocando
    if (!importanceAudio.paused) {
        return;
    }
    
    
    importanceAudio.play()
        .then(() => {
        })
        .catch((error) => {
            setupUserInteraction();
        });
}

/**
 * Setup listener for user interaction
 */
function setupUserInteraction() {
    const startAudio = () => {
        if (importanceAudio && importanceAudio.paused) {
            importanceAudio.play().catch(e => {});
        }
        
        // Remove listeners after first click
        document.removeEventListener('click', startAudio);
        document.removeEventListener('keydown', startAudio);
        document.removeEventListener('touchstart', startAudio);
    };
    
    document.addEventListener('click', startAudio, { once: true });
    document.addEventListener('keydown', startAudio, { once: true });
    document.addEventListener('touchstart', startAudio, { once: true });
}

/**
 * Stop audio when leaving importance page
 */
function stopImportanceAudio() {
    if (importanceAudio && !importanceAudio.paused) {
        importanceAudio.pause();
        importanceAudio.currentTime = 0;
    }
}

/**
 * Pause audio when page loses focus
 */
function pauseImportanceAudio() {
    if (importanceAudio && !importanceAudio.paused) {
        importanceAudio.pause();
    }
}

/**
 * Resume audio when page regains focus
 */
function resumeImportanceAudio() {
    if (importanceAudio && importanceAudio.paused) {
        importanceAudio.play().catch(e => {});
    }
}

/**
 * Set audio volume
 */
function setImportanceAudioVolume(volume) {
    if (importanceAudio) {
        importanceAudio.volume = Math.max(0, Math.min(1, volume));
    }
}

/**
 * Get audio information
 */
function getImportanceAudioInfo() {
    if (!importanceAudio) {
        return { error: 'Importance page audio not initialized' };
    }
    
    return {
        isPlaying: !importanceAudio.paused,
        volume: importanceAudio.volume,
        duration: importanceAudio.duration || 0,
        currentTime: importanceAudio.currentTime || 0,
        readyState: importanceAudio.readyState
    };
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initImportanceAudio();
});

// Pause when page loses focus
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseImportanceAudio();
    } else {
        resumeImportanceAudio();
    }
});

// Stop audio when leaving page
window.addEventListener('beforeunload', () => {
    stopImportanceAudio();
});

// Make functions globally available for debug
window.importanceAudio = {
    play: tryPlayImportanceAudio,
    pause: pauseImportanceAudio,
    resume: resumeImportanceAudio,
    stop: stopImportanceAudio,
    setVolume: setImportanceAudioVolume,
    getInfo: getImportanceAudioInfo
};

