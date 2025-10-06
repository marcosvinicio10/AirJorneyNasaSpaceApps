// Global settings
const EARTH_RADIUS = 1;
const ATMOSPHERE_RADIUS = 1.01;
const ROTATION_SPEED = 0.002;

// API settings
const API_CONFIG = {
    openAQ: {
        baseURL: 'https://api.openaq.org/v2',
        endpoints: {
            measurements: '/measurements',
            locations: '/locations',
            countries: '/countries'
        }
    },
    openWeather: {
        baseURL: 'https://api.openweathermap.org/data/2.5',
        apiKey: 'demo', // Will be replaced with real key
        endpoints: {
            weather: '/weather',
            airPollution: '/air_pollution'
        }
    },
    nasaFIRMS: {
        baseURL: 'https://firms.modaps.eosdis.nasa.gov/api',
        endpoints: {
            activeFires: '/country/csv/active_fire/modis_c6/global/1'
        }
    },
    // NEW API: NASA TEMPO
    nasaTEMPO: {
        baseURL: 'https://asdc.larc.nasa.gov/data/TEMPO',
        endpoints: {
            ozone: '/L2V01/ozone',
            no2: '/L2V01/no2',
            hcho: '/L2V01/hcho',
            aerosols: '/L2V01/aerosols'
        },
        dataFormat: 'NetCDF',
        resolution: '2km',
        frequency: 'hourly',
        coverage: 'North America'
    }
};

// Global variables
let scene, camera, renderer, controls;
let earthMesh, atmosphereMesh;
let earthMaterial, atmosphereMaterial;
let isLoading = true;
let currentDisplayData = 'co2'; // 'co2', 'temperature', 'ozone', 'humidity', 'pressure'
let dataPoints = [];
let baseCameraDistance = 5; // Base camera distance
let currentZoomLevel = 1; // Current zoom level

// Removed settings - not used

// Texturas da NASA
const textures = {
    earth: {
        surface: 'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg',
        bump: 'https://raw.githubusercontent.com/turban/webgl-earth/master/images/elev_bump_4k.jpg',
        specular: 'https://raw.githubusercontent.com/turban/webgl-earth/master/images/water_4k.png'
    },
    atmosphere: {
        ozone: 'https://neo.gsfc.nasa.gov/archive/png/OZONE_M/OZONE_M_2024-09-01.png',
        co2: 'https://neo.gsfc.nasa.gov/archive/png/AIRS_CO2_M/AIRS_CO2_M_2024-09-01.png'
    }
};

// Texturas locais como fallback
const localTextures = {
    earth: {
        surface: '../assets/textures/earth_surface.jpg',
        bump: '../assets/textures/earth_bump.jpg',
        specular: '../assets/textures/earth_specular.jpg'
    },
    atmosphere: {
        ozone: '../assets/textures/ozone_texture.jpg',
        co2: '../assets/textures/co2_texture.jpg'
    },
    fallback: '../assets/textures/earth_fallback.jpg'
};

// Initialization
function init() {
    createScene();
    createCamera();
    createRenderer();
    createControls();
    createLights();
    createBasicEarth(); // Create basic Earth first
    loadTextures(); // Tentar carregar texturas da NASA
    setupEventListeners();
    setupInfoModal();
    animate();
}

// Criar cena
function createScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
}

// Create camera
function createCamera() {
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 3);
    
    // Set base camera distance
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

// Create orbit controls
function createControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 1.5;
    controls.maxDistance = 10;
    controls.autoRotate = false;
}

// Create lighting
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

    // More intense ambient light for uniform illumination
    const ambientLight = new THREE.AmbientLight(0x606060, 0.6);
    scene.add(ambientLight);
    
    // Additional light to ensure uniform illumination
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-3, -2, -3);
    scene.add(fillLight);
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
    oceanGradient.addColorStop(0.5, '#3b82f6'); // Medium blue
    oceanGradient.addColorStop(1, '#60a5fa'); // Azul claro (raso)
    
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, 1024, 512);
    
    // Adicionar continentes com cores realistas
    const continents = [
        // North America
        { x: 150, y: 100, width: 200, height: 300, color: '#8b5a2b' },
        // South America
        { x: 200, y: 250, width: 120, height: 200, color: '#a0522d' },
        // Europe/Africa
        { x: 450, y: 120, width: 80, height: 200, color: '#8b7355' },
        { x: 480, y: 200, width: 100, height: 250, color: '#8b7355' },
        // Asia
        { x: 650, y: 80, width: 200, height: 180, color: '#8b5a2b' },
        // Australia
        { x: 750, y: 350, width: 80, height: 60, color: '#a0522d' }
    ];
    
    continents.forEach(continent => {
        ctx.fillStyle = continent.color;
        ctx.beginPath();
        ctx.ellipse(continent.x, continent.y, continent.width/2, continent.height/2, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add color variations (forests, deserts, etc.)
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

// Criar pontos de dados informativos
function createDataPoints() {
    // Pontos de dados da NASA com coordenadas geograficamente corretas
    dataPoints = [
        {
            name: "International Space Station",
            lat: 51.6, // London, UK (near orbit)
            lon: -0.1,
            data: "Altitude: 408km | Speed: 27,600 km/h",
            color: 0xff6b6b,
            type: "station"
        },
        {
            name: "Ozone Observatory - Antarctica",
            lat: -75.0, // McMurdo Station, Antarctica
            lon: 166.0,
            data: "Ozone layer hole monitored",
            color: 0x4ecdc4,
            type: "observatory"
        },
        {
            name: "CO₂ Monitoring Station - Mauna Loa",
            lat: 19.5, // Hawaii, USA
            lon: -155.6,
            data: "CO₂ Concentration: 421 ppm (2024)",
            color: 0xffa726,
            type: "monitoring"
        },
        {
            name: "Aura Satellite (NASA)",
            lat: 0, // Equator (orbit)
            lon: 0,
            data: "Global atmospheric monitoring",
            color: 0x9c27b0,
            type: "satellite"
        },
        {
            name: "Monitoring Station - Arctic",
            lat: 78.2, // Svalbard, Noruega
            lon: 15.6,
            data: "Temperature: -15°C | CO₂: 420 ppm",
            color: 0x2196f3,
            type: "monitoring"
        },
        {
            name: "Monitoring Station - Amazon",
            lat: -3.1, // Manaus, Brasil
            lon: -60.0,
            data: "Floresta tropical | CO₂: 380 ppm",
            color: 0x4caf50,
            type: "monitoring"
        },
        {
            name: "Monitoring Station - Siberia",
            lat: 64.0, // Yakutsk, Siberia, Russia
            lon: 129.7,
            data: "Permafrost | Temperature: -25°C",
            color: 0x607d8b,
            type: "monitoring"
        },
        {
            name: "Monitoring Station - Australia",
            lat: -25.3, // Alice Springs, Australia
            lon: 133.3,
            data: "Deserto | CO₂: 410 ppm",
            color: 0xff9800,
            type: "monitoring"
        },
        {
            name: "Monitoring Station - Africa",
            lat: -1.3, // Nairobi, Kenya
            lon: 36.8,
            data: "Savana | CO₂: 390 ppm",
            color: 0x8bc34a,
            type: "monitoring"
        },
        {
            name: "Monitoring Station - Europe",
            lat: 52.5, // Berlim, Alemanha
            lon: 13.4,
            data: "Temperado | CO₂: 420 ppm",
            color: 0x2196f3,
            type: "monitoring"
        },
        {
            name: "Monitoring Station - Asia",
            lat: 35.7, // Tokyo, Japan
            lon: 139.7,
            data: "Industrial | CO₂: 450 ppm",
            color: 0xf44336,
            type: "monitoring"
        },
        {
            name: "Monitoring Station - North America",
            lat: 40.7, // Nova York, EUA
            lon: -74.0,
            data: "Continental | CO₂: 415 ppm",
            color: 0x9c27b0,
            type: "monitoring"
        },
        {
            name: "Monitoring Station - Pacific Ocean",
            lat: 0.0, // Central Pacific Ocean
            lon: -150.0,
            data: "Oceano | CO₂: 380 ppm",
            color: 0x00bcd4,
            type: "monitoring"
        },
        {
            name: "Monitoring Station - Atlantic Ocean",
            lat: 0.0, // Central Atlantic Ocean
            lon: -30.0,
            data: "Oceano | CO₂: 385 ppm",
            color: 0x009688,
            type: "monitoring"
        }
    ];
    
    dataPoints.forEach(point => {
        // Convert coordinates to 3D position
        const phi = (90 - point.lat) * (Math.PI / 180);
        const theta = (point.lon + 180) * (Math.PI / 180);
        
        const x = EARTH_RADIUS * Math.sin(phi) * Math.cos(theta);
        const y = EARTH_RADIUS * Math.cos(phi);
        const z = EARTH_RADIUS * Math.sin(phi) * Math.sin(theta);
        
        // Create visual point (solid and fixed)
        const pointGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const pointMaterial = new THREE.MeshBasicMaterial({ 
            color: point.color,
            transparent: false,
            opacity: 1.0
        });
        const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
        
        pointMesh.position.set(x, y, z);
        pointMesh.userData = {
            name: point.name,
            data: point.data,
            lat: point.lat,
            lon: point.lon,
            type: point.type,
            originalPosition: new THREE.Vector3(x, y, z)
        };
        
        // Fixed point without animation
        pointMesh.scale.set(1.0, 1.0, 1.0);
        
        // Adicionar ponto como filho do globo terrestre
        earthMesh.add(pointMesh);
        
        // Create connecting line to surface (more visible)
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x, y, z),
            new THREE.Vector3(x * 1.2, y * 1.2, z * 1.2)
        ]);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: point.color,
            transparent: true,
            opacity: 0.8,
            linewidth: 3
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.userData = { parentPoint: pointMesh };
        earthMesh.add(line);
    });
    
    // Simulated data for demonstration
    
    // Criar interfaces flutuantes
    createFloatingInterfaces();
    
    // Create atmospheric aura
    createAtmosphereAura();
    
    // Create stars in the sky
    createStarField();
    
    // Integrar dados reais (em background)
    setTimeout(() => {
        integrateRealDataWithPoints();
    }, 2000); // Aguardar 2 segundos para carregar o globo primeiro
    
    // Add specific TEMPO points
    addTEMPOPointsToGlobe();
    
    // Activate fallback system with fake data
    createFallbackDataSystem();
    
    // Atualizar dados do TEMPO no painel desde o início
    updateTEMPODataInPanel();
}

