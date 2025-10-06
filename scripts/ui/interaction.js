// ===== SISTEMA DE INTERAÇÃO =====
// Este arquivo gerencia as interações do usuário com o globo

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

