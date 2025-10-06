// ===== CONFIGURAÇÕES GLOBAIS =====
// Este arquivo contém todas as configurações globais do projeto AirJorney

// Configurações do globo terrestre
const EARTH_RADIUS = 1;
const ATMOSPHERE_RADIUS = 1.01;
const ROTATION_SPEED = 0.002;

// Configurações de APIs
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
        apiKey: 'demo', // Será substituído por chave real
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
    // NOVA API: NASA TEMPO
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

// Variáveis globais do Three.js
let scene, camera, renderer, controls;
let earthMesh, atmosphereMesh;
let earthMaterial, atmosphereMaterial;
let isLoading = true;
let currentDisplayData = 'co2'; // 'co2', 'temperature', 'ozone', 'humidity', 'pressure'
let dataPoints = [];
let baseCameraDistance = 5; // Distância base da câmera
let currentZoomLevel = 1; // Nível de zoom atual

// Armazenar texturas globalmente
window.earthTextures = {};
window.atmosphereTextures = {};