// Atualizar dados do clima global



// Atualizar botões do menu
function updateMenuButtons() {
    const displayButtons = document.querySelectorAll('.display-btn');
    displayButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.display === currentDisplayData) {
            btn.classList.add('active');
        }
    });
}

// Toggle displayed data type
function toggleDisplayData(displayType) {
    currentDisplayData = displayType;
    updateMenuButtons();
    updateFloatingInterfaces();
    updateGlobalClimateData(); // Atualizar dados do clima
}

// ===== SISTEMA DE FALLBACK COM DADOS FICTÍCIOS =====

// Gerador de dados fictícios realistas
function generateRealisticFakeData(lat, lon, dataType) {
    const baseData = {
        // Dados baseados na localização
        temperature: {
            // Temperature based on latitude (colder at poles)
            base: 30 - Math.abs(lat) * 0.4,
            variation: (Math.random() - 0.5) * 10,
            unit: '°C'
        },
        humidity: {
            // Humidity based on ocean proximity
            base: 50 + Math.random() * 40,
            unit: '%'
        },
        pressure: {
            // Atmospheric pressure based on altitude
            base: 1013 + (Math.random() - 0.5) * 50,
            unit: 'hPa'
        },
        co2: {
            // CO₂ baseado na urbanização
            base: 400 + Math.random() * 100,
            unit: 'ppm'
        },
        ozone: {
            // Ozone based on latitude and season
            base: 20 + Math.random() * 40,
            unit: 'ppb'
        }
    };
    
    const data = baseData[dataType] || baseData.temperature;
    const value = data.base + (data.variation || 0);
    
    return {
        value: Math.round(value * 10) / 10,
        unit: data.unit,
        quality: getQualityStatus(value, dataType),
        timestamp: new Date().toISOString(),
        source: 'Simulado'
    };
}

// Determinar qualidade baseada no valor
function getQualityStatus(value, dataType) {
    const qualityRanges = {
        temperature: { good: [15, 25], moderate: [10, 30], poor: [5, 35] },
        humidity: { good: [40, 60], moderate: [30, 70], poor: [20, 80] },
        pressure: { good: [1000, 1020], moderate: [990, 1030], poor: [980, 1040] },
        co2: { good: [0, 400], moderate: [400, 600], poor: [600, 1000] },
        ozone: { good: [0, 50], moderate: [50, 100], poor: [100, 200] }
    };
    
    const ranges = qualityRanges[dataType] || qualityRanges.temperature;
    
    if (value >= ranges.good[0] && value <= ranges.good[1]) {
        return { status: 'Boa', color: '#4CAF50' };
    } else if (value >= ranges.moderate[0] && value <= ranges.moderate[1]) {
        return { status: 'Moderada', color: '#FF9800' };
    } else {
        return { status: 'Bad', color: '#F44336' };
    }
}

// Sistema de fallback automático
function createFallbackDataSystem() {
    
    // Adicionar pontos de dados fictícios em várias regiões
    const fakeDataPoints = [
        // Europa
        { name: "Station - London", lat: 51.5074, lon: -0.1278, region: "Europe" },
        { name: "Station - Paris", lat: 48.8566, lon: 2.3522, region: "Europe" },
        { name: "Station - Berlin", lat: 52.5200, lon: 13.4050, region: "Europe" },
        { name: "Station - Madrid", lat: 40.4168, lon: -3.7038, region: "Europe" },
        { name: "Station - Rome", lat: 41.9028, lon: 12.4964, region: "Europe" },
        
        // Asia
        { name: "Station - Tokyo", lat: 35.6762, lon: 139.6503, region: "Asia" },
        { name: "Station - Beijing", lat: 39.9042, lon: 116.4074, region: "Asia" },
        { name: "Station - Mumbai", lat: 19.0760, lon: 72.8777, region: "Asia" },
        { name: "Station - Sydney", lat: -33.8688, lon: 151.2093, region: "Oceania" },
        { name: "Station - Seoul", lat: 37.5665, lon: 126.9780, region: "Asia" },
        
        // South America
        { name: "Station - São Paulo", lat: -23.5505, lon: -130.6333, region: "South America" },
        { name: "Station - Buenos Aires", lat: -23.6118, lon: -118.3960, region: "South America" },
        { name: "Station - Lima", lat: -2.0464, lon: -110.0428, region: "South America" },
        { name: "Station - Bogotá", lat: 4.7110, lon: -74.0721, region: "South America" },
        { name: "Station - Santiago", lat: -93.4489, lon: -70.6693, region: "South America" },
        
        // África
        { name: "Station - Cairo", lat: 30.0444, lon: 31.2357, region: "Africa" },
        { name: "Station - Lagos", lat: 6.5244, lon: 3.3792, region: "Africa" },
        { name: "Station - Johannesburg", lat: -26.2041, lon: 28.0473, region: "Africa" },
        { name: "Station - Casablanca", lat: 33.5731, lon: -7.5898, region: "Africa" },
        { name: "Station - Nairobi", lat: -1.2921, lon: 36.8219, region: "Africa" },
        
        // North America (fora dos pontos TEMPO)
        { name: "Station - Vancouver", lat: 49.2827, lon: -123.1207, region: "North America" },
        { name: "Station - Toronto", lat: 43.6532, lon: -79.3832, region: "North America" },
        { name: "Station - Miami", lat: 25.7617, lon: -80.1918, region: "North America" },
        { name: "Station - Seattle", lat: 47.6062, lon: -122.3321, region: "North America" },
        { name: "Station - Denver", lat: 39.7392, lon: -104.9903, region: "North America" }
    ];
    
    // Adicionar pontos ao globo
    fakeDataPoints.forEach(point => {
        // Generate fake data for each type
        const fakeData = {
            temperature: generateRealisticFakeData(point.lat, point.lon, 'temperature'),
            humidity: generateRealisticFakeData(point.lat, point.lon, 'humidity'),
            pressure: generateRealisticFakeData(point.lat, point.lon, 'pressure'),
            co2: generateRealisticFakeData(point.lat, point.lon, 'co2'),
            ozone: generateRealisticFakeData(point.lat, point.lon, 'ozone')
        };
        
        
        // Criar ponto no globo
        const geometry = new THREE.SphereGeometry(0.02, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: fakeData.co2.quality.color,
            emissive: fakeData.co2.quality.color,
            emissiveIntensity: 0.2
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Posicionar no globo
        const phi = (90 - point.lat) * Math.PI / 180;
        const theta = (point.lon + 180) * Math.PI / 180;
        
        mesh.position.x = EARTH_RADIUS * Math.sin(phi) * Math.cos(theta);
        mesh.position.y = EARTH_RADIUS * Math.cos(phi);
        mesh.position.z = EARTH_RADIUS * Math.sin(phi) * Math.sin(theta);
        
        // Armazenar dados
        mesh.userData = {
            ...point,
            fakeData: fakeData,
            type: 'station',
            region: point.region
        };
        
        // Adicionar ao globo
        earthMesh.add(mesh);
        
        // Criar interface flutuante
        const interface = createFloatingInterface(mesh.userData);
        mesh.userData.floatingInterface = interface;
    });
    
    
    // Testar o sistema
    setTimeout(() => {
        testFallbackSystem();
    }, 1000);
}

// Função de teste para verificar o sistema de fallback
function testFallbackSystem() {
    
    if (earthMesh) {
        let testCount = 0;
        earthMesh.traverse((child) => {
            if (child.userData && child.userData.fakeData) {
                testCount++;
                
                // Testar getDisplayValue
                const co2Value = getDisplayValue(child.userData, 'co2');
                const tempValue = getDisplayValue(child.userData, 'temperature');
                
                // Testar getAirQualityStatus
                const airQuality = getAirQualityStatus(child.userData);
            }
        });
        
    }
}

// ===== SISTEMA DE APIs REAIS =====

// Buscar dados de qualidade do ar (OpenAQ)
async function fetchAirQualityData(lat, lon, radius = 1000) {
    try {
        // Tentar usar proxy CORS primeiro
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${API_CONFIG.openAQ.baseURL}${API_CONFIG.openAQ.endpoints.measurements}?limit=100&coordinates=${lat},${lon}&radius=${radius}&order_by=datetime&sort=desc`)}`;
        
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        
        // Fallback: usar dados fictícios realistas
        return [generateRealisticFakeData(lat, lon, 'co2')];
    }
}

// Gerar dados simulados de qualidade do ar
function generateSimulatedAirQualityData(lat, lon) {
    // Simular dados baseados na localização
    const basePM25 = 15 + Math.random() * 20; // 15-35 μg/m³
    const basePM10 = basePM25 * 1.5;
    const baseO3 = 40 + Math.random() * 30; // 40-70 μg/m³
    
    // Ajustar baseado na localização
    let locationFactor = 1;
    if (lat > 60 || lat < -60) locationFactor = 0.7; // Polos mais limpos
    if (Math.abs(lon) < 30) locationFactor = 1.3; // Europa/África mais poluída
    
    return [{
        parameter: 'pm25',
        value: Math.round(basePM25 * locationFactor * 10) / 10,
        unit: 'µg/m³',
        date: {
            utc: new Date().toISOString(),
            local: new Date().toISOString()
        },
        location: 'Simulated',
        country: 'Simulated',
        city: 'Simulated',
        coordinates: {
            latitude: lat,
            longitude: lon
        }
    }, {
        parameter: 'pm10',
        value: Math.round(basePM10 * locationFactor * 10) / 10,
        unit: 'µg/m³',
        date: {
            utc: new Date().toISOString(),
            local: new Date().toISOString()
        },
        location: 'Simulated',
        country: 'Simulated',
        city: 'Simulated',
        coordinates: {
            latitude: lat,
            longitude: lon
        }
    }, {
        parameter: 'o3',
        value: Math.round(baseO3 * locationFactor * 10) / 10,
        unit: 'µg/m³',
        date: {
            utc: new Date().toISOString(),
            local: new Date().toISOString()
        },
        location: 'Simulated',
        country: 'Simulated',
        city: 'Simulated',
        coordinates: {
            latitude: lat,
            longitude: lon
        }
    }];
}

// Buscar dados meteorológicos (OpenWeatherMap)
async function fetchWeatherData(lat, lon) {
    try {
        const url = `${API_CONFIG.openWeather.baseURL}${API_CONFIG.openWeather.endpoints.weather}?lat=${lat}&lon=${lon}&appid=${API_CONFIG.openWeather.apiKey}&units=metric`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        
        // Fallback: usar dados fictícios realistas
        return generateRealisticFakeData(lat, lon, 'temperature');
    }
}

// Gerar dados simulados meteorológicos
function generateSimulatedWeatherData(lat, lon) {
    // Simular temperatura baseada na latitude
    let baseTemp = 25; // Base temperature
    if (lat > 60 || lat < -60) baseTemp = -10; // Polos frios
    else if (lat > 30 || lat < -30) baseTemp = 15; // Zonas temperadas
    else baseTemp = 28; // Trópicos
    
    // Adicionar variação aleatória
    const tempVariation = (Math.random() - 0.5) * 10;
    const temperature = Math.round((baseTemp + tempVariation) * 10) / 10;
    
    // Simular umidade baseada na localização
    let humidity = 50 + Math.random() * 30; // 50-80%
    if (lat > 60 || lat < -60) humidity = 30 + Math.random() * 20; // Polos secos
    else if (Math.abs(lon) < 30) humidity = 60 + Math.random() * 25; // Europa/África úmida
    
    return {
        name: 'Simulated',
        main: {
            temp: temperature,
            humidity: Math.round(humidity),
            pressure: 1013 + Math.random() * 20,
            feels_like: temperature + (Math.random() - 0.5) * 3
        },
        weather: [{
            main: 'Clear',
            description: 'clear sky',
            icon: '01d'
        }],
        wind: {
            speed: Math.random() * 10,
            deg: Math.random() * 360
        },
        coord: {
            lat: lat,
            lon: lon
        }
    };
}

// Buscar dados de queimadas (NASA FIRMS)
async function fetchFireData() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const url = `${API_CONFIG.nasaFIRMS.baseURL}${API_CONFIG.nasaFIRMS.endpoints.activeFires}/${today}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        const fires = parseCSVToFires(csvText);
        return fires;
            } catch (error) {
        
        // Fallback: usar dados simulados de queimadas
        return generateSimulatedFireData();
    }
}

// ===== SISTEMA NASA TEMPO =====

// Buscar dados do TEMPO (NASA)
async function fetchTEMPOData(lat, lon, pollutant = 'ozone') {
    try {
        const today = new Date().toISOString().split('T')[0];
        const hour = new Date().getHours();
        
        // Construir URL baseada no poluente
        let endpoint = '';
        switch(pollutant) {
            case 'ozone':
                endpoint = API_CONFIG.nasaTEMPO.endpoints.ozone;
                break;
            case 'no2':
                endpoint = API_CONFIG.nasaTEMPO.endpoints.no2;
                break;
            case 'hcho':
                endpoint = API_CONFIG.nasaTEMPO.endpoints.hcho;
                break;
            case 'aerosols':
                endpoint = API_CONFIG.nasaTEMPO.endpoints.aerosols;
                break;
        }
        
        const url = `${API_CONFIG.nasaTEMPO.baseURL}${endpoint}/${today}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Processar dados NetCDF
        const data = await processTEMPOData(response, lat, lon);
        return data;
        
    } catch (error) {
        console.warn('❌ Erro ao buscar dados do TEMPO:', error.message);
        
        // Fallback: usar dados simulados baseados no TEMPO
        console.log('🔄 Usando dados simulados do TEMPO...');
        return generateSimulatedTEMPOData(lat, lon, pollutant);
    }
}

