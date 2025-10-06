// ===== SISTEMA DE PONTOS DE DADOS =====
// Este arquivo gerencia todos os pontos de dados no globo terrestre

// Criar pontos de dados informativos
function createDataPoints() {
    // Pontos de dados da NASA com coordenadas geograficamente corretas
    dataPoints = [
        {
            name: "Estação Espacial Internacional",
            lat: 51.6, // Londres, Reino Unido (órbita próxima)
            lon: -0.1,
            data: "Altitude: 408km | Velocidade: 27,600 km/h",
            color: 0xff6b6b,
            type: "station"
        },
        {
            name: "Observatório de Ozônio - Antártica",
            lat: -75.0, // Estação McMurdo, Antártica
            lon: 166.0,
            data: "Buraco na camada de ozônio monitorado",
            color: 0x4ecdc4,
            type: "observatory"
        },
        {
            name: "Estação de Monitoramento CO₂ - Mauna Loa",
            lat: 19.5, // Havaí, EUA
            lon: -155.6,
            data: "Concentração CO₂: 421 ppm (2024)",
            color: 0xffa726,
            type: "monitoring"
        },
        {
            name: "Satélite Aura (NASA)",
            lat: 0, // Equador (órbita)
            lon: 0,
            data: "Monitoramento atmosférico global",
            color: 0x9c27b0,
            type: "satellite"
        },
        {
            name: "Estação de Monitoramento - Ártico",
            lat: 78.2, // Svalbard, Noruega
            lon: 15.6,
            data: "Temperatura: -15°C | CO₂: 420 ppm",
            color: 0x2196f3,
            type: "monitoring"
        },
        {
            name: "Estação de Monitoramento - Amazônia",
            lat: -3.1, // Manaus, Brasil
            lon: -60.0,
            data: "Floresta tropical | CO₂: 380 ppm",
            color: 0x4caf50,
            type: "monitoring"
        },
        {
            name: "Estação de Monitoramento - Sibéria",
            lat: 64.0, // Yakutsk, Sibéria, Rússia
            lon: 129.7,
            data: "Permafrost | Temperatura: -25°C",
            color: 0x607d8b,
            type: "monitoring"
        },
        {
            name: "Estação de Monitoramento - Austrália",
            lat: -25.3, // Alice Springs, Austrália
            lon: 133.3,
            data: "Deserto | CO₂: 410 ppm",
            color: 0xff9800,
            type: "monitoring"
        },
        {
            name: "Estação de Monitoramento - África",
            lat: -1.3, // Nairobi, Quênia
            lon: 36.8,
            data: "Savana | CO₂: 390 ppm",
            color: 0x8bc34a,
            type: "monitoring"
        },
        {
            name: "Estação de Monitoramento - Europa",
            lat: 52.5, // Berlim, Alemanha
            lon: 13.4,
            data: "Temperado | CO₂: 420 ppm",
            color: 0x2196f3,
            type: "monitoring"
        },
        {
            name: "Estação de Monitoramento - Ásia",
            lat: 35.7, // Tóquio, Japão
            lon: 139.7,
            data: "Industrial | CO₂: 450 ppm",
            color: 0xf44336,
            type: "monitoring"
        },
        {
            name: "Estação de Monitoramento - América do Norte",
            lat: 40.7, // Nova York, EUA
            lon: -74.0,
            data: "Continental | CO₂: 415 ppm",
            color: 0x9c27b0,
            type: "monitoring"
        },
        {
            name: "Estação de Monitoramento - Oceano Pacífico",
            lat: 0.0, // Oceano Pacífico Central
            lon: -150.0,
            data: "Oceano | CO₂: 380 ppm",
            color: 0x00bcd4,
            type: "monitoring"
        },
        {
            name: "Estação de Monitoramento - Oceano Atlântico",
            lat: 0.0, // Oceano Atlântico Central
            lon: -30.0,
            data: "Oceano | CO₂: 385 ppm",
            color: 0x009688,
            type: "monitoring"
        }
    ];
    
    dataPoints.forEach(point => {
        // Converter coordenadas para posição 3D
        const phi = (90 - point.lat) * (Math.PI / 180);
        const theta = (point.lon + 180) * (Math.PI / 180);
        
        const x = EARTH_RADIUS * Math.sin(phi) * Math.cos(theta);
        const y = EARTH_RADIUS * Math.cos(phi);
        const z = EARTH_RADIUS * Math.sin(phi) * Math.sin(theta);
        
        // Criar ponto visual (sólido e fixo)
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
        
        // Ponto fixo sem animação
        pointMesh.scale.set(1.0, 1.0, 1.0);
        
        // Adicionar ponto como filho do globo terrestre
        earthMesh.add(pointMesh);
        
        // Criar linha conectora para a superfície (mais visível)
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
    
    // Dados simulados para demonstração
    
    // Criar interfaces flutuantes
    createFloatingInterfaces();
    
    // Criar aura atmosférica
    createAtmosphereAura();
    
    // Criar estrelas no céu
    createStarField();
    
    // Integrar dados reais (em background)
    setTimeout(() => {
        integrateRealDataWithPoints();
    }, 2000); // Aguardar 2 segundos para carregar o globo primeiro
    
    // Adicionar pontos específicos do TEMPO
    addTEMPOPointsToGlobe();
    
    // Ativar sistema de fallback com dados fictícios
    createFallbackDataSystem();
    
    // Atualizar dados do TEMPO no painel desde o início
    updateTEMPODataInPanel();
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
    
    return `Altitude: ${altitude}km | Velocidade: ${velocity} km/h | Órbita: ${orbit}° | Status: Ativo | ${timeStamp}`;
}

// Gerar dados para estações de monitoramento
function generateMonitoringData(point, baseData, timeStamp) {
    const co2 = Math.floor(Math.random() * 20 + baseData.co2Base);
    const temp = Math.floor(Math.random() * 20 + baseData.tempBase);
    const humidity = Math.floor(Math.random() * 30 + baseData.humidityBase);
    const pressure = Math.floor(Math.random() * 50 + baseData.pressureBase);
    const airQuality = getAirQualityIndex(co2);
    
    return `CO₂: ${co2} ppm | Temp: ${temp}°C | Umidade: ${humidity}% | Pressão: ${pressure.toFixed(2)} hPa | AQI: ${airQuality} | ${timeStamp}`;
}

// Gerar dados para observatórios
function generateObservatoryData(point, baseData, timeStamp) {
    const ozone = Math.floor(Math.random() * 50 + baseData.ozoneBase);
    const uvIndex = Math.floor(Math.random() * 10 + baseData.uvBase);
    const radiation = (Math.random() * 0.5 + baseData.radiationBase).toFixed(2);
    const atmosphericPressure = Math.floor(Math.random() * 20 + baseData.pressureBase);
    
    return `Ozônio: ${ozone} DU | UV: ${uvIndex} | Radiação: ${radiation} μW/cm² | Pressão: ${atmosphericPressure} hPa | ${timeStamp}`;
}

// Gerar dados para satélites
function generateSatelliteData(point, baseData, timeStamp) {
    const orbit = Math.floor(Math.random() * 100 + 700);
    const dataRate = Math.floor(Math.random() * 1000 + 500);
    const coverage = Math.floor(Math.random() * 20 + 80);
    const missionStatus = Math.random() > 0.1 ? 'Operacional' : 'Manutenção';
    
    return `Órbita: ${orbit}km | Taxa: ${dataRate} Mbps | Cobertura: ${coverage}% | Status: ${missionStatus} | ${timeStamp}`;
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
    if (co2 < 400) return 'Excelente';
    if (co2 < 420) return 'Bom';
    if (co2 < 450) return 'Moderado';
    if (co2 < 500) return 'Ruim';
    return 'Muito Ruim';
}

