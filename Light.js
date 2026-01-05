
function updateDynamicLighting() {
    const playerPos = camera.position;
    const updateRadius = 30;

    lightingSystem.lights.forEach((lightData, key) => {
        const dx = lightData.x - playerPos.x;
        const dy = lightData.y - playerPos.y;
        const dz = lightData.z - playerPos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Otimização: desativar luzes muito distantes
        if (dist > updateRadius) {
            lightData.light.visible = false;
        } else {
            lightData.light.visible = true;

            // Efeito de cintilação suave para tochas
            if (lightData.type === 'torch') {
                const flicker = 0.95 + Math.sin(Date.now() * 0.01 + lightData.x) * 0.05;
                lightData.light.intensity = 1.5 * flicker;
            }
        }
    });
}

function addWaterLighting(x, y, z) {
    const waterLight = new THREE.PointLight(0x4499FF, 0.3, 8);
    waterLight.position.set(x, y, z);
    scene.add(waterLight);

    return waterLight;
}



function setupShadowSystem() {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras suaves
    renderer.shadowMap.autoUpdate = true;

    // Configurações de qualidade
    updateShadowQuality(shadowSystem.quality);
}

function updateShadowQuality(quality) {
    let mapSize, bias;

    switch(quality) {
        case 'low':
            mapSize = 512;
            bias = -0.001;
            renderer.shadowMap.type = THREE.BasicShadowMap;
            break;
        case 'medium':
            mapSize = 1024;
            bias = -0.0005;
            renderer.shadowMap.type = THREE.PCFShadowMap;
            break;
        case 'high':
            mapSize = 2048;
            bias = -0.0001;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            break;
        case 'ultra':
            mapSize = 4096;
            bias = -0.00005;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            break;
        default:
            mapSize = 2048;
            bias = -0.0001;
    }

    shadowSystem.quality = quality;

    // Atualizar todas as luzes existentes
    scene.traverse(obj => {
        if (obj.isLight && obj.castShadow) {
            obj.shadow.mapSize.width = mapSize;
            obj.shadow.mapSize.height = mapSize;
            obj.shadow.bias = bias;
            obj.shadow.needsUpdate = true;
        }
    });
}

function setupSunShadows(sunLight) {
    sunLight.castShadow = true;

    // Configuração de alta qualidade para o sol
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;

    // Área de sombra grande
    const shadowSize = 100;
    sunLight.shadow.camera.left = -shadowSize;
    sunLight.shadow.camera.right = shadowSize;
    sunLight.shadow.camera.top = shadowSize;
    sunLight.shadow.camera.bottom = -shadowSize;

    sunLight.shadow.bias = -0.0001;
    sunLight.shadow.radius = 2; // Sombras mais suaves

    return sunLight;
}

function enableShadowsForChunk(chunkKey) {
    const chunkMesh = chunkMeshes[chunkKey];
    if (!chunkMesh) return;

    chunkMesh.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Otimização: apenas blocos próximos projetam sombras
            child.userData.updateShadow = true;
        }
    });
}

function updateDynamicShadows() {
    if (!shadowSystem.dynamicShadows) return;

    const playerPos = camera.position;
    const shadowRadius = shadowSystem.shadowDistance;

    // Atualizar sombras apenas para chunks próximos
    for (let key in chunkMeshes) {
        const [cx, cz] = key.split(',').map(Number);
        const chunkCenterX = cx * CHUNK_SIZE + CHUNK_SIZE / 2;
        const chunkCenterZ = cz * CHUNK_SIZE + CHUNK_SIZE / 2;

        const dx = chunkCenterX - playerPos.x;
        const dz = chunkCenterZ - playerPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        const chunk = chunkMeshes[key];
        if (chunk) {
            chunk.traverse(child => {
                if (child.isMesh) {
                    // Ativar/desativar sombras baseado na distância
                    const shouldCastShadow = dist < shadowRadius;
                    child.castShadow = shouldCastShadow;
                    child.receiveShadow = true; // Sempre recebe sombras
                }
            });
        }
    }

    // Atualizar sombras de entidades
    [animals, enemies, villagers].forEach(entityList => {
        entityList.forEach(entity => {
            if (entity.mesh) {
                const dx = entity.x - playerPos.x;
                const dz = entity.z - playerPos.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                entity.mesh.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = dist < shadowRadius;
                        child.receiveShadow = true;
                    }
                });
            }
        });
    });
}

function setupPlayerShadows() {
    if (playerCharacter && playerCharacter.group) {
        playerCharacter.group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }
}

function addAmbientOcclusion() {
    // Adicionar luz hemisférica para AO
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);

    return hemiLight;
}

function addVolumetricShadows() {
    const volumetricLight = new THREE.SpotLight(0xffffff, 0.5);
    volumetricLight.position.set(50, 100, 50);
    volumetricLight.angle = Math.PI / 4;
    volumetricLight.penumbra = 0.8;
    volumetricLight.decay = 2;
    volumetricLight.distance = 300;

    volumetricLight.castShadow = true;
    volumetricLight.shadow.mapSize.width = 2048;
    volumetricLight.shadow.mapSize.height = 2048;
    volumetricLight.shadow.camera.near = 1;
    volumetricLight.shadow.camera.far = 300;
    volumetricLight.shadow.bias = -0.0001;

    scene.add(volumetricLight);

    return volumetricLight;
}

function updateSunShadowPosition() {
    scene.traverse(obj => {
        if (obj.isDirectionalLight && obj.castShadow) {
            // Seguir o jogador para sombras sempre visíveis
            const playerPos = camera.position;
            obj.shadow.camera.position.copy(playerPos);
            obj.shadow.camera.updateProjectionMatrix();
            obj.shadow.needsUpdate = true;
        }
    });
}

function enableSoftShadows() {
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene.traverse(obj => {
        if (obj.isLight && obj.shadow) {
            obj.shadow.radius = 3; // Aumentar suavidade
            obj.shadow.needsUpdate = true;
        }
    });
}