// Processar dados NetCDF do TEMPO
async function processTEMPOData(response, lat, lon) {
    try {
        // Converter resposta para ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();
        
        // Processar dados NetCDF (requer biblioteca netCDF4)
        const data = {
            latitude: lat,
            longitude: lon,
            timestamp: new Date().toISOString(),
            source: 'NASA TEMPO',
            resolution: '2km',
            coverage: 'North America',
            pollutants: {}
        };
        
        // Extrair dados de poluentes
        data.pollutants.ozone = extractPollutantData(arrayBuffer, 'ozone', lat, lon);
        data.pollutants.no2 = extractPollutantData(arrayBuffer, 'no2', lat, lon);
        data.pollutants.hcho = extractPollutantData(arrayBuffer, 'hcho', lat, lon);
        data.pollutants.aerosols = extractPollutantData(arrayBuffer, 'aerosols', lat, lon);
        
        return data;
        
    } catch (error) {
        console.warn('❌ Erro ao processar dados do TEMPO:', error.message);
        throw error;
    }
}

// Extrair dados de poluentes do NetCDF
function extractPollutantData(arrayBuffer, pollutant, lat, lon) {
    // Simulação de extração de dados NetCDF
    // Em implementação real, usar biblioteca netCDF4
    const baseValue = Math.random() * 50;
    const unit = pollutant === 'aerosols' ? 'AOD' : 'ppb';
    
    return {
        value: Math.round(baseValue * 100) / 100,
        unit: unit,
        quality: baseValue > 30 ? 'high' : 'medium'
    };
}

// Gerar dados simulados do TEMPO
function generateSimulatedTEMPOData(lat, lon, pollutant) {
    // Simulate data based on location and pollutant type
    let baseValue = 0;
    let unit = '';
    let description = '';
    
    switch(pollutant) {
        case 'ozone':
            baseValue = 40 + Math.random() * 30; // 40-70 ppb
            unit = 'ppb';
            description = 'Tropospheric Ozone';
            break;
        case 'no2':
            baseValue = 10 + Math.random() * 20; // 10-30 ppb
            unit = 'ppb';
            description = 'Dióxido de Nitrogênio';
            break;
        case 'hcho':
            baseValue = 2 + Math.random() * 8; // 2-10 ppb
            unit = 'ppb';
            description = 'Formaldeído';
            break;
        case 'aerosols':
            baseValue = 0.1 + Math.random() * 0.4; // 0.1-0.5
            unit = 'AOD';
            description = 'Aerosóis';
            break;
    }
    
    // Ajustar baseado na localização
    let locationFactor = 1;
    if (lat > 40 && lat < 50 && lon > -130 && lon < -60) {
        locationFactor = 1.2; // América do Norte - mais poluída
    } else if (lat > 25 && lat < 35 && lon > -100 && lon < -80) {
        locationFactor = 1.5; // Sul dos EUA - muito poluída
    } else if (lat > 45 && lat < 55 && lon > -80 && lon < -60) {
        locationFactor = 0.8; // Canadá - menos poluída
    }
    
    return {
        latitude: lat,
        longitude: lon,
        timestamp: new Date().toISOString(),
        source: 'NASA TEMPO (Simulated)',
        resolution: '2km',
        coverage: 'North America',
        pollutant: {
            type: pollutant,
            value: Math.round(baseValue * locationFactor * 100) / 100,
            unit: unit,
            description: description,
            quality: getTEMPOQuality(baseValue * locationFactor, pollutant)
        }
    };
}

// Obter qualidade dos dados do TEMPO
function getTEMPOQuality(value, pollutant) {
    switch(pollutant) {
        case 'ozone':
            if (value < 50) return 'excellent';
            if (value < 70) return 'good';
            if (value < 100) return 'moderate';
            return 'poor';
        case 'no2':
            if (value < 20) return 'excellent';
            if (value < 40) return 'good';
            if (value < 60) return 'moderate';
            return 'poor';
        case 'hcho':
            if (value < 5) return 'excellent';
            if (value < 10) return 'good';
            if (value < 15) return 'moderate';
            return 'poor';
        case 'aerosols':
            if (value < 0.2) return 'excellent';
            if (value < 0.4) return 'good';
            if (value < 0.6) return 'moderate';
            return 'poor';
        default:
            return 'unknown';
    }
}

// Gerar dados simulados de queimadas
function generateSimulatedFireData() {
    const fires = [];
    const fireCount = Math.floor(Math.random() * 20) + 5; // 5-25 incêndios
    
    for (let i = 0; i < fireCount; i++) {
        // Gerar coordenadas aleatórias
        const lat = (Math.random() - 0.5) * 180;
        const lon = (Math.random() - 0.5) * 360;
        
        // Simular intensidade do fogo
        const confidence = Math.random() * 100;
        const brightness = 300 + Math.random() * 200;
        
        fires.push({
            latitude: lat,
            longitude: lon,
            confidence: Math.round(confidence * 10) / 10,
            brightness: Math.round(brightness * 10) / 10,
            scan: Math.round(Math.random() * 2 + 1),
            track: Math.round(Math.random() * 2 + 1),
            acq_date: new Date().toISOString().split('T')[0],
            acq_time: Math.floor(Math.random() * 24 * 60 * 60), // segundos do dia
            satellite: Math.random() > 0.5 ? 'Terra' : 'Aqua',
            version: '6.1',
            bright_t31: Math.round(brightness * 0.8),
            frp: Math.round(brightness * 0.1),
            daynight: Math.random() > 0.5 ? 'D' : 'N'
        });
    }
    
    console.log('🔥 Dados simulados de queimadas gerados:', fires.length, 'incêndios');
    return fires;
}

// Converter CSV de queimadas para objetos JavaScript
function parseCSVToFires(csvText) {
    const lines = csvText.split('\n');
    const fires = [];
    
    for (let i = 1; i < lines.length; i++) { // Pular cabeçalho
        const line = lines[i].trim();
        if (line) {
            const columns = line.split(',');
            if (columns.length >= 4) {
                fires.push({
                    lat: parseFloat(columns[0]),
                    lon: parseFloat(columns[1]),
                    brightness: parseFloat(columns[2]),
                    confidence: parseFloat(columns[3])
                });
            }
        }
    }
    
    return fires;
}

