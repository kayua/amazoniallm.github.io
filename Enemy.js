class Enemy {
    constructor(type, x, y, z) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.z = z;
        this.health = enemyTypes[type].health;
        this.speed = enemyTypes[type].speed;
        this.damage = enemyTypes[type].damage;
        this.attackRange = enemyTypes[type].attackRange;
        this.detectionRange = enemyTypes[type].detectionRange;
        this.velocity = new THREE.Vector3();
        this.targetPlayer = false;
        this.attackCooldown = 0;
        this.animationTime = 0;
        this.mesh = null;
        this.boundingBox = null;
        this.isOnGround = false;
        this.jumpTimer = 0;
        this.state = 'idle';
        this.exploding = false;
        this.explodeTimer = 0;
        this.teleportTimer = 0;
        this.holdingBlock = null;
        this.fireballTimer = 0;
        this.jumpForce = 0;
        this.squishAmount = 0;
        this.createMesh();
    }

    createZombieMesh() {
        const group = new THREE.Group();

        // Texturas detalhadas e realistas
        const skinTexture = this.createZombieSkinTexture();
        const clothesTexture = this.createRaggedClothesTexture();

        // Corpo com forma mais orgânica
        const bodyGeo = new THREE.BoxGeometry(0.6, 0.95, 0.35);
        bodyGeo.translate(0, 0, 0.025);
        const bodyMat = new THREE.MeshPhongMaterial({
            color: 0x3D5A3D,
            shininess: 5,
            map: clothesTexture,
            bumpMap: clothesTexture,
            bumpScale: 0.02
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.05;
        group.add(body);

        // Cabeça mais detalhada com formato irregular
        const headGeo = new THREE.BoxGeometry(0.52, 0.52, 0.52);
        const headMat = new THREE.MeshPhongMaterial({
            color: 0x7A9D6F,
            shininess: 10,
            map: skinTexture,
            bumpMap: skinTexture,
            bumpScale: 0.03
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.75;
        head.rotation.x = -0.05;
        head.userData.isHead = true;
        group.add(head);

        // Mandíbula separada
        const jawGeo = new THREE.BoxGeometry(0.48, 0.15, 0.48);
        const jaw = new THREE.Mesh(jawGeo, headMat);
        jaw.position.y = 1.52;
        jaw.position.z = 0.02;
        group.add(jaw);

        // Olhos vermelhos brilhantes mais realistas
        const eyeGeo = new THREE.SphereGeometry(0.08, 12, 12);
        const eyeMat = new THREE.MeshStandardMaterial({
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: 0.6,
            metalness: 0.3,
            roughness: 0.2
        });

        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.13, 1.78, 0.27);
        leftEye.scale.set(1, 1.1, 0.8);
        group.add(leftEye);

        const leftPupil = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        leftPupil.position.set(-0.13, 1.78, 0.32);
        group.add(leftPupil);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.13, 1.78, 0.27);
        rightEye.scale.set(1, 1.1, 0.8);
        group.add(rightEye);

        const rightPupil = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        rightPupil.position.set(0.13, 1.78, 0.32);
        group.add(rightPupil);

        // Boca com dentes
        const mouthGeo = new THREE.BoxGeometry(0.3, 0.03, 0.05);
        const mouth = new THREE.Mesh(mouthGeo, new THREE.MeshBasicMaterial({ color: 0x1A1A1A }));
        mouth.position.set(0, 1.6, 0.26);
        group.add(mouth);

        // Dentes
        for (let i = 0; i < 6; i++) {
            const toothGeo = new THREE.BoxGeometry(0.03, 0.06, 0.03);
            const tooth = new THREE.Mesh(toothGeo, new THREE.MeshPhongMaterial({ color: 0xEEEEDD }));
            tooth.position.set(-0.13 + i * 0.05, 1.62, 0.26);
            group.add(tooth);
        }

        // Orelhas
        const earGeo = new THREE.BoxGeometry(0.08, 0.15, 0.06);
        const leftEar = new THREE.Mesh(earGeo, headMat);
        leftEar.position.set(-0.28, 1.75, 0);
        leftEar.rotation.z = -0.2;
        group.add(leftEar);

        const rightEar = new THREE.Mesh(earGeo, headMat);
        rightEar.position.set(0.28, 1.75, 0);
        rightEar.rotation.z = 0.2;
        group.add(rightEar);

        // Nariz
        const noseGeo = new THREE.BoxGeometry(0.08, 0.12, 0.08);
        const nose = new THREE.Mesh(noseGeo, headMat);
        nose.position.set(0, 1.7, 0.28);
        group.add(nose);

        // Braços articulados com músculos
        const upperArmGeo = new THREE.BoxGeometry(0.22, 0.5, 0.22);
        const forearmGeo = new THREE.BoxGeometry(0.2, 0.45, 0.2);
        const armMat = new THREE.MeshPhongMaterial({
            color: 0x6B8B5E,
            shininess: 8,
            map: skinTexture,
            bumpMap: skinTexture,
            bumpScale: 0.02
        });

        // Braço esquerdo
        const leftUpperArm = new THREE.Mesh(upperArmGeo, armMat);
        leftUpperArm.position.set(-0.41, 1.3, 0);
        leftUpperArm.userData.isArm = true;
        leftUpperArm.userData.side = 'left';
        leftUpperArm.userData.isPart = 'upper';
        group.add(leftUpperArm);

        const leftForearm = new THREE.Mesh(forearmGeo, armMat);
        leftForearm.position.set(-0.41, 0.75, 0.05);
        leftForearm.userData.isArm = true;
        leftForearm.userData.side = 'left';
        leftForearm.userData.isPart = 'forearm';
        group.add(leftForearm);

        const leftHand = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.15, 0.25),
            armMat
        );
        leftHand.position.set(-0.41, 0.48, 0.1);
        group.add(leftHand);

        // Braço direito
        const rightUpperArm = new THREE.Mesh(upperArmGeo, armMat);
        rightUpperArm.position.set(0.41, 1.3, 0);
        rightUpperArm.userData.isArm = true;
        rightUpperArm.userData.side = 'right';
        rightUpperArm.userData.isPart = 'upper';
        group.add(rightUpperArm);

        const rightForearm = new THREE.Mesh(forearmGeo, armMat);
        rightForearm.position.set(0.41, 0.75, 0.05);
        rightForearm.userData.isArm = true;
        rightForearm.userData.side = 'right';
        rightForearm.userData.isPart = 'forearm';
        group.add(rightForearm);

        const rightHand = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.15, 0.25),
            armMat
        );
        rightHand.position.set(0.41, 0.48, 0.1);
        group.add(rightHand);

        // Pernas articuladas
        const thighGeo = new THREE.BoxGeometry(0.26, 0.52, 0.26);
        const calfGeo = new THREE.BoxGeometry(0.24, 0.48, 0.24);
        const legMat = new THREE.MeshPhongMaterial({
            color: 0x3D5A3D,
            shininess: 5,
            map: clothesTexture,
            bumpMap: clothesTexture,
            bumpScale: 0.02
        });

        // Perna esquerda
        const leftThigh = new THREE.Mesh(thighGeo, legMat);
        leftThigh.position.set(-0.16, 0.78, 0);
        leftThigh.userData.isLeg = true;
        leftThigh.userData.side = 'left';
        leftThigh.userData.isPart = 'thigh';
        group.add(leftThigh);

        const leftCalf = new THREE.Mesh(calfGeo, legMat);
        leftCalf.position.set(-0.16, 0.24, 0);
        leftCalf.userData.isLeg = true;
        leftCalf.userData.side = 'left';
        leftCalf.userData.isPart = 'calf';
        group.add(leftCalf);

        const leftFoot = new THREE.Mesh(
            new THREE.BoxGeometry(0.24, 0.12, 0.35),
            legMat
        );
        leftFoot.position.set(-0.16, 0.06, 0.05);
        group.add(leftFoot);

        // Perna direita
        const rightThigh = new THREE.Mesh(thighGeo, legMat);
        rightThigh.position.set(0.16, 0.78, 0);
        rightThigh.userData.isLeg = true;
        rightThigh.userData.side = 'right';
        rightThigh.userData.isPart = 'thigh';
        group.add(rightThigh);

        const rightCalf = new THREE.Mesh(calfGeo, legMat);
        rightCalf.position.set(0.16, 0.24, 0);
        rightCalf.userData.isLeg = true;
        rightCalf.userData.side = 'right';
        rightCalf.userData.isPart = 'calf';
        group.add(rightCalf);

        const rightFoot = new THREE.Mesh(
            new THREE.BoxGeometry(0.24, 0.12, 0.35),
            legMat
        );
        rightFoot.position.set(0.16, 0.06, 0.05);
        group.add(rightFoot);

        // Detalhes adicionais - cicatrizes e feridas
        for (let i = 0; i < 3; i++) {
            const scarGeo = new THREE.BoxGeometry(0.15, 0.02, 0.02);
            const scar = new THREE.Mesh(scarGeo, new THREE.MeshBasicMaterial({ color: 0x4A2020 }));
            scar.position.set(
                (Math.random() - 0.5) * 0.4,
                1.6 + Math.random() * 0.2,
                0.26
            );
            scar.rotation.z = (Math.random() - 0.5) * 0.5;
            group.add(scar);
        }

        return group;
    }

    createCreeperMesh() {
        const group = new THREE.Group();
        const color = 0x00AA00;
        const darkColor = 0x006600;

        // Textura de camuflagem pixelada realista
        const camoTexture = this.createAdvancedCamoTexture(color, darkColor);

        // Corpo com cantos arredondados
        const bodyGeo = this.createRoundedBoxGeometry(0.6, 1.25, 0.6, 0.05);
        const bodyMat = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 80,
            map: camoTexture,
            bumpMap: camoTexture,
            bumpScale: 0.04
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.05;
        group.add(body);

        // Cabeça com rosto detalhado
        const headGeo = this.createRoundedBoxGeometry(0.62, 0.62, 0.62, 0.05);
        const faceTexture = this.createDetailedCreeperFace(color, darkColor);
        const headMat = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 80,
            map: faceTexture,
            bumpMap: faceTexture,
            bumpScale: 0.03
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.9;
        group.add(head);

        // Olhos com brilho sutil
        const eyeGlow = new THREE.PointLight(0x00FF00, 0.3, 2);
        eyeGlow.position.y = 1.9;
        group.add(eyeGlow);

        // Pernas mais orgânicas (4 pernas)
        const legGeo = this.createRoundedBoxGeometry(0.22, 0.55, 0.22, 0.03);
        const legMat = new THREE.MeshPhongMaterial({
            color: darkColor,
            shininess: 70,
            map: camoTexture
        });

        const legPositions = [
            { x: -0.19, z: -0.19 },
            { x: 0.19, z: -0.19 },
            { x: -0.19, z: 0.19 },
            { x: 0.19, z: 0.19 }
        ];

        legPositions.forEach((pos, i) => {
            const leg = new THREE.Mesh(legGeo, legMat.clone());
            leg.position.set(pos.x, 0.28, pos.z);
            leg.userData.isLeg = true;
            leg.userData.index = i;
            group.add(leg);

            // Pés
            const footGeo = new THREE.BoxGeometry(0.24, 0.08, 0.28);
            const foot = new THREE.Mesh(footGeo, legMat.clone());
            foot.position.set(pos.x, 0.04, pos.z + 0.03);
            group.add(foot);
        });

        // Partículas de pólvora quando explodindo
        const particleGeo = new THREE.BufferGeometry();
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 1.5;
            positions[i + 1] = Math.random() * 2;
            positions[i + 2] = (Math.random() - 0.5) * 1.5;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0x222222,
            size: 0.05,
            transparent: true,
            opacity: 0
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        particles.userData.isExplosionParticles = true;
        group.add(particles);

        return group;
    }

    createSpiderMesh() {
        const group = new THREE.Group();
        const color = 0x3A3A3A;
        const darkColor = 0x1A1A1A;
        const hairColor = 0x2A2A2A;

        // Corpo segmentado com pelos
        const hairTexture = this.createRealisticHairTexture(color, hairColor);

        // Abdômen grande e peludo
        const abdomenGeo = new THREE.SphereGeometry(0.5, 20, 20);
        abdomenGeo.scale(1.3, 0.9, 1);
        const abdomenMat = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 100,
            map: hairTexture,
            bumpMap: hairTexture,
            bumpScale: 0.05
        });
        const abdomen = new THREE.Mesh(abdomenGeo, abdomenMat);
        abdomen.position.set(0, 0.6, -0.2);
        group.add(abdomen);

        // Cefalotórax
        const cephaloGeo = new THREE.SphereGeometry(0.4, 16, 16);
        cephaloGeo.scale(1.2, 0.8, 1.1);
        const cephalo = new THREE.Mesh(cephaloGeo, abdomenMat);
        cephalo.position.set(0, 0.65, 0.5);
        group.add(cephalo);

        // Cabeça menor
        const headGeo = new THREE.SphereGeometry(0.25, 12, 12);
        const head = new THREE.Mesh(headGeo, abdomenMat);
        head.position.set(0, 0.7, 0.8);
        group.add(head);

        // Quelíceras (presas)
        const fangGeo = new THREE.ConeGeometry(0.04, 0.15, 8);
        const fangMat = new THREE.MeshPhongMaterial({
            color: 0x1A0A0A,
            shininess: 150,
            specular: 0x444444
        });

        const leftFang = new THREE.Mesh(fangGeo, fangMat);
        leftFang.position.set(-0.08, 0.63, 0.92);
        leftFang.rotation.x = Math.PI / 6;
        group.add(leftFang);

        const rightFang = new THREE.Mesh(fangGeo, fangMat);
        rightFang.position.set(0.08, 0.63, 0.92);
        rightFang.rotation.x = Math.PI / 6;
        group.add(rightFang);

        // 8 olhos compostos realistas
        const eyePositions = [
            { x: -0.12, y: 0.78, z: 0.88, size: 0.09 },
            { x: 0.12, y: 0.78, z: 0.88, size: 0.09 },
            { x: -0.18, y: 0.73, z: 0.82, size: 0.06 },
            { x: 0.18, y: 0.73, z: 0.82, size: 0.06 },
            { x: -0.08, y: 0.68, z: 0.85, size: 0.05 },
            { x: 0.08, y: 0.68, z: 0.85, size: 0.05 },
            { x: -0.14, y: 0.64, z: 0.78, size: 0.04 },
            { x: 0.14, y: 0.64, z: 0.78, size: 0.04 }
        ];

        eyePositions.forEach(pos => {
            const eyeGeo = new THREE.SphereGeometry(pos.size, 12, 12);
            const eyeMat = new THREE.MeshStandardMaterial({
                color: 0x000000,
                metalness: 0.8,
                roughness: 0.1
            });
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(pos.x, pos.y, pos.z);
            group.add(eye);

            // Reflexo vermelho
            const glowGeo = new THREE.SphereGeometry(pos.size * 0.6, 8, 8);
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0xFF0000,
                transparent: true,
                opacity: 0.7
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.set(pos.x, pos.y, pos.z + 0.01);
            group.add(glow);
        });

        // 8 pernas articuladas e peludas
        const segments = [
            { length: 0.4, radius: 0.06 },
            { length: 0.5, radius: 0.05 },
            { length: 0.6, radius: 0.04 }
        ];

        for (let i = 0; i < 8; i++) {
            const side = i < 4 ? -1 : 1;
            const legIndex = i % 4;
            const angleOffset = (legIndex * Math.PI / 3.5) - Math.PI / 6;

            let currentX = 0;
            let currentY = 0.5;
            let currentZ = 0.2;

            segments.forEach((seg, segIndex) => {
                const segGeo = new THREE.CylinderGeometry(seg.radius, seg.radius * 0.8, seg.length, 12);
                const segMat = new THREE.MeshPhongMaterial({
                    color: darkColor,
                    shininess: 120,
                    map: hairTexture,
                    bumpMap: hairTexture,
                    bumpScale: 0.03
                });
                const segment = new THREE.Mesh(segGeo, segMat);

                const angle = angleOffset + (side > 0 ? Math.PI : 0);
                const lift = segIndex === 0 ? 0.2 : (segIndex === 1 ? -0.1 : -0.3);

                segment.position.set(
                    currentX + Math.sin(angle) * seg.length * 0.5,
                    currentY + lift,
                    currentZ + Math.cos(angle) * seg.length * 0.5 * side
                );

                segment.rotation.z = angle + (side > 0 ? Math.PI / 4 : -Math.PI / 4);
                segment.rotation.x = lift * 0.5;

                segment.userData.isLeg = true;
                segment.userData.index = i;
                segment.userData.segment = segIndex;
                segment.userData.baseRotation = { x: segment.rotation.x, z: segment.rotation.z };

                group.add(segment);

                currentX = segment.position.x + Math.sin(angle) * seg.length * 0.5;
                currentY = segment.position.y + lift;
                currentZ = segment.position.z + Math.cos(angle) * seg.length * 0.5 * side;
            });
        }

        // Pelos individuais
        for (let i = 0; i < 40; i++) {
            const hairGeo = new THREE.CylinderGeometry(0.01, 0.005, 0.15, 4);
            const hair = new THREE.Mesh(hairGeo, new THREE.MeshBasicMaterial({ color: hairColor }));
            hair.position.set(
                (Math.random() - 0.5) * 1,
                0.5 + Math.random() * 0.3,
                -0.2 + Math.random() * 0.8
            );
            hair.rotation.x = (Math.random() - 0.5) * 0.5;
            hair.rotation.z = (Math.random() - 0.5) * Math.PI;
            group.add(hair);
        }

        return group;
    }

    createEndermanMesh() {
        const group = new THREE.Group();
        const color = 0x0A0A0A;
        const eyeColor = 0xAA00FF;

        // Textura de partículas escuras
        const darkTexture = this.createEndermanTexture();

        // Corpo esguio e alto
        const bodyGeo = new THREE.BoxGeometry(0.38, 1.7, 0.38);
        const bodyMat = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 30,
            map: darkTexture,
            emissive: 0x1A0A1A,
            emissiveIntensity: 0.2
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.9;
        group.add(body);

        // Cabeça alongada e angular
        const headGeo = new THREE.BoxGeometry(0.48, 0.85, 0.48);
        const headMat = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 30,
            map: darkTexture,
            emissive: 0x1A0A1A,
            emissiveIntensity: 0.2
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 2.95;
        group.add(head);

        // Mandíbula inferior
        const jawGeo = new THREE.BoxGeometry(0.46, 0.2, 0.46);
        const jaw = new THREE.Mesh(jawGeo, headMat);
        jaw.position.y = 2.6;
        group.add(jaw);

        // Olhos roxos brilhantes intensos com efeito de partículas
        const eyeGeo = new THREE.BoxGeometry(0.18, 0.35, 0.08);
        const eyeMat = new THREE.MeshStandardMaterial({
            color: eyeColor,
            emissive: eyeColor,
            emissiveIntensity: 1.2,
            metalness: 0.5,
            roughness: 0.3
        });

        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.14, 2.95, 0.25);
        group.add(leftEye);

        const leftEyeGlow = new THREE.PointLight(eyeColor, 1, 3);
        leftEyeGlow.position.set(-0.14, 2.95, 0.3);
        group.add(leftEyeGlow);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.14, 2.95, 0.25);
        group.add(rightEye);

        const rightEyeGlow = new THREE.PointLight(eyeColor, 1, 3);
        rightEyeGlow.position.set(0.14, 2.95, 0.3);
        group.add(rightEyeGlow);

        // Partículas orbitando os olhos
        for (let i = 0; i < 20; i++) {
            const particleGeo = new THREE.SphereGeometry(0.02, 4, 4);
            const particle = new THREE.Mesh(particleGeo, eyeMat.clone());
            particle.userData.isEyeParticle = true;
            particle.userData.angle = (i / 20) * Math.PI * 2;
            particle.userData.radius = 0.2 + Math.random() * 0.1;
            particle.userData.speed = 0.05 + Math.random() * 0.05;
            particle.userData.eye = i < 10 ? 'left' : 'right';
            group.add(particle);
        }

        // Braços extremamente longos e finos
        const upperArmGeo = new THREE.BoxGeometry(0.18, 0.7, 0.18);
        const forearmGeo = new THREE.BoxGeometry(0.16, 0.65, 0.16);
        const armMat = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 30,
            map: darkTexture,
            emissive: 0x1A0A1A,
            emissiveIntensity: 0.2
        });

        // Braço esquerdo
        const leftUpperArm = new THREE.Mesh(upperArmGeo, armMat);
        leftUpperArm.position.set(-0.42, 2.15, 0);
        leftUpperArm.userData.isArm = true;
        leftUpperArm.userData.side = 'left';
        leftUpperArm.userData.part = 'upper';
        group.add(leftUpperArm);

        const leftForearm = new THREE.Mesh(forearmGeo, armMat);
        leftForearm.position.set(-0.42, 1.42, 0);
        leftForearm.userData.isArm = true;
        leftForearm.userData.side = 'left';
        leftForearm.userData.part = 'forearm';
        group.add(leftForearm);

        const leftHand = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.35, 0.12),
            armMat
        );
        leftHand.position.set(-0.42, 1.05, 0);
        group.add(leftHand);

        // Dedos longos e finos
        for (let i = 0; i < 4; i++) {
            const fingerGeo = new THREE.CylinderGeometry(0.015, 0.01, 0.25, 6);
            const finger = new THREE.Mesh(fingerGeo, armMat);
            finger.position.set(-0.42 + (i - 1.5) * 0.04, 0.8, 0);
            finger.rotation.x = 0.2;
            group.add(finger);
        }

        // Braço direito
        const rightUpperArm = new THREE.Mesh(upperArmGeo, armMat);
        rightUpperArm.position.set(0.42, 2.15, 0);
        rightUpperArm.userData.isArm = true;
        rightUpperArm.userData.side = 'right';
        rightUpperArm.userData.part = 'upper';
        group.add(rightUpperArm);

        const rightForearm = new THREE.Mesh(forearmGeo, armMat);
        rightForearm.position.set(0.42, 1.42, 0);
        rightForearm.userData.isArm = true;
        rightForearm.userData.side = 'right';
        rightForearm.userData.part = 'forearm';
        group.add(rightForearm);

        const rightHand = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.35, 0.12),
            armMat
        );
        rightHand.position.set(0.42, 1.05, 0);
        group.add(rightHand);

        for (let i = 0; i < 4; i++) {
            const fingerGeo = new THREE.CylinderGeometry(0.015, 0.01, 0.25, 6);
            const finger = new THREE.Mesh(fingerGeo, armMat);
            finger.position.set(0.42 + (i - 1.5) * 0.04, 0.8, 0);
            finger.rotation.x = 0.2;
            group.add(finger);
        }

        // Pernas muito longas e finas
        const thighGeo = new THREE.BoxGeometry(0.22, 0.85, 0.22);
        const calfGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2);

        // Perna esquerda
        const leftThigh = new THREE.Mesh(thighGeo, armMat);
        leftThigh.position.set(-0.13, 0.93, 0);
        leftThigh.userData.isLeg = true;
        leftThigh.userData.side = 'left';
        leftThigh.userData.part = 'thigh';
        group.add(leftThigh);

        const leftCalf = new THREE.Mesh(calfGeo, armMat);
        leftCalf.position.set(-0.13, 0.4, 0);
        leftCalf.userData.isLeg = true;
        leftCalf.userData.side = 'left';
        leftCalf.userData.part = 'calf';
        group.add(leftCalf);

        // Perna direita
        const rightThigh = new THREE.Mesh(thighGeo, armMat);
        rightThigh.position.set(0.13, 0.93, 0);
        rightThigh.userData.isLeg = true;
        rightThigh.userData.side = 'right';
        rightThigh.userData.part = 'thigh';
        group.add(rightThigh);

        const rightCalf = new THREE.Mesh(calfGeo, armMat);
        rightCalf.position.set(0.13, 0.4, 0);
        rightCalf.userData.isLeg = true;
        rightCalf.userData.side = 'right';
        rightCalf.userData.part = 'calf';
        group.add(rightCalf);

        // Sistema de partículas de teleporte
        const particleCount = 150;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = Math.random() * 3.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2;

            colors[i * 3] = 0.5;
            colors[i * 3 + 1] = 0;
            colors[i * 3 + 2] = 0.8;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMat = new THREE.PointsMaterial({
            size: 0.08,
            transparent: true,
            opacity: 0,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(particleGeo, particleMat);
        particleSystem.userData.isParticles = true;
        group.add(particleSystem);

        return group;
    }

    createGhastMesh() {
        const group = new THREE.Group();

        // Corpo fantasmagórico grande com tentáculos
        const bodyGeo = new THREE.SphereGeometry(1.2, 24, 24);
        const bodyMat = new THREE.MeshPhongMaterial({
            color: 0xFAFAFA,
            transparent: true,
            opacity: 0.75,
            shininess: 150,
            emissive: 0xFFFFFF,
            emissiveIntensity: 0.1
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 3.5;
        group.add(body);

        // Camada interna brilhante
        const innerGeo = new THREE.SphereGeometry(1.0, 20, 20);
        const innerMat = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.4,
            shininess: 200,
            emissive: 0xFFEEFF,
            emissiveIntensity: 0.3
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        inner.position.y = 3.5;
        group.add(inner);

        // Rosto detalhado e expressivo
        const faceTexture = this.createGhastFaceTexture();
        const faceGeo = new THREE.PlaneGeometry(1.6, 1.6);
        const faceMat = new THREE.MeshBasicMaterial({
            map: faceTexture,
            transparent: true,
            side: THREE.DoubleSide
        });
        const face = new THREE.Mesh(faceGeo, faceMat);
        face.position.set(0, 3.5, 1.21);
        group.add(face);

        // Olhos 3D tristes
        const eyeGeo = new THREE.SphereGeometry(0.22, 16, 16);
        eyeGeo.scale(1, 1.3, 0.8);
        const eyeMat = new THREE.MeshPhongMaterial({
            color: 0x000000,
            shininess: 200
        });

        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.35, 3.6, 1.1);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.35, 3.6, 1.1);
        group.add(rightEye);

        // Lágrimas
        for (let i = 0; i < 2; i++) {
            const tearGeo = new THREE.SphereGeometry(0.08, 8, 8);
            tearGeo.scale(1, 1.5, 1);
            const tear = new THREE.Mesh(tearGeo, new THREE.MeshPhongMaterial({
                color: 0x88CCFF,
                transparent: true,
                opacity: 0.7,
                shininess: 200
            }));
            tear.position.set(i === 0 ? -0.35 : 0.35, 3.35, 1.15);
            group.add(tear);
        }

        // Boca triste em 3D
        const mouthGeo = new THREE.TorusGeometry(0.28, 0.08, 12, 24, Math.PI);
        const mouthMat = new THREE.MeshPhongMaterial({
            color: 0x000000,
            shininess: 100
        });
        const mouth = new THREE.Mesh(mouthGeo, mouthMat);
        mouth.position.set(0, 3.1, 1.1);
        mouth.rotation.x = Math.PI;
        group.add(mouth);

        // 9 tentáculos ondulantes detalhados
        for (let i = 0; i < 9; i++) {
            const angle = (i / 9) * Math.PI * 2;
            const radius = 1.0;

            // Cada tentáculo tem 4 segmentos
            for (let seg = 0; seg < 4; seg++) {
                const segmentLength = 0.5 - seg * 0.05;
                const segmentRadius = 0.12 - seg * 0.02;

                const tentacleSegGeo = new THREE.CylinderGeometry(
                    segmentRadius,
                    segmentRadius * 0.8,
                    segmentLength,
                    12
                );

                const tentacleSegMat = new THREE.MeshPhongMaterial({
                    color: 0xFAFAFA,
                    transparent: true,
                    opacity: 0.75 - seg * 0.05,
                    shininess: 150
                });

                const segment = new THREE.Mesh(tentacleSegGeo, tentacleSegMat);

                segment.position.set(
                    Math.sin(angle) * radius,
                    2.5 - seg * 0.4,
                    Math.cos(angle) * radius
                );

                segment.rotation.x = Math.PI / 2;
                segment.rotation.z = angle;

                segment.userData.isTentacle = true;
                segment.userData.index = i;
                segment.userData.segment = seg;
                segment.userData.baseY = 2.5 - seg * 0.4;
                segment.userData.angle = angle;

                group.add(segment);

                // Ventosas nos tentáculos
                if (seg > 0 && seg % 2 === 0) {
                    for (let v = 0; v < 3; v++) {
                        const suctionGeo = new THREE.SphereGeometry(0.03, 8, 8);
                        const suction = new THREE.Mesh(suctionGeo, tentacleSegMat);
                        suction.position.copy(segment.position);
                        suction.position.y -= v * 0.12;
                        group.add(suction);
                    }
                }
            }
        }

        // Sistema de partículas flutuantes mágicas
        const particleCount = 100;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 4;
            positions[i * 3 + 1] = 2 + Math.random() * 3;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

            colors[i * 3] = 0.9 + Math.random() * 0.1;
            colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
            colors[i * 3 + 2] = 1.0;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMat = new THREE.PointsMaterial({
            size: 0.12,
            transparent: true,
            opacity: 0.6,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(particleGeo, particleMat);
        particleSystem.userData.isParticles = true;
        group.add(particleSystem);

        // Luz ambiente do Ghast
        const ambientGlow = new THREE.PointLight(0xFFFFFF, 0.5, 8);
        ambientGlow.position.y = 3.5;
        group.add(ambientGlow);

        return group;
    }

    createSlimeMesh() {
        const group = new THREE.Group();
        const color = 0x66FF66;
        const darkColor = 0x33CC33;

        // Corpo gelatinoso com múltiplas camadas
        const bodyGeo = new THREE.SphereGeometry(0.75, 24, 24);
        const bodyMat = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 150,
            transparent: true,
            opacity: 0.85,
            specular: 0xFFFFFF
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.75;
        body.userData.isBody = true;
        group.add(body);

        // Camada interna mais escura
        const innerGeo = new THREE.SphereGeometry(0.55, 20, 20);
        const innerMat = new THREE.MeshPhongMaterial({
            color: darkColor,
            shininess: 100,
            transparent: true,
            opacity: 0.6
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        inner.position.y = 0.75;
        inner.userData.isInner = true;
        group.add(inner);

        // Núcleo ainda mais escuro
        const coreGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const coreMat = new THREE.MeshPhongMaterial({
            color: 0x229922,
            shininess: 80,
            transparent: true,
            opacity: 0.5
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.y = 0.75;
        group.add(core);

        // Olhos 3D realistas
        const eyeGeo = new THREE.SphereGeometry(0.12, 12, 12);
        eyeGeo.scale(1.1, 1, 1.3);
        const eyeWhiteMat = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            shininess: 200
        });

        const leftEyeWhite = new THREE.Mesh(eyeGeo, eyeWhiteMat);
        leftEyeWhite.position.set(-0.22, 0.95, 0.55);
        group.add(leftEyeWhite);

        const rightEyeWhite = new THREE.Mesh(eyeGeo, eyeWhiteMat);
        rightEyeWhite.position.set(0.22, 0.95, 0.55);
        group.add(rightEyeWhite);

        // Pupilas
        const pupilGeo = new THREE.SphereGeometry(0.06, 10, 10);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
        leftPupil.position.set(-0.22, 0.95, 0.62);
        group.add(leftPupil);

        const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
        rightPupil.position.set(0.22, 0.95, 0.62);
        group.add(rightPupil);

        // Brilho nos olhos
        const glintGeo = new THREE.SphereGeometry(0.03, 6, 6);
        const glintMat = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.9
        });

        const leftGlint = new THREE.Mesh(glintGeo, glintMat);
        leftGlint.position.set(-0.2, 1.0, 0.65);
        group.add(leftGlint);

        const rightGlint = new THREE.Mesh(glintGeo, glintMat);
        rightGlint.position.set(0.24, 1.0, 0.65);
        group.add(rightGlint);

        // Boca sorridente em 3D
        const mouthGeo = new THREE.TorusGeometry(0.18, 0.03, 8, 16, Math.PI);
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x004400 });
        const mouth = new THREE.Mesh(mouthGeo, mouthMat);
        mouth.position.set(0, 0.7, 0.58);
        mouth.rotation.x = -0.2;
        group.add(mouth);

        // Bolhas internas
        for (let i = 0; i < 15; i++) {
            const bubbleSize = 0.05 + Math.random() * 0.1;
            const bubbleGeo = new THREE.SphereGeometry(bubbleSize, 8, 8);
            const bubbleMat = new THREE.MeshPhongMaterial({
                color: 0xAAFFAA,
                transparent: true,
                opacity: 0.3,
                shininess: 200
            });
            const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
            bubble.position.set(
                (Math.random() - 0.5) * 1.0,
                0.3 + Math.random() * 0.9,
                (Math.random() - 0.5) * 1.0
            );
            bubble.userData.isBubble = true;
            bubble.userData.floatSpeed = 0.01 + Math.random() * 0.02;
            bubble.userData.startY = bubble.position.y;
            group.add(bubble);
        }

        // Efeito de brilho gelatinoso
        const glowGeo = new THREE.SphereGeometry(0.8, 20, 20);
        const glowMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.y = 0.75;
        group.add(glow);

        return group;
    }

    createWitchMesh() {
        const group = new THREE.Group();

        // Corpo com vestido detalhado
        const bodyGeo = new THREE.CylinderGeometry(0.4, 0.55, 1.1, 12);
        const bodyMat = new THREE.MeshPhongMaterial({
            color: 0x660066,
            shininess: 40,
            map: this.createWitchRobeTexture()
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.15;
        group.add(body);

        // Cintura/cinto
        const beltGeo = new THREE.CylinderGeometry(0.41, 0.41, 0.12, 12);
        const belt = new THREE.Mesh(beltGeo, new THREE.MeshPhongMaterial({
            color: 0x222222,
            shininess: 100
        }));
        belt.position.y = 1.15;
        group.add(belt);

        // Pescoço
        const neckGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.15, 10);
        const neckMat = new THREE.MeshPhongMaterial({
            color: 0xC8A882,
            shininess: 20
        });
        const neck = new THREE.Mesh(neckGeo, neckMat);
        neck.position.y = 1.78;
        group.add(neck);

        // Cabeça com textura de pele
        const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
        headGeo.scale(0.9, 1, 0.95);
        const skinTexture = this.createWitchSkinTexture();
        const headMat = new THREE.MeshPhongMaterial({
            color: 0xB89968,
            shininess: 15,
            map: skinTexture,
            bumpMap: skinTexture,
            bumpScale: 0.02
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.95;
        group.add(head);

        // Queixo proeminente
        const chinGeo = new THREE.SphereGeometry(0.08, 10, 10);
        chinGeo.scale(1, 1.3, 0.9);
        const chin = new THREE.Mesh(chinGeo, headMat);
        chin.position.set(0, 1.78, 0.18);
        group.add(chin);

        // Nariz grande e curvo (verruga incluída)
        const noseGeo = new THREE.CylinderGeometry(0.04, 0.07, 0.25, 8);
        const noseMat = new THREE.MeshPhongMaterial({
            color: 0xA88858
        });
        const nose = new THREE.Mesh(noseGeo, noseMat);
        nose.position.set(0, 1.92, 0.25);
        nose.rotation.x = Math.PI / 2.2;
        group.add(nose);

        // Verruga no nariz
        const wartGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const wart = new THREE.Mesh(wartGeo, new THREE.MeshPhongMaterial({ color: 0x885533 }));
        wart.position.set(-0.02, 1.88, 0.35);
        group.add(wart);

        // Olhos com pálpebras
        const eyeGeo = new THREE.SphereGeometry(0.06, 10, 10);
        const eyeWhiteMat = new THREE.MeshPhongMaterial({
            color: 0xFFFFEE,
            shininess: 100
        });

        const leftEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
        leftEye.position.set(-0.12, 1.98, 0.22);
        leftEye.scale.set(1, 0.9, 0.8);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
        rightEye.position.set(0.12, 1.98, 0.22);
        rightEye.scale.set(1, 0.9, 0.8);
        group.add(rightEye);

        // Íris verdes
        const irisGeo = new THREE.SphereGeometry(0.035, 8, 8);
        const irisMat = new THREE.MeshBasicMaterial({ color: 0x00AA00 });

        const leftIris = new THREE.Mesh(irisGeo, irisMat);
        leftIris.position.set(-0.12, 1.98, 0.26);
        group.add(leftIris);

        const rightIris = new THREE.Mesh(irisGeo, irisMat);
        rightIris.position.set(0.12, 1.98, 0.26);
        group.add(rightIris);

        // Pupilas
        const pupilGeo = new THREE.SphereGeometry(0.02, 6, 6);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
        leftPupil.position.set(-0.12, 1.98, 0.28);
        group.add(leftPupil);

        const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
        rightPupil.position.set(0.12, 1.98, 0.28);
        group.add(rightPupil);

        // Sobrancelhas grossas
        const browGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);
        const browMat = new THREE.MeshBasicMaterial({ color: 0x3A2A1A });

        const leftBrow = new THREE.Mesh(browGeo, browMat);
        leftBrow.position.set(-0.12, 2.06, 0.24);
        leftBrow.rotation.z = -0.2;
        group.add(leftBrow);

        const rightBrow = new THREE.Mesh(browGeo, browMat);
        rightBrow.position.set(0.12, 2.06, 0.24);
        rightBrow.rotation.z = 0.2;
        group.add(rightBrow);

        // Cabelo saindo do chapéu
        for (let i = 0; i < 20; i++) {
            const hairGeo = new THREE.CylinderGeometry(0.01, 0.008, 0.3, 4);
            const hair = new THREE.Mesh(hairGeo, new THREE.MeshPhongMaterial({
                color: 0x4A3A2A,
                shininess: 50
            }));
            const angle = (i / 20) * Math.PI * 2;
            hair.position.set(
                Math.sin(angle) * 0.25,
                1.95 + Math.random() * 0.1,
                Math.cos(angle) * 0.25
            );
            hair.rotation.x = (Math.random() - 0.5) * 0.3;
            hair.rotation.z = angle + (Math.random() - 0.5) * 0.2;
            group.add(hair);
        }

        // Chapéu de bruxa detalhado
        const hatBrimGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.08, 16);
        const hatMat = new THREE.MeshPhongMaterial({
            color: 0x0A0A0A,
            shininess: 120
        });
        const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
        hatBrim.position.y = 2.15;
        group.add(hatBrim);

        const hatBaseGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.25, 16);
        const hatBase = new THREE.Mesh(hatBaseGeo, hatMat);
        hatBase.position.y = 2.32;
        group.add(hatBase);

        const hatConeGeo = new THREE.ConeGeometry(0.32, 1.1, 16);
        const hatCone = new THREE.Mesh(hatConeGeo, hatMat);
        hatCone.position.y = 2.95;
        hatCone.userData.isHat = true;
        group.add(hatCone);

        // Fivela do chapéu
        const buckleGeo = new THREE.TorusGeometry(0.08, 0.02, 8, 16);
        const buckle = new THREE.Mesh(buckleGeo, new THREE.MeshPhongMaterial({
            color: 0xFFD700,
            shininess: 150,
            metalness: 0.8
        }));
        buckle.position.set(0, 2.32, 0.33);
        buckle.rotation.x = Math.PI / 2;
        group.add(buckle);

        // Pontas dobradas do chapéu
        const tipGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const tip = new THREE.Mesh(tipGeo, hatMat);
        tip.position.set(0.15, 3.45, 0.1);
        group.add(tip);

        // Mangas e braços
        const sleeveGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.6, 10);
        const sleeveMat = new THREE.MeshPhongMaterial({
            color: 0x660066,
            shininess: 40
        });

        // Braço esquerdo
        const leftSleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
        leftSleeve.position.set(-0.45, 1.3, 0);
        leftSleeve.rotation.z = 0.3;
        group.add(leftSleeve);

        const leftHandGeo = new THREE.SphereGeometry(0.1, 10, 10);
        leftHandGeo.scale(0.8, 1.1, 0.7);
        const leftHand = new THREE.Mesh(leftHandGeo, neckMat);
        leftHand.position.set(-0.65, 1.0, 0);
        group.add(leftHand);

        // Dedos da mão esquerda
        for (let i = 0; i < 4; i++) {
            const fingerGeo = new THREE.CylinderGeometry(0.015, 0.012, 0.12, 6);
            const finger = new THREE.Mesh(fingerGeo, neckMat);
            finger.position.set(-0.68 + i * 0.025, 0.88, 0);
            finger.rotation.x = 0.3;
            group.add(finger);
        }

        // Braço direito segurando vassoura
        const rightSleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
        rightSleeve.position.set(0.45, 1.3, 0);
        rightSleeve.rotation.z = -0.3;
        group.add(rightSleeve);

        const rightHand = new THREE.Mesh(leftHandGeo, neckMat);
        rightHand.position.set(0.65, 1.0, 0);
        group.add(rightHand);

        // Vassoura detalhada
        const broomHandleGeo = new THREE.CylinderGeometry(0.025, 0.03, 1.8, 8);
        const broomHandleMat = new THREE.MeshPhongMaterial({
            color: 0x6B4423,
            shininess: 60,
            map: this.createWoodTexture()
        });
        const broomHandle = new THREE.Mesh(broomHandleGeo, broomHandleMat);
        broomHandle.position.set(0.85, 0.9, 0);
        broomHandle.rotation.z = Math.PI / 4;
        group.add(broomHandle);

        // Cerdas da vassoura
        const bristleCount = 30;
        for (let i = 0; i < bristleCount; i++) {
            const angle = (i / bristleCount) * Math.PI * 2;
            const bristleGeo = new THREE.CylinderGeometry(0.01, 0.005, 0.4, 4);
            const bristleMat = new THREE.MeshPhongMaterial({
                color: 0xD2A679,
                shininess: 20
            });
            const bristle = new THREE.Mesh(bristleGeo, bristleMat);
            bristle.position.set(
                1.45 + Math.sin(angle) * 0.1,
                0.15,
                Math.cos(angle) * 0.1
            );
            bristle.rotation.z = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
            bristle.rotation.y = angle;
            group.add(bristle);
        }

        // Amarração das cerdas
        const tieGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.08, 8);
        const tie = new THREE.Mesh(tieGeo, new THREE.MeshPhongMaterial({
            color: 0x8B4513,
            shininess: 40
        }));
        tie.position.set(1.35, 0.32, 0);
        tie.rotation.z = Math.PI / 4;
        group.add(tie);

        // Poções flutuantes mágicas
        const potionColors = [
            { color: 0xFF0000, emissive: 0x880000 },
            { color: 0x00FF00, emissive: 0x008800 },
            { color: 0x0000FF, emissive: 0x000088 },
            { color: 0xFFFF00, emissive: 0x888800 },
            { color: 0xFF00FF, emissive: 0x880088 }
        ];

        potionColors.forEach((potion, i) => {
            // Frasco
            const bottleBodyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.18, 8);
            const bottleMat = new THREE.MeshPhongMaterial({
                color: 0xAAFFFF,
                transparent: true,
                opacity: 0.4,
                shininess: 200
            });
            const bottleBody = new THREE.Mesh(bottleBodyGeo, bottleMat);
            bottleBody.position.set(
                -0.6 + i * 0.25,
                2.1 + Math.sin(i) * 0.15,
                0.3
            );
            bottleBody.userData.isPotion = true;
            bottleBody.userData.index = i;
            bottleBody.userData.baseY = bottleBody.position.y;
            group.add(bottleBody);

            // Líquido da poção
            const liquidGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.14, 8);
            const liquidMat = new THREE.MeshPhongMaterial({
                color: potion.color,
                emissive: potion.emissive,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.8,
                shininess: 100
            });
            const liquid = new THREE.Mesh(liquidGeo, liquidMat);
            liquid.position.copy(bottleBody.position);
            liquid.position.y -= 0.02;
            liquid.userData.isPotion = true;
            liquid.userData.index = i;
            liquid.userData.baseY = liquid.position.y;
            group.add(liquid);

            // Tampa/rolha
            const corkGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.08, 8);
            const cork = new THREE.Mesh(corkGeo, new THREE.MeshPhongMaterial({
                color: 0x8B4513
            }));
            cork.position.copy(bottleBody.position);
            cork.position.y += 0.13;
            group.add(cork);

            // Brilho mágico ao redor
            const glowGeo = new THREE.SphereGeometry(0.12, 8, 8);
            const glowMat = new THREE.MeshBasicMaterial({
                color: potion.color,
                transparent: true,
                opacity: 0.2,
                blending: THREE.AdditiveBlending
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.copy(bottleBody.position);
            group.add(glow);
        });

        // Partículas mágicas ao redor da bruxa
        const magicParticleCount = 50;
        const magicParticleGeo = new THREE.BufferGeometry();
        const magicPositions = new Float32Array(magicParticleCount * 3);
        const magicColors = new Float32Array(magicParticleCount * 3);

        for (let i = 0; i < magicParticleCount; i++) {
            const angle = (i / magicParticleCount) * Math.PI * 2;
            const radius = 0.5 + Math.random() * 0.5;
            magicPositions[i * 3] = Math.sin(angle) * radius;
            magicPositions[i * 3 + 1] = 0.5 + Math.random() * 2;
            magicPositions[i * 3 + 2] = Math.cos(angle) * radius;

            const colorChoice = Math.floor(Math.random() * 3);
            magicColors[i * 3] = colorChoice === 0 ? 1 : 0;
            magicColors[i * 3 + 1] = colorChoice === 1 ? 1 : 0;
            magicColors[i * 3 + 2] = colorChoice === 2 ? 1 : 0;
        }

        magicParticleGeo.setAttribute('position', new THREE.BufferAttribute(magicPositions, 3));
        magicParticleGeo.setAttribute('color', new THREE.BufferAttribute(magicColors, 3));

        const magicParticleMat = new THREE.PointsMaterial({
            size: 0.06,
            transparent: true,
            opacity: 0.7,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });

        const magicParticles = new THREE.Points(magicParticleGeo, magicParticleMat);
        magicParticles.userData.isMagicParticles = true;
        group.add(magicParticles);

        return group;
    }

    createMesh() {
        switch(this.type) {
            case 'zombie':
            case 'skeleton':
                this.mesh = this.createZombieMesh();
                break;
            case 'creeper':
                this.mesh = this.createCreeperMesh();
                break;
            case 'spider':
                this.mesh = this.createSpiderMesh();
                break;
            case 'enderman':
                this.mesh = this.createEndermanMesh();
                break;
            case 'ghast':
                this.mesh = this.createGhastMesh();
                break;
            case 'slime':
                this.mesh = this.createSlimeMesh();
                break;
            case 'witch':
                this.mesh = this.createWitchMesh();
                break;
            default:
                const enemyType = enemyTypes[this.type];
                const geometry = new THREE.BoxGeometry(
                    enemyType.size.width,
                    enemyType.size.height,
                    enemyType.size.depth
                );
                const material = new THREE.MeshPhongMaterial({
                    color: enemyType.color,
                    shininess: 30
                });
                this.mesh = new THREE.Mesh(geometry, material);
        }

        this.mesh.position.set(this.x, this.y, this.z);
        this.mesh.userData.isEnemy = true;
        this.mesh.userData.enemyRef = this;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        scene.add(this.mesh);
        enemyMeshes.push(this.mesh);
        this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
    }

    // Funções auxiliares para texturas aprimoradas
    createRoundedBoxGeometry(width, height, depth, radius) {
        const shape = new THREE.Shape();
        const hw = width / 2 - radius;
        const hh = height / 2 - radius;

        shape.moveTo(-hw, -hh + radius);
        shape.lineTo(-hw, hh - radius);
        shape.quadraticCurveTo(-hw, hh, -hw + radius, hh);
        shape.lineTo(hw - radius, hh);
        shape.quadraticCurveTo(hw, hh, hw, hh - radius);
        shape.lineTo(hw, -hh + radius);
        shape.quadraticCurveTo(hw, -hh, hw - radius, -hh);
        shape.lineTo(-hw + radius, -hh);
        shape.quadraticCurveTo(-hw, -hh, -hw, -hh + radius);

        const extrudeSettings = {
            depth: depth,
            bevelEnabled: true,
            bevelThickness: radius,
            bevelSize: radius,
            bevelSegments: 2
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }

    createZombieSkinTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 128, 128);
        gradient.addColorStop(0, '#7DA055');
        gradient.addColorStop(0.5, '#8DB360');
        gradient.addColorStop(1, '#6B8B4E');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);

        // Veias e manchas
        ctx.strokeStyle = '#5A7A3A';
        ctx.lineWidth = 1;
        for (let i = 0; i < 30; i++) {
            ctx.beginPath();
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.random() * 20 - 10, y + Math.random() * 20 - 10);
            ctx.stroke();
        }

        // Manchas de decomposição
        ctx.fillStyle = 'rgba(70, 90, 50, 0.4)';
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 128, Math.random() * 128, Math.random() * 8 + 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Textura de pele
        for (let i = 0; i < 800; i++) {
            ctx.fillStyle = `rgba(${100 + Math.random() * 50}, ${120 + Math.random() * 40}, ${60 + Math.random() * 30}, 0.3)`;
            ctx.fillRect(Math.random() * 128, Math.random() * 128, 1, 1);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createRaggedClothesTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#3D5A3D';
        ctx.fillRect(0, 0, 128, 128);

        // Rasgos e buracos
        ctx.fillStyle = '#2A402A';
        for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            ctx.ellipse(x, y, Math.random() * 15 + 5, Math.random() * 8 + 3, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        // Textura de tecido
        ctx.strokeStyle = 'rgba(50, 70, 50, 0.5)';
        ctx.lineWidth = 1;
        for (let y = 0; y < 128; y += 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(128, y);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createAdvancedCamoTexture(baseColor, camoColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = `#${baseColor.toString(16).padStart(6, '0')}`;
        ctx.fillRect(0, 0, 128, 128);

        ctx.fillStyle = `#${camoColor.toString(16).padStart(6, '0')}`;

        // Padrão pixelado tipo Minecraft
        for (let y = 0; y < 128; y += 8) {
            for (let x = 0; x < 128; x += 8) {
                if (Math.random() > 0.5) {
                    ctx.fillRect(x, y, 8, 8);
                }
            }
        }

        // Manchas orgânicas
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 128, Math.random() * 128, Math.random() * 20 + 10, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return texture;
    }

    createDetailedCreeperFace(baseColor, faceColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = `#${baseColor.toString(16).padStart(6, '0')}`;
        ctx.fillRect(0, 0, 128, 128);

        ctx.fillStyle = `#${faceColor.toString(16).padStart(6, '0')}`;

        // Olhos pixelados
        ctx.fillRect(32, 32, 16, 24);
        ctx.fillRect(80, 32, 16, 24);

        // Nariz/boca do Creeper
        ctx.fillRect(56, 64, 16, 8);
        ctx.fillRect(48, 72, 8, 16);
        ctx.fillRect(72, 72, 8, 16);
        ctx.fillRect(56, 88, 16, 8);

        // Sombras para profundidade
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(32, 50, 16, 6);
        ctx.fillRect(80, 50, 16, 6);
        ctx.fillRect(56, 90, 16, 6);

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return texture;
    }

    createRealisticHairTexture(baseColor, hairColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(128, 128, 50, 128, 128, 128);
        gradient.addColorStop(0, `#${baseColor.toString(16).padStart(6, '0')}`);
        gradient.addColorStop(1, `#${hairColor.toString(16).padStart(6, '0')}`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);

        // Pelos detalhados
        ctx.strokeStyle = `#${hairColor.toString(16).padStart(6, '0')}`;
        ctx.lineWidth = 0.5;

        for (let i = 0; i < 500; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const length = Math.random() * 10 + 3;
            const angle = Math.random() * Math.PI * 2;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            ctx.stroke();
        }

        // Pelos mais grossos
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const length = Math.random() * 15 + 5;
            const angle = Math.random() * Math.PI * 2;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createEndermanTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 128, 128);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(0.5, '#0A0A0A');
        gradient.addColorStop(1, '#050505');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);

        // Partículas roxas
        for (let i = 0; i < 100; i++) {
            ctx.fillStyle = `rgba(${Math.random() * 100 + 100}, 0, ${Math.random() * 100 + 155}, ${Math.random() * 0.3})`;
            ctx.fillRect(Math.random() * 128, Math.random() * 128, Math.random() * 3 + 1, Math.random() * 3 + 1);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createGhastFaceTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(255, 255, 255, 0)';
        ctx.fillRect(0, 0, 256, 256);

        // Sombras ao redor dos olhos
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(80, 110, 45, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(176, 110, 45, 50, 0, 0, Math.PI * 2);
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    createWitchRobeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // ✅ CORRIGIDO: Gradiente com cores válidas
        const gradient = ctx.createLinearGradient(0, 0, 0, 128);
        gradient.addColorStop(0, '#550055');    // ✅ Roxo escuro (era #5500550 - INVÁLIDO)
        gradient.addColorStop(0.5, '#660066');  // Roxo médio
        gradient.addColorStop(1, '#4B0082');    // Índigo

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);

        // Base com variação de profundidade
        const bgGradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 90);
        bgGradient.addColorStop(0, 'rgba(100, 0, 130, 0.3)');
        bgGradient.addColorStop(1, 'rgba(40, 0, 60, 0.3)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, 128, 128);

        // Padrão de tecido horizontal (trama)
        ctx.strokeStyle = 'rgba(75, 0, 130, 0.5)';
        ctx.lineWidth = 1;
        for (let y = 0; y < 128; y += 8) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(128, y);
            ctx.stroke();
        }

        // Padrão de tecido vertical (urdidura)
        ctx.strokeStyle = 'rgba(75, 0, 130, 0.3)';
        for (let x = 0; x < 128; x += 6) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 128);
            ctx.stroke();
        }

        // Manchas e desgaste (marcas de uso)
        ctx.fillStyle = 'rgba(50, 0, 80, 0.4)';
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const radius = Math.random() * 10 + 3;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Dobras e sombras do tecido (profundidade)
        ctx.strokeStyle = 'rgba(20, 0, 40, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const y = Math.random() * 128;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.quadraticCurveTo(
                64, y + Math.random() * 20 - 10,
                128, y
            );
            ctx.stroke();
        }

        // Brilhos sutis (reflexos de luz)
        ctx.fillStyle = 'rgba(150, 100, 200, 0.15)';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            ctx.fillRect(x, y, 2, 2);
        }

        // Bordados místicos (símbolos decorativos)
        ctx.strokeStyle = 'rgba(100, 50, 150, 0.6)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;

            // Pequenos círculos místicos
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.stroke();

            // Cruz no centro
            ctx.beginPath();
            ctx.moveTo(x - 3, y);
            ctx.lineTo(x + 3, y);
            ctx.moveTo(x, y - 3);
            ctx.lineTo(x, y + 3);
            ctx.stroke();
        }

        // Sujeira e manchas antigas
        ctx.fillStyle = 'rgba(30, 20, 10, 0.3)';
        for (let i = 0; i < 12; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const size = Math.random() * 6 + 2;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.random() * Math.PI);
            ctx.fillRect(-size/2, -size/2, size, size * 1.5);
            ctx.restore();
        }

        // Rasgos e remendos
        ctx.strokeStyle = 'rgba(40, 0, 60, 0.6)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const length = Math.random() * 15 + 5;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.random() * length - length/2, y + Math.random() * length - length/2);
            ctx.stroke();
        }

        // Textura final - noise para realismo
        const imageData = ctx.getImageData(0, 0, 128, 128);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 15;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
        }
        ctx.putImageData(imageData, 0, 0);

        // Criar textura THREE.js
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;

        return texture;
    }

    createWitchSkinTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#B89968';
        ctx.fillRect(0, 0, 64, 64);

        // Rugas e linhas de expressão
        ctx.strokeStyle = 'rgba(100, 70, 50, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * 64, Math.random() * 64);
            ctx.lineTo(Math.random() * 64, Math.random() * 64);
            ctx.stroke();
        }

        // Manchas de idade
        ctx.fillStyle = 'rgba(140, 100, 70, 0.3)';
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 64, Math.random() * 64, Math.random() * 4 + 1, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    createWoodTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#6B4423';
        ctx.fillRect(0, 0, 128, 128);

        // Veios da madeira
        ctx.strokeStyle = '#5A3618';
        ctx.lineWidth = 2;
        for (let y = 0; y < 128; y += 10) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            for (let x = 0; x < 128; x += 10) {
                ctx.lineTo(x, y + Math.sin(x * 0.1) * 3);
            }
            ctx.stroke();
        }

        // Nós da madeira
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = '#4A2810';
            ctx.beginPath();
            ctx.ellipse(Math.random() * 128, Math.random() * 128, Math.random() * 15 + 5, Math.random() * 10 + 3, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    update() {
        this.animationTime += 0.1;
        this.attackCooldown = Math.max(0, this.attackCooldown - 1);
        this.teleportTimer = Math.max(0, this.teleportTimer - 1);
        this.fireballTimer = Math.max(0, this.fireballTimer - 1);
        this.jumpTimer = Math.max(0, this.jumpTimer - 1);

        const dx = camera.position.x - this.x;
        const dz = camera.position.z - this.z;
        const distToPlayer = Math.sqrt(dx * dx + dz * dz);

        if (distToPlayer < this.detectionRange && !this.exploding) {
            this.targetPlayer = true;
            this.state = 'chasing';
        } else if (this.state === 'chasing' && distToPlayer > this.detectionRange * 1.5) {
            this.targetPlayer = false;
            this.state = 'idle';
        }

        switch(this.type) {
            case 'enderman':
                this.updateEnderman(dx, dz, distToPlayer);
                break;
            case 'ghast':
                this.updateGhast(dx, dz, distToPlayer);
                break;
            case 'slime':
                this.updateSlime(dx, dz, distToPlayer);
                break;
            case 'witch':
                this.updateWitch(dx, dz, distToPlayer);
                break;
            default:
                this.updateStandard(dx, dz, distToPlayer);
        }

        if (this.mesh) {
            this.mesh.position.set(this.x, this.y, this.z);
            this.boundingBox.setFromObject(this.mesh);
        }
    }

    updateStandard(dx, dz, distToPlayer) {
        if (this.targetPlayer && distToPlayer > 1 && !this.exploding) {
            const dirX = dx / distToPlayer;
            const dirZ = dz / distToPlayer;

            this.x += dirX * this.speed;
            this.z += dirZ * this.speed;

            const blockBelow = getBlock(Math.floor(this.x), Math.floor(this.y - 1), Math.floor(this.z));
            if (!blockBelow) {
                this.y -= 0.5;
            } else {
                this.isOnGround = true;
            }

            if (this.isOnGround && this.jumpTimer === 0 && Math.random() < 0.01) {
                this.y += 0.5;
                this.jumpTimer = 30;
            }

            if (this.mesh) {
                this.mesh.rotation.y = Math.atan2(-dx, -dz);
            }

            this.animateWalking();
        }

        if (distToPlayer < this.attackRange && this.attackCooldown === 0 && !this.exploding) {
            this.attack();
        }
    }

    updateEnderman(dx, dz, distToPlayer) {
        if (this.teleportTimer === 0 && Math.random() < 0.02) {
            this.teleport();
        }

        // Animar partículas dos olhos
        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.userData.isEyeParticle) {
                    child.userData.angle += child.userData.speed;
                    const eye = child.userData.eye === 'left' ? -0.14 : 0.14;
                    child.position.set(
                        eye + Math.cos(child.userData.angle) * child.userData.radius,
                        2.95 + Math.sin(child.userData.angle * 2) * 0.1,
                        0.3 + Math.sin(child.userData.angle) * child.userData.radius
                    );
                }
            });
        }

        if (this.targetPlayer && distToPlayer > 3) {
            const dirX = dx / distToPlayer;
            const dirZ = dz / distToPlayer;

            this.x += dirX * this.speed * 1.5;
            this.z += dirZ * this.speed * 1.5;

            const blockBelow = getBlock(Math.floor(this.x), Math.floor(this.y - 1), Math.floor(this.z));
            if (!blockBelow) {
                this.y -= 0.5;
            }

            if (this.mesh) {
                this.mesh.rotation.y = Math.atan2(-dx, -dz);
            }

            this.animateEnderman();
        }

        if (distToPlayer < this.attackRange && this.attackCooldown === 0) {
            this.attack();
        }
    }

    updateGhast(dx, dz, distToPlayer) {
        this.y = getHeight(this.x, this.z) + 5 + Math.sin(this.animationTime * 0.5) * 0.5;

        if (this.targetPlayer && distToPlayer > 10) {
            const dirX = dx / distToPlayer;
            const dirZ = dz / distToPlayer;

            this.x -= dirX * this.speed * 0.5;
            this.z -= dirZ * this.speed * 0.5;

            if (this.mesh) {
                this.mesh.rotation.y = Math.atan2(dx, dz);
            }

            this.animateGhast();
        }

        if (distToPlayer < 20 && this.fireballTimer === 0) {
            this.attack();
            this.fireballTimer = 120;
        }
    }

    updateSlime(dx, dz, distToPlayer) {
        if (this.jumpTimer === 0 && this.isOnGround) {
            this.jumpForce = 0.5 + Math.random() * 0.5;
            this.jumpTimer = 60 + Math.floor(Math.random() * 60);
            this.squishAmount = 0.3;
        }

        this.y += this.jumpForce;
        this.jumpForce -= 0.05;

        const blockBelow = getBlock(Math.floor(this.x), Math.floor(this.y - 0.7), Math.floor(this.z));
        if (blockBelow && this.y <= getHeight(this.x, this.z) + 0.7) {
            this.y = getHeight(this.x, this.z) + 0.7;
            this.isOnGround = true;
            this.jumpForce = 0;
            this.squishAmount = Math.max(0, this.squishAmount - 0.05);
        } else {
            this.isOnGround = false;
        }

        if (this.targetPlayer && this.isOnGround) {
            const dirX = dx / distToPlayer;
            const dirZ = dz / distToPlayer;

            this.x += dirX * this.speed * 0.5;
            this.z += dirZ * this.speed * 0.5;

            if (this.mesh) {
                this.mesh.rotation.y = Math.atan2(-dx, -dz);
            }
        }

        this.animateSlime();

        if (distToPlayer < 1.5 && this.isOnGround) {
            this.attack();
        }
    }

    updateWitch(dx, dz, distToPlayer) {
        if (this.targetPlayer) {
            const dirX = dx / distToPlayer;
            const dirZ = dz / distToPlayer;

            if (distToPlayer < 8) {
                this.x -= dirX * this.speed * 0.7;
                this.z -= dirZ * this.speed * 0.7;
            } else if (distToPlayer > 12) {
                this.x += dirX * this.speed * 0.7;
                this.z += dirZ * this.speed * 0.7;
            }

            const blockBelow = getBlock(Math.floor(this.x), Math.floor(this.y - 1), Math.floor(this.z));
            if (!blockBelow) {
                this.y -= 0.5;
            }

            if (this.mesh) {
                this.mesh.rotation.y = Math.atan2(-dx, -dz);
            }

            this.animateWitch();
        }

        if (distToPlayer < 15 && this.attackCooldown === 0) {
            this.attack();
        }
    }

    teleport() {
        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.userData.isParticles) {
                    child.visible = true;
                    child.material.opacity = 1;
                    setTimeout(() => {
                        if (child.parent) {
                            child.visible = false;
                            child.material.opacity = 0;
                        }
                    }, 500);
                }
            });
        }

        this.x += (Math.random() - 0.5) * 10;
        this.z += (Math.random() - 0.5) * 10;
        this.y = getHeight(this.x, this.z) + 1;

        this.teleportTimer = 100;
    }

    animateWalking() {
        if (!this.mesh) return;

        this.mesh.traverse(child => {
            if (child.userData.isLeg) {
                if (this.type === 'spider') {
                    const legMove = Math.sin(this.animationTime * 8 + child.userData.index) * 0.3;
                    child.rotation.z = child.userData.baseRotation + legMove;
                } else {
                    const legMove = Math.sin(this.animationTime * 8) * 0.5;

                    if (child.userData.isPart === 'thigh') {
                        if (child.userData.side === 'left') {
                            child.rotation.x = legMove * 0.6;
                        } else {
                            child.rotation.x = -legMove * 0.6;
                        }
                    } else if (child.userData.isPart === 'calf') {
                        const calfMove = Math.max(0, Math.sin(this.animationTime * 8)) * 0.8;
                        if (child.userData.side === 'left') {
                            child.rotation.x = calfMove;
                        } else {
                            child.rotation.x = calfMove;
                        }
                    } else {
                        if (child.userData.side === 'left') {
                            child.rotation.x = legMove;
                        } else {
                            child.rotation.x = -legMove;
                        }
                    }
                }
            }

            if (child.userData.isArm && (this.type === 'zombie' || this.type === 'skeleton')) {
                const armMove = Math.sin(this.animationTime * 8) * 0.5;

                if (child.userData.isPart === 'upper') {
                    if (child.userData.side === 'left') {
                        child.rotation.x = -armMove * 0.8;
                    } else {
                        child.rotation.x = armMove * 0.8;
                    }
                } else if (child.userData.isPart === 'forearm') {
                    const forearmSwing = Math.sin(this.animationTime * 8 + Math.PI / 4) * 0.3;
                    child.rotation.x = Math.abs(forearmSwing);
                }
            }
        });

        // Balanço do corpo ao andar
        if (this.mesh && (this.type === 'zombie' || this.type === 'skeleton')) {
            const bodyBounce = Math.abs(Math.sin(this.animationTime * 8)) * 0.05;
            const bodyChildren = this.mesh.children.filter(c => !c.userData.isLeg && !c.userData.isArm);
            bodyChildren.forEach(child => {
                if (child.position.y > 0.5) {
                    child.position.y += bodyBounce;
                }
            });
        }
    }

    animateEnderman() {
        if (!this.mesh) return;

        this.mesh.traverse(child => {
            if (child.userData.isArm) {
                const armMove = Math.sin(this.animationTime * 6) * 0.3;

                if (child.userData.part === 'upper') {
                    if (child.userData.side === 'left') {
                        child.rotation.x = -armMove * 0.5;
                        child.rotation.z = 0.1;
                    } else {
                        child.rotation.x = armMove * 0.5;
                        child.rotation.z = -0.1;
                    }
                } else if (child.userData.part === 'forearm') {
                    child.rotation.x = Math.abs(armMove) * 0.3;
                }
            }

            if (child.userData.isLeg) {
                const legMove = Math.sin(this.animationTime * 6) * 0.25;

                if (child.userData.part === 'thigh') {
                    if (child.userData.side === 'left') {
                        child.rotation.x = legMove;
                    } else {
                        child.rotation.x = -legMove;
                    }
                } else if (child.userData.part === 'calf') {
                    const calfMove = Math.max(0, Math.sin(this.animationTime * 6)) * 0.4;
                    child.rotation.x = calfMove;
                }
            }
        });

        // Tremor característico do Enderman
        if (this.mesh) {
            this.mesh.position.x += (Math.random() - 0.5) * 0.02;
            this.mesh.position.z += (Math.random() - 0.5) * 0.02;
        }
    }

    animateGhast() {
        if (!this.mesh) return;

        this.mesh.traverse(child => {
            if (child.userData.isTentacle) {
                const wave = Math.sin(this.animationTime * 4 + child.userData.index + child.userData.segment * 0.5) * 0.5;
                child.rotation.x = Math.PI / 2 + wave * 0.2;

                const verticalWave = Math.sin(this.animationTime * 2 + child.userData.index * 0.5 + child.userData.segment) * 0.15;
                child.position.y = child.userData.baseY + verticalWave;

                // Rotação dos segmentos
                const segmentRotation = Math.sin(this.animationTime * 3 + child.userData.segment) * 0.1;
                child.rotation.z = child.userData.angle + segmentRotation;
            }

            if (child.userData.isParticles) {
                const positions = child.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i + 1] += Math.sin(this.animationTime * 2 + i) * 0.015;

                    // Movimento circular
                    const angle = this.animationTime * 0.5 + i * 0.1;
                    positions[i] += Math.cos(angle) * 0.01;
                    positions[i + 2] += Math.sin(angle) * 0.01;
                }
                child.geometry.attributes.position.needsUpdate = true;
            }
        });

        // Corpo pulsante e flutuante
        const bodyScale = 1 + Math.sin(this.animationTime * 2) * 0.06;
        if (this.mesh.children[0] && this.mesh.children[0].geometry && this.mesh.children[0].geometry.type === 'SphereGeometry') {
            this.mesh.children[0].scale.set(bodyScale, bodyScale, bodyScale);
        }

        if (this.mesh.children[1]) {
            const innerScale = 1 + Math.sin(this.animationTime * 2.5 + 0.5) * 0.08;
            this.mesh.children[1].scale.set(innerScale, innerScale, innerScale);
        }

        // Rotação suave
        this.mesh.rotation.y = Math.sin(this.animationTime * 0.5) * 0.2;
    }

    animateSlime() {
        if (!this.mesh) return;

        // Efeito de esmagamento ao pular
        this.mesh.traverse(child => {
            if (child.userData.isBody) {
                const squash = 1 - this.squishAmount;
                const stretch = 1 + this.squishAmount * 0.7;
                child.scale.set(stretch, squash, stretch);
            }

            if (child.userData.isInner) {
                const squash = 1 - this.squishAmount * 0.8;
                const stretch = 1 + this.squishAmount * 0.5;
                child.scale.set(stretch, squash, stretch);
            }

            // Animar bolhas internas
            if (child.userData.isBubble) {
                child.position.y += child.userData.floatSpeed;
                if (child.position.y > 1.3) {
                    child.position.y = 0.3;
                }

                // Movimento lateral das bolhas
                child.position.x += Math.sin(this.animationTime * 2 + child.position.y) * 0.005;
                child.position.z += Math.cos(this.animationTime * 2 + child.position.y) * 0.005;
            }
        });

        // Rotação enquanto pula
        this.mesh.rotation.y += 0.02;

        // Inclinação durante o movimento
        if (!this.isOnGround) {
            this.mesh.rotation.x = this.jumpForce * 0.3;
        } else {
            this.mesh.rotation.x *= 0.9;
        }
    }

    animateWitch() {
        if (!this.mesh) return;

        // Animar poções flutuantes
        this.mesh.traverse(child => {
            if (child.userData.isPotion) {
                child.position.y = child.userData.baseY + Math.sin(this.animationTime * 2 + child.userData.index * 0.8) * 0.15;
                child.rotation.y += 0.03;

                // Movimento orbital ao redor da bruxa
                const orbitAngle = this.animationTime * 0.5 + child.userData.index * (Math.PI * 2 / 5);
                const orbitRadius = 0.3;
                child.position.x = -0.6 + child.userData.index * 0.25 + Math.cos(orbitAngle) * orbitRadius * 0.3;
                child.position.z = 0.3 + Math.sin(orbitAngle) * orbitRadius * 0.3;
            }

            if (child.userData.isMagicParticles) {
                const positions = child.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    // Movimento espiral
                    const angle = this.animationTime * 0.3 + i * 0.2;
                    const radius = 0.5 + Math.sin(this.animationTime + i * 0.1) * 0.3;
                    positions[i] = Math.sin(angle) * radius;
                    positions[i + 1] = 0.5 + (i / positions.length) * 2 + Math.sin(this.animationTime * 2 + i * 0.1) * 0.2;
                    positions[i + 2] = Math.cos(angle) * radius;
                }
                child.geometry.attributes.position.needsUpdate = true;

                // Pulsação de opacidade
                child.material.opacity = 0.5 + Math.sin(this.animationTime * 3) * 0.2;
            }
        });

        // Chapéu balançando
        const hat = this.mesh.children.find(child => child.userData.isHat);
        if (hat) {
            hat.rotation.z = Math.sin(this.animationTime * 1.5) * 0.08;
            hat.rotation.x = Math.cos(this.animationTime * 1.2) * 0.05;
        }

        // Movimento da vassoura
        this.mesh.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'CylinderGeometry' && child.position.x > 0.8) {
                child.rotation.z = Math.PI / 4 + Math.sin(this.animationTime * 2) * 0.1;
            }
        });
    }

    attack() {
        switch(this.type) {
            case 'creeper':
                this.startExplosion();
                break;
            case 'ghast':
                this.shootFireball();
                break;
            case 'witch':
                this.throwPotion();
                break;
            case 'enderman':
                if (Math.random() < 0.3) {
                    this.teleport();
                }
                damagePlayer(this.damage);
                this.attackCooldown = 40;

                // Efeito visual de ataque
                if (this.mesh) {
                    this.mesh.traverse(child => {
                        if (child.material && child.material.emissive) {
                            const originalIntensity = child.material.emissiveIntensity;
                            child.material.emissiveIntensity = 2;
                            setTimeout(() => {
                                if (child.material) {
                                    child.material.emissiveIntensity = originalIntensity;
                                }
                            }, 200);
                        }
                    });
                }
                break;
            case 'slime':
                damagePlayer(this.damage);
                if (this.health > 20 && Math.random() < 0.2) {
                    this.split();
                }
                this.attackCooldown = 20;

                // Efeito de salto de ataque
                if (this.isOnGround) {
                    this.jumpForce = 0.3;
                    this.squishAmount = 0.4;
                }
                break;
            case 'spider':
                damagePlayer(this.damage);
                this.attackCooldown = 40;

                // Animação de mordida
                if (this.mesh) {
                    this.mesh.traverse(child => {
                        if (child.geometry && child.geometry.type === 'ConeGeometry') {
                            const originalRotation = child.rotation.x;
                            child.rotation.x = Math.PI / 3;
                            setTimeout(() => {
                                child.rotation.x = originalRotation;
                            }, 150);
                        }
                    });
                }
                break;
            default:
                damagePlayer(this.damage);
                this.attackCooldown = 60;

                // Animação de soco/ataque
                if (this.mesh) {
                    this.mesh.traverse(child => {
                        if (child.userData.isArm && child.userData.side === 'right') {
                            const originalRotation = child.rotation.x;
                            child.rotation.x = -Math.PI / 2;
                            setTimeout(() => {
                                child.rotation.x = originalRotation;
                            }, 200);
                        }
                    });
                }
        }
    }

    startExplosion() {
        if (!this.exploding) {
            this.exploding = true;
            this.explodeTimer = Date.now();
            this.speed = 0;
        }

        const elapsed = Date.now() - this.explodeTimer;
        const intensity = elapsed / enemyTypes.creeper.explodeTime;

        if (this.mesh) {
            // Piscar e expandir
            const flashColor = intensity > 0.5 ? 0xFFFFFF : (intensity > 0.3 ? 0xFF0000 : 0xFFFFFF);
            const scale = 1 + intensity * 0.3;

            this.mesh.scale.set(scale, scale, scale);

            this.mesh.traverse(child => {
                if (child.material) {
                    child.material.color.set(flashColor);
                    if (child.material.emissive) {
                        child.material.emissive.set(flashColor);
                        child.material.emissiveIntensity = intensity * 1.5;
                    }
                }

                // Mostrar partículas de explosão
                if (child.userData.isExplosionParticles) {
                    child.material.opacity = intensity;
                    const positions = child.geometry.attributes.position.array;
                    for (let i = 0; i < positions.length; i += 3) {
                        positions[i] *= 1 + intensity * 0.02;
                        positions[i + 1] += intensity * 0.05;
                        positions[i + 2] *= 1 + intensity * 0.02;
                    }
                    child.geometry.attributes.position.needsUpdate = true;
                }
            });

            // Som de chiado (visual feedback)
            this.mesh.position.y += Math.sin(elapsed * 0.05) * 0.02;
        }

        if (elapsed > enemyTypes.creeper.explodeTime) {
            this.explode();
        }
    }

    shootFireball() {
        const fireballGeo = new THREE.SphereGeometry(0.35, 12, 12);
        const fireballMat = new THREE.MeshStandardMaterial({
            color: 0xFF4500,
            emissive: 0xFF4500,
            emissiveIntensity: 1.2,
            metalness: 0.3,
            roughness: 0.4
        });
        const fireball = new THREE.Mesh(fireballGeo, fireballMat);

        fireball.position.set(this.x, this.y, this.z);
        fireball.userData.isFireball = true;
        fireball.userData.damage = this.damage;
        fireball.userData.speed = 0.3;
        fireball.userData.direction = new THREE.Vector3(
            camera.position.x - this.x,
            camera.position.y - this.y,
            camera.position.z - this.z
        ).normalize();

        // Luz da fireball
        const fireLight = new THREE.PointLight(0xFF4500, 2, 5);
        fireball.add(fireLight);

        // Trail de partículas
        const trailGeo = new THREE.BufferGeometry();
        const trailPositions = new Float32Array(30 * 3);
        trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
        const trailMat = new THREE.PointsMaterial({
            color: 0xFF6600,
            size: 0.15,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const trail = new THREE.Points(trailGeo, trailMat);
        fireball.userData.trail = trail;
        scene.add(trail);

        scene.add(fireball);
        enemyMeshes.push(fireball);

        // Atualizar fireball
        const updateFireball = setInterval(() => {
            if (!fireball.parent) {
                clearInterval(updateFireball);
                if (trail.parent) scene.remove(trail);
                return;
            }

            fireball.position.add(
                fireball.userData.direction.clone().multiplyScalar(fireball.userData.speed)
            );

            // Rotação da fireball
            fireball.rotation.x += 0.1;
            fireball.rotation.y += 0.15;

            // Atualizar trail
            const trailPos = trail.geometry.attributes.position.array;
            for (let i = trailPos.length - 3; i >= 3; i -= 3) {
                trailPos[i] = trailPos[i - 3];
                trailPos[i + 1] = trailPos[i - 2];
                trailPos[i + 2] = trailPos[i - 1];
            }
            trailPos[0] = fireball.position.x;
            trailPos[1] = fireball.position.y;
            trailPos[2] = fireball.position.z;
            trail.geometry.attributes.position.needsUpdate = true;

            // Verificar colisão com jogador
            const distToPlayer = fireball.position.distanceTo(camera.position);
            if (distToPlayer < 1) {
                damagePlayer(fireball.userData.damage);

                // Explosão
                const explosionGeo = new THREE.SphereGeometry(1, 16, 16);
                const explosionMat = new THREE.MeshBasicMaterial({
                    color: 0xFF6600,
                    transparent: true,
                    opacity: 0.8
                });
                const explosion = new THREE.Mesh(explosionGeo, explosionMat);
                explosion.position.copy(fireball.position);
                scene.add(explosion);

                setTimeout(() => {
                    if (explosion.parent) scene.remove(explosion);
                }, 200);

                scene.remove(fireball);
                if (trail.parent) scene.remove(trail);
                const index = enemyMeshes.indexOf(fireball);
                if (index > -1) enemyMeshes.splice(index, 1);
                clearInterval(updateFireball);
            }

            // Verificar colisão com blocos
            const block = getBlock(
                Math.floor(fireball.position.x),
                Math.floor(fireball.position.y),
                Math.floor(fireball.position.z)
            );
            if (block) {
                scene.remove(fireball);
                if (trail.parent) scene.remove(trail);
                const index = enemyMeshes.indexOf(fireball);
                if (index > -1) enemyMeshes.splice(index, 1);
                clearInterval(updateFireball);
            }
        }, 50);

        setTimeout(() => {
            if (fireball.parent) {
                scene.remove(fireball);
                if (trail.parent) scene.remove(trail);
                const index = enemyMeshes.indexOf(fireball);
                if (index > -1) enemyMeshes.splice(index, 1);
                clearInterval(updateFireball);
            }
        }, 5000);
    }

    throwPotion() {
        const potionColor = Math.random() < 0.5 ? 0xFF0000 : 0x00FF00;

        const bottleGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 8);
        const bottleMat = new THREE.MeshPhongMaterial({
            color: 0xAAFFFF,
            transparent: true,
            opacity: 0.5,
            shininess: 200
        });
        const potion = new THREE.Mesh(bottleGeo, bottleMat);

        // Líquido dentro
        const liquidGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8);
        const liquidMat = new THREE.MeshPhongMaterial({
            color: potionColor,
            emissive: potionColor,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const liquid = new THREE.Mesh(liquidGeo, liquidMat);
        potion.add(liquid);

        potion.position.set(this.x, this.y + 1.5, this.z);
        potion.userData.isPotion = true;
        potion.userData.damage = this.damage;
        potion.userData.effect = Math.random() < 0.5 ? 'damage' : 'slowness';
        potion.userData.velocity = new THREE.Vector3(
            (camera.position.x - this.x) * 0.15,
            0.3,
            (camera.position.z - this.z) * 0.15
        );

        // Brilho
        const glowGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: potionColor,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        potion.add(glow);

        scene.add(potion);
        enemyMeshes.push(potion);

        // Atualizar poção
        const updatePotion = setInterval(() => {
            if (!potion.parent) {
                clearInterval(updatePotion);
                return;
            }

            potion.userData.velocity.y -= 0.02; // Gravidade
            potion.position.add(potion.userData.velocity);
            potion.rotation.x += 0.2;
            potion.rotation.z += 0.15;

            // Verificar colisão com jogador
            const distToPlayer = potion.position.distanceTo(camera.position);
            if (distToPlayer < 1.5) {
                damagePlayer(potion.userData.damage);

                // Efeito splash
                const splashGeo = new THREE.SphereGeometry(1.5, 16, 16);
                const splashMat = new THREE.MeshBasicMaterial({
                    color: potionColor,
                    transparent: true,
                    opacity: 0.6,
                    blending: THREE.AdditiveBlending
                });
                const splash = new THREE.Mesh(splashGeo, splashMat);
                splash.position.copy(potion.position);
                scene.add(splash);

                let splashScale = 0.1;
                const splashInterval = setInterval(() => {
                    splashScale += 0.15;
                    splash.scale.set(splashScale, splashScale, splashScale);
                    splash.material.opacity -= 0.08;

                    if (splash.material.opacity <= 0) {
                        scene.remove(splash);
                        clearInterval(splashInterval);
                    }
                }, 30);

                scene.remove(potion);
                const index = enemyMeshes.indexOf(potion);
                if (index > -1) enemyMeshes.splice(index, 1);
                clearInterval(updatePotion);
            }

            // Verificar colisão com chão
            if (potion.position.y < getHeight(potion.position.x, potion.position.z) + 0.2) {
                // Efeito splash no chão
                const splashGeo = new THREE.SphereGeometry(1.5, 16, 16);
                const splashMat = new THREE.MeshBasicMaterial({
                    color: potionColor,
                    transparent: true,
                    opacity: 0.6,
                    blending: THREE.AdditiveBlending
                });
                const splash = new THREE.Mesh(splashGeo, splashMat);
                splash.position.copy(potion.position);
                scene.add(splash);

                let splashScale = 0.1;
                const splashInterval = setInterval(() => {
                    splashScale += 0.15;
                    splash.scale.set(splashScale, splashScale, splashScale);
                    splash.material.opacity -= 0.08;

                    if (splash.material.opacity <= 0) {
                        scene.remove(splash);
                        clearInterval(splashInterval);
                    }
                }, 30);

                scene.remove(potion);
                const index = enemyMeshes.indexOf(potion);
                if (index > -1) enemyMeshes.splice(index, 1);
                clearInterval(updatePotion);
            }
        }, 50);

        setTimeout(() => {
            if (potion.parent) {
                scene.remove(potion);
                const index = enemyMeshes.indexOf(potion);
                if (index > -1) enemyMeshes.splice(index, 1);
                clearInterval(updatePotion);
            }
        }, 6000);

        this.attackCooldown = 80;
    }

    split() {
        for (let i = 0; i < 2; i++) {
            const smallSlime = new Enemy('slime', this.x + (i - 0.5) * 0.8, this.y, this.z);
            smallSlime.health = Math.floor(this.health / 2);
            smallSlime.damage = Math.floor(this.damage / 2);
            smallSlime.speed = this.speed * 1.5;

            if (smallSlime.mesh) {
                smallSlime.mesh.scale.set(0.6, 0.6, 0.6);
            }

            enemies.push(smallSlime);
        }
    }

    explode() {
        // Efeito visual de explosão múltiplas camadas
        const explosionLayers = [
            { radius: 6, color: 0xFF6600, opacity: 0.8 },
            { radius: 5, color: 0xFF4500, opacity: 0.6 },
            { radius: 4, color: 0xFFFF00, opacity: 0.4 }
        ];

        explosionLayers.forEach((layer, index) => {
            setTimeout(() => {
                const explosionGeo = new THREE.SphereGeometry(layer.radius, 20, 20);
                const explosionMat = new THREE.MeshBasicMaterial({
                    color: layer.color,
                    transparent: true,
                    opacity: layer.opacity,
                    blending: THREE.AdditiveBlending
                });
                const explosion = new THREE.Mesh(explosionGeo, explosionMat);
                explosion.position.set(this.x, this.y, this.z);
                scene.add(explosion);

                // Luz da explosão
                const explosionLight = new THREE.PointLight(layer.color, 5, 15);
                explosionLight.position.copy(explosion.position);
                scene.add(explosionLight);

                let scale = 0.1;
                const expandInterval = setInterval(() => {
                    scale += 0.15;
                    explosion.scale.set(scale, scale, scale);
                    explosion.material.opacity -= 0.05;
                    explosionLight.intensity -= 0.3;

                    if (explosion.material.opacity <= 0) {
                        scene.remove(explosion);
                        scene.remove(explosionLight);
                        clearInterval(expandInterval);
                    }
                }, 30);
            }, index * 50);
        });

        // Partículas de explosão
        const particleCount = 100;
        for (let i = 0; i < particleCount; i++) {
            const particleGeo = new THREE.SphereGeometry(0.1, 4, 4);
            const particleMat = new THREE.MeshBasicMaterial({
                color: Math.random() < 0.5 ? 0xFF4500 : 0xFFAA00
            });
            const particle = new THREE.Mesh(particleGeo, particleMat);
            particle.position.set(this.x, this.y, this.z);

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                Math.random() * 0.4 + 0.2,
                (Math.random() - 0.5) * 0.5
            );

            scene.add(particle);

            const particleInterval = setInterval(() => {
                velocity.y -= 0.02;
                particle.position.add(velocity);
                particle.scale.multiplyScalar(0.95);

                if (particle.scale.x < 0.1 || particle.position.y < 0) {
                    scene.remove(particle);
                    clearInterval(particleInterval);
                }
            }, 30);
        }

        // Dano ao jogador
        const dx = camera.position.x - this.x;
        const dz = camera.position.z - this.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 8) {
            const damage = Math.floor(this.damage * (1 - dist / 8));
            damagePlayer(damage);
        }

        // Destruir blocos ao redor
        for (let x = -3; x <= 3; x++) {
            for (let y = -2; y <= 2; y++) {
                for (let z = -3; z <= 3; z++) {
                    const bx = Math.floor(this.x) + x;
                    const by = Math.floor(this.y) + y;
                    const bz = Math.floor(this.z) + z;

                    const block = getBlock(bx, by, bz);
                    const distance = Math.sqrt(x*x + y*y + z*z);

                    if (block && block.type !== 'bedrock' && distance < 4 && Math.random() > distance/5) {
                        removeBlockData(bx, by, bz);
                    }
                }
            }
        }

        // Reconstruir chunks afetados
        const chunk = worldToChunk(this.x, this.z);
        for (let cx = -1; cx <= 1; cx++) {
            for (let cz = -1; cz <= 1; cz++) {
                const key = getChunkKey(chunk.x + cx, chunk.z + cz);
                if (chunkMeshes[key]) {
                    buildChunkMesh(chunk.x + cx, chunk.z + cz);
                }
            }
        }

        this.remove();
        const index = enemies.indexOf(this);
        if (index > -1) enemies.splice(index, 1);
    }

    damage(amount) {
        this.health -= amount;

        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.material) {
                    const originalColor = child.material.color.clone();
                    const originalEmissive = child.material.emissive ? child.material.emissive.clone() : null;
                    const originalEmissiveIntensity = child.material.emissiveIntensity || 0;

                    child.material.color.set(0xFF0000);
                    if (child.material.emissive) {
                        child.material.emissive.set(0xFF0000);
                        child.material.emissiveIntensity = 0.8;
                    }

                    setTimeout(() => {
                        if (child.material) {
                            child.material.color.copy(originalColor);
                            if (originalEmissive && child.material.emissive) {
                                child.material.emissive.copy(originalEmissive);
                                child.material.emissiveIntensity = originalEmissiveIntensity;
                            }
                        }
                    }, 100);
                }
            });

            // Pequeno knockback visual
            const knockbackDir = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                0.2,
                (Math.random() - 0.5) * 0.3
            );
            this.mesh.position.add(knockbackDir);
        }

        if (this.health <= 0) {
            this.state = 'dead';
            this.dropItems();

            // Animação de morte
            if (this.mesh) {
                let deathRotation = 0;
                const deathInterval = setInterval(() => {
                    if (!this.mesh || !this.mesh.parent) {
                        clearInterval(deathInterval);
                        return;
                    }

                    deathRotation += 0.15;
                    this.mesh.rotation.x = deathRotation;
                    this.mesh.position.y -= 0.05;
                    this.mesh.scale.multiplyScalar(0.95);

                    if (this.mesh.scale.x < 0.1) {
                        clearInterval(deathInterval);
                        this.remove();
                    }
                }, 30);
            } else {
                this.remove();
            }

            const index = enemies.indexOf(this);
            if (index > -1) enemies.splice(index, 1);
            return true;
        }
        return false;
    }

    dropItems() {
        const enemyType = enemyTypes[this.type];
        if (enemyType.drops) {
            enemyType.drops.forEach(drop => {
                const count = Math.floor(Math.random() *
                    (enemyType.dropCount.max - enemyType.dropCount.min + 1)) + enemyType.dropCount.min;
                if (count > 0) addToInventory(drop, count);
            });
        }
    }

    remove() {
        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            if (mat.map) mat.map.dispose();
                            if (mat.bumpMap) mat.bumpMap.dispose();
                            mat.dispose();
                        });
                    } else {
                        if (child.material.map) child.material.map.dispose();
                        if (child.material.bumpMap) child.material.bumpMap.dispose();
                        child.material.dispose();
                    }
                }
            });
            scene.remove(this.mesh);
            const index = enemyMeshes.indexOf(this.mesh);
            if (index > -1) enemyMeshes.splice(index, 1);
        }
    }
}


