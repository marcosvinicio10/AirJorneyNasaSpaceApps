// ===== INTEGRAÇÃO DE DADOS =====
// Este arquivo gerencia a integração de dados reais com o sistema

// Integrar dados reais com pontos existentes
async function integrateRealDataWithPoints() {
    
    if (!earthMesh) {
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
    
    
    for (let i = 0; i < pointsToProcess.length; i++) {
        const point = pointsToProcess[i];
        
        try {
            
            // Buscar dados de qualidade do ar
            const airQualityData = await fetchAirQualityData(point.lat, point.lon);
            if (airQualityData.length > 0) {
                point.realAirQuality = processAirQualityData(airQualityData);
            } else {
            }
            
            // Buscar dados meteorológicos
            const weatherData = await fetchWeatherData(point.lat, point.lon);
            if (weatherData) {
                point.realWeather = processWeatherData(weatherData);
            } else {
            }
            
            // Pequeno delay para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
        }
    }
    
    updateDataPointsWithRealData();
    
    // Integrar dados de queimadas em paralelo
    integrateFireData();
    
    // Integrar dados do TEMPO em paralelo
    integrateTEMPODataWithPoints();
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

// Atualizar interface flutuante com dados reais
function updateFloatingInterfaceWithRealData(interface, realData) {
    // Esta função será chamada quando a interface for atualizada
}

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