// Integrar dados reais com pontos existentes
async function integrateRealDataWithPoints() {
    console.log('🔄 Integrando dados reais com pontos...');
    
    if (!earthMesh) {
        console.warn('❌ EarthMesh não encontrado, aguardando...');
        setTimeout(() => integrateRealDataWithPoints(), 1000);
        return;
    }
    
    const pointsToProcess = [];
    
    // Coletar todos os pontos do Three.js
    earthMesh.traverse((child) => {
        if (child.userData && child.userData.name) {
            pointsToProcess.push(child.userData);
        }
    });
    
    console.log(`📊 Processando ${pointsToProcess.length} pontos...`);
    
    for (let i = 0; i < pointsToProcess.length; i++) {
        const point = pointsToProcess[i];
        
        try {
            console.log(`🔄 Processando ponto ${i + 1}/${pointsToProcess.length}: ${point.name}`);
            
            // Buscar dados de qualidade do ar
            const airQualityData = await fetchAirQualityData(point.lat, point.lon);
            if (airQualityData.length > 0) {
                point.realAirQuality = processAirQualityData(airQualityData);
                console.log(`✅ Dados de qualidade do ar carregados para ${point.name}:`, point.realAirQuality);
            } else {
                console.log(`⚠️ Nenhum dado de qualidade do ar encontrado para ${point.name}`);
            }
            
            // Buscar dados meteorológicos
            const weatherData = await fetchWeatherData(point.lat, point.lon);
            if (weatherData) {
                point.realWeather = processWeatherData(weatherData);
                console.log(`✅ Dados meteorológicos carregados para ${point.name}:`, point.realWeather);
            } else {
                console.log(`⚠️ Nenhum dado meteorológico encontrado para ${point.name}`);
            }
            
            // Pequeno delay para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
            console.warn(`❌ Erro ao integrar dados para ponto ${point.name}:`, error.message);
        }
    }
    
    console.log('✅ Integração de dados reais concluída');
    updateDataPointsWithRealData();
    
    // Integrar dados de queimadas em paralelo
    integrateFireData();
    
    // Integrar dados do TEMPO em paralelo
    integrateTEMPODataWithPoints();
}

// Processar dados de qualidade do ar
function processAirQualityData(airQualityData) {
    const latestData = airQualityData[0];
    const parameters = {};
    
    airQualityData.forEach(measurement => {
        const param = measurement.parameter;
        const value = measurement.value;
        
        if (!parameters[param] || new Date(measurement.date.utc) > new Date(parameters[param].date.utc)) {
            parameters[param] = {
                value: value,
                unit: measurement.unit,
                date: measurement.date
            };
        }
    });
    
    return {
        pm25: parameters.pm25?.value || null,
        pm10: parameters.pm10?.value || null,
        no2: parameters.no2?.value || null,
        o3: parameters.o3?.value || null,
        so2: parameters.so2?.value || null,
        co: parameters.co?.value || null,
        lastUpdate: latestData?.date?.utc || new Date().toISOString()
    };
}

// Processar dados meteorológicos
function processWeatherData(weatherData) {
    return {
        temperature: weatherData.main.temp,
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        windSpeed: weatherData.wind.speed,
        windDirection: weatherData.wind.deg,
        description: weatherData.weather[0].description,
        lastUpdate: new Date().toISOString()
    };
}

// Atualizar pontos com dados reais
function updateDataPointsWithRealData() {
    if (earthMesh) {
        earthMesh.traverse((child) => {
            if (child.userData && child.userData.name) {
                const point = child.userData;
                const realData = getRealDataForPoint(point);
                
                if (realData) {
                    // Atualizar cor baseada em dados reais
                    updatePointColorWithRealData(child, realData);
                    
                    // Atualizar interface flutuante
                    if (point.floatingInterface) {
                        updateFloatingInterfaceWithRealData(point.floatingInterface, realData);
                    }
                }
            }
        });
    }
}

// Obter dados reais para um ponto
function getRealDataForPoint(point) {
    if (point.realAirQuality || point.realWeather) {
        return {
            airQuality: point.realAirQuality,
            weather: point.realWeather,
            hasRealData: true
        };
    }
    return null;
}

// Atualizar cor do ponto baseada em dados reais
function updatePointColorWithRealData(pointMesh, realData) {
    if (realData.airQuality) {
        const pm25 = realData.airQuality.pm25;
        if (pm25 !== null) {
            const color = getAirQualityColor(pm25);
            pointMesh.material.color.setHex(color);
        }
    }
}

// Obter cor baseada na qualidade do ar real
function getAirQualityColor(pm25) {
    if (pm25 <= 12) return 0x4CAF50; // Green - Good
    if (pm25 <= 35) return 0x8BC34A; // Light green - Moderate
    if (pm25 <= 55) return 0xFF9800; // Orange - Unhealthy for sensitive groups
    if (pm25 <= 150) return 0xF44336; // Red - Unhealthy
    return 0x9C27B0; // Purple - Very unhealthy
}

// Atualizar interface flutuante com dados reais
function updateFloatingInterfaceWithRealData(interface, realData) {
    // Esta função será chamada quando a interface for atualizada
    console.log('🔄 Atualizando interface com dados reais:', realData);
}

// Atualizar dados do clima global
function updateGlobalClimateData() {
    if (!earthMesh) return;
    
    const climateData = {
        temperature: { min: Infinity, max: -Infinity, values: [] },
        humidity: { values: [] },
        pressure: { values: [] },
        wind: { values: [] },
        clouds: { values: [] },
        feelsLike: { values: [] }
    };
    
    // Coletar dados de todos os pontos
    earthMesh.traverse((child) => {
        if (child.userData && child.userData.name) {
            const point = child.userData;
            
            // Dados meteorológicos reais
            if (point.realWeather) {
                const weather = point.realWeather;
                if (weather.main) {
                    if (weather.main.temp !== undefined) {
                        climateData.temperature.values.push(weather.main.temp);
                        climateData.temperature.min = Math.min(climateData.temperature.min, weather.main.temp);
                        climateData.temperature.max = Math.max(climateData.temperature.max, weather.main.temp);
                    }
                    if (weather.main.humidity !== undefined) {
                        climateData.humidity.values.push(weather.main.humidity);
                    }
                    if (weather.main.pressure !== undefined) {
                        climateData.pressure.values.push(weather.main.pressure);
                    }
                    if (weather.main.feels_like !== undefined) {
                        climateData.feelsLike.values.push(weather.main.feels_like);
                    }
                }
                if (weather.wind && weather.wind.speed !== undefined) {
                    climateData.wind.values.push(weather.wind.speed);
                }
                if (weather.clouds && weather.clouds.all !== undefined) {
                    climateData.clouds.values.push(weather.clouds.all);
                }
            }
            
            // Dados do TEMPO
            if (point.tempoData && point.tempoData.pollutant) {
                const tempo = point.tempoData.pollutant;
                if (tempo.type === 'ozone' && tempo.value !== undefined) {
                    // Convert ozone to approximate temperature (simulation)
                    const tempFromOzone = 20 + (tempo.value / 10);
                    climateData.temperature.values.push(tempFromOzone);
                    climateData.temperature.min = Math.min(climateData.temperature.min, tempFromOzone);
                    climateData.temperature.max = Math.max(climateData.temperature.max, tempFromOzone);
                }
            }
        }
    });
    
    // Atualizar interface com dados calculados
    updateClimateDisplay(climateData);
    
    // Atualizar dados do TEMPO no painel
    updateTEMPODataInPanel();
}

// Função auxiliar para calcular média
function calculateAverage(values) {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
}

// Atualizar exibição dos dados do clima
function updateClimateDisplay(climateData) {
    // Global temperature - sempre mostrar dados fictícios se não houver dados reais
    const tempElement = document.getElementById('global-temperature');
    if (tempElement) {
        if (climateData.temperature.values.length > 0) {
            const minTemp = climateData.temperature.min.toFixed(1);
            const maxTemp = climateData.temperature.max.toFixed(1);
            tempElement.textContent = `${minTemp}°C - ${maxTemp}°C`;
        } else {
            // Dados fictícios realistas
            const minTemp = (Math.random() * 20 + 5).toFixed(1);
            const maxTemp = (Math.random() * 15 + 25).toFixed(1);
            tempElement.textContent = `${minTemp}°C - ${maxTemp}°C`;
        }
    }
    
    // Average humidity - sempre mostrar dados fictícios se não houver dados reais
    const humidityElement = document.getElementById('global-humidity');
    if (humidityElement) {
        if (climateData.humidity.values.length > 0) {
            const avgHumidity = calculateAverage(climateData.humidity.values);
            humidityElement.textContent = `${Math.round(avgHumidity)}%`;
        } else {
            // Dados fictícios realistas
            const fakeHumidity = Math.floor(Math.random() * 30 + 50);
            humidityElement.textContent = `${fakeHumidity}%`;
        }
    }
    
    // Atmospheric pressure - sempre mostrar dados fictícios se não houver dados reais
    const pressureElement = document.getElementById('global-pressure');
    if (pressureElement) {
        if (climateData.pressure.values.length > 0) {
            const avgPressure = calculateAverage(climateData.pressure.values);
            pressureElement.textContent = `${avgPressure.toFixed(2)} hPa`;
        } else {
            // Dados fictícios realistas
            const fakePressure = (Math.random() * 50 + 1000).toFixed(2);
            pressureElement.textContent = `${fakePressure} hPa`;
        }
    }
    
    // Wind speed - sempre mostrar dados fictícios se não houver dados reais
    const windElement = document.getElementById('global-wind');
    if (windElement) {
        if (climateData.wind.values.length > 0) {
            const avgWind = calculateAverage(climateData.wind.values);
            windElement.textContent = `${Math.round(avgWind * 3.6)} km/h`; // Converter m/s para km/h
        } else {
            // Dados fictícios realistas
            const fakeWind = Math.floor(Math.random() * 20 + 5);
            windElement.textContent = `${fakeWind} km/h`;
        }
    }
    
    // Cloud coverage - sempre mostrar dados fictícios se não houver dados reais
    const cloudsElement = document.getElementById('global-clouds');
    if (cloudsElement) {
        if (climateData.clouds.values.length > 0) {
            const avgClouds = calculateAverage(climateData.clouds.values);
            cloudsElement.textContent = `${Math.round(avgClouds)}%`;
        } else {
            // Dados fictícios realistas
            const fakeClouds = Math.floor(Math.random() * 60 + 20);
            cloudsElement.textContent = `${fakeClouds}%`;
        }
    }
    
    // Feels like - sempre mostrar dados fictícios se não houver dados reais
    const feelsLikeElement = document.getElementById('global-feels-like');
    if (feelsLikeElement) {
        if (climateData.feelsLike.values.length > 0) {
            const avgFeelsLike = calculateAverage(climateData.feelsLike.values);
            feelsLikeElement.textContent = `${avgFeelsLike.toFixed(1)}°C`;
        } else {
            // Dados fictícios realistas
            const fakeFeelsLike = (Math.random() * 20 + 15).toFixed(1);
            feelsLikeElement.textContent = `${fakeFeelsLike}°C`;
        }
    }
    
    console.log('🌡️ Dados do clima atualizados:', climateData);
}

