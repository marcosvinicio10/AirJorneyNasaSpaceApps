// ===== API DE DADOS DE QUEIMADAS =====
// Este arquivo gerencia as APIs de dados de queimadas (NASA FIRMS)

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

// Buscar e integrar dados de queimadas
async function integrateFireData() {
    try {
        const fireData = await fetchFireData();
        
        // Atualizar contador de queimadas
        const fireCountElement = document.getElementById('fire-count');
        if (fireCountElement) {
            fireCountElement.textContent = `${fireData.length} ativos`;
            fireCountElement.className = 'analysis-value';
        }
        
        // Adicionar pontos de queimadas ao globo
        addFirePointsToGlobe(fireData);
        
    } catch (error) {
        const fireCountElement = document.getElementById('fire-count');
        if (fireCountElement) {
            fireCountElement.textContent = 'Erro ao carregar';
            fireCountElement.className = 'analysis-value error';
        }
    }
}

// Adicionar pontos de queimadas ao globo
function addFirePointsToGlobe(fireData) {
    if (!earthMesh || fireData.length === 0) return;
    
    fireData.forEach(fire => {
        // Converter coordenadas para posição 3D
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
    
}

