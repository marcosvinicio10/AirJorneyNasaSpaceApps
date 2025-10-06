// ===== CORE DO GLOBO TERRESTRE =====
// Este arquivo contém as funções principais para criar e gerenciar o globo terrestre

// Criar cena
function createScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
}

// Criar câmera
function createCamera() {
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 3);
    
    // Definir distância base da câmera
    baseCameraDistance = camera.position.length();
}

// Criar renderer
function createRenderer() {
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('container').appendChild(renderer.domElement);
}

// Criar controles de órbita
function createControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 1.5;
    controls.maxDistance = 10;
    controls.autoRotate = false;
}

// Criar iluminação
function createLights() {
    // Luz solar direcional (mais intensa para simular dia)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 3, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    scene.add(sunLight);

    // Luz ambiente mais intensa para iluminação uniforme
    const ambientLight = new THREE.AmbientLight(0x606060, 0.6);
    scene.add(ambientLight);
    
    // Luz adicional para garantir iluminação uniforme
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-3, -2, -3);
    scene.add(fillLight);
}

// Criar Terra básica (sem texturas externas)
function createBasicEarth() {
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    
    // Criar textura procedural mais realista
    const earthTexture = createRealisticEarthTexture();
    
    earthMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        shininess: 100,
        specular: 0x111111
    });
    
    earthMesh = new THREE.Mesh(geometry, earthMaterial);
    earthMesh.castShadow = true;
    earthMesh.receiveShadow = true;
    scene.add(earthMesh);
    
    // Criar atmosfera básica
    const atmosphereGeometry = new THREE.SphereGeometry(ATMOSPHERE_RADIUS, 64, 64);
    atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00, // Verde para ozônio
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });
    
    atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);
    
    // Adicionar pontos informativos
    createDataPoints();
    
    // Esconder loading imediatamente
    hideLoading();
}

// Criar textura procedural realista da Terra
function createRealisticEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Gradiente base (oceano)
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGradient.addColorStop(0, '#1e3a8a'); // Azul escuro (profundo)
    oceanGradient.addColorStop(0.5, '#3b82f6'); // Azul médio
    oceanGradient.addColorStop(1, '#60a5fa'); // Azul claro (raso)
    
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, 1024, 512);
    
    // Adicionar continentes com cores realistas
    const continents = [
        // América do Norte
        { x: 150, y: 100, width: 200, height: 300, color: '#8b5a2b' },
        // América do Sul
        { x: 200, y: 250, width: 120, height: 200, color: '#a0522d' },
        // Europa/África
        { x: 450, y: 120, width: 80, height: 200, color: '#8b7355' },
        { x: 480, y: 200, width: 100, height: 250, color: '#8b7355' },
        // Ásia
        { x: 650, y: 80, width: 200, height: 180, color: '#8b5a2b' },
        // Austrália
        { x: 750, y: 350, width: 80, height: 60, color: '#a0522d' }
    ];
    
    continents.forEach(continent => {
        ctx.fillStyle = continent.color;
        ctx.beginPath();
        ctx.ellipse(continent.x, continent.y, continent.width/2, continent.height/2, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Adicionar variações de cor (florestas, desertos, etc.)
        const variation = Math.random() * 0.3;
        const r = parseInt(continent.color.slice(1, 3), 16);
        const g = parseInt(continent.color.slice(3, 5), 16);
        const b = parseInt(continent.color.slice(5, 7), 16);
        
        const newR = Math.min(255, Math.max(0, r + (Math.random() - 0.5) * 50));
        const newG = Math.min(255, Math.max(0, g + (Math.random() - 0.5) * 50));
        const newB = Math.min(255, Math.max(0, b + (Math.random() - 0.5) * 50));
        
        ctx.fillStyle = `rgb(${newR}, ${newG}, ${newB})`;
        ctx.beginPath();
        ctx.ellipse(continent.x + (Math.random() - 0.5) * 20, continent.y + (Math.random() - 0.5) * 20, 
                   continent.width/3, continent.height/3, 0, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Adicionar nuvens
    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
        ctx.beginPath();
        ctx.arc(Math.random() * 1024, Math.random() * 512, Math.random() * 30 + 10, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
}

// Esconder tela de carregamento
function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    isLoading = false;
}