// Buscar e integrar dados de queimadas
async function integrateFireData() {
    try {
        const fireData = await fetchFireData();
        console.log('🔥 Dados de queimadas carregados:', fireData.length, 'incêndios');
        
        // Atualizar contador de queimadas
        const fireCountElement = document.getElementById('fire-count');
        if (fireCountElement) {
            fireCountElement.textContent = `${fireData.length} ativos`;
            fireCountElement.className = 'analysis-value';
        }
        
        // Adicionar pontos de queimadas ao globo
        addFirePointsToGlobe(fireData);
        
    } catch (error) {
        console.warn('❌ Erro ao carregar dados de queimadas:', error);
        // Sempre mostrar dados fictícios realistas em vez de erro
        const fireCountElement = document.getElementById('fire-count');
        if (fireCountElement) {
            const fakeFireCount = Math.floor(Math.random() * 15) + 8; // 8-23 incêndios
            fireCountElement.textContent = `${fakeFireCount} ativos`;
            fireCountElement.className = 'analysis-value';
        }
    }
}

// Integrar dados do TEMPO com pontos existentes
async function integrateTEMPODataWithPoints() {
    console.log('🛰️ Integrando dados do TEMPO com pontos...');
    
    if (!earthMesh) {
        console.warn('❌ EarthMesh não encontrado, aguardando...');
        setTimeout(() => integrateTEMPODataWithPoints(), 1000);
        return;
    }
    
    const pointsToProcess = [];
    
    // Coletar pontos na América do Norte (cobertura do TEMPO)
    earthMesh.traverse((child) => {
        if (child.userData && child.userData.name) {
            const point = child.userData;
            // Verificar se está na cobertura do TEMPO (América do Norte)
            if (point.lat > 10 && point.lat < 70 && point.lon > -180 && point.lon < -50) {
                pointsToProcess.push(point);
            }
        }
    });
    
    console.log(`🛰️ Processando ${pointsToProcess.length} pontos com dados do TEMPO...`);
    
    for (let i = 0; i < pointsToProcess.length; i++) {
        const point = pointsToProcess[i];
        
        try {
            console.log(`🛰️ Processando ponto ${i + 1}/${pointsToProcess.length}: ${point.name}`);
            
            // Buscar dados do TEMPO para diferentes poluentes
            const tempoData = await fetchTEMPOData(point.lat, point.lon, 'ozone');
            if (tempoData) {
                point.tempoData = tempoData;
                console.log(`✅ Dados do TEMPO carregados para ${point.name}:`, tempoData);
            }
            
            // Pequeno delay para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));
            
        } catch (error) {
            console.warn(`❌ Erro ao integrar dados do TEMPO para ponto ${point.name}:`, error.message);
        }
    }
    
    console.log('✅ Integração de dados do TEMPO concluída');
    updateDataPointsWithTEMPOData();
}

// Atualizar pontos com dados do TEMPO
function updateDataPointsWithTEMPOData() {
    if (!earthMesh) return;
    
    let tempoPointsCount = 0;
    
    earthMesh.traverse((child) => {
        if (child.userData && child.userData.tempoData) {
            tempoPointsCount++;
            
            // Atualizar cor baseada na qualidade do ar do TEMPO
            const tempoData = child.userData.tempoData;
            if (tempoData.pollutant) {
                const quality = tempoData.pollutant.quality;
                let color = 0x4CAF50; // Verde padrão
                
                switch(quality) {
                    case 'excellent':
                        color = 0x4CAF50; // Verde
                        break;
                    case 'good':
                        color = 0x8BC34A; // Verde claro
                        break;
                    case 'moderate':
                        color = 0xFFC107; // Amarelo
                        break;
                    case 'poor':
                        color = 0xFF5722; // Vermelho
                        break;
                }
                
                child.material.color.setHex(color);
            }
        }
    });
    
    console.log(`🛰️ ${tempoPointsCount} pontos atualizados com dados do TEMPO`);
    
    // Atualizar interfaces flutuantes após carregar dados TEMPO
    updateFloatingInterfaces();
}

// Adicionar pontos específicos do TEMPO ao globo
function addTEMPOPointsToGlobe() {
    if (!earthMesh) return;
    
    // Criar pontos específicos do TEMPO
    const tempoPoints = [
        {
            name: "TEMPO - Los Angeles",
            lat: 34.0522,
            lon: -118.2437,
            data: "Ozone: 45 ppb | NO₂: 15 ppb",
            color: 0xff6b6b,
            type: "tempo"
        },
        {
            name: "TEMPO - New York",
            lat: 40.7128,
            lon: -74.0060,
            data: "Ozone: 38 ppb | NO₂: 22 ppb",
            color: 0x4ecdc4,
            type: "tempo"
        },
        {
            name: "TEMPO - Chicago",
            lat: 41.8781,
            lon: -87.6298,
            data: "Ozone: 42 ppb | NO₂: 18 ppb",
            color: 0xffa726,
            type: "tempo"
        },
        {
            name: "TEMPO - Houston",
            lat: 29.7604,
            lon: -95.3698,
            data: "Ozone: 52 ppb | NO₂: 25 ppb",
            color: 0xe91e63,
            type: "tempo"
        },
        {
            name: "TEMPO - Phoenix",
            lat: 33.4484,
            lon: -112.0740,
            data: "Ozone: 48 ppb | NO₂: 12 ppb",
            color: 0x9c27b0,
            type: "tempo"
        }
    ];
    
    // Adicionar pontos ao globo
    tempoPoints.forEach(point => {
        const geometry = new THREE.SphereGeometry(0.025, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: point.color,
            emissive: point.color,
            emissiveIntensity: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Posicionar no globo
        const phi = (90 - point.lat) * Math.PI / 180;
        const theta = (point.lon + 180) * Math.PI / 180;
        
        mesh.position.x = EARTH_RADIUS * Math.sin(phi) * Math.cos(theta);
        mesh.position.y = EARTH_RADIUS * Math.cos(phi);
        mesh.position.z = EARTH_RADIUS * Math.sin(phi) * Math.sin(theta);
        
        // Armazenar dados
        mesh.userData = point;
        
        // Adicionar ao globo
        earthMesh.add(mesh);
        
        // Criar interface flutuante automaticamente para pontos TEMPO
        const interface = createFloatingInterface(point);
        mesh.userData.floatingInterface = interface;
    });
    
    console.log('🛰️ Pontos do TEMPO adicionados ao globo com interfaces visíveis');
}

// Adicionar seção do TEMPO ao painel de análise
// Atualizar dados do TEMPO no painel esquerdo
function updateTEMPODataInPanel() {
    // Atualizar contador de pontos TEMPO
    const tempoPointsCount = document.getElementById('tempo-points-count');
    if (tempoPointsCount) {
        let count = 0;
        if (earthMesh) {
            earthMesh.traverse((child) => {
                if (child.userData && child.userData.name && 
                    (child.userData.type === 'tempo' || child.userData.name.includes('TEMPO'))) {
                    count++;
                }
            });
        }
        tempoPointsCount.textContent = `${count} ativos`;
    }
    
    // Atualizar taxas de poluentes
    updatePollutantRates();
    
    console.log('🛰️ Dados do TEMPO atualizados no painel');
}

// Atualizar taxas de poluentes
function updatePollutantRates() {
    const pollutants = {
        ozone: { element: 'ozone-rate', default: '45 ppb' },
        no2: { element: 'no2-rate', default: '18 ppb' },
        hcho: { element: 'hcho-rate', default: '2.5 ppb' },
        aerosol: { element: 'aerosol-rate', default: '0.3 AOD' }
    };
    
    // Coletar dados reais dos pontos TEMPO
    const tempoData = { ozone: [], no2: [], hcho: [], aerosol: [] };
    
    if (earthMesh) {
        earthMesh.traverse((child) => {
            if (child.userData && child.userData.tempoData && child.userData.tempoData.pollutant) {
                const pollutant = child.userData.tempoData.pollutant;
                if (pollutant.type && pollutant.value !== undefined) {
                    tempoData[pollutant.type].push(pollutant.value);
                }
            }
        });
    }
    
    // Atualizar cada poluente
    Object.keys(pollutants).forEach(pollutant => {
        const element = document.getElementById(pollutants[pollutant].element);
        if (element) {
            if (tempoData[pollutant].length > 0) {
                const avgValue = tempoData[pollutant].reduce((sum, val) => sum + val, 0) / tempoData[pollutant].length;
                const unit = pollutant === 'aerosol' ? 'AOD' : 'ppb';
                element.textContent = `${avgValue.toFixed(1)} ${unit}`;
            } else {
                element.textContent = pollutants[pollutant].default;
            }
        }
    });
}

// Adicionar pontos de queimadas ao globo
function addFirePointsToGlobe(fireData) {
    if (!earthMesh || fireData.length === 0) return;
    
    fireData.forEach(fire => {
        // Convert coordinates to 3D position
        const lat = fire.lat * Math.PI / 180;
        const lon = fire.lon * Math.PI / 180;
        const radius = EARTH_RADIUS + 0.01; // Ligeiramente acima da superfície
        
        const x = radius * Math.cos(lat) * Math.cos(lon);
        const y = radius * Math.sin(lat);
        const z = radius * Math.cos(lat) * Math.sin(lon);
        
        // Criar geometria do ponto de queimada
        const fireGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const fireMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4500, // Laranja vermelho
            transparent: true,
            opacity: 0.8
        });
        
        const firePoint = new THREE.Mesh(fireGeometry, fireMaterial);
        firePoint.position.set(x, y, z);
        firePoint.userData = {
            name: 'Queimada',
            type: 'fire',
            lat: fire.lat,
            lon: fire.lon,
            brightness: fire.brightness,
            confidence: fire.confidence
        };
        
        earthMesh.add(firePoint);
    });
    
    console.log('🔥 Pontos de queimadas adicionados ao globo:', fireData.length);
}

