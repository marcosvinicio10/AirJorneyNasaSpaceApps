// ===== SISTEMA DE ANIMAÇÃO =====
// Este arquivo gerencia todas as animações do globo terrestre

// Loop de animação principal
function animate() {
    requestAnimationFrame(animate);
    
    if (!isLoading) {
        // Calcular nível de zoom
        updateZoomLevel();
        
        // Animar pontos de dados
        animateDataPoints();
    }
    
    // Atualizar controles
    controls.update();
    
    // Renderizar cena
    renderer.render(scene, camera);
}

// Animar pontos de dados
function animateDataPoints() {
    if (earthMesh) {
        earthMesh.traverse((child) => {
            // Animar interfaces flutuantes
            if (child.userData && child.userData.floatingInterface) {
                const interface = child.userData.floatingInterface;
                const pointPosition = new THREE.Vector3();
                
                // Encontrar posição do ponto pai
                earthMesh.traverse((pointChild) => {
                    if (pointChild.userData && pointChild.userData.name === child.userData.name) {
                        pointPosition.copy(pointChild.position);
                    }
                });
                
                // Atualizar posição da interface
                interface.position.copy(pointPosition);
                interface.position.y += 0.3;
                
                // Fazer a interface sempre olhar para a câmera
                interface.lookAt(camera.position);
            }
        });
    }
    
    // Animar campo estelar
    const starField = scene.getObjectByName('starField');
    if (starField) {
        // Rotação muito lenta para simular movimento das estrelas
        starField.rotation.y += 0.00005;
        starField.rotation.x += 0.00002;
    }
    
    // Animar aura atmosférica
    const atmosphere = scene.getObjectByName('atmosphere');
    if (atmosphere) {
        atmosphere.rotation.y += 0.001;
    }
    
    const atmosphereGlow = scene.getObjectByName('atmosphereGlow');
    if (atmosphereGlow) {
        atmosphereGlow.rotation.y -= 0.0005;
    }
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

