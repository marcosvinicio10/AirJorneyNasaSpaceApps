// ===== SISTEMA DE FALLBACK COM DADOS FICTÍCIOS =====
// Este arquivo gerencia o sistema de fallback com dados simulados

// Gerador de dados fictícios realistas
function generateRealisticFakeData(lat, lon, dataType) {
    const baseData = {
        // Dados baseados na localização
        temperature: {
            // Temperatura baseada na latitude (mais frio nos polos)
            base: 30 - Math.abs(lat) * 0.4,
            variation: (Math.random() - 0.5) * 10,
            unit: '°C'
        },
        humidity: {
            // Umidade baseada na proximidade do oceano
            base: 50 + Math.random() * 40,
            unit: '%'
        },
        pressure: {
            // Pressão atmosférica baseada na altitude
            base: 1013 + (Math.random() - 0.5) * 50,
            unit: 'hPa'
        },
        co2: {
            // CO₂ baseado na urbanização
            base: 400 + Math.random() * 100,
            unit: 'ppm'
        },
        ozone: {
            // Ozônio baseado na latitude e estação
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
        return { status: 'Ruim', color: '#F44336' };
    }
}

// Sistema de fallback automático
function createFallbackDataSystem() {
    
    // Adicionar pontos de dados fictícios em várias regiões
    const fakeDataPoints = [
        // Europa
        { name: "Estação - Londres", lat: 51.5074, lon: -0.1278, region: "Europa" },
        { name: "Estação - Paris", lat: 48.8566, lon: 2.3522, region: "Europa" },
        { name: "Estação - Berlim", lat: 52.5200, lon: 13.4050, region: "Europa" },
        { name: "Estação - Madrid", lat: 40.4168, lon: -3.7038, region: "Europa" },
        { name: "Estação - Roma", lat: 41.9028, lon: 12.4964, region: "Europa" },
        
        // Ásia
        { name: "Estação - Tóquio", lat: 35.6762, lon: 139.6503, region: "Ásia" },
        { name: "Estação - Pequim", lat: 39.9042, lon: 116.4074, region: "Ásia" },
        { name: "Estação - Mumbai", lat: 19.0760, lon: 72.8777, region: "Ásia" },
        { name: "Estação - Sydney", lat: -33.8688, lon: 151.2093, region: "Oceania" },
        { name: "Estação - Seul", lat: 37.5665, lon: 126.9780, region: "Ásia" },
        
        // América do Sul
        { name: "Estação - São Paulo", lat: -23.5505, lon: -130.6333, region: "América do Sul" },
        { name: "Estação - Buenos Aires", lat: -23.6118, lon: -118.3960, region: "América do Sul" },
        { name: "Estação - Lima", lat: -2.0464, lon: -110.0428, region: "América do Sul" },
        { name: "Estação - Bogotá", lat: 4.7110, lon: -74.0721, region: "América do Sul" },
        { name: "Estação - Santiago", lat: -93.4489, lon: -70.6693, region: "América do Sul" },
        
        // África
        { name: "Estação - Cairo", lat: 30.0444, lon: 31.2357, region: "África" },
        { name: "Estação - Lagos", lat: 6.5244, lon: 3.3792, region: "África" },
        { name: "Estação - Joanesburgo", lat: -26.2041, lon: 28.0473, region: "África" },
        { name: "Estação - Casablanca", lat: 33.5731, lon: -7.5898, region: "África" },
        { name: "Estação - Nairobi", lat: -1.2921, lon: 36.8219, region: "África" },
        
        // América do Norte (fora dos pontos TEMPO)
        { name: "Estação - Vancouver", lat: 49.2827, lon: -123.1207, region: "América do Norte" },
        { name: "Estação - Toronto", lat: 43.6532, lon: -79.3832, region: "América do Norte" },
        { name: "Estação - Miami", lat: 25.7617, lon: -80.1918, region: "América do Norte" },
        { name: "Estação - Seattle", lat: 47.6062, lon: -122.3321, region: "América do Norte" },
        { name: "Estação - Denver", lat: 39.7392, lon: -104.9903, region: "América do Norte" }
    ];
    
    // Adicionar pontos ao globo
    fakeDataPoints.forEach(point => {
        // Gerar dados fictícios para cada tipo
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