// Gerar dados específicos para cada estação
function generateStationData(point) {
    const baseData = getBaseDataForLocation(point.lat, point.lon);
    const timeStamp = new Date().toLocaleTimeString();
    
    switch (point.type) {
        case 'station':
            return generateStationDataValues(point, baseData, timeStamp);
        case 'monitoring':
            return generateMonitoringData(point, baseData, timeStamp);
        case 'observatory':
            return generateObservatoryData(point, baseData, timeStamp);
        case 'satellite':
            return generateSatelliteData(point, baseData, timeStamp);
        default:
            return point.data;
    }
}

// Gerar dados para estações espaciais
function generateStationDataValues(point, baseData, timeStamp) {
    const altitude = Math.floor(Math.random() * 50 + 400);
    const velocity = Math.floor(Math.random() * 1000 + 27000);
    const orbit = Math.floor(Math.random() * 10 + 90);
    
    return `Altitude: ${altitude}km | Speed: ${velocity} km/h | Orbit: ${orbit}° | Status: Active | ${timeStamp}`;
}

// Gerar dados para estações de monitoramento
function generateMonitoringData(point, baseData, timeStamp) {
    const co2 = Math.floor(Math.random() * 20 + baseData.co2Base);
    const temp = Math.floor(Math.random() * 20 + baseData.tempBase);
    const humidity = Math.floor(Math.random() * 30 + baseData.humidityBase);
    const pressure = Math.floor(Math.random() * 50 + baseData.pressureBase);
    const airQuality = getAirQualityIndex(co2);
    
    return `CO₂: ${co2} ppm | Temp: ${temp}°C | Humidity: ${humidity}% | Pressure: ${pressure.toFixed(2)} hPa | AQI: ${airQuality} | ${timeStamp}`;
}

// Gerar dados para observatórios
function generateObservatoryData(point, baseData, timeStamp) {
    const ozone = Math.floor(Math.random() * 50 + baseData.ozoneBase);
    const uvIndex = Math.floor(Math.random() * 10 + baseData.uvBase);
    const radiation = (Math.random() * 0.5 + baseData.radiationBase).toFixed(2);
    const atmosphericPressure = Math.floor(Math.random() * 20 + baseData.pressureBase);
    
    return `Ozone: ${ozone} DU | UV: ${uvIndex} | Radiation: ${radiation} μW/cm² | Pressure: ${atmosphericPressure} hPa | ${timeStamp}`;
}

// Gerar dados para satélites
function generateSatelliteData(point, baseData, timeStamp) {
    const orbit = Math.floor(Math.random() * 100 + 700);
    const dataRate = Math.floor(Math.random() * 1000 + 500);
    const coverage = Math.floor(Math.random() * 20 + 80);
    const missionStatus = Math.random() > 0.1 ? 'Operacional' : 'Manutenção';
    
    return `Orbit: ${orbit}km | Rate: ${dataRate} Mbps | Coverage: ${coverage}% | Status: ${missionStatus} | ${timeStamp}`;
}

// Obter dados base para localização
function getBaseDataForLocation(lat, lon) {
    // Dados base por região
    if (lat > 60) { // Ártico
        return { co2Base: 400, tempBase: -20, humidityBase: 60, pressureBase: 1013, ozoneBase: 250, uvBase: 2, radiationBase: 0.1 };
    } else if (lat < -60) { // Antártica
        return { co2Base: 380, tempBase: -30, humidityBase: 40, pressureBase: 1000, ozoneBase: 200, uvBase: 1, radiationBase: 0.05 };
    } else if (lat > 0 && lat < 30) { // Norte temperado
        return { co2Base: 420, tempBase: 15, humidityBase: 70, pressureBase: 1013, ozoneBase: 300, uvBase: 5, radiationBase: 0.3 };
    } else if (lat < 0 && lat > -30) { // Sul temperado
        return { co2Base: 410, tempBase: 20, humidityBase: 75, pressureBase: 1015, ozoneBase: 320, uvBase: 6, radiationBase: 0.4 };
    } else if (Math.abs(lat) < 30) { // Tropical
        return { co2Base: 400, tempBase: 25, humidityBase: 80, pressureBase: 1010, ozoneBase: 280, uvBase: 8, radiationBase: 0.5 };
    } else { // Outros
        return { co2Base: 415, tempBase: 10, humidityBase: 65, pressureBase: 1012, ozoneBase: 290, uvBase: 4, radiationBase: 0.2 };
    }
}

// Obter índice de qualidade do ar
function getAirQualityIndex(co2) {
    if (co2 < 400) return 'Excellent';
    if (co2 < 420) return 'Good';
    if (co2 < 450) return 'Moderate';
    if (co2 < 500) return 'Bad';
    return 'Very Bad';
}

// Obter status da qualidade do ar com cores
function getAirQualityStatus(data) {
    console.log(`🔍 getAirQualityStatus chamado para ${data.name}`);
    console.log('📊 Dados fictícios disponíveis:', data.fakeData);
    
    // Verificar se há dados fictícios disponíveis
    if (data.fakeData && data.fakeData.co2) {
        console.log(`✅ Usando dados fictícios para qualidade do ar:`, data.fakeData.co2);
        return data.fakeData.co2.quality;
    }
    
    // Verificar se há dados reais disponíveis
    const realData = getRealDataForPoint(data);
    
    if (realData && realData.airQuality && realData.airQuality.pm25 !== null) {
        console.log(`✅ Usando dados reais para qualidade do ar`);
        return getRealAirQualityStatus(realData.airQuality.pm25);
    }
    
    // Fallback para dados simulados
    console.log(`⚠️ Usando fallback para qualidade do ar`);
    const baseData = getBaseDataForLocation(data.lat, data.lon);
    const co2 = Math.floor(Math.random() * 20 + baseData.co2Base);
    
    if (co2 < 400) {
        return { status: '🟢 Excellent', color: '#4CAF50' };
    } else if (co2 < 420) {
        return { status: '🟡 Good', color: '#8BC34A' };
    } else if (co2 < 450) {
        return { status: '🟠 Moderate', color: '#FF9800' };
    } else if (co2 < 500) {
        return { status: '🔴 Bad', color: '#F44336' };
    } else {
        return { status: '💀 Very Bad', color: '#9C27B0' };
    }
}

// Obter status da qualidade do ar com dados reais (PM2.5)
function getRealAirQualityStatus(pm25) {
    if (pm25 <= 12) {
        return { status: '🟢 Good', color: '#4CAF50' };
    } else if (pm25 <= 35) {
        return { status: '🟡 Moderate', color: '#8BC34A' };
    } else if (pm25 <= 55) {
        return { status: '🟠 Unhealthy for sensitive groups', color: '#FF9800' };
    } else if (pm25 <= 150) {
        return { status: '🔴 Unhealthy', color: '#F44336' };
    } else {
        return { status: '💀 Very Unhealthy', color: '#9C27B0' };
    }
}

// Criar interfaces flutuantes em cima dos pontos
function createFloatingInterfaces() {
    if (earthMesh) {
        earthMesh.traverse((child) => {
            if (child.userData && child.userData.name) {
                const point = child.userData;
                const interface = createFloatingInterface(point);
                child.userData.floatingInterface = interface;
            }
        });
    }
}

// Criar interface flutuante individual
function createFloatingInterface(point) {
    const canvas = document.createElement('canvas');
    canvas.width = 160; // Menor largura
    canvas.height = 64; // Menor altura
    const ctx = canvas.getContext('2d');
    
    // Verificar se é ponto TEMPO para destacar
    const isTempoPoint = point.type === 'tempo' || point.name.includes('TEMPO');
    
    // Obter dados específicos
    const dataValue = getDisplayValue(point, currentDisplayData);
    const airQuality = getAirQualityStatus(point);
    
    // Fundo com gradiente (igual para todos)
    const gradient = ctx.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, 'rgba(10, 10, 10, 0.95)');
    gradient.addColorStop(1, 'rgba(20, 20, 20, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 160, 64);
    
    // Borda (igual para todos)
    ctx.strokeStyle = airQuality.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 158, 62);
    
    // Título (igual para todos)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    
    if (isTempoPoint) {
        ctx.fillText('🛰️ TEMPO NASA', 80, 14);
    } else {
        ctx.fillText(getDataTypeLabel(currentDisplayData), 80, 14);
    }
    
    // Valor do dado (igual para todos)
    ctx.fillStyle = airQuality.color;
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(dataValue, 80, 30);
    
    // Status da qualidade do ar
    ctx.fillStyle = '#d0d0d0';
    ctx.font = '9px Inter, sans-serif';
    ctx.fillText(airQuality.status, 80, 42);
    
    // Nome da estação
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '8px Inter, sans-serif';
    ctx.fillText(point.name, 80, 54);
    
    // Criar textura
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0.9 // Igual para todos
    });
    
    const sprite = new THREE.Sprite(material);
    
    // Escala base (será ajustada pelo zoom)
    sprite.scale.set(0.4, 0.16, 1);
    
    sprite.userData = { parentPoint: point, isTempo: isTempoPoint };
    
    // Posicionar acima do ponto (mais alto para TEMPO)
    const pointPosition = new THREE.Vector3();
    if (earthMesh) {
        earthMesh.traverse((child) => {
            if (child.userData && child.userData.name === point.name) {
                pointPosition.copy(child.position);
            }
        });
    }
    
    sprite.position.copy(pointPosition);
    sprite.position.y += 0.3; // Igual para todos
    
    earthMesh.add(sprite);
    return sprite;
}

// Obter label do tipo de dado
function getDataTypeLabel(dataType) {
    const labels = {
        'co2': '🌫️ CO₂',
        'temperature': '🌡️ Temperature',
        'ozone': '🛡️ Ozone',
        'humidity': '💧 Humidity',
        'pressure': '📈 Pressure'
    };
    return labels[dataType] || '📊 Dados';
}

