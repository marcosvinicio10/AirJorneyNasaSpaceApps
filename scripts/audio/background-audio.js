/**
 * Sistema de Áudio de Fundo Simples
 * Toca uma música baixa durante toda a experiência
 */

// Variável global para o áudio
let backgroundAudio = null;
let isAudioInitialized = false;

/**
 * Inicializa o áudio de fundo
 */
function initBackgroundAudio() {
    // Evita múltiplas inicializações
    if (isAudioInitialized) {
        return;
    }
    
    
    // Cria o elemento de áudio
    backgroundAudio = new Audio();
    backgroundAudio.src = getAudioPath();
    backgroundAudio.loop = true;
    backgroundAudio.volume = 0.1; // Volume bem baixo (10%)
    backgroundAudio.preload = 'auto';
    
    // Event listeners
    backgroundAudio.addEventListener('canplaythrough', () => {
        tryPlayAudio();
    });
    
    backgroundAudio.addEventListener('error', (e) => {
    });
    
    backgroundAudio.addEventListener('play', () => {
    });
    
    backgroundAudio.addEventListener('pause', () => {
    });
    
    isAudioInitialized = true;
    
    // Tenta reproduzir após um pequeno delay
    setTimeout(() => {
        tryPlayAudio();
    }, 1000);
}

/**
 * Determina o caminho correto do áudio
 */
function getAudioPath() {
    const path = window.location.pathname;
    
    // Se estamos em pages/, usar caminho relativo
    if (path.includes('/pages/') || path.includes('pages/')) {
        return '../assets/audio/background_som.mp3';
    }
    
    // Se estamos na raiz
    return 'assets/audio/background_som.mp3';
}

/**
 * Tenta reproduzir o áudio
 */
function tryPlayAudio() {
    if (!backgroundAudio) {
        return;
    }
    
    // Verifica se já está tocando
    if (!backgroundAudio.paused) {
        return;
    }
    
    
    backgroundAudio.play()
        .then(() => {
        })
        .catch((error) => {
            setupUserInteraction();
        });
}

/**
 * Configura listener para interação do usuário
 */
function setupUserInteraction() {
    const startAudio = () => {
        if (backgroundAudio && backgroundAudio.paused) {
            backgroundAudio.play().catch(e => {});
        }
        
        // Remove os listeners após o primeiro clique
        document.removeEventListener('click', startAudio);
        document.removeEventListener('keydown', startAudio);
        document.addEventListener('touchstart', startAudio);
    };
    
    document.addEventListener('click', startAudio, { once: true });
    document.addEventListener('keydown', startAudio, { once: true });
    document.addEventListener('touchstart', startAudio, { once: true });
}

/**
 * Pausa o áudio
 */
function pauseAudio() {
    if (backgroundAudio && !backgroundAudio.paused) {
        backgroundAudio.pause();
    }
}

/**
 * Retoma o áudio
 */
function resumeAudio() {
    if (backgroundAudio && backgroundAudio.paused) {
        backgroundAudio.play().catch(e => {});
    }
}

/**
 * Para o áudio completamente
 */
function stopAudio() {
    if (backgroundAudio) {
        backgroundAudio.pause();
        backgroundAudio.currentTime = 0;
    }
}

/**
 * Define o volume do áudio
 */
function setVolume(volume) {
    if (backgroundAudio) {
        backgroundAudio.volume = Math.max(0, Math.min(1, volume));
    }
}

/**
 * Obtém informações do áudio
 */
function getAudioInfo() {
    if (!backgroundAudio) {
        return { error: 'Áudio não inicializado' };
    }
    
    return {
        isPlaying: !backgroundAudio.paused,
        volume: backgroundAudio.volume,
        duration: backgroundAudio.duration || 0,
        currentTime: backgroundAudio.currentTime || 0,
        readyState: backgroundAudio.readyState
    };
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    initBackgroundAudio();
});

// Pausa quando a página perde o foco
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseAudio();
    } else {
        resumeAudio();
    }
});

// Torna as funções disponíveis globalmente para debug
window.backgroundAudio = {
    init: initBackgroundAudio,
    play: tryPlayAudio,
    pause: pauseAudio,
    resume: resumeAudio,
    stop: stopAudio,
    setVolume: setVolume,
    getInfo: getAudioInfo
};

