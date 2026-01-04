function connectMultiplayer() {
    try {
        // ✅ MODIFICAÇÃO: Garantir que estamos usando ws:// (não seguro) para LAN
        let serverUrl = multiplayer.serverUrl;

        // Se a URL não especificar ws:// ou wss://, assume ws:// para LAN
        if (!serverUrl.startsWith('ws://') && !serverUrl.startsWith('wss://')) {
            serverUrl = 'ws://' + serverUrl;
        }

        // ✅ MODIFICAÇÃO IMPORTANTE: Substituir wss:// por ws:// para conexão LAN sem SSL
        serverUrl = serverUrl.replace('wss://', 'ws://');

        console.log(`🌐 Conectando em: ${serverUrl}`);

        multiplayer.ws = new WebSocket(serverUrl);

        multiplayer.ws.onopen = () => {
            multiplayer.connected = true;
            console.log('✅ Conectado ao servidor multiplayer');

            document.getElementById('mp-status').textContent = 'Conectado';
            document.getElementById('mp-status').className = 'mp-connected';

            showNotification('✅ Conectado ao servidor!', 'success');
            updateMultiplayerMenuStatus();

            // Solicitar lista de jogadores
            sendMultiplayerMessage({ type: 'request_players' });

            // ✅ NOVO: Solicitar informações do servidor
            sendMultiplayerMessage({ type: 'request_server_info' });
        };

        multiplayer.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleMultiplayerMessage(data);
            } catch (e) {
                console.error('Erro ao processar mensagem:', e);
            }
        };

        multiplayer.ws.onerror = (error) => {
            console.error('❌ Erro WebSocket:', error);
            showNotification('❌ Erro ao conectar ao servidor', 'error');

            // ✅ NOVO: Tentar reconectar automaticamente após 3 segundos
            if (!multiplayer.reconnecting) {
                multiplayer.reconnecting = true;
                setTimeout(() => {
                    console.log('🔄 Tentando reconectar...');
                    multiplayer.reconnecting = false;
                    if (!multiplayer.connected) {
                        connectMultiplayer();
                    }
                }, 3000);
            }
        };

        multiplayer.ws.onclose = () => {
            multiplayer.connected = false;
            console.log('🔌 Desconectado do servidor');

            document.getElementById('mp-status').textContent = 'Desconectado';
            document.getElementById('mp-status').className = 'mp-disconnected';

            // Remover outros jogadores
            multiplayer.otherPlayers.forEach(player => {
                if (player.mesh) {
                    scene.remove(player.mesh);
                    player.mesh.traverse(child => {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) child.material.dispose();
                    });
                }
            });
            multiplayer.otherPlayers.clear();

            showNotification('🔌 Desconectado do servidor', 'info');
            updateMultiplayerMenuStatus();
            updatePlayerCount();

            // ✅ NOVO: Tentar reconectar automaticamente (se não foi desconexão manual)
            if (!multiplayer.reconnecting && multiplayer.enabled) {
                multiplayer.reconnecting = true;
                setTimeout(() => {
                    console.log('🔄 Tentando reconectar automaticamente...');
                    multiplayer.reconnecting = false;
                    if (multiplayer.enabled && !multiplayer.connected) {
                        connectMultiplayer();
                    }
                }, 5000);
            }
        };

    } catch (error) {
        console.error('❌ Erro ao conectar:', error);
        showNotification('❌ Falha na conexão: ' + error.message, 'error');

        // ✅ NOVO: Tentar reconectar em caso de erro
        if (multiplayer.enabled) {
            setTimeout(() => {
                console.log('🔄 Tentando reconectar após erro...');
                connectMultiplayer();
            }, 3000);
        }
    }
}

function disconnectMultiplayer() {
    if (multiplayer.ws) {
        multiplayer.ws.close();
        multiplayer.ws = null;
    }
    multiplayer.connected = false;
    multiplayer.enabled = false;
}

function sendMultiplayerMessage(data) {
    if (multiplayer.connected && multiplayer.ws) {
        try {
            multiplayer.ws.send(JSON.stringify(data));
        } catch (e) {
            console.error('Erro ao enviar mensagem:', e);
        }
    }
}