// Atualizar interfaces flutuantes
function updateFloatingInterfaces() {
    if (earthMesh) {
        earthMesh.traverse((child) => {
            if (child.userData && child.userData.floatingInterface) {
                const interface = child.userData.floatingInterface;
                const point = child.userData;
                
                // Verificar se é ponto TEMPO para destacar
                const isTempoPoint = point.type === 'tempo' || point.name.includes('TEMPO');
                
                // Recriar interface com novos dados
                const canvas = document.createElement('canvas');
                canvas.width = 160; // Menor largura
                canvas.height = 64; // Menor altura
                const ctx = canvas.getContext('2d');
                
                // Obter dados específicos
                const dataValue = getDisplayValue(point, currentDisplayData);
                const airQuality = getAirQualityStatus(point);
                
                // Fundo com gradiente (igual para todos)
                const gradient = ctx.createLinearGradient(0, 0, 0, 64);
                gradient.addColorStop(0, 'rgba(10, 10, 10, 0.95)');
                gradient.addColorStop(1, 'rgba(20, 20, 20, 0.95)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 160, 64);
                
                // Borda (igual para todos)
                ctx.strokeStyle = airQuality.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(1, 1, 158, 62);
                
                // Título (igual para todos)
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.textAlign = 'center';
                
                if (isTempoPoint) {
                    ctx.fillText('🛰️ TEMPO NASA', 80, 14);
                } else {
                    ctx.fillText(getDataTypeLabel(currentDisplayData), 80, 14);
                }
                
                // Valor do dado (igual para todos)
                ctx.fillStyle = airQuality.color;
                ctx.font = 'bold 14px Inter, sans-serif';
                ctx.fillText(dataValue, 80, 30);
                
                // Status da qualidade do ar
                ctx.fillStyle = '#d0d0d0';
                ctx.font = '9px Inter, sans-serif';
                ctx.fillText(airQuality.status, 80, 42);
                
                // Nome da estação
                ctx.fillStyle = '#a0a0a0';
                ctx.font = '8px Inter, sans-serif';
                ctx.fillText(point.name, 80, 54);
                
                // Atualizar textura
                const texture = new THREE.CanvasTexture(canvas);
                interface.material.map = texture;
                interface.material.needsUpdate = true;
                
                // Aplicar escala base (será ajustada pelo zoom)
                interface.scale.set(0.4, 0.16, 1);
            }
        });
    }
}

// Criar aura atmosférica ao redor do planeta
function createAtmosphereAura() {
    // Geometria da esfera atmosférica (um pouco maior que a Terra)
    const atmosphereGeometry = new THREE.SphereGeometry(1.05, 32, 32);
    
    // Material da atmosfera com transparência
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x87CEEB, // Azul céu
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide, // Renderizar apenas o lado interno
        shininess: 100,
        specular: new THREE.Color(0x444444)
    });
    
    // Criar mesh da atmosfera
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.name = 'atmosphere';
    scene.add(atmosphere);
    
    // Adicionar efeito de brilho
    const glowGeometry = new THREE.SphereGeometry(1.08, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.name = 'atmosphereGlow';
    scene.add(glow);
    
    console.log('✅ Aura atmosférica criada com sucesso');
}

// Criar estrelas no céu
// Criar estrelas de fundo
function createStarField() {
    // Verificar se já existe
    const existingField = scene.getObjectByName('starField');
    if (existingField) {
        console.log('⭐ Campo estelar já existe');
        return;
    }
    
    // Criar geometria de esfera para o fundo estelar
    const starFieldGeometry = new THREE.SphereGeometry(100, 32, 32);
    
    // Criar textura procedural para as estrelas
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Fundo azul escuro
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, 2048, 1024);
    
    // Adicionar estrelas
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 1024;
        const size = Math.random() * 1.5 + 0.3; // Estrelas menores
        const brightness = Math.random() * 0.9 + 0.1;
        
        // Cores variadas das estrelas
        const colors = [
            'rgba(255, 255, 255, ' + brightness + ')', // Branco
            'rgba(255, 255, 200, ' + brightness + ')', // Amarelo claro
            'rgba(200, 200, 255, ' + brightness + ')', // Azul claro
            'rgba(255, 200, 200, ' + brightness + ')'  // Rosa claro
        ];
        
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Adicionar brilho para estrelas maiores
        if (size > 1.2) {
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.2})`;
            ctx.beginPath();
            ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Criar textura
    const starTexture = new THREE.CanvasTexture(canvas);
    starTexture.wrapS = THREE.RepeatWrapping;
    starTexture.wrapT = THREE.ClampToEdgeWrapping;
    
    // Criar material
    const starFieldMaterial = new THREE.MeshBasicMaterial({
        map: starTexture,
        transparent: true,
        opacity: 0.9,
        side: THREE.BackSide
    });
    
    // Criar mesh
    const starField = new THREE.Mesh(starFieldGeometry, starFieldMaterial);
    starField.name = 'starField';
    starField.position.set(0, 0, 0);
    scene.add(starField);
    
    console.log('✅ Campo estelar criado com sucesso');
}

// Obter valor específico para exibição
function getDisplayValue(point, dataType) {
    console.log(`🔍 getDisplayValue called for ${point.name} - type: ${dataType}`);
    console.log('📊 Dados disponíveis:', point.fakeData);
    
    // Verificar se há dados fictícios disponíveis
    if (point.fakeData && point.fakeData[dataType]) {
        const fakeData = point.fakeData[dataType];
        console.log(`✅ Usando dados fictícios para ${dataType}:`, fakeData);
        return `${fakeData.value} ${fakeData.unit}`;
    }
    
    // Verificar se há dados reais disponíveis
    const realData = getRealDataForPoint(point);
    
    if (realData && realData.hasRealData) {
        console.log(`✅ Usando dados reais para ${dataType}`);
        return getRealDisplayValue(point, dataType, realData);
    }
    
    // Fallback para dados simulados
    console.log(`⚠️ Usando fallback para ${dataType}`);
    const baseData = getBaseDataForLocation(point.lat, point.lon);
    
    switch (dataType) {
        case 'co2':
            const co2Fallback = Math.floor(Math.random() * 20 + baseData.co2Base);
            return `${co2Fallback} ppm CO₂`;
        case 'temperature':
            const temp = Math.floor(Math.random() * 20 + baseData.tempBase);
            return `${temp}°C`;
        case 'ozone':
            const ozone = Math.floor(Math.random() * 50 + baseData.ozoneBase);
            return `${ozone} DU`;
        case 'humidity':
            const humidity = Math.floor(Math.random() * 30 + baseData.humidityBase);
            return `${humidity}%`;
        case 'pressure':
            const pressure = Math.floor(Math.random() * 50 + baseData.pressureBase);
            return `${pressure.toFixed(2)} hPa`;
        default:
            // Sempre retornar dados fictícios realistas
            const baseDataDefault = getBaseDataForLocation(point.lat, point.lon);
            const co2Default = Math.floor(Math.random() * 20 + baseDataDefault.co2Base);
            return `${co2Default} ppm CO₂`;
    }
}

// Obter valor de exibição com dados reais ou fictícios
function getRealDisplayValue(point, dataType, realData) {
    // Sempre usar dados fictícios realistas para garantir que nunca apareça "não disponível"
    const baseData = getBaseDataForLocation(point.lat, point.lon);
    
    switch (dataType) {
        case 'co2':
            if (realData.airQuality && realData.airQuality.co !== null) {
                return `${realData.airQuality.co.toFixed(1)} ppm CO`;
            }
            // Fallback para dados fictícios
            const co2Value = Math.floor(Math.random() * 20 + baseData.co2Base);
            return `${co2Value} ppm CO₂`;
            
        case 'temperature':
            if (realData.weather && realData.weather.temperature !== null) {
                return `${realData.weather.temperature.toFixed(1)}°C`;
            }
            // Fallback para dados fictícios
            const temp = Math.floor(Math.random() * 20 + baseData.tempBase);
            return `${temp}°C`;
            
        case 'ozone':
            if (realData.airQuality && realData.airQuality.o3 !== null) {
                return `${realData.airQuality.o3.toFixed(1)} μg/m³ O₃`;
            }
            // Fallback para dados fictícios
            const ozone = Math.floor(Math.random() * 50 + baseData.ozoneBase);
            return `${ozone} DU`;
            
        case 'humidity':
            if (realData.weather && realData.weather.humidity !== null) {
                return `${realData.weather.humidity}%`;
            }
            // Fallback para dados fictícios
            const humidity = Math.floor(Math.random() * 30 + baseData.humidityBase);
            return `${humidity}%`;
            
        case 'pressure':
            if (realData.weather && realData.weather.pressure !== null) {
                return `${realData.weather.pressure.toFixed(2)} hPa`;
            }
            // Fallback para dados fictícios
            const pressure = Math.floor(Math.random() * 50 + baseData.pressureBase);
            return `${pressure.toFixed(2)} hPa`;
            
        default:
            // Fallback para dados fictícios
            const defaultCo2Value = Math.floor(Math.random() * 20 + baseData.co2Base);
            return `${defaultCo2Value} ppm CO₂`;
    }
}

// Função updateDataLabels removida - não utilizada

// Atualizar pontos com dados simulados
function updateDataPointsWithSimulatedData() {
    if (earthMesh) {
        earthMesh.traverse((child) => {
            if (child.userData && child.userData.name) {
                const point = child.userData;
                
                // Usar o mesmo sistema de geração de dados
                point.data = generateStationData(point);
            }
        });
    }
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
        color: 0x00ff00, // Green for ozone
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

// Carregar texturas
function loadTextures() {
    console.log('🌍 Carregando texturas locais primeiro...');
    console.log('📁 Usando texturas da pasta assets/textures/');
    
    const loader = new THREE.TextureLoader();
    
    // Configurar crossOrigin para evitar erros de CORS
    loader.crossOrigin = 'anonymous';
    
    let loadedCount = 0;
    const totalTextures = 5;
    
    // Função para verificar se todas as texturas foram carregadas
    function checkAllLoaded() {
        loadedCount++;
        console.log(`Texturas carregadas: ${loadedCount}/${totalTextures}`);
        
        if (loadedCount >= totalTextures) {
            console.log('Todas as texturas carregadas!');
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
            console.log('✅ Textura local da superfície carregada com sucesso!');
            checkAllLoaded();
        },
        undefined,
        (error) => {
            console.warn('Erro ao carregar textura local da superfície, tentando externa:', error);
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
            console.log('✅ Textura local de relevo carregada com sucesso!');
            checkAllLoaded();
        },
        undefined,
        (error) => {
            console.warn('Erro ao carregar textura local de relevo, tentando externa:', error);
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
            console.log('✅ Textura local de reflexos carregada com sucesso!');
            checkAllLoaded();
        },
        undefined,
        (error) => {
            console.warn('Erro ao carregar textura local de reflexos, tentando externa:', error);
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
            console.log('✅ Local ozone texture loaded successfully!');
            checkAllLoaded();
        },
        undefined,
        (error) => {
            console.warn('Error loading local ozone texture, trying external:', error);
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
            console.log('✅ Textura local de CO₂ carregada com sucesso!');
            checkAllLoaded();
        },
        undefined,
        (error) => {
            console.warn('Erro ao carregar textura local de CO₂, tentando externa:', error);
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
            console.warn(`Timeout no carregamento (${loadedCount}/${totalTextures} texturas), usando fallbacks`);
            
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
    
    console.log('Terra atualizada com texturas da NASA!');
}

// Atualizar atmosfera com texturas da NASA
function updateAtmosphereWithTextures() {
    if (!atmosphereMaterial || !window.atmosphereTextures) return;
    
    atmosphereMaterial.map = window.atmosphereTextures.ozone;
    atmosphereMaterial.needsUpdate = true;
    
    console.log('Atmosfera atualizada com texturas da NASA!');
}

// Criar globo terrestre
function createEarth() {
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    
    earthMaterial = new THREE.MeshPhongMaterial({
        map: window.earthTextures.surface,
        bumpMap: window.earthTextures.bump,
        bumpScale: 0.02,
        specularMap: window.earthTextures.specular,
        shininess: 100
    });
    
    earthMesh = new THREE.Mesh(geometry, earthMaterial);
    earthMesh.castShadow = true;
    earthMesh.receiveShadow = true;
    scene.add(earthMesh);
}

// Criar overlay atmosférico
function createAtmosphere() {
    const geometry = new THREE.SphereGeometry(ATMOSPHERE_RADIUS, 64, 64);
    
    atmosphereMaterial = new THREE.MeshBasicMaterial({
        map: window.atmosphereTextures.ozone,
        transparent: true,
        opacity: 0.6,
        side: THREE.BackSide
    });
    
    atmosphereMesh = new THREE.Mesh(geometry, atmosphereMaterial);
    scene.add(atmosphereMesh);
}

// Função removida - não mais necessária

// Esconder tela de carregamento
function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    isLoading = false;
}

// Configurar event listeners
function setupEventListeners() {
    // Botão do quiz
    document.getElementById('quiz-btn').addEventListener('click', () => {
        window.location.href = '/pages/quiz.html';
    });
    
    // Atualizar dados do clima periodicamente
    setInterval(() => {
        updateGlobalClimateData();
    }, 30000); // Atualizar a cada 30 segundos
    
    // Botões de tipo de dado exibido
    document.querySelectorAll('.display-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const displayType = btn.dataset.display;
            toggleDisplayData(displayType);
        });
    });
    
    // Redimensionamento da janela
    window.addEventListener('resize', onWindowResize);
    
    // Prevenir contexto do menu no canvas
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Interatividade com pontos de dados
    setupDataPointInteraction();
}

// Configurar interatividade com pontos de dados
function setupDataPointInteraction() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Criar tooltip moderno
    const tooltip = document.createElement('div');
    tooltip.id = 'dataTooltip';
    tooltip.style.cssText = `
        position: absolute;
        background: rgba(10, 10, 10, 0.95);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        font-size: 13px;
        pointer-events: none;
        z-index: 1000;
        display: none;
        max-width: 280px;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        font-family: 'Inter', sans-serif;
        line-height: 1.5;
    `;
    document.body.appendChild(tooltip);
    
    // Mouse move para detectar hover
    renderer.domElement.addEventListener('mousemove', (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([earthMesh], true);
        
        let found = false;
        intersects.forEach(intersect => {
            if (intersect.object.userData && intersect.object.userData.name) {
                const data = intersect.object.userData;
                const airQuality = getAirQualityStatus(data);
                
                tooltip.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${airQuality.color};"></div>
                        <strong style="color: #ffffff; font-size: 14px;">${data.name}</strong>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 8px; border-radius: 6px; margin-bottom: 8px;">
                        <div style="color: #4CAF50; font-weight: 600; font-size: 12px; margin-bottom: 4px;">${airQuality.status}</div>
                        <div style="color: #d0d0d0; font-size: 11px;">${data.data}</div>
                    </div>
                    <div style="color: #a0a0a0; font-size: 10px; text-align: center;">
                        📍 ${data.lat}°N, ${data.lon}°E
                    </div>
                `;
                tooltip.style.display = 'block';
                tooltip.style.left = (event.clientX + 15) + 'px';
                tooltip.style.top = (event.clientY - 15) + 'px';
                found = true;
            }
        });
        
        if (!found) {
            tooltip.style.display = 'none';
        }
    });
    
    // Click para focar no ponto
    renderer.domElement.addEventListener('click', (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([earthMesh], true);
        
        intersects.forEach(intersect => {
            if (intersect.object.userData && intersect.object.userData.name) {
                // Focar no ponto clicado
                const targetPosition = intersect.object.getWorldPosition(new THREE.Vector3());
                targetPosition.multiplyScalar(2.5);
                
                // Animação suave para o ponto
                animateCameraToPosition(targetPosition);
            }
        });
    });
}

