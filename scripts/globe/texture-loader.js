// ===== CARREGADOR DE TEXTURAS =====
// Este arquivo gerencia o carregamento de texturas da NASA

// Carregar texturas
function loadTextures() {
    
    const loader = new THREE.TextureLoader();
    
    // Configurar crossOrigin para evitar erros de CORS
    loader.crossOrigin = 'anonymous';
    
    let loadedCount = 0;
    const totalTextures = 5;
    
    // Função para verificar se todas as texturas foram carregadas
    function checkAllLoaded() {
        loadedCount++;
        
        if (loadedCount >= totalTextures) {
            updateEarthWithTextures();
            updateAtmosphereWithTextures();
        }
    }
    
    // Função para criar texturas de fallback
    function createFallbackTexture(color = 0x404040) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.fillRect(0, 0, 512, 512);
        return new THREE.CanvasTexture(canvas);
    }

    // Carregar texturas da Terra - PRIMEIRO tentar texturas locais
    const earthSurfaceTexture = loader.load(
        localTextures.earth.surface,
        () => {
            checkAllLoaded();
        },
        undefined,
        (error) => {
            // Tentar textura externa como fallback
            loader.load(
        textures.earth.surface,
        () => checkAllLoaded(),
        undefined,
                (externalError) => {
                    console.warn('Erro ao carregar textura externa, usando fallback:', externalError);
            window.earthTextures.surface = createFallbackTexture(0x4a90e2);
            checkAllLoaded();
                }
            );
        }
    );
    
    const earthBumpTexture = loader.load(
        localTextures.earth.bump,
        () => {
            checkAllLoaded();
        },
        undefined,
        (error) => {
            // Tentar textura externa como fallback
            loader.load(
        textures.earth.bump,
        () => checkAllLoaded(),
        undefined,
                (externalError) => {
                    console.warn('Erro ao carregar textura externa, usando fallback:', externalError);
            window.earthTextures.bump = createFallbackTexture(0x808080);
            checkAllLoaded();
                }
            );
        }
    );
    
    const earthSpecularTexture = loader.load(
        localTextures.earth.specular,
        () => {
            checkAllLoaded();
        },
        undefined,
        (error) => {
            // Tentar textura externa como fallback
            loader.load(
        textures.earth.specular,
        () => checkAllLoaded(),
        undefined,
                (externalError) => {
                    console.warn('Erro ao carregar textura externa, usando fallback:', externalError);
            window.earthTextures.specular = createFallbackTexture(0x0000ff);
            checkAllLoaded();
                }
            );
        }
    );

    // Carregar texturas atmosféricas - PRIMEIRO tentar texturas locais
    const ozoneTexture = loader.load(
        localTextures.atmosphere.ozone,
        () => {
            checkAllLoaded();
        },
        undefined,
        (error) => {
            // Tentar textura externa como fallback
            loader.load(
        textures.atmosphere.ozone,
        () => checkAllLoaded(),
        undefined,
                (externalError) => {
                    console.warn('Erro ao carregar textura externa, usando fallback:', externalError);
            window.atmosphereTextures.ozone = createFallbackTexture(0x00ff00);
            checkAllLoaded();
                }
            );
        }
    );
    
    const co2Texture = loader.load(
        localTextures.atmosphere.co2,
        () => {
            checkAllLoaded();
        },
        undefined,
        (error) => {
            // Tentar textura externa como fallback
            loader.load(
        textures.atmosphere.co2,
        () => checkAllLoaded(),
        undefined,
                (externalError) => {
                    console.warn('Erro ao carregar textura externa, usando fallback:', externalError);
            window.atmosphereTextures.co2 = createFallbackTexture(0xff6600);
            checkAllLoaded();
                }
            );
        }
    );

    // Armazenar texturas globalmente
    window.earthTextures = {
        surface: earthSurfaceTexture,
        bump: earthBumpTexture,
        specular: earthSpecularTexture
    };
    
    window.atmosphereTextures = {
        ozone: ozoneTexture,
        co2: co2Texture
    };
    
    // Timeout de segurança - se não carregar em 5 segundos, usar fallbacks
    setTimeout(() => {
        if (loadedCount < totalTextures) {
            
            // Forçar uso de texturas de fallback
            if (!window.earthTextures) {
                window.earthTextures = {};
            }
            if (!window.atmosphereTextures) {
                window.atmosphereTextures = {};
            }
            
            // Criar fallbacks para texturas não carregadas
            if (!window.earthTextures.surface) {
                window.earthTextures.surface = createFallbackTexture(0x2a4a2a);
            }
            if (!window.earthTextures.bump) {
                window.earthTextures.bump = createFallbackTexture(0x808080);
            }
            if (!window.earthTextures.specular) {
                window.earthTextures.specular = createFallbackTexture(0x0000ff);
            }
            if (!window.atmosphereTextures.ozone) {
                window.atmosphereTextures.ozone = createFallbackTexture(0x00ff00);
            }
            if (!window.atmosphereTextures.co2) {
                window.atmosphereTextures.co2 = createFallbackTexture(0xff6600);
            }
            
            updateEarthWithTextures();
            updateAtmosphereWithTextures();
        }
    }, 5000);
}

// Atualizar Terra com texturas da NASA
function updateEarthWithTextures() {
    if (!earthMaterial || !window.earthTextures) return;
    
    earthMaterial.map = window.earthTextures.surface;
    earthMaterial.bumpMap = window.earthTextures.bump;
    earthMaterial.specularMap = window.earthTextures.specular;
    earthMaterial.needsUpdate = true;
    
}

// Atualizar atmosfera com texturas da NASA
function updateAtmosphereWithTextures() {
    if (!atmosphereMaterial || !window.atmosphereTextures) return;
    
    atmosphereMaterial.map = window.atmosphereTextures.ozone;
    atmosphereMaterial.needsUpdate = true;
    
}

