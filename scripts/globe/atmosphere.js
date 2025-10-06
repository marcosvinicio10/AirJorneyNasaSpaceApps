// ===== SISTEMA ATMOSFÉRICO =====
// Este arquivo gerencia a atmosfera e efeitos visuais do globo

// Criar aura atmosférica ao redor do planeta
function createAtmosphereAura() {
    // Geometria da esfera atmosférica (um pouco maior que a Terra)
    const atmosphereGeometry = new THREE.SphereGeometry(1.05, 32, 32);
    
    // Material da atmosfera com transparência
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x87CEEB, // Azul céu
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide, // Renderizar apenas o lado interno
        shininess: 100,
        specular: new THREE.Color(0x444444)
    });
    
    // Criar mesh da atmosfera
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.name = 'atmosphere';
    scene.add(atmosphere);
    
    // Adicionar efeito de brilho
    const glowGeometry = new THREE.SphereGeometry(1.08, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.name = 'atmosphereGlow';
    scene.add(glow);
    
}

// Criar estrelas de fundo
function createStarField() {
    // Verificar se já existe
    const existingField = scene.getObjectByName('starField');
    if (existingField) {
        return;
    }
    
    // Criar geometria de esfera para o fundo estelar
    const starFieldGeometry = new THREE.SphereGeometry(100, 32, 32);
    
    // Criar textura procedural para as estrelas
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Fundo azul escuro
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, 2048, 1024);
    
    // Adicionar estrelas
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 1024;
        const size = Math.random() * 1.5 + 0.3; // Estrelas menores
        const brightness = Math.random() * 0.9 + 0.1;
        
        // Cores variadas das estrelas
        const colors = [
            'rgba(255, 255, 255, ' + brightness + ')', // Branco
            'rgba(255, 255, 200, ' + brightness + ')', // Amarelo claro
            'rgba(200, 200, 255, ' + brightness + ')', // Azul claro
            'rgba(255, 200, 200, ' + brightness + ')'  // Rosa claro
        ];
        
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Adicionar brilho para estrelas maiores
        if (size > 1.2) {
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.2})`;
            ctx.beginPath();
            ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Criar textura
    const starTexture = new THREE.CanvasTexture(canvas);
    starTexture.wrapS = THREE.RepeatWrapping;
    starTexture.wrapT = THREE.ClampToEdgeWrapping;
    
    // Criar material
    const starFieldMaterial = new THREE.MeshBasicMaterial({
        map: starTexture,
        transparent: true,
        opacity: 0.9,
        side: THREE.BackSide
    });
    
    // Criar mesh
    const starField = new THREE.Mesh(starFieldGeometry, starFieldMaterial);
    starField.name = 'starField';
    starField.position.set(0, 0, 0);
    scene.add(starField);
    
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