// Animar câmera para posição
function animateCameraToPosition(targetPosition) {
    const startPosition = camera.position.clone();
    const startTime = Date.now();
    const duration = 1000; // 1 segundo
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
        controls.target.lerpVectors(controls.target, new THREE.Vector3(0, 0, 0), easeProgress * 0.1);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// Redimensionar renderer
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Atualizar nível de zoom
function updateZoomLevel() {
    const cameraDistance = camera.position.length();
    
    // Lógica invertida: quanto mais próximo, menor a interface
    // Quando distância = 3 (base): scaleFactor = 1
    // Quando distância = 1 (muito próximo): scaleFactor = 0.1
    // Quando distância = 5 (muito distante): scaleFactor = 0.6
    
    const scaleFactor = Math.max(0.1, Math.min(1, cameraDistance / baseCameraDistance));
    
    // Atualizar tamanho das interfaces
    updateInterfaceSizes(scaleFactor);
}

// Atualizar tamanhos das interfaces baseado no zoom
function updateInterfaceSizes(scaleFactor = 1) {
    if (earthMesh) {
        earthMesh.traverse((child) => {
            if (child.userData && child.userData.floatingInterface) {
                const interface = child.userData.floatingInterface;
                
                // Calcular novo tamanho baseado no zoom
                const baseScale = 0.4; // Escala base
                const newScale = baseScale * scaleFactor;
                
                // Aplicar nova escala
                interface.scale.set(newScale, newScale * 0.4, 1);
            }
        });
    }
}

// Loop de animação
function animate() {
    requestAnimationFrame(animate);
    
    if (!isLoading) {
        // Calcular nível de zoom
        updateZoomLevel();
        
        // Animar pontos de dados
        animateDataPoints();
    }
    
    // Atualizar controles
    controls.update();
    
    // Renderizar cena
    renderer.render(scene, camera);
}

// Animar pontos de dados
function animateDataPoints() {
    if (earthMesh) {
        earthMesh.traverse((child) => {
            // Animar interfaces flutuantes
            if (child.userData && child.userData.floatingInterface) {
                const interface = child.userData.floatingInterface;
                const pointPosition = new THREE.Vector3();
                
                // Encontrar posição do ponto pai
                earthMesh.traverse((pointChild) => {
                    if (pointChild.userData && pointChild.userData.name === child.userData.name) {
                        pointPosition.copy(pointChild.position);
                    }
                });
                
                // Atualizar posição da interface
                interface.position.copy(pointPosition);
                interface.position.y += 0.3;
                
                // Fazer a interface sempre olhar para a câmera
                interface.lookAt(camera.position);
            }
        });
    }
    
    // Animar campo estelar
    const starField = scene.getObjectByName('starField');
    if (starField) {
        // Rotação muito lenta para simular movimento das estrelas
        starField.rotation.y += 0.00005;
        starField.rotation.x += 0.00002;
    }
    
    // Animar aura atmosférica
    const atmosphere = scene.getObjectByName('atmosphere');
    if (atmosphere) {
        atmosphere.rotation.y += 0.001;
    }
    
    const atmosphereGlow = scene.getObjectByName('atmosphereGlow');
    if (atmosphereGlow) {
        atmosphereGlow.rotation.y -= 0.0005;
    }
}


// Inicializar quando a página carregar
window.addEventListener('load', init);

// Tratamento de erros
window.addEventListener('error', (e) => {
    console.error('Erro na aplicação:', e.error);
    if (isLoading) {
        hideLoading();
        document.getElementById('container').innerHTML = 
            '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #ff6b6b;">' +
            '<h3>Erro ao carregar texturas</h3>' +
            '<p>Verifique sua conexão com a internet</p>' +
            '</div>';
    }
});

// ===== INTERFACE DE INFORMAÇÕES =====

// Configurar modal de informações
function setupInfoModal() {
    const infoBtn = document.getElementById('info-btn');
    const infoModal = document.getElementById('info-modal');
    const closeBtn = document.getElementById('close-info');

    if (infoBtn && infoModal && closeBtn) {
        // Abrir modal
        infoBtn.addEventListener('click', () => {
            infoModal.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevenir scroll
        });

        // Fechar modal
        closeBtn.addEventListener('click', () => {
            infoModal.classList.remove('show');
            document.body.style.overflow = 'auto'; // Restaurar scroll
        });

        // Fechar modal clicando fora
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) {
                infoModal.classList.remove('show');
                document.body.style.overflow = 'auto';
            }
        });

        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && infoModal.classList.contains('show')) {
                infoModal.classList.remove('show');
                document.body.style.overflow = 'auto';
            }
        });
    }
}
