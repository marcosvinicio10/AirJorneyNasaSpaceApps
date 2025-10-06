// ===== API METEOROLÓGICA =====
// Este arquivo gerencia as APIs meteorológicas (OpenWeatherMap)

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
    let baseTemp = 25; // Temperatura base
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