function handleMultiplayerMessage(data) {
    switch (data.type) {
        case 'player_id':
            multiplayer.playerId = data.playerId;
            console.log('🆔 ID recebido:', multiplayer.playerId);

            // Enviar nome do jogador
            const playerName = document.getElementById('mp-player-name').value || multiplayer.playerName;
            sendMultiplayerMessage({
                type: 'set_name',
                name: playerName
            });
            break;

        case 'players_list':
            // Criar meshes para jogadores existentes
            data.players.forEach(playerData => {
                createOtherPlayer(playerData);
            });
            updatePlayerCount();
            break;

        case 'player_connect':
            if (data.playerId !== multiplayer.playerId) {
                addChatMessage('Sistema', `${data.playerName} entrou no jogo`, true);
                updatePlayerCount();
            }
            break;

        case 'player_disconnect':
            if (data.playerId !== multiplayer.playerId) {
                removeOtherPlayer(data.playerId);
                addChatMessage('Sistema', `${data.playerName} saiu do jogo`, true);
                updatePlayerCount();
            }
            break;

        case 'player_update':
            if (data.playerId !== multiplayer.playerId) {
                updateOtherPlayer(data);
            }
            break;

        case 'block_place':
            console.log('📥 Recebendo colocação de bloco:', data.blockType, 'em', data.x, data.y, data.z);
            if (data.playerId !== multiplayer.playerId) {
                // Sincronizar colocação de bloco
                setBlock(data.x, data.y, data.z, data.blockType);

                // Se for água, criar mesh especial
                if (data.blockType === 'water' && waterSystem) {
                    waterSystem.createWaterBlock(data.x, data.y, data.z);
                }

                const chunk = worldToChunk(data.x, data.z);
                const chunksToUpdate = new Set();
                chunksToUpdate.add(getChunkKey(chunk.x, chunk.z));

                // Atualizar chunks adjacentes
                const localX = ((data.x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
                const localZ = ((data.z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

                if (localX === 0) chunksToUpdate.add(getChunkKey(chunk.x - 1, chunk.z));
                if (localX === CHUNK_SIZE - 1) chunksToUpdate.add(getChunkKey(chunk.x + 1, chunk.z));
                if (localZ === 0) chunksToUpdate.add(getChunkKey(chunk.x, chunk.z - 1));
                if (localZ === CHUNK_SIZE - 1) chunksToUpdate.add(getChunkKey(chunk.x, chunk.z + 1));

                chunksToUpdate.forEach(key => {
                    const [cx, cz] = key.split(',').map(Number);
                    if (chunkMeshes[key]) {
                        buildChunkMesh(cx, cz);
                    }
                });
            }
            break;

        case 'block_break':
            console.log('📥 Recebendo quebra de bloco em:', data.x, data.y, data.z);
            if (data.playerId !== multiplayer.playerId) {
                // Sincronizar quebra de bloco
                const block = getBlock(data.x, data.y, data.z);

                // Remover água se for bloco de água
                if (block && block.type === 'water' && waterSystem) {
                    waterSystem.removeWater(data.x, data.y, data.z);
                }

                removeBlockData(data.x, data.y, data.z);

                const chunk = worldToChunk(data.x, data.z);
                const chunksToUpdate = new Set();
                chunksToUpdate.add(getChunkKey(chunk.x, chunk.z));

                // Atualizar chunks adjacentes
                const localX = ((data.x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
                const localZ = ((data.z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

                if (localX === 0) chunksToUpdate.add(getChunkKey(chunk.x - 1, chunk.z));
                if (localX === CHUNK_SIZE - 1) chunksToUpdate.add(getChunkKey(chunk.x + 1, chunk.z));
                if (localZ === 0) chunksToUpdate.add(getChunkKey(chunk.x, chunk.z - 1));
                if (localZ === CHUNK_SIZE - 1) chunksToUpdate.add(getChunkKey(chunk.x, chunk.z + 1));

                chunksToUpdate.forEach(key => {
                    const [cx, cz] = key.split(',').map(Number);
                    if (chunkMeshes[key]) {
                        buildChunkMesh(cx, cz);
                    }
                });
            }
            break;

        case 'block_break':
            if (data.playerId !== multiplayer.playerId) {
                // Sincronizar quebra de bloco
                removeBlockData(data.x, data.y, data.z);
                const chunk = worldToChunk(data.x, data.z);
                buildChunkMesh(chunk.x, chunk.z);
            }
            break;

        case 'chat_message':
            addChatMessage(data.playerName, data.message, false);
            break;

        case 'player_rename':
            if (multiplayer.otherPlayers.has(data.playerId)) {
                multiplayer.otherPlayers.get(data.playerId).name = data.newName;
            }
            addChatMessage('Sistema', `${data.oldName} mudou o nome para ${data.newName}`, true);
            break;
    }
}

function createOtherPlayer(playerData) {
    if (multiplayer.otherPlayers.has(playerData.playerId)) return;

    // Criar mesh do jogador (similar ao PlayerCharacter mas simplificado)
    const group = new THREE.Group();

    // Corpo
    const bodyGeo = new THREE.BoxGeometry(0.6, 0.9, 0.3);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    group.add(body);

    // Cabeça
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.2;
    group.add(head);

    // Braços
    const armGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    const armMat = new THREE.MeshLambertMaterial({ color: 0x4169E1 });

    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.4, 0.4, 0);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.4, 0.4, 0);
    group.add(rightArm);

    // Pernas
    const legGeo = new THREE.BoxGeometry(0.25, 0.9, 0.25);
    const legMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.15, -0.4, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.15, -0.4, 0);
    group.add(rightLeg);

    // Nome do jogador acima da cabeça
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(playerData.name, 128, 42);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2, 0.5, 1);
    sprite.position.y = 2;
    group.add(sprite);

    // Posicionar
    group.position.set(
        playerData.position.x,
        playerData.position.y,
        playerData.position.z
    );

    scene.add(group);

    multiplayer.otherPlayers.set(playerData.playerId, {
        id: playerData.playerId,
        name: playerData.name,
        mesh: group,
        position: playerData.position,
        rotation: playerData.rotation
    });
}

function updateOtherPlayer(data) {
    if (!multiplayer.otherPlayers.has(data.playerId)) {
        createOtherPlayer({
            playerId: data.playerId,
            name: `Jogador_${data.playerId}`,
            position: data.position,
            rotation: data.rotation
        });
        return;
    }

    const player = multiplayer.otherPlayers.get(data.playerId);

    if (player.mesh) {
        // Interpolação suave de posição
        player.mesh.position.lerp(
            new THREE.Vector3(data.position.x, data.position.y, data.position.z),
            0.3
        );

        // Rotação
        if (data.rotation) {
            player.mesh.rotation.y = data.rotation.y;
        }
    }

    player.position = data.position;
    player.rotation = data.rotation;
}

function removeOtherPlayer(playerId) {
    if (multiplayer.otherPlayers.has(playerId)) {
        const player = multiplayer.otherPlayers.get(playerId);
        if (player.mesh) {
            scene.remove(player.mesh);
            player.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        multiplayer.otherPlayers.delete(playerId);
    }
}

function updatePlayerCount() {
    const count = multiplayer.otherPlayers.size;
    document.getElementById('mp-players-count').textContent = count;
}

function syncPlayerPosition() {
    if (!multiplayer.connected) return;

    const now = Date.now();
    if (now - multiplayer.lastPositionSent < multiplayer.positionUpdateInterval) return;

    sendMultiplayerMessage({
        type: 'player_update',
        position: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        },
        rotation: {
            x: mouse.x,
            y: mouse.y
        },
        health: playerHealth
    });

    multiplayer.lastPositionSent = now;
}

// Sistema de Chat
function openChat() {
    const chat = document.getElementById('multiplayer-chat');
    chat.classList.add('open');
    document.getElementById('chat-input').focus();
}

function closeChat() {
    document.getElementById('multiplayer-chat').classList.remove('open');
    document.getElementById('chat-input').value = '';
}

function sendChatMessage(message) {
    if (!message || !message.trim()) return;

    if (multiplayer.connected) {
        sendMultiplayerMessage({
            type: 'chat_message',
            message: message.trim()
        });
    }

    document.getElementById('chat-input').value = '';
}

function addChatMessage(playerName, message, isSystem = false) {
    const chatMessages = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = isSystem ? 'chat-msg chat-system' : 'chat-msg chat-player';

    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (isSystem) {
        msgDiv.innerHTML = `
      <span class="chat-time">${time}</span>
      <span class="chat-text-system">${message}</span>
    `;
    } else {
        msgDiv.innerHTML = `
      <span class="chat-time">${time}</span>
      <span class="chat-player">${playerName}:</span>
      <span class="chat-text">${message}</span>
    `;
    }

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Limitar mensagens
    if (chatMessages.children.length > 50) {
        chatMessages.removeChild(chatMessages.firstChild);
    }
}