function updateEnemies() {
    enemies.forEach(enemy => {
        if (enemy.update) {
            enemy.update();
        }
    });

    // Atualizar projéteis
    enemyMeshes.forEach((mesh, index) => {
        if (mesh.userData.isFireball) {
            mesh.position.x += mesh.userData.direction.x * mesh.userData.speed;
            mesh.position.y += mesh.userData.direction.y * mesh.userData.speed;
            mesh.position.z += mesh.userData.direction.z * mesh.userData.speed;

            // Verificar colisão com jogador
            const dx = camera.position.x - mesh.position.x;
            const dy = camera.position.y - mesh.position.y;
            const dz = camera.position.z - mesh.position.z;
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

            if (dist < 1.5) {
                damagePlayer(mesh.userData.damage);
                scene.remove(mesh);
                enemyMeshes.splice(index, 1);
            }

            // Rotação
            mesh.rotation.x += 0.1;
            mesh.rotation.y += 0.1;
        }

        if (mesh.userData.isPotion) {
            mesh.userData.velocity.add(mesh.userData.direction.clone().multiplyScalar(mesh.userData.speed));
            mesh.userData.velocity.y += mesh.userData.gravity;

            mesh.position.x += mesh.userData.velocity.x;
            mesh.position.y += mesh.userData.velocity.y;
            mesh.position.z += mesh.userData.velocity.z;

            // Verificar colisão com o chão
            if (mesh.position.y <= getHeight(mesh.position.x, mesh.position.z) + 0.2) {
                // Criar efeito de poção quebrada
                const splashGeo = new THREE.SphereGeometry(2, 8, 8);
                const splashMat = new THREE.MeshBasicMaterial({
                    color: mesh.material.color,
                    transparent: true,
                    opacity: 0.4
                });
                const splash = new THREE.Mesh(splashGeo, splashMat);
                splash.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
                scene.add(splash);

                // Aplicar efeito ao jogador se estiver perto
                const dx = camera.position.x - mesh.position.x;
                const dz = camera.position.z - mesh.position.z;
                const dist = Math.sqrt(dx*dx + dz*dz);

                if (dist < 3) {
                    if (mesh.userData.effect === 'damage') {
                        damagePlayer(mesh.userData.damage);
                    } else {
                        // Efeito de lentidão (implementar se houver sistema de status)
                        console.log('Jogador ficou lento!');
                    }
                }

                // Remover poção e splash
                setTimeout(() => {
                    if (splash.parent) scene.remove(splash);
                }, 1000);

                scene.remove(mesh);
                enemyMeshes.splice(index, 1);
            }

            // Rotação
            mesh.rotation.y += 0.05;
        }
    });
}

function spawnEnemies(chunkX, chunkZ) {
    const sx = chunkX * CHUNK_SIZE;
    const sz = chunkZ * CHUNK_SIZE;

    // ✅ REDUZIDO: 0 a 2 inimigos por chunk (antes era 2-5)
    const spawnCount = Math.floor(Math.random() * 2); // 0, 1 ou 2 inimigos

    for (let i = 0; i < spawnCount; i++) {
        const x = sx + Math.random() * CHUNK_SIZE;
        const z = sz + Math.random() * CHUNK_SIZE;
        const y = getHeight(x, z) + 1;

        const blockBelow = getBlock(Math.floor(x), Math.floor(y - 1), Math.floor(z));

        // ✅ REDUZIDO: 20% de chance (antes era 50%)
        if (blockBelow && Math.random() > 0.8) {
            const types = Object.keys(enemyTypes);
            const type = types[Math.floor(Math.random() * types.length)];

            const enemy = new Enemy(type, x, y, z);
            enemies.push(enemy);
        }
    }
}


