// ===== SISTEMA DE EXIBIÇÃO DE DADOS =====
// Este arquivo gerencia a exibição e manipulação dos dados

// Obter valor específico para exibição
function getDisplayValue(point, dataType) {
    
    // Verificar se há dados fictícios disponíveis
    if (point.fakeData && point.fakeData[dataType]) {
        const fakeData = point.fakeData[dataType];
        return `${fakeData.value} ${fakeData.unit}`;
    }
    
    // Verificar se há dados reais disponíveis
    const realData = getRealDataForPoint(point);
    
    if (realData && realData.hasRealData) {
        return getRealDisplayValue(point, dataType, realData);
    }
    
    // Fallback para dados simulados
    const baseData = getBaseDataForLocation(point.lat, point.lon);
    
    switch (dataType) {
        case 'co2':
            const co2 = Math.floor(Math.random() * 20 + baseData.co2Base);
            return `${co2} ppm CO₂`;
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
            return 'N/A';
    }
}

// Obter valor de exibição com dados reais
function getRealDisplayValue(point, dataType, realData) {
    switch (dataType) {
        case 'co2':
            if (realData.airQuality && realData.airQuality.co !== null) {
                return `${realData.airQuality.co.toFixed(1)} ppm CO`;
            }
            return 'Dados não disponíveis';
            
        case 'temperature':
            if (realData.weather && realData.weather.temperature !== null) {
                return `${realData.weather.temperature.toFixed(1)}°C`;
            }
            return 'Dados não disponíveis';
            
        case 'ozone':
            if (realData.airQuality && realData.airQuality.o3 !== null) {
                return `${realData.airQuality.o3.toFixed(1)} μg/m³ O₃`;
            }
            return 'Dados não disponíveis';
            
        case 'humidity':
            if (realData.weather && realData.weather.humidity !== null) {
                return `${realData.weather.humidity}%`;
            }
            return 'Dados não disponíveis';
            
        case 'pressure':
            if (realData.weather && realData.weather.pressure !== null) {
                return `${realData.weather.pressure.toFixed(2)} hPa`;
            }
            return 'Dados não disponíveis';
            
        default:
            return 'Dados não disponíveis';
    }
}

// Obter status da qualidade do ar com cores
function getAirQualityStatus(data) {
    
    // Verificar se há dados fictícios disponíveis
    if (data.fakeData && data.fakeData.co2) {
        return data.fakeData.co2.quality;
    }
    
    // Verificar se há dados reais disponíveis
    const realData = getRealDataForPoint(data);
    
    if (realData && realData.airQuality && realData.airQuality.pm25 !== null) {
        return getRealAirQualityStatus(realData.airQuality.pm25);
    }
    
    // Fallback para dados simulados
    const baseData = getBaseDataForLocation(data.lat, data.lon);
    const co2 = Math.floor(Math.random() * 20 + baseData.co2Base);
    
    if (co2 < 400) {
        return { status: 'Excellent', color: '#4CAF50' };
    } else if (co2 < 420) {
        return { status: 'Good', color: '#8BC34A' };
    } else if (co2 < 450) {
        return { status: 'Moderate', color: '#FF9800' };
    } else if (co2 < 500) {
        return { status: 'Bad', color: '#F44336' };
    } else {
        return { status: 'Very Bad', color: '#9C27B0' };
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

// Alternar tipo de dado exibido
function toggleDisplayData(displayType) {
    currentDisplayData = displayType;
    updateMenuButtons();
    updateFloatingInterfaces();
    updateGlobalClimateData(); // Atualizar dados do clima
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
                    // Converter ozônio para temperatura aproximada (simulação)
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
    // Temperatura global
    const tempElement = document.getElementById('global-temperature');
    if (tempElement && climateData.temperature.values.length > 0) {
        const minTemp = climateData.temperature.min.toFixed(1);
        const maxTemp = climateData.temperature.max.toFixed(1);
        tempElement.textContent = `${minTemp}°C - ${maxTemp}°C`;
    }
    
    // Umidade média
    const humidityElement = document.getElementById('global-humidity');
    if (humidityElement && climateData.humidity.values.length > 0) {
        const avgHumidity = calculateAverage(climateData.humidity.values);
        humidityElement.textContent = `${Math.round(avgHumidity)}%`;
    }
    
    // Pressão atmosférica
    const pressureElement = document.getElementById('global-pressure');
    if (pressureElement && climateData.pressure.values.length > 0) {
        const avgPressure = calculateAverage(climateData.pressure.values);
        pressureElement.textContent = `${avgPressure.toFixed(2)} hPa`;
    }
    
    // Velocidade do vento
    const windElement = document.getElementById('global-wind');
    if (windElement && climateData.wind.values.length > 0) {
        const avgWind = calculateAverage(climateData.wind.values);
        windElement.textContent = `${Math.round(avgWind * 3.6)} km/h`; // Converter m/s para km/h
    }
    
    // Cobertura de nuvens
    const cloudsElement = document.getElementById('global-clouds');
    if (cloudsElement && climateData.clouds.values.length > 0) {
        const avgClouds = calculateAverage(climateData.clouds.values);
        cloudsElement.textContent = `${Math.round(avgClouds)}%`;
    }
    
    // Sensação térmica
    const feelsLikeElement = document.getElementById('global-feels-like');
    if (feelsLikeElement && climateData.feelsLike.values.length > 0) {
        const avgFeelsLike = calculateAverage(climateData.feelsLike.values);
        feelsLikeElement.textContent = `${avgFeelsLike.toFixed(1)}°C`;
    }
    
}

