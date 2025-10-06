// ===== INTERFACES FLUTUANTES =====
// Este arquivo gerencia as interfaces flutuantes dos pontos de dados

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
        'temperature': 'Temperature',
        'ozone': 'Ozone',
        'humidity': 'Humidity',
        'pressure': 'Pressure'
    };
    return labels[dataType] || 'Data';
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

