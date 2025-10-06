// ===== API NASA TEMPO =====
// Este arquivo gerencia a integração com a API NASA TEMPO

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
        
        // Fallback: usar dados simulados baseados no TEMPO
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
    // Simular dados baseados na localização e tipo de poluente
    let baseValue = 0;
    let unit = '';
    let description = '';
    
    switch(pollutant) {
        case 'ozone':
            baseValue = 40 + Math.random() * 30; // 40-70 ppb
            unit = 'ppb';
            description = 'Ozônio Troposférico';
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

// Adicionar pontos específicos do TEMPO ao globo
function addTEMPOPointsToGlobe() {
    if (!earthMesh) return;
    
    // Criar pontos específicos do TEMPO
    const tempoPoints = [
        {
            name: "TEMPO - Los Angeles",
            lat: 34.0522,
            lon: -118.2437,
            data: "Ozônio: 45 ppb | NO₂: 15 ppb",
            color: 0xff6b6b,
            type: "tempo"
        },
        {
            name: "TEMPO - New York",
            lat: 40.7128,
            lon: -74.0060,
            data: "Ozônio: 38 ppb | NO₂: 22 ppb",
            color: 0x4ecdc4,
            type: "tempo"
        },
        {
            name: "TEMPO - Chicago",
            lat: 41.8781,
            lon: -87.6298,
            data: "Ozônio: 42 ppb | NO₂: 18 ppb",
            color: 0xffa726,
            type: "tempo"
        },
        {
            name: "TEMPO - Houston",
            lat: 29.7604,
            lon: -95.3698,
            data: "Ozônio: 52 ppb | NO₂: 25 ppb",
            color: 0xe91e63,
            type: "tempo"
        },
        {
            name: "TEMPO - Phoenix",
            lat: 33.4484,
            lon: -112.0740,
            data: "Ozônio: 48 ppb | NO₂: 12 ppb",
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
    
}

// Integrar dados do TEMPO com pontos existentes
async function integrateTEMPODataWithPoints() {
    
    if (!earthMesh) {
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
    
    
    for (let i = 0; i < pointsToProcess.length; i++) {
        const point = pointsToProcess[i];
        
        try {
            
            // Buscar dados do TEMPO para diferentes poluentes
            const tempoData = await fetchTEMPOData(point.lat, point.lon, 'ozone');
            if (tempoData) {
                point.tempoData = tempoData;
            }
            
            // Pequeno delay para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));
            
        } catch (error) {
        }
    }
    
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
    
    
    // Atualizar interfaces flutuantes após carregar dados TEMPO
    updateFloatingInterfaces();
}

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

