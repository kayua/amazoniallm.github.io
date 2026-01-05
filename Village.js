class Villager {
    constructor(x, y, z, profession) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.profession = profession || this.getRandomProfession();
        this.health = 20 + Math.floor(Math.random() * 5);
        this.homeX = x;
        this.homeZ = z;
        this.wanderRadius = 8 + Math.random() * 10;
        this.targetX = x;
        this.targetZ = z;
        this.speed = 0.012 + (Math.random() - 0.5) * 0.008;
        this.moveTimer = Math.floor(Math.random() * 180);
        this.animationTime = 0;
        this.idleAnimationTime = 0;

        this.workplaceX = null;
        this.workplaceZ = null;
        this.currentActivity = 'idle'; // idle, walking, working, sleeping, socializing
        this.schedule = this.createSchedule();
        this.currentTime = 0;
        this.hunger = 100;
        this.energy = 100;
        this.social = 50 + Math.random() * 50;
        this.pathfinding = [];
        this.conversationPartner = null;
        this.conversationTimer = 0;
        this.workTimer = 0;
        this.workCycleTime = 300 + Math.random() * 200;
        this.personality = {
            sociability: Math.random(),
            workEthic: 0.5 + Math.random() * 0.5,
            curiosity: Math.random()
        };
        this.memory = {
            lastMeeting: {},
            favoriteSpots: [],
            visitedPlaces: []
        };



        this.mesh = null;
        this.boundingBox = null;
        this.skinTone = this.getRandomSkinTone();
        this.hairColor = this.getRandomHairColor();
        this.eyeColor = this.getRandomEyeColor();
        this.heightScale = 0.85 + Math.random() * 0.3;
        this.bodyScale = 0.9 + Math.random() * 0.2;
        this.clothingColor = this.getClothingColor();
        this.accessoryColor = this.getAccessoryColor();
        this.gender = Math.random() < 0.5 ? 'male' : 'female';
        this.beard = this.gender === 'male' && Math.random() < 0.6;
        this.hairStyle = Math.floor(Math.random() * 3);




        this.createMesh();
    }

    getRandomProfession() {
        const professions = ['farmer', 'librarian', 'blacksmith', 'priest', 'butcher',
            'fisherman', 'cartographer', 'fletcher', 'shepherd', 'mason',
            'baker', 'brewer', 'leatherworker', 'toolsmith'];
        return professions[Math.floor(Math.random() * professions.length)];
    }

    getRandomSkinTone() {
        const tones = [0xFFDBAC, 0xE3B98A, 0xD2A679, 0xC08F5E, 0xA0704A, 0x8B5A2B, 0x7B4B2A, 0x6B3E26];
        return tones[Math.floor(Math.random() * tones.length)];
    }

    getRandomHairColor() {
        const colors = [0x4B3621, 0x3B2F1E, 0x2B2315, 0x1B170D, 0x8B4513, 0xA0522D, 0x000000, 0xFFD700];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getRandomEyeColor() {
        const colors = [0x000000, 0x654321, 0x8B4513, 0x228B22, 0x4169E1, 0xA52A2A];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getClothingColor() {
        const professionColors = {
            farmer: [0x8B4513, 0xA0522D, 0xCD853F, 0xDEB887],
            librarian: [0xFFFFFF, 0xF5F5F5, 0xDCDCDC, 0xC0C0C0],
            blacksmith: [0x696969, 0x808080, 0xA9A9A9, 0xBEBEBE],
            priest: [0x800080, 0x9932CC, 0xBA55D3, 0xDA70D6],
            butcher: [0xFFEBCD, 0xFFE4C4, 0xFFDAB9, 0xFFDEAD],
            fisherman: [0x20B2AA, 0x48D1CC, 0x00CED1, 0x5F9EA0],
            cartographer: [0xDAA520, 0xB8860B, 0xCDAD00, 0xEEE8AA],
            fletcher: [0x556B2F, 0x6B8E23, 0x808000, 0x9ACD32],
            shepherd: [0xF0E68C, 0xE6E6FA, 0xFFFACD, 0xFFE4B5],
            mason: [0x708090, 0x778899, 0xB0C4DE, 0xD3D3D3],
            baker: [0xFFF8DC, 0xFFEBCD, 0xFFE4C4, 0xFAEBD7],
            brewer: [0x8B0000, 0xA52A2A, 0xB22222, 0xDC143C],
            leatherworker: [0x8B4513, 0xA0522D, 0xD2691E, 0xCD853F],
            toolsmith: [0x696969, 0x708090, 0x778899, 0x2F4F4F]
        };
        const colors = professionColors[this.profession] || [0x8B4513];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getAccessoryColor() {
        return 0xFFD700 + Math.floor(Math.random() * 0x202020);
    }

    createSchedule() {
        // Horário em ciclos de jogo (0-2400 representa 24 horas)
        return {
            0: 'sleeping',      // 00:00 - 06:00
            360: 'waking',      // 06:00
            420: 'breakfast',   // 07:00
            480: 'work',        // 08:00
            720: 'lunch',       // 12:00
            780: 'work',        // 13:00
            1080: 'socializing',// 18:00
            1200: 'dinner',     // 20:00
            1320: 'relaxing',   // 22:00
            1440: 'sleeping'    // 24:00
        };
    }

    getScheduledActivity() {
        const times = Object.keys(this.schedule).map(Number).sort((a, b) => a - b);
        const currentCycle = this.currentTime % 1440;

        for (let i = times.length - 1; i >= 0; i--) {
            if (currentCycle >= times[i]) {
                return this.schedule[times[i]];
            }
        }
        return 'sleeping';
    }

    setWorkplace(x, z) {
        this.workplaceX = x;
        this.workplaceZ = z;
    }

    findNearbyVillagers(radius = 5) {
        if (typeof villagers === 'undefined') return [];

        return villagers.filter(v => {
            if (v === this || !v.mesh) return false;
            const dx = v.x - this.x;
            const dz = v.z - this.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            return dist <= radius && dist > 0.5;
        });
    }

    startConversation(partner) {
        if (!partner || partner.conversationPartner) return;

        this.conversationPartner = partner;
        partner.conversationPartner = this;
        this.conversationTimer = 100 + Math.random() * 200;
        partner.conversationTimer = this.conversationTimer;
        this.currentActivity = 'socializing';
        partner.currentActivity = 'socializing';

        // Atualizar memória social
        this.memory.lastMeeting[partner.profession] = this.currentTime;
        partner.memory.lastMeeting[this.profession] = this.currentTime;
    }

    updateNeeds(delta = 1) {
        // Fome diminui com o tempo
        this.hunger = Math.max(0, this.hunger - delta * 0.02);

        // Energia diminui quando acordado
        if (this.currentActivity !== 'sleeping') {
            this.energy = Math.max(0, this.energy - delta * 0.03);
        } else {
            this.energy = Math.min(100, this.energy + delta * 0.15);
        }

        // Social aumenta em interações
        if (this.currentActivity === 'socializing' && this.conversationPartner) {
            this.social = Math.min(100, this.social + delta * 0.1);
        } else {
            this.social = Math.max(0, this.social - delta * 0.01);
        }
    }

    makeDecision() {
        const scheduledActivity = this.getScheduledActivity();

        // Necessidades urgentes sobrepõem a rotina
        if (this.hunger < 20 && scheduledActivity !== 'breakfast' && scheduledActivity !== 'lunch' && scheduledActivity !== 'dinner') {
            return 'eating';
        }

        if (this.energy < 20 && scheduledActivity !== 'sleeping') {
            return 'resting';
        }

        // Aldeões sociáveis procuram conversa
        if (this.social < 30 && this.personality.sociability > 0.7 && Math.random() < 0.02) {
            return 'seeking_social';
        }

        return scheduledActivity;
    }

    updateAI() {
        this.currentTime++;
        this.updateNeeds();

        const decision = this.makeDecision();

        // Conversação em andamento
        if (this.conversationPartner) {
            this.conversationTimer--;
            if (this.conversationTimer <= 0) {
                this.endConversation();
            } else {
                // Virar para o parceiro
                const dx = this.conversationPartner.x - this.x;
                const dz = this.conversationPartner.z - this.z;
                this.mesh.rotation.y = Math.atan2(-dx, -dz);
                return; // Não se move durante conversa
            }
        }

        // Executar decisão
        switch(decision) {
            case 'work':
                if (this.workplaceX && this.workplaceZ) {
                    const dx = this.workplaceX - this.x;
                    const dz = this.workplaceZ - this.z;
                    const dist = Math.sqrt(dx * dx + dz * dz);

                    if (dist > 2) {
                        this.targetX = this.workplaceX;
                        this.targetZ = this.workplaceZ;
                        this.currentActivity = 'walking';
                    } else {
                        this.currentActivity = 'working';
                        this.workTimer++;

                        // Animação de trabalho
                        if (this.workTimer % 60 < 30) {
                            this.performWorkAnimation();
                        }
                    }
                }
                break;

            case 'sleeping':
                const homeDist = Math.sqrt(
                    (this.homeX - this.x) ** 2 +
                    (this.homeZ - this.z) ** 2
                );

                if (homeDist > 2) {
                    this.targetX = this.homeX;
                    this.targetZ = this.homeZ;
                    this.currentActivity = 'walking';
                } else {
                    this.currentActivity = 'sleeping';
                }
                break;

            case 'socializing':
            case 'seeking_social':
                const nearby = this.findNearbyVillagers(8);
                if (nearby.length > 0 && !this.conversationPartner) {
                    const target = nearby[Math.floor(Math.random() * nearby.length)];
                    const dist = Math.sqrt(
                        (target.x - this.x) ** 2 +
                        (target.z - this.z) ** 2
                    );

                    if (dist < 1.5) {
                        this.startConversation(target);
                    } else {
                        this.targetX = target.x;
                        this.targetZ = target.z;
                    }
                }
                break;

            case 'breakfast':
            case 'lunch':
            case 'dinner':
            case 'eating':
                this.currentActivity = 'eating';
                this.hunger = Math.min(100, this.hunger + 0.5);
                break;

            default:
                // Comportamento de wandering existente
                if (this.moveTimer > 120 && Math.random() < 0.03) {
                    this.targetX = this.homeX + (Math.random() - 0.5) * this.wanderRadius;
                    this.targetZ = this.homeZ + (Math.random() - 0.5) * this.wanderRadius;
                    this.moveTimer = 0;
                }
        }
    }

    endConversation() {
        if (this.conversationPartner) {
            this.conversationPartner.conversationPartner = null;
            this.conversationPartner.conversationTimer = 0;
            this.conversationPartner.currentActivity = 'idle';
        }
        this.conversationPartner = null;
        this.conversationTimer = 0;
        this.currentActivity = 'idle';
    }

    performWorkAnimation() {
        if (!this.mesh) return;

        const workAnimations = {
            farmer: () => {
                // Movimento de enxada
                this.mesh.traverse(child => {
                    if (child.userData.isArm && child.userData.side === 'right') {
                        child.rotation.x = Math.sin(this.workTimer * 0.1) * 0.8;
                    }
                });
            },
            blacksmith: () => {
                // Martelar
                this.mesh.traverse(child => {
                    if (child.userData.isArm && child.userData.side === 'right') {
                        child.rotation.x = Math.abs(Math.sin(this.workTimer * 0.2)) * -1.2;
                    }
                });
            },
            librarian: () => {
                // Ler livro
                this.mesh.traverse(child => {
                    if (child.userData.isArm) {
                        child.rotation.x = -0.5 + Math.sin(this.workTimer * 0.05) * 0.1;
                    }
                });
            }
        };

        const animation = workAnimations[this.profession];
        if (animation) animation();
    }

    update() {
        if (!this.mesh) return;

        this.moveTimer++;
        this.animationTime += 0.05;
        this.idleAnimationTime += 0.02;

        // Atualizar IA
        this.updateAI();

        const dx = this.targetX - this.x;
        const dz = this.targetZ - this.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.3 && this.currentActivity !== 'working' && this.currentActivity !== 'socializing') {
            const moveStep = this.speed * (1 - 0.2 * Math.random());
            this.x += (dx / dist) * moveStep;
            this.z += (dz / dist) * moveStep;

            this.animateWalking();
            this.mesh.rotation.y = Math.atan2(-dx, -dz) + (Math.sin(this.animationTime) * 0.05);
        } else {
            if (this.currentActivity === 'working') {
                // Já tratado em performWorkAnimation
            } else if (this.currentActivity === 'sleeping') {
                // Deitar (inclinar o corpo)
                this.mesh.rotation.z = Math.PI / 2;
            } else {
                this.mesh.rotation.z = 0;
                this.animateIdle();
            }
        }

        this.mesh.position.set(this.x, this.y, this.z);
        this.boundingBox.setFromObject(this.mesh);
    }


    createMesh() {
        const group = new THREE.Group();
        group.scale.set(this.bodyScale, this.heightScale, this.bodyScale);

        // Torso
        const torsoGeo = new THREE.CylinderGeometry(0.28, 0.35, 1.0, 32, 4, false);
        const torsoMat = new THREE.MeshLambertMaterial({ color: this.clothingColor });
        const torso = new THREE.Mesh(torsoGeo, torsoMat);
        torso.position.y = 1.0;
        group.add(torso);

        // Shirt
        const shirtGeo = new THREE.CylinderGeometry(0.29, 0.36, 0.8, 32);
        const shirtMat = new THREE.MeshLambertMaterial({ color: this.clothingColor * 1.1 });
        const shirt = new THREE.Mesh(shirtGeo, shirtMat);
        shirt.position.y = 1.1;
        group.add(shirt);

        // Pants
        const pantsGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.6, 32);
        const pantsMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const pants = new THREE.Mesh(pantsGeo, pantsMat);
        pants.position.y = 0.5;
        group.add(pants);

        // Profession accessories
        this.addProfessionAccessories(group);

        // Head
        const headGeo = new THREE.IcosahedronGeometry(0.35, 2);
        const headMat = new THREE.MeshLambertMaterial({ color: this.skinTone });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.75;
        group.add(head);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.06, 16, 16);
        const eyeWhiteMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        const leftEyeWhite = new THREE.Mesh(eyeGeo, eyeWhiteMat);
        leftEyeWhite.position.set(-0.14, 1.78, 0.28);
        group.add(leftEyeWhite);
        const rightEyeWhite = new THREE.Mesh(eyeGeo, eyeWhiteMat);
        rightEyeWhite.position.set(0.14, 1.78, 0.28);
        group.add(rightEyeWhite);

        const pupilGeo = new THREE.SphereGeometry(0.03, 16, 16);
        const pupilMat = new THREE.MeshLambertMaterial({ color: this.eyeColor });
        const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
        leftPupil.position.set(-0.14, 1.78, 0.31);
        group.add(leftPupil);
        const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
        rightPupil.position.set(0.14, 1.78, 0.31);
        group.add(rightPupil);

        // Nose
        const noseGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.3, 8, 1, false);
        const noseMat = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 });
        const nose = new THREE.Mesh(noseGeo, noseMat);
        nose.position.set(0, 1.65, 0.32);
        nose.rotation.x = Math.PI / 2;
        group.add(nose);

        // Mouth
        const mouthGeo = new THREE.TorusGeometry(0.1, 0.02, 8, 32, Math.PI);
        const mouthMat = new THREE.MeshLambertMaterial({ color: 0xC71585 });
        const mouth = new THREE.Mesh(mouthGeo, mouthMat);
        mouth.position.set(0, 1.55, 0.3);
        mouth.rotation.x = Math.PI / 2;
        group.add(mouth);

        // Ears
        const earGeo = new THREE.SphereGeometry(0.08, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const earMat = new THREE.MeshLambertMaterial({ color: this.skinTone });
        const leftEar = new THREE.Mesh(earGeo, earMat);
        leftEar.position.set(-0.36, 1.75, 0.05);
        leftEar.rotation.y = Math.PI / 2;
        group.add(leftEar);
        const rightEar = new THREE.Mesh(earGeo, earMat);
        rightEar.position.set(0.36, 1.75, 0.05);
        rightEar.rotation.y = -Math.PI / 2;
        group.add(rightEar);

        // Hair
        this.addHair(group);

        // Beard
        if (this.beard) {
            const beardGeo = new THREE.BoxGeometry(0.4, 0.2, 0.1);
            const beardMat = new THREE.MeshLambertMaterial({ color: this.hairColor });
            const beard = new THREE.Mesh(beardGeo, beardMat);
            beard.position.set(0, 1.5, 0.3);
            group.add(beard);
        }

        // Arms
        const upperArmGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.4, 16);
        const armMat = new THREE.MeshLambertMaterial({ color: this.clothingColor });
        const leftUpperArm = new THREE.Mesh(upperArmGeo, armMat);
        leftUpperArm.position.set(-0.32, 1.4, 0);
        leftUpperArm.userData.isArm = true;
        leftUpperArm.userData.part = 'upper';
        leftUpperArm.userData.side = 'left';
        group.add(leftUpperArm);

        const lowerArmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.4, 16);
        const leftLowerArm = new THREE.Mesh(lowerArmGeo, armMat);
        leftLowerArm.position.set(-0.32, 1.0, 0);
        leftLowerArm.userData.isArm = true;
        leftLowerArm.userData.part = 'lower';
        leftLowerArm.userData.side = 'left';
        group.add(leftLowerArm);

        const rightUpperArm = new THREE.Mesh(upperArmGeo, armMat);
        rightUpperArm.position.set(0.32, 1.4, 0);
        rightUpperArm.userData.isArm = true;
        rightUpperArm.userData.part = 'upper';
        rightUpperArm.userData.side = 'right';
        group.add(rightUpperArm);

        const rightLowerArm = new THREE.Mesh(lowerArmGeo, armMat);
        rightLowerArm.position.set(0.32, 1.0, 0);
        rightLowerArm.userData.isArm = true;
        rightLowerArm.userData.part = 'lower';
        rightLowerArm.userData.side = 'right';
        group.add(rightLowerArm);

        // Hands
        const handGeo = new THREE.BoxGeometry(0.12, 0.15, 0.1);
        const handMat = new THREE.MeshLambertMaterial({ color: this.skinTone });
        const leftHand = new THREE.Mesh(handGeo, handMat);
        leftHand.position.set(-0.32, 0.8, 0);
        group.add(leftHand);
        const rightHand = new THREE.Mesh(handGeo, handMat);
        rightHand.position.set(0.32, 0.8, 0);
        group.add(rightHand);

        // Fingers
        for (let i = 0; i < 4; i++) {
            const fingerGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
            const fingerMat = new THREE.MeshLambertMaterial({ color: this.skinTone });
            const leftFinger = new THREE.Mesh(fingerGeo, fingerMat);
            leftFinger.position.set(-0.32 + (i - 1.5) * 0.03, 0.7, 0);
            leftFinger.rotation.z = Math.PI / 2;
            group.add(leftFinger);
            const rightFinger = new THREE.Mesh(fingerGeo, fingerMat);
            rightFinger.position.set(0.32 + (i - 1.5) * 0.03, 0.7, 0);
            rightFinger.rotation.z = Math.PI / 2;
            group.add(rightFinger);
        }

        // Legs
        const upperLegGeo = new THREE.CylinderGeometry(0.15, 0.12, 0.45, 16);
        const legMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const leftUpperLeg = new THREE.Mesh(upperLegGeo, legMat);
        leftUpperLeg.position.set(-0.15, 0.7, 0);
        leftUpperLeg.userData.isLeg = true;
        leftUpperLeg.userData.part = 'upper';
        leftUpperLeg.userData.side = 'left';
        group.add(leftUpperLeg);

        const lowerLegGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.45, 16);
        const leftLowerLeg = new THREE.Mesh(lowerLegGeo, legMat);
        leftLowerLeg.position.set(-0.15, 0.25, 0);
        leftLowerLeg.userData.isLeg = true;
        leftLowerLeg.userData.part = 'lower';
        leftLowerLeg.userData.side = 'left';
        group.add(leftLowerLeg);

        const rightUpperLeg = new THREE.Mesh(upperLegGeo, legMat);
        rightUpperLeg.position.set(0.15, 0.7, 0);
        rightUpperLeg.userData.isLeg = true;
        rightUpperLeg.userData.part = 'upper';
        rightUpperLeg.userData.side = 'right';
        group.add(rightUpperLeg);

        const rightLowerLeg = new THREE.Mesh(lowerLegGeo, legMat);
        rightLowerLeg.position.set(0.15, 0.25, 0);
        rightLowerLeg.userData.isLeg = true;
        rightLowerLeg.userData.part = 'lower';
        rightLowerLeg.userData.side = 'right';
        group.add(rightLowerLeg);

        // Feet
        const footGeo = new THREE.BoxGeometry(0.18, 0.12, 0.35);
        const footMat = new THREE.MeshLambertMaterial({ color: 0x3D2B1F });
        const leftFoot = new THREE.Mesh(footGeo, footMat);
        leftFoot.position.set(-0.15, 0.06, 0.08);
        group.add(leftFoot);
        const rightFoot = new THREE.Mesh(footGeo, footMat);
        rightFoot.position.set(0.15, 0.06, 0.08);
        group.add(rightFoot);

        this.mesh = group;
        this.mesh.position.set(this.x, this.y, this.z);
        this.mesh.userData.isVillager = true;

        if (typeof scene !== 'undefined') {
            scene.add(this.mesh);
        }
        if (typeof villagerMeshes !== 'undefined') {
            villagerMeshes.push(this.mesh);
        }

        this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
    }

    addProfessionAccessories(group) {
        switch (this.profession) {
            case 'farmer':
                // Hoe
                const hoeHandleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
                const hoeHandleMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
                const hoeHandle = new THREE.Mesh(hoeHandleGeo, hoeHandleMat);
                hoeHandle.position.set(0.35, 1.0, 0.1);
                hoeHandle.rotation.z = Math.PI / 4;
                group.add(hoeHandle);
                const hoeHeadGeo = new THREE.BoxGeometry(0.2, 0.1, 0.05);
                const hoeHeadMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
                const hoeHead = new THREE.Mesh(hoeHeadGeo, hoeHeadMat);
                hoeHead.position.set(0.45, 0.7, 0.1);
                hoeHead.rotation.z = Math.PI / 4;
                group.add(hoeHead);
                break;

            case 'librarian':
                // Glasses
                const glassesGeo = new THREE.TorusGeometry(0.15, 0.02, 8, 32);
                const glassesMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
                const glasses = new THREE.Mesh(glassesGeo, glassesMat);
                glasses.position.set(0, 1.78, 0.3);
                glasses.rotation.x = Math.PI / 2;
                group.add(glasses);
                // Book
                const bookGeo = new THREE.BoxGeometry(0.25, 0.35, 0.1);
                const bookMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                const book = new THREE.Mesh(bookGeo, bookMat);
                book.position.set(-0.35, 1.0, 0.1);
                book.rotation.y = Math.PI / 6;
                group.add(book);
                break;

            case 'blacksmith':
            case 'toolsmith':
                // Hammer
                const hammerHandleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
                const hammerHandleMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
                const hammerHandle = new THREE.Mesh(hammerHandleGeo, hammerHandleMat);
                hammerHandle.position.set(0.35, 0.9, 0.1);
                hammerHandle.rotation.z = Math.PI / 3;
                group.add(hammerHandle);
                const hammerHeadGeo = new THREE.BoxGeometry(0.18, 0.12, 0.12);
                const hammerHeadMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
                const hammerHead = new THREE.Mesh(hammerHeadGeo, hammerHeadMat);
                hammerHead.position.set(0.4, 0.65, 0.1);
                group.add(hammerHead);
                // Leather apron
                const apronGeo = new THREE.BoxGeometry(0.55, 0.9, 0.05);
                const apronMat = new THREE.MeshLambertMaterial({ color: 0x4B3621 });
                const apron = new THREE.Mesh(apronGeo, apronMat);
                apron.position.set(0, 0.9, 0.26);
                group.add(apron);
                break;

            case 'baker':
                // Chef hat
                const hatBaseGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 32);
                const hatMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
                const hatBase = new THREE.Mesh(hatBaseGeo, hatMat);
                hatBase.position.y = 2.0;
                group.add(hatBase);
                const hatTopGeo = new THREE.SphereGeometry(0.3, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
                const hatTop = new THREE.Mesh(hatTopGeo, hatMat);
                hatTop.position.y = 2.15;
                group.add(hatTop);
                // Rolling pin
                const pinGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16);
                const pinMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
                const pin = new THREE.Mesh(pinGeo, pinMat);
                pin.position.set(0.35, 1.0, 0.1);
                pin.rotation.z = Math.PI / 2;
                group.add(pin);
                break;

            case 'shepherd':
                // Staff
                const staffGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8);
                const staffMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                const staff = new THREE.Mesh(staffGeo, staffMat);
                staff.position.set(0.35, 1.0, 0);
                group.add(staff);
                const staffCurvGeo = new THREE.TorusGeometry(0.15, 0.03, 8, 16, Math.PI);
                const staffCurv = new THREE.Mesh(staffCurvGeo, staffMat);
                staffCurv.position.set(0.35, 1.6, 0);
                staffCurv.rotation.x = Math.PI / 2;
                group.add(staffCurv);
                break;
        }
    }

    addHair(group) {
        let hairGeo, hair;
        const hairMat = new THREE.MeshLambertMaterial({ color: this.hairColor });

        switch (this.hairStyle) {
            case 0:
                hairGeo = new THREE.SphereGeometry(0.36, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
                hair = new THREE.Mesh(hairGeo, hairMat);
                hair.position.y = 1.85;
                group.add(hair);
                break;
            case 1:
                hairGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.6, 32);
                hair = new THREE.Mesh(hairGeo, hairMat);
                hair.position.y = 1.6;
                group.add(hair);
                break;
            case 2:
                hairGeo = new THREE.SphereGeometry(0.36, 32, 32, 0, Math.PI * 2, Math.PI / 4, Math.PI / 2);
                hair = new THREE.Mesh(hairGeo, hairMat);
                hair.position.y = 1.85;
                group.add(hair);
                break;
        }

        if (Math.random() < 0.3 || this.profession === 'farmer') {
            const hatGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32);
            const hatBrimGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32);
            const hatMat = new THREE.MeshLambertMaterial({ color: 0xDAA520 });
            const hatTop = new THREE.Mesh(hatGeo, hatMat);
            hatTop.position.y = 2.0;
            group.add(hatTop);
            const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
            hatBrim.position.y = 1.9;
            group.add(hatBrim);
        }
    }

    animateWalking() {
        if (!this.mesh) return;
        this.mesh.traverse(child => {
            if (child.userData.isLeg) {
                const legMove = Math.sin(this.animationTime * 5) * 0.5;
                const kneeBend = Math.abs(Math.cos(this.animationTime * 5)) * 0.2;
                if (child.userData.side === 'left') {
                    if (child.userData.part === 'upper') child.rotation.x = legMove;
                    if (child.userData.part === 'lower') child.rotation.x = kneeBend;
                } else {
                    if (child.userData.part === 'upper') child.rotation.x = -legMove;
                    if (child.userData.part === 'lower') child.rotation.x = -kneeBend;
                }
            }
            if (child.userData.isArm) {
                const armMove = Math.sin(this.animationTime * 5) * 0.4;
                const elbowBend = Math.abs(Math.sin(this.animationTime * 5)) * 0.15;
                if (child.userData.side === 'left') {
                    if (child.userData.part === 'upper') child.rotation.x = -armMove;
                    if (child.userData.part === 'lower') child.rotation.x = -elbowBend;
                } else {
                    if (child.userData.part === 'upper') child.rotation.x = armMove;
                    if (child.userData.part === 'lower') child.rotation.x = elbowBend;
                }
            }
        });
    }

    animateIdle() {
        if (!this.mesh) return;
        this.mesh.scale.y = this.heightScale * (1 + Math.sin(this.idleAnimationTime) * 0.005);
        this.mesh.rotation.y += Math.sin(this.idleAnimationTime * 0.5) * 0.01;
    }

    remove() {
        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            if (typeof scene !== 'undefined') {
                scene.remove(this.mesh);
            }
            if (typeof villagerMeshes !== 'undefined') {
                const index = villagerMeshes.indexOf(this.mesh);
                if (index > -1) villagerMeshes.splice(index, 1);
            }
        }
    }
}


function buildHouse(x, y, z) {
    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            setBlock(x + dx, y - 1, z + dz, 'planks');
        }
    }

    for (let dy = 0; dy < 4; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                if (Math.abs(dx) === 2 || Math.abs(dz) === 2) {
                    if (dy === 1 && dx === 0 && dz === 2) {
                        continue;
                    } else {
                        setBlock(x + dx, y + dy, z + dz, 'planks');
                    }
                }
            }
        }
    }

    for (let dy = 0; dy < 3; dy++) {
        const size = 2 - dy;
        for (let dx = -size; dx <= size; dx++) {
            for (let dz = -size; dz <= size; dz++) {
                setBlock(x + dx, y + 4 + dy, z + dz, 'brick');
            }
        }
    }

    setBlock(x - 2, y + 2, z, 'glass');
    setBlock(x + 2, y + 2, z, 'glass');
}

function buildBakery(x, y, z) {
    // Base
    for (let dx = -3; dx <= 3; dx++) {
        for (let dz = -3; dz <= 3; dz++) {
            setBlock(x + dx, y - 1, z + dz, 'planks');
        }
    }

    // Walls
    for (let dy = 0; dy < 5; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
                if (Math.abs(dx) === 3 || Math.abs(dz) === 3) {
                    if (dy === 1 && dx === 0 && dz === 3) {
                        continue;
                    }
                    setBlock(x + dx, y + dy, z + dz, 'brick');
                }
            }
        }
    }

    // Oven (furnace area)
    setBlock(x - 2, y + 1, z - 2, 'furnace');
    setBlock(x - 1, y + 1, z - 2, 'furnace');

    // Chimney
    for (let dy = 0; dy < 6; dy++) {
        setBlock(x - 2, y + 5 + dy, z - 2, 'brick');
    }
    setBlock(x - 2, y + 11, z - 2, 'cobblestone');

    // Display window
    setBlock(x + 3, y + 1, z - 1, 'glass');
    setBlock(x + 3, y + 2, z - 1, 'glass');
    setBlock(x + 3, y + 1, z, 'glass');
    setBlock(x + 3, y + 2, z, 'glass');
    setBlock(x + 3, y + 1, z + 1, 'glass');
    setBlock(x + 3, y + 2, z + 1, 'glass');

    // Counter
    for (let dx = -1; dx <= 1; dx++) {
        setBlock(x + dx, y + 1, z + 1, 'planks');
    }

    // Sign
    setBlock(x, y + 3, z + 3, 'planks');

    // Roof
    for (let dy = 0; dy < 3; dy++) {
        const size = 3 - dy;
        for (let dx = -size; dx <= size; dx++) {
            for (let dz = -size; dz <= size; dz++) {
                setBlock(x + dx, y + 5 + dy, z + dz, 'brick');
            }
        }
    }
}

function buildWindmill(x, y, z) {
    // Base tower
    for (let dy = 0; dy < 12; dy++) {
        const size = Math.max(2, 4 - Math.floor(dy / 4));
        for (let dx = -size; dx <= size; dx++) {
            for (let dz = -size; dz <= size; dz++) {
                if (Math.abs(dx) === size || Math.abs(dz) === size) {
                    setBlock(x + dx, y + dy, z + dz, 'cobblestone');
                }
            }
        }
    }

    // Door
    setBlock(x, y + 1, z + 4, 'air');
    setBlock(x, y + 2, z + 4, 'air');

    // Windows
    setBlock(x + 2, y + 6, z, 'glass');
    setBlock(x - 2, y + 6, z, 'glass');
    setBlock(x, y + 6, z + 2, 'glass');
    setBlock(x, y + 6, z - 2, 'glass');

    // Top platform
    for (let dx = -3; dx <= 3; dx++) {
        for (let dz = -3; dz <= 3; dz++) {
            if (Math.abs(dx) <= 3 && Math.abs(dz) <= 3) {
                setBlock(x + dx, y + 12, z + dz, 'planks');
            }
        }
    }

    // Windmill blades (simplified cross pattern)
    const bladeLength = 6;
    for (let i = -bladeLength; i <= bladeLength; i++) {
        // Blade 1 (horizontal)
        setBlock(x + i, y + 13, z, 'planks');
        if (Math.abs(i) > 2) {
            setBlock(x + i, y + 13, z - 1, 'planks');
            setBlock(x + i, y + 13, z + 1, 'planks');
        }

        // Blade 2 (vertical)
        setBlock(x, y + 13 + i, z, 'planks');
        if (Math.abs(i) > 2) {
            setBlock(x - 1, y + 13 + i, z, 'planks');
            setBlock(x + 1, y + 13 + i, z, 'planks');
        }
    }

    // Center hub
    setBlock(x, y + 13, z, 'wood');
    setBlock(x, y + 14, z, 'wood');
}

function buildWell(x, y, z) {
    // Base
    for (let angle = 0; angle < 360; angle += 30) {
        const rad = angle * Math.PI / 180;
        const wx = Math.floor(x + Math.cos(rad) * 2);
        const wz = Math.floor(z + Math.sin(rad) * 2);
        setBlock(wx, y, wz, 'cobblestone');
    }

    // Inner well (water)
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            if (dx === 0 && dz === 0) continue;
            setBlock(x + dx, y, z + dz, 'glass');
            setBlock(x + dx, y - 1, z + dz, 'glass');
            setBlock(x + dx, y - 2, z + dz, 'glass');
        }
    }

    // Walls around well
    for (let angle = 0; angle < 360; angle += 30) {
        const rad = angle * Math.PI / 180;
        const wx = Math.floor(x + Math.cos(rad) * 2);
        const wz = Math.floor(z + Math.sin(rad) * 2);
        setBlock(wx, y + 1, wz, 'cobblestone');
        setBlock(wx, y + 2, wz, 'cobblestone');
    }

    // Posts
    setBlock(x + 2, y + 3, z + 2, 'planks');
    setBlock(x + 2, y + 4, z + 2, 'planks');
    setBlock(x - 2, y + 3, z - 2, 'planks');
    setBlock(x - 2, y + 4, z - 2, 'planks');

    // Roof beam
    for (let dx = -2; dx <= 2; dx++) {
        setBlock(x + dx, y + 5, z, 'planks');
    }

    // Bucket (decorative)
    setBlock(x, y + 1, z, 'wood');
}

function buildBlacksmith(x, y, z) {
    // Base
    for (let dx = -4; dx <= 4; dx++) {
        for (let dz = -3; dz <= 3; dz++) {
            setBlock(x + dx, y - 1, z + dz, 'cobblestone');
        }
    }

    // Walls
    for (let dy = 0; dy < 5; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
                if (Math.abs(dx) === 4 || Math.abs(dz) === 3) {
                    if (dy === 1 && dx === 0 && dz === 3) {
                        continue;
                    }
                    setBlock(x + dx, y + dy, z + dz, 'cobblestone');
                }
            }
        }
    }

    // Forge area
    setBlock(x - 3, y + 1, z - 2, 'furnace');
    setBlock(x - 2, y + 1, z - 2, 'furnace');

    // Anvil area (using blocks to represent)
    setBlock(x + 2, y + 1, z - 1, 'cobblestone');
    setBlock(x + 2, y + 2, z - 1, 'stone');

    // Chimney
    for (let dy = 0; dy < 7; dy++) {
        setBlock(x - 3, y + 5 + dy, z - 2, 'brick');
    }

    // Lava pit for dramatic effect
    setBlock(x - 3, y, z, 'lava');
    setBlock(x - 2, y, z, 'lava');

    // Windows
    setBlock(x + 4, y + 2, z - 1, 'glass');
    setBlock(x + 4, y + 2, z + 1, 'glass');

    // Roof
    for (let dy = 0; dy < 3; dy++) {
        const width = 4 - dy;
        for (let dx = -width; dx <= width; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
                setBlock(x + dx, y + 5 + dy, z + dz, 'brick');
            }
        }
    }

    // Tool racks (decorative)
    for (let dz = -2; dz <= 2; dz += 2) {
        setBlock(x - 4, y + 2, z + dz, 'planks');
    }
}

function buildLibrary(x, y, z) {
    // Base (large)
    for (let dx = -5; dx <= 5; dx++) {
        for (let dz = -6; dz <= 6; dz++) {
            setBlock(x + dx, y - 1, z + dz, 'planks');
        }
    }

    // Walls
    for (let dy = 0; dy < 8; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
            for (let dz = -6; dz <= 6; dz++) {
                if (Math.abs(dx) === 5 || Math.abs(dz) === 6) {
                    if (dy <= 2 && dx === 0 && dz === 6) {
                        continue;
                    }
                    setBlock(x + dx, y + dy, z + dz, 'quartz');
                }
            }
        }
    }

    // Columns
    const columns = [
        {dx: -4, dz: -5}, {dx: -4, dz: 0}, {dx: -4, dz: 5},
        {dx: 4, dz: -5}, {dx: 4, dz: 0}, {dx: 4, dz: 5}
    ];

    columns.forEach(col => {
        for (let dy = 0; dy < 8; dy++) {
            setBlock(x + col.dx, y + dy, z + col.dz, 'quartz');
        }
        setBlock(x + col.dx, y + 8, z + col.dz, 'cobblestone');
    });

    // Bookshelves
    for (let dx = -4; dx <= 4; dx += 2) {
        for (let dy = 1; dy < 7; dy++) {
            if (dx !== 0) {
                setBlock(x + dx, y + dy, z - 6, 'planks');
                setBlock(x + dx, y + dy, z + 6, 'planks');
            }
        }
    }

    // Windows
    setBlock(x - 5, y + 4, z - 3, 'glass');
    setBlock(x - 5, y + 5, z - 3, 'glass');
    setBlock(x - 5, y + 4, z + 3, 'glass');
    setBlock(x - 5, y + 5, z + 3, 'glass');
    setBlock(x + 5, y + 4, z - 3, 'glass');
    setBlock(x + 5, y + 5, z + 3, 'glass');

    // Roof
    for (let dy = 0; dy < 4; dy++) {
        const size = 5 - dy;
        for (let dx = -size; dx <= size; dx++) {
            for (let dz = -6; dz <= 6; dz++) {
                setBlock(x + dx, y + 8 + dy, z + dz, 'brick');
            }
        }
    }

    // Entrance steps
    for (let dx = -1; dx <= 1; dx++) {
        setBlock(x + dx, y, z + 7, 'quartz');
        setBlock(x + dx, y + 1, z + 8, 'quartz');
    }
}

function buildTavern(x, y, z) {
    // Base
    for (let dx = -4; dx <= 4; dx++) {
        for (let dz = -5; dz <= 5; dz++) {
            setBlock(x + dx, y - 1, z + dz, 'planks');
        }
    }

    // Walls
    for (let dy = 0; dy < 6; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
            for (let dz = -5; dz <= 5; dz++) {
                if (Math.abs(dx) === 4 || Math.abs(dz) === 5) {
                    if (dy === 1 && dx === 0 && dz === 5) {
                        continue;
                    }
                    setBlock(x + dx, y + dy, z + dz, 'planks');
                }
            }
        }
    }

    // Second floor
    for (let dx = -3; dx <= 3; dx++) {
        for (let dz = -4; dz <= 4; dz++) {
            setBlock(x + dx, y + 6, z + dz, 'planks');
        }
    }

    // Bar counter
    for (let dx = -2; dx <= 2; dx++) {
        setBlock(x + dx, y + 1, z - 3, 'planks');
    }

    // Barrels
    setBlock(x - 3, y + 1, z - 4, 'wood');
    setBlock(x - 2, y + 1, z - 4, 'wood');
    setBlock(x + 2, y + 1, z - 4, 'wood');
    setBlock(x + 3, y + 1, z - 4, 'wood');

    // Tables
    setBlock(x - 2, y + 1, z + 1, 'planks');
    setBlock(x + 2, y + 1, z + 1, 'planks');

    // Sign
    for (let dx = -2; dx <= 2; dx++) {
        setBlock(x + dx, y + 3, z + 5, 'planks');
    }

    // Lanterns
    setBlock(x - 2, y + 3, z, 'lantern');
    setBlock(x + 2, y + 3, z, 'lantern');

    // Windows - first floor
    setBlock(x - 4, y + 2, z - 2, 'glass');
    setBlock(x - 4, y + 2, z + 2, 'glass');
    setBlock(x + 4, y + 2, z - 2, 'glass');
    setBlock(x + 4, y + 2, z + 2, 'glass');

    // Windows - second floor
    setBlock(x - 2, y + 7, z - 4, 'glass');
    setBlock(x + 2, y + 7, z - 4, 'glass');

    // Roof
    for (let dy = 0; dy < 4; dy++) {
        const size = 4 - dy;
        for (let dx = -size; dx <= size; dx++) {
            for (let dz = -5; dz <= 5; dz++) {
                setBlock(x + dx, y + 6 + dy, z + dz, 'brick');
            }
        }
    }
}

function buildWatchTower(x, y, z) {
    // Base
    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            setBlock(x + dx, y - 1, z + dz, 'cobblestone');
        }
    }

    // Tower structure
    for (let dy = 0; dy < 20; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                if (Math.abs(dx) === 2 || Math.abs(dz) === 2) {
                    setBlock(x + dx, y + dy, z + dz, 'cobblestone');
                }
            }
        }
    }

    // Viewing platform
    for (let dx = -3; dx <= 3; dx++) {
        for (let dz = -3; dz <= 3; dz++) {
            setBlock(x + dx, y + 20, z + dz, 'planks');
        }
    }

    // Battlements
    for (let dx = -3; dx <= 3; dx++) {
        for (let dz = -3; dz <= 3; dz++) {
            if ((Math.abs(dx) === 3 || Math.abs(dz) === 3) && (dx + dz) % 2 === 0) {
                setBlock(x + dx, y + 21, z + dz, 'cobblestone');
                setBlock(x + dx, y + 22, z + dz, 'cobblestone');
            }
        }
    }

    // Ladder
    for (let dy = 0; dy < 20; dy++) {
        setBlock(x, y + dy, z, 'ladder');
    }

    // Torch posts
    setBlock(x + 3, y + 21, z + 3, 'torch');
    setBlock(x - 3, y + 21, z + 3, 'torch');
    setBlock(x + 3, y + 21, z - 3, 'torch');
    setBlock(x - 3, y + 21, z - 3, 'torch');
}

function buildGarden(x, y, z) {
    // Garden bed
    for (let dx = -3; dx <= 3; dx++) {
        for (let dz = -3; dz <= 3; dz++) {
            setBlock(x + dx, y, z + dz, 'dirt');

            // Plants
            if (Math.random() > 0.5) {
                const plants = ['leaves', 'mushroom_red', 'mushroom_brown', 'grass'];
                setBlock(x + dx, y + 1, z + dz, plants[Math.floor(Math.random() * plants.length)]);
            }
        }
    }

    // Fence
    for (let dx = -4; dx <= 4; dx++) {
        setBlock(x + dx, y, z - 4, 'planks');
        setBlock(x + dx, y, z + 4, 'planks');
    }
    for (let dz = -3; dz <= 3; dz++) {
        setBlock(x - 4, y, z + dz, 'planks');
        setBlock(x + 4, y, z + dz, 'planks');
    }

    // Decorative tree
    setBlock(x, y, z, 'dirt');
    for (let dy = 1; dy <= 4; dy++) {
        setBlock(x, y + dy, z, 'wood');
    }
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            for (let dy = 0; dy <= 1; dy++) {
                setBlock(x + dx, y + 4 + dy, z + dz, 'leaves');
            }
        }
    }
}

function buildBridge(x, y, z, length, direction) {
    // direction: 'x' or 'z'
    if (direction === 'x') {
        for (let i = 0; i < length; i++) {
            // Platform
            for (let dz = -1; dz <= 1; dz++) {
                setBlock(x + i, y, z + dz, 'planks');
            }

            // Railings
            if (i % 2 === 0) {
                setBlock(x + i, y + 1, z - 1, 'planks');
                setBlock(x + i, y + 1, z + 1, 'planks');
            }

            // Support posts
            if (i % 5 === 0) {
                for (let dy = -3; dy < 0; dy++) {
                    setBlock(x + i, y + dy, z - 1, 'wood');
                    setBlock(x + i, y + dy, z + 1, 'wood');
                }
            }
        }
    } else {
        for (let i = 0; i < length; i++) {
            for (let dx = -1; dx <= 1; dx++) {
                setBlock(x + dx, y, z + i, 'planks');
            }

            if (i % 2 === 0) {
                setBlock(x - 1, y + 1, z + i, 'planks');
                setBlock(x + 1, y + 1, z + i, 'planks');
            }

            if (i % 5 === 0) {
                for (let dy = -3; dy < 0; dy++) {
                    setBlock(x - 1, y + dy, z + i, 'wood');
                    setBlock(x + 1, y + dy, z + i, 'wood');
                }
            }
        }
    }
}

function buildFarm(x, y, z) {
    // Farmland
    for (let dx = -5; dx <= 5; dx++) {
        for (let dz = -5; dz <= 5; dz++) {
            setBlock(x + dx, y, z + dz, 'dirt');

            // Crops
            if ((dx + dz) % 2 === 0) {
                setBlock(x + dx, y + 1, z + dz, 'grass');
            }
        }
    }

    // Fence
    for (let dx = -6; dx <= 6; dx++) {
        setBlock(x + dx, y, z - 6, 'planks');
        setBlock(x + dx, y, z + 6, 'planks');
    }
    for (let dz = -5; dz <= 5; dz++) {
        setBlock(x - 6, y, z + dz, 'planks');
        setBlock(x + 6, y, z + dz, 'planks');
    }

    // Scarecrow
    setBlock(x, y + 1, z, 'planks');
    setBlock(x, y + 2, z, 'planks');
    setBlock(x - 1, y + 2, z, 'planks');
    setBlock(x + 1, y + 2, z, 'planks');
    setBlock(x, y + 3, z, 'mushroom_brown');

    // Tool shed
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            if (Math.abs(dx) === 1 || Math.abs(dz) === 1) {
                setBlock(x + 7 + dx, y + 1, z + dz, 'planks');
            }
        }
    }
    setBlock(x + 7, y + 2, z, 'planks');
}

function buildChurch(x, y, z) {
    // Base (larger)
    for (let dx = -4; dx <= 4; dx++) {
        for (let dz = -7; dz <= 7; dz++) {
            setBlock(x + dx, y - 1, z + dz, 'cobblestone');
        }
    }

    // Main walls
    for (let dy = 0; dy < 8; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
            for (let dz = -7; dz <= 7; dz++) {
                if (Math.abs(dx) === 4 || Math.abs(dz) === 7) {
                    if (dy <= 3 && dx >= -1 && dx <= 1 && dz === 7) {
                        continue; // Main door
                    }
                    setBlock(x + dx, y + dy, z + dz, 'quartz');
                }
            }
        }
    }

    // Windows
    const windows = [
        {dx: -4, dz: -3}, {dx: -4, dz: 3},
        {dx: 4, dz: -3}, {dx: 4, dz: 3}
    ];

    windows.forEach(w => {
        for (let dy = 3; dy <= 5; dy++) {
            setBlock(x + w.dx, y + dy, z + w.dz, 'glass');
        }
    });

    // Bell tower
    for (let dy = 0; dy < 15; dy++) {
        if (dy < 8) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    if (Math.abs(dx) === 1 || Math.abs(dz) === 1) {
                        setBlock(x + dx, y + 8 + dy, z + dz, 'quartz');
                    }
                }
            }
        } else {
            setBlock(x, y + 8 + dy, z, 'quartz');
            setBlock(x + 1, y + 8 + dy, z, 'quartz');
            setBlock(x - 1, y + 8 + dy, z, 'quartz');
            setBlock(x, y + 8 + dy, z + 1, 'quartz');
            setBlock(x, y + 8 + dy, z - 1, 'quartz');
        }
    }

    // Bell
    setBlock(x, y + 18, z, 'gold_ore');

    // Cross
    for (let dy = 0; dy < 3; dy++) {
        setBlock(x, y + 23 + dy, z, 'gold_ore');
    }
    setBlock(x - 1, y + 24, z, 'gold_ore');
    setBlock(x + 1, y + 24, z, 'gold_ore');
    setBlock(x, y + 26, z, 'glowstone');

    // Roof
    for (let dy = 0; dy < 5; dy++) {
        const width = 4 - dy;
        for (let dx = -width; dx <= width; dx++) {
            for (let dz = -7; dz <= 7; dz++) {
                setBlock(x + dx, y + 8 + dy, z + dz, 'brick');
            }
        }
    }

    // Interior altar
    for (let dx = -2; dx <= 2; dx++) {
        setBlock(x + dx, y + 1, z - 6, 'quartz');
    }
    for (let dx = -1; dx <= 1; dx++) {
        setBlock(x + dx, y + 2, z - 6, 'quartz');
    }
    setBlock(x, y + 3, z - 6, 'gold_ore');

    // Pews
    for (let row = -4; row <= 2; row += 2) {
        for (let dz = 0; dz < 3; dz++) {
            setBlock(x - 2, y + 1, z + row + dz, 'planks');
            setBlock(x + 2, y + 1, z + row + dz, 'planks');
        }
    }
}

function buildMarket(x, y, z) {
    // Platform
    for (let dx = -5; dx <= 5; dx++) {
        for (let dz = -5; dz <= 5; dz++) {
            setBlock(x + dx, y, z + dz, 'planks');
        }
    }

    // Stalls
    const stalls = [
        {dx: -3, dz: -3}, {dx: 3, dz: -3},
        {dx: -3, dz: 3}, {dx: 3, dz: 3}
    ];

    stalls.forEach(stall => {
        // Base
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (Math.abs(dx) === 1 || Math.abs(dz) === 1) {
                    setBlock(x + stall.dx + dx, y + 1, z + stall.dz + dz, 'planks');
                }
            }
        }

        // Posts
        setBlock(x + stall.dx - 1, y + 2, z + stall.dz - 1, 'planks');
        setBlock(x + stall.dx + 1, y + 2, z + stall.dz - 1, 'planks');
        setBlock(x + stall.dx - 1, y + 2, z + stall.dz + 1, 'planks');
        setBlock(x + stall.dx + 1, y + 2, z + stall.dz + 1, 'planks');

        // Roof
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                setBlock(x + stall.dx + dx, y + 3, z + stall.dz + dz, 'planks');
            }
        }

        // Goods
        setBlock(x + stall.dx, y + 1, z + stall.dz, 'chest');
    });

    // Central lantern
    setBlock(x, y + 1, z, 'planks');
    setBlock(x, y + 2, z, 'planks');
    setBlock(x, y + 3, z, 'planks');
    setBlock(x, y + 4, z, 'lantern');
}

function buildFountain(x, y, z) {
    // Base
    for (let dx = -3; dx <= 3; dx++) {
        for (let dz = -3; dz <= 3; dz++) {
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist <= 3) {
                setBlock(x + dx, y - 1, z + dz, 'cobblestone');
            }
        }
    }

    // Outer rim
    for (let angle = 0; angle < 360; angle += 45) {
        const rad = angle * Math.PI / 180;
        const fx = Math.floor(x + Math.cos(rad) * 3);
        const fz = Math.floor(z + Math.sin(rad) * 3);
        setBlock(fx, y, fz, 'stone');
        setBlock(fx, y + 1, fz, 'stone');
    }

    // Inner pool
    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 2) {
                setBlock(x + dx, y, z + dz, 'glass'); // Water
            }
        }
    }

    // Central column
    for (let dy = 0; dy < 4; dy++) {
        setBlock(x, y + dy, z, 'quartz');
    }

    // Top
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            if (dx !== 0 || dz !== 0) {
                setBlock(x + dx, y + 4, z + dz, 'glowstone');
            }
        }
    }
    setBlock(x, y + 5, z, 'glowstone');
}

function buildPaths(centerX, villageY, centerZ) {
    // Main cross paths
    for (let i = -30; i <= 30; i++) {
        // Horizontal
        setBlock(centerX + i, villageY, centerZ, 'cobblestone');
        setBlock(centerX + i, villageY, centerZ + 1, 'cobblestone');
        setBlock(centerX + i, villageY, centerZ - 1, 'cobblestone');

        // Vertical
        setBlock(centerX, villageY, centerZ + i, 'cobblestone');
        setBlock(centerX + 1, villageY, centerZ + i, 'cobblestone');
        setBlock(centerX - 1, villageY, centerZ + i, 'cobblestone');
    }

    // Lanterns along paths
    for (let i = -28; i <= 28; i += 7) {
        setBlock(centerX + i, villageY + 1, centerZ + 4, 'planks');
        setBlock(centerX + i, villageY + 2, centerZ + 4, 'lantern');
        setBlock(centerX + i, villageY + 1, centerZ - 4, 'planks');
        setBlock(centerX + i, villageY + 2, centerZ - 4, 'lantern');
        setBlock(centerX + 4, villageY + 1, centerZ + i, 'planks');
        setBlock(centerX + 4, villageY + 2, centerZ + i, 'lantern');
        setBlock(centerX - 4, villageY + 1, centerZ + i, 'planks');
        setBlock(centerX - 4, villageY + 2, centerZ + i, 'lantern');
    }
}


function buildStable(x, y, z) {
    // Estábulo para cavalos
    for (let dx = -4; dx <= 4; dx++) {
        for (let dz = -5; dz <= 5; dz++) {
            setBlock(x + dx, y - 1, z + dz, 'planks');
        }
    }

    // Paredes
    for (let dy = 0; dy < 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
            for (let dz = -5; dz <= 5; dz++) {
                if (Math.abs(dx) === 4 || Math.abs(dz) === 5) {
                    if (dy <= 2 && ((dx === 0 && dz === 5) || (Math.abs(dx) === 2 && dz === 5))) {
                        continue; // Portas e entradas
                    }
                    setBlock(x + dx, y + dy, z + dz, 'planks');
                }
            }
        }
    }

    // Baias para cavalos
    for (let stall = -3; stall <= 3; stall += 3) {
        for (let dz = -3; dz <= 2; dz++) {
            if (dz === -3 || dz === 2) {
                setBlock(x + stall, y + 1, z + dz, 'planks');
            }
        }
        // Comedouro
        setBlock(x + stall, y + 1, z - 2, 'planks');
    }

    // Teto
    for (let dy = 0; dy < 3; dy++) {
        const width = 4 - dy;
        for (let dx = -width; dx <= width; dx++) {
            for (let dz = -5; dz <= 5; dz++) {
                setBlock(x + dx, y + 4 + dy, z + dz, 'planks');
            }
        }
    }

    // Feno
    setBlock(x - 3, y + 1, z + 3, 'grass');
    setBlock(x + 3, y + 1, z + 3, 'grass');
}

function buildCarpenter(x, y, z) {
    // Oficina de carpintaria
    for (let dx = -3; dx <= 3; dx++) {
        for (let dz = -4; dz <= 4; dz++) {
            setBlock(x + dx, y - 1, z + dz, 'planks');
        }
    }

    // Paredes
    for (let dy = 0; dy < 5; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -4; dz <= 4; dz++) {
                if (Math.abs(dx) === 3 || Math.abs(dz) === 4) {
                    if (dy === 1 && dx === 0 && dz === 4) continue;
                    setBlock(x + dx, y + dy, z + dz, 'planks');
                }
            }
        }
    }

    // Bancada de trabalho
    for (let dx = -2; dx <= 2; dx++) {
        setBlock(x + dx, y + 1, z - 3, 'planks');
    }
    setBlock(x, y + 2, z - 3, 'crafting_table');

    // Prateleiras com ferramentas
    for (let dy = 1; dy <= 3; dy++) {
        setBlock(x - 3, y + dy, z - 2, 'planks');
        setBlock(x - 3, y + dy, z, 'planks');
        setBlock(x - 3, y + dy, z + 2, 'planks');
    }

    // Pilhas de madeira
    for (let dx = 1; dx <= 2; dx++) {
        for (let dy = 1; dy <= 2; dy++) {
            setBlock(x + dx, y + dy, z + 3, 'wood');
        }
    }

    // Teto
    for (let dy = 0; dy < 3; dy++) {
        const size = 3 - dy;
        for (let dx = -size; dx <= size; dx++) {
            for (let dz = -4; dz <= 4; dz++) {
                setBlock(x + dx, y + 5 + dy, z + dz, 'brick');
            }
        }
    }
}

function buildTeaHouse(x, y, z) {
    // Casa de chá oriental
    for (let dx = -4; dx <= 4; dx++) {
        for (let dz = -4; dz <= 4; dz++) {
            setBlock(x + dx, y - 1, z + dz, 'planks');
        }
    }

    // Paredes baixas (estilo japonês)
    for (let dy = 0; dy < 3; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
            for (let dz = -4; dz <= 4; dz++) {
                if (Math.abs(dx) === 4 || Math.abs(dz) === 4) {
                    if (dy === 1 && ((dx === 0 && Math.abs(dz) === 4) || (dz === 0 && Math.abs(dx) === 4))) {
                        setBlock(x + dx, y + dy, z + dz, 'glass'); // Portas de vidro
                    } else {
                        setBlock(x + dx, y + dy, z + dz, 'planks');
                    }
                }
            }
        }
    }

    // Mesas baixas
    setBlock(x - 2, y, z - 2, 'planks');
    setBlock(x + 2, y, z - 2, 'planks');
    setBlock(x - 2, y, z + 2, 'planks');
    setBlock(x + 2, y, z + 2, 'planks');

    // Jardim zen central
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            setBlock(x + dx, y, z + dz, 'sand');
        }
    }

    // Lanternas
    setBlock(x - 3, y + 1, z - 3, 'lantern');
    setBlock(x + 3, y + 1, z - 3, 'lantern');
    setBlock(x - 3, y + 1, z + 3, 'lantern');
    setBlock(x + 3, y + 1, z + 3, 'lantern');

    // Teto curvo (pagode style)
    for (let dy = 0; dy < 4; dy++) {
        const size = 5 + dy;
        for (let dx = -size; dx <= size; dx++) {
            for (let dz = -size; dz <= size; dz++) {
                if (Math.abs(dx) === size || Math.abs(dz) === size) {
                    setBlock(x + dx, y + 3 + dy, z + dz, 'brick');
                }
            }
        }
    }

    // Topo do telhado
    setBlock(x, y + 7, z, 'gold_ore');
}

function buildFishMarket(x, y, z) {
    // Mercado de peixes à beira d'água
    for (let dx = -5; dx <= 5; dx++) {
        for (let dz = -3; dz <= 3; dz++) {
            setBlock(x + dx, y, z + dz, 'planks');
        }
    }

    // Tenda
    for (let dx = -4; dx <= 4; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            if (Math.abs(dx) === 4 || Math.abs(dz) === 2) {
                setBlock(x + dx, y + 1, z + dz, 'planks');
                setBlock(x + dx, y + 2, z + dz, 'planks');
            }
        }
    }

    // Telhado de lona
    for (let dx = -5; dx <= 5; dx++) {
        for (let dz = -3; dz <= 3; dz++) {
            setBlock(x + dx, y + 3, z + dz, 'wool_cyan');
        }
    }

    // Balcões de exposição
    for (let dx = -3; dx <= 3; dx += 2) {
        setBlock(x + dx, y + 1, z - 1, 'planks');
        setBlock(x + dx, y + 1, z + 1, 'planks');
        // "Peixes" no gelo
        setBlock(x + dx, y + 2, z - 1, 'glass');
        setBlock(x + dx, y + 2, z + 1, 'glass');
    }

    // Barris
    setBlock(x - 4, y + 1, z, 'wood');
    setBlock(x + 4, y + 1, z, 'wood');

    // Placa
    setBlock(x, y + 3, z - 3, 'planks');
}

function buildGuardHouse(x, y, z) {
    // Casa da guarda
    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            setBlock(x + dx, y - 1, z + dz, 'cobblestone');
        }
    }

    // Paredes fortificadas
    for (let dy = 0; dy < 5; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                if (Math.abs(dx) === 2 || Math.abs(dz) === 2) {
                    if (dy === 1 && dx === 0 && dz === 2) continue;
                    setBlock(x + dx, y + dy, z + dz, 'cobblestone');
                }
            }
        }
    }

    // Torre de vigia
    for (let dy = 5; dy < 12; dy++) {
        setBlock(x, y + dy, z, 'cobblestone');
        setBlock(x + 1, y + dy, z, 'cobblestone');
        setBlock(x - 1, y + dy, z, 'cobblestone');
        setBlock(x, y + dy, z + 1, 'cobblestone');
        setBlock(x, y + dy, z - 1, 'cobblestone');
    }

    // Plataforma de observação
    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            setBlock(x + dx, y + 12, z + dz, 'planks');
        }
    }

    // Ameias
    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            if ((Math.abs(dx) === 2 || Math.abs(dz) === 2) && (dx + dz) % 2 === 0) {
                setBlock(x + dx, y + 13, z + dz, 'cobblestone');
            }
        }
    }

    // Armas na parede
    setBlock(x - 2, y + 2, z - 1, 'iron_block');
    setBlock(x - 2, y + 2, z + 1, 'iron_block');

    // Bandeira
    for (let dy = 0; dy < 3; dy++) {
        setBlock(x, y + 14 + dy, z, 'planks');
    }
    setBlock(x, y + 17, z, 'wool_red');
}

function buildWarehouse(x, y, z) {
    // Armazém grande
    for (let dx = -6; dx <= 6; dx++) {
        for (let dz = -8; dz <= 8; dz++) {
            setBlock(x + dx, y - 1, z + dz, 'cobblestone');
        }
    }

    // Paredes
    for (let dy = 0; dy < 6; dy++) {
        for (let dx = -6; dx <= 6; dx++) {
            for (let dz = -8; dz <= 8; dz++) {
                if (Math.abs(dx) === 6 || Math.abs(dz) === 8) {
                    if (dy <= 3 && ((dx === 0 && dz === 8) || (dx === 0 && dz === -8))) {
                        continue; // Portas grandes
                    }
                    setBlock(x + dx, y + dy, z + dz, 'planks');
                }
            }
        }
    }

    // Prateleiras de armazenamento
    for (let row = -6; row <= 6; row += 4) {
        for (let dz = -6; dz <= 6; dz += 3) {
            if (row === 0 || dz === 0) continue; // Deixar corredor central
            for (let dy = 1; dy <= 4; dy++) {
                setBlock(x + row, y + dy, z + dz, 'planks');
            }
            // Caixas
            setBlock(x + row, y + dy, z + dz, 'chest');
        }
    }

    // Teto alto
    for (let dy = 0; dy < 3; dy++) {
        const width = 6 - dy;
        for (let dx = -width; dx <= width; dx++) {
            for (let dz = -8; dz <= 8; dz++) {
                setBlock(x + dx, y + 6 + dy, z + dz, 'planks');
            }
        }
    }

    // Janelas altas para ventilação
    setBlock(x - 6, y + 4, z - 4, 'glass');
    setBlock(x - 6, y + 4, z + 4, 'glass');
    setBlock(x + 6, y + 4, z - 4, 'glass');
    setBlock(x + 6, y + 4, z + 4, 'glass');
}

function buildArcherTower(x, y, z) {
    // Torre de arqueiro estilo medieval
    for (let dy = 0; dy < 25; dy++) {
        const radius = dy < 20 ? 2 : 3;
        for (let angle = 0; angle < 360; angle += 45) {
            const rad = angle * Math.PI / 180;
            const tx = Math.floor(x + Math.cos(rad) * radius);
            const tz = Math.floor(z + Math.sin(rad) * radius);
            setBlock(tx, y + dy, tz, 'stone');
        }
    }

    // Plataforma de tiro
    for (let dx = -4; dx <= 4; dx++) {
        for (let dz = -4; dz <= 4; dz++) {
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist <= 4) {
                setBlock(x + dx, y + 25, z + dz, 'planks');
            }
        }
    }

    // Ameias com seteiras
    for (let angle = 0; angle < 360; angle += 45) {
        const rad = angle * Math.PI / 180;
        const tx = Math.floor(x + Math.cos(rad) * 4);
        const tz = Math.floor(z + Math.sin(rad) * 4);
        setBlock(tx, y + 26, tz, 'stone');
        setBlock(tx, y + 27, tz, 'stone');
        // Seteira (abertura para arqueiros)
        setBlock(tx, y + 26.5, tz, 'air');
    }

    // Escadas internas
    for (let dy = 0; dy < 25; dy++) {
        const angle = (dy * 20) * Math.PI / 180;
        const tx = Math.floor(x + Math.cos(angle) * 1);
        const tz = Math.floor(z + Math.sin(angle) * 1);
        setBlock(tx, y + dy, tz, 'ladder');
    }

    // Telhado pontiagudo
    for (let dy = 0; dy < 5; dy++) {
        const radius = 4 - dy;
        for (let angle = 0; angle < 360; angle += 30) {
            const rad = angle * Math.PI / 180;
            const tx = Math.floor(x + Math.cos(rad) * radius);
            const tz = Math.floor(z + Math.sin(rad) * radius);
            setBlock(tx, y + 28 + dy, tz, 'brick');
        }
    }
    setBlock(x, y + 33, z, 'gold_ore');
}

function forceUpdateChunk(worldX, worldZ) {
    const chunk = worldToChunk(worldX, worldZ);
    const chunkKey = getChunkKey(chunk.x, chunk.z);

    if (!chunks[chunkKey]) {
        console.warn(`Chunk ${chunkKey} não existe`);
        return false;
    }

    const chunkData = chunks[chunkKey];

    // Remove mesh antigo
    if (chunkData.mesh) {
        if (chunkData.mesh.geometry) chunkData.mesh.geometry.dispose();
        if (chunkData.mesh.material) {
            if (Array.isArray(chunkData.mesh.material)) {
                chunkData.mesh.material.forEach(m => m.dispose());
            } else {
                chunkData.mesh.material.dispose();
            }
        }
        scene.remove(chunkData.mesh);
        chunkData.mesh = null;
    }

    // Reconstrói
    buildChunkMesh(chunk.x, chunk.z);
    console.log(`✅ Chunk ${chunkKey} atualizado`);
    return true;
}

function generateVillage(centerX, centerZ) {
    console.log('🏘️ Iniciando geração de vila em:', centerX, centerZ);

    // Get terrain height
    let villageY = 64;
    if (typeof getHeight === 'function') {
        villageY = getHeight(centerX, centerZ) + 1;
    }

    // FASE 1: Garantir que todos os chunks necessários existam
    const villageRadius = 50;
    const requiredChunks = [];

    for (let x = -villageRadius; x <= villageRadius; x += CHUNK_SIZE) {
        for (let z = -villageRadius; z <= villageRadius; z += CHUNK_SIZE) {
            const wx = centerX + x;
            const wz = centerZ + z;
            const chunk = worldToChunk(wx, wz);
            const chunkKey = getChunkKey(chunk.x, chunk.z);

            if (!chunks[chunkKey]) {
                requiredChunks.push([chunk.x, chunk.z]);
            }
        }
    }

    // Gerar todos os chunks necessários
    console.log(`📦 Gerando ${requiredChunks.length} chunks necessários...`);
    requiredChunks.forEach(([cx, cz]) => {
        generateChunk(cx, cz);
    });

    // FASE 2: Limpar e nivelar área
    console.log('🏗️ Nivelando terreno...');
    const affectedChunks = new Set(); // Mover para cá para rastrear desde o início

    for (let x = -40; x <= 40; x++) {
        for (let z = -40; z <= 40; z++) {
            const wx = centerX + x;
            const wz = centerZ + z;

            // Rastrear chunks afetados
            const chunk = worldToChunk(wx, wz);
            affectedChunks.add(getChunkKey(chunk.x, chunk.z));

            if (typeof setBlock === 'function') {
                setBlock(wx, villageY, wz, 'grass');

                // Clear above
                for (let y = villageY + 1; y < villageY + 30; y++) {
                    if (typeof removeBlockData === 'function') {
                        removeBlockData(wx, y, wz);
                    }
                }
            }
        }
    }

    // FASE 3: Construir infraestrutura básica
    console.log('🛤️ Construindo caminhos...');
    buildPaths(centerX, villageY, centerZ);

    console.log('⛲ Construindo fonte central...');
    buildFountain(centerX, villageY + 1, centerZ);

    // FASE 4: Configuração de edifícios
    const buildings = [
        // CASAS RESIDENCIAIS
        {x: 0, z: 18, type: 'house', profession: 'farmer', workplace: {x: 22, z: -12}},
        {x: 18, z: 0, type: 'house', profession: 'librarian', workplace: {x: 15, z: -20}},
        {x: -18, z: 0, type: 'house', profession: 'blacksmith', workplace: {x: -5, z: -25}},
        {x: 0, z: -18, type: 'house', profession: 'priest', workplace: {x: -15, z: 15}},
        {x: 12, z: 12, type: 'house', profession: 'butcher', workplace: {x: -25, z: 5}},
        {x: -12, z: -12, type: 'house', profession: 'fisherman', workplace: {x: -28, z: 15}},
        {x: -12, z: 12, type: 'house', profession: 'shepherd', workplace: {x: 28, z: 12}},
        {x: 12, z: -12, type: 'house', profession: 'fletcher', workplace: {x: 25, z: 5}},
        {x: 8, z: 20, type: 'house', profession: 'baker', workplace: {x: 5, z: 25}},
        {x: -8, z: -20, type: 'house', profession: 'carpenter', workplace: {x: -10, z: 28}},

        // EDIFÍCIOS PRINCIPAIS
        {x: -15, z: 15, type: 'church'},
        {x: 15, z: -20, type: 'library'},
        {x: 25, z: 5, type: 'tavern'},
        {x: -25, z: 5, type: 'market'},

        // EDIFÍCIOS DE TRABALHO
        {x: 5, z: 25, type: 'bakery'},
        {x: -5, z: -25, type: 'blacksmith'},
        {x: 22, z: -12, type: 'farm'},
        {x: 20, z: 20, type: 'windmill'},

        // DECORATIVOS
        {x: 8, z: 8, type: 'well'},
        {x: -20, z: 20, type: 'garden'},

        // DEFESA
        {x: 30, z: 0, type: 'tower'},
        {x: -30, z: 0, type: 'tower'}
    ];

    // FASE 5: Construir edifícios e rastrear chunks
    console.log(`🏛️ Construindo ${buildings.length} estruturas...`);
    let buildingsBuilt = 0;

    buildings.forEach((building, index) => {
        const bx = centerX + building.x;
        const bz = centerZ + building.z;

        // Adicionar chunks do edifício e área ao redor aos chunks afetados
        for (let dx = -10; dx <= 10; dx++) {
            for (let dz = -10; dz <= 10; dz++) {
                const wx = bx + dx;
                const wz = bz + dz;
                const chunk = worldToChunk(wx, wz);
                affectedChunks.add(getChunkKey(chunk.x, chunk.z));
            }
        }

        // Verificar se o chunk do edifício existe
        const buildingChunk = worldToChunk(bx, bz);
        const buildingChunkKey = getChunkKey(buildingChunk.x, buildingChunk.z);

        if (!chunks[buildingChunkKey]) {
            console.warn(`⚠️ Chunk não encontrado para ${building.type} em (${bx}, ${bz})`);
            return;
        }

        try {
            switch(building.type) {
                case 'house':
                    buildHouse(bx, villageY + 1, bz);
                    if (building.profession && typeof Villager !== 'undefined') {
                        const villager = new Villager(bx, villageY + 2, bz, building.profession);
                        if (building.workplace) {
                            villager.setWorkplace(
                                centerX + building.workplace.x,
                                centerZ + building.workplace.z
                            );
                        }
                        if (typeof villagers !== 'undefined') {
                            villagers.push(villager);
                        }
                    }
                    break;
                case 'church': buildChurch(bx, villageY + 1, bz); break;
                case 'library': buildLibrary(bx, villageY + 1, bz); break;
                case 'tavern': buildTavern(bx, villageY + 1, bz); break;
                case 'market': buildMarket(bx, villageY + 1, bz); break;
                case 'bakery': buildBakery(bx, villageY + 1, bz); break;
                case 'blacksmith': buildBlacksmith(bx, villageY + 1, bz); break;
                case 'farm': buildFarm(bx, villageY + 1, bz); break;
                case 'windmill': buildWindmill(bx, villageY + 1, bz); break;
                case 'well': buildWell(bx, villageY + 1, bz); break;
                case 'garden': buildGarden(bx, villageY + 1, bz); break;
                case 'tower': buildWatchTower(bx, villageY + 1, bz); break;
                default:
                    console.warn(`❓ Tipo de edifício desconhecido: ${building.type}`);
            }
            buildingsBuilt++;
        } catch (error) {
            console.error(`❌ Erro construindo ${building.type} em (${bx}, ${villageY + 1}, ${bz}):`, error);
        }
    });

    // FASE 6: Adicionar decorações
    console.log('🌳 Adicionando decorações...');
    addSimpleDecorations(centerX, villageY, centerZ);

    // FASE 7: Reconstruir TODOS os chunks afetados (FORÇAR RECONSTRUÇÃO)
    console.log(`🔨 Reconstruindo ${affectedChunks.size} chunks afetados...`);

    let chunksRebuilt = 0;
    let chunksSkipped = 0;

    affectedChunks.forEach(chunkKey => {
        const [cx, cz] = chunkKey.split(',').map(Number);

        if (!chunks[chunkKey]) {
            console.warn(`⚠️ Chunk ${chunkKey} não existe`);
            chunksSkipped++;
            return;
        }

        try {
            const chunk = chunks[chunkKey];

            // IMPORTANTE: Remover mesh antigo SEMPRE
            if (chunk.mesh) {
                if (chunk.mesh.geometry) {
                    chunk.mesh.geometry.dispose();
                }
                if (chunk.mesh.material) {
                    if (Array.isArray(chunk.mesh.material)) {
                        chunk.mesh.material.forEach(mat => {
                            if (mat && mat.dispose) mat.dispose();
                        });
                    } else if (chunk.mesh.material.dispose) {
                        chunk.mesh.material.dispose();
                    }
                }
                if (typeof scene !== 'undefined' && scene.remove) {
                    scene.remove(chunk.mesh);
                }
                chunk.mesh = null;
            }

            // Marcar chunk como modificado (se existir essa propriedade)
            if (chunk.hasOwnProperty('modified')) {
                chunk.modified = true;
            }

            // Forçar reconstrução
            if (typeof buildChunkMesh === 'function') {
                buildChunkMesh(cx, cz);
                chunksRebuilt++;
            } else {
                console.warn('⚠️ buildChunkMesh não está definido');
            }

        } catch (error) {
            console.error(`❌ Erro reconstruindo chunk (${cx}, ${cz}):`, error);
            chunksSkipped++;
        }
    });

    console.log(`✅ Reconstrução concluída: ${chunksRebuilt} sucesso, ${chunksSkipped} falhas`);

    // FASE 8: Registrar vila
    if (typeof villages !== 'undefined') {
        villages.push({
            x: centerX,
            z: centerZ,
            y: villageY,
            buildingCount: buildingsBuilt,
            chunksAffected: affectedChunks.size,
            timestamp: Date.now()
        });
    }

    console.log(`✅ Vila concluída!`);
    console.log(`   📊 Edifícios construídos: ${buildingsBuilt}/${buildings.length}`);
    console.log(`   👥 Aldeões: ${buildings.filter(b => b.profession).length}`);
    console.log(`   🗺️ Chunks afetados: ${affectedChunks.size}`);

    return {
        success: true,
        buildings: buildingsBuilt,
        chunks: chunksRebuilt,
        villagers: buildings.filter(b => b.profession).length
    };
}

function addSimpleDecorations(centerX, villageY, centerZ) {
    // Árvores apenas nas bordas
    const treePositions = [
        {x: 25, z: 25}, {x: -25, z: 25},
        {x: 25, z: -25}, {x: -25, z: -25}
    ];

    treePositions.forEach(pos => {
        const tx = centerX + pos.x;
        const tz = centerZ + pos.z;

        // Verificar se o chunk existe
        const treeChunk = worldToChunk(tx, tz);
        if (!chunks[getChunkKey(treeChunk.x, treeChunk.z)]) return;

        try {
            // Tronco
            for (let dy = 0; dy < 5; dy++) {
                setBlock(tx, villageY + 1 + dy, tz, 'wood');
            }
            // Folhas
            for (let dx = -2; dx <= 2; dx++) {
                for (let dz = -2; dz <= 2; dz++) {
                    for (let dy = 0; dy <= 2; dy++) {
                        if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy) <= 4) {
                            setBlock(tx + dx, villageY + 5 + dy, tz + dz, 'leaves');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erro adicionando árvore:', error);
        }
    });
}
function addExtendedPaths(centerX, villageY, centerZ) {
    // Connect outer buildings with secondary paths
    const connections = [
        // North connections
        {from: {x: 0, z: 32}, to: {x: 15, z: 28}},
        {from: {x: 0, z: 32}, to: {x: -10, z: 28}},

        // East connections
        {from: {x: 32, z: 0}, to: {x: 28, z: 12}},
        {from: {x: 32, z: 0}, to: {x: 30, z: -8}},

        // South connections
        {from: {x: 0, z: -32}, to: {x: -5, z: -25}},
        {from: {x: 0, z: -32}, to: {x: 15, z: -20}},

        // West connections
        {from: {x: -32, z: 0}, to: {x: -28, z: 15}},
        {from: {x: -32, z: 0}, to: {x: -30, z: -15}}
    ];

    connections.forEach(conn => {
        createPath(
            centerX + conn.from.x, villageY, centerZ + conn.from.z,
            centerX + conn.to.x, villageY, centerZ + conn.to.z
        );
    });
}

function createPath(x1, y, z1, x2, y2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const steps = Math.max(Math.abs(dx), Math.abs(dz));

    if (steps === 0) return;

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = Math.floor(x1 + dx * t);
        const z = Math.floor(z1 + dz * t);

        // Place path blocks
        if (typeof setBlock === 'function') {
            setBlock(x, y, z, 'cobblestone');
            setBlock(x + 1, y, z, 'cobblestone');
            setBlock(x - 1, y, z, 'cobblestone');

            // Add occasional lanterns
            if (i % 15 === 0 && i > 0 && i < steps) {
                setBlock(x + 2, y + 1, z, 'planks');
                setBlock(x + 2, y + 2, z, 'lantern');
            }
        }
    }
}

function addVillageDecorations(centerX, villageY, centerZ) {
    // Trees around village perimeter
    const treePositions = [
        // Cardinal directions
        {x: 28, z: 28}, {x: -28, z: 28},
        {x: 28, z: -28}, {x: -28, z: -28},
        {x: 35, z: 0}, {x: -35, z: 0},
        {x: 0, z: 35}, {x: 0, z: -35},

        // Additional decorative trees
        {x: 24, z: 24}, {x: -24, z: 24},
        {x: 24, z: -24}, {x: -24, z: -24},
        {x: 30, z: 15}, {x: -30, z: 15},
        {x: 15, z: 30}, {x: -15, z: 30}
    ];

    treePositions.forEach(pos => {
        const tx = centerX + pos.x;
        const tz = centerZ + pos.z;

        // Tree trunk
        for (let dy = 0; dy < 5; dy++) {
            setBlock(tx, villageY + 1 + dy, tz, 'wood');
        }

        // Tree leaves (fuller canopy)
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                for (let dy = 0; dy <= 2; dy++) {
                    const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
                    if (dist <= 4) {
                        setBlock(tx + dx, villageY + 5 + dy, tz + dz, 'leaves');
                    }
                }
            }
        }
    });

    // Benches around fountain
    for (let angle = 0; angle < 360; angle += 90) {
        const rad = angle * Math.PI / 180;
        const bx = Math.floor(centerX + Math.cos(rad) * 6);
        const bz = Math.floor(centerZ + Math.sin(rad) * 6);

        setBlock(bx, villageY, bz, 'planks');
        setBlock(bx - 1, villageY, bz, 'planks');
        setBlock(bx + 1, villageY, bz, 'planks');
    }

    // Flower beds around central area
    const flowerSpots = [
        {x: 4, z: 4}, {x: -4, z: 4},
        {x: 4, z: -4}, {x: -4, z: -4}
    ];

    flowerSpots.forEach(spot => {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const fx = centerX + spot.x + dx;
                const fz = centerZ + spot.z + dz;

                if (Math.random() > 0.3) {
                    const flowers = ['mushroom_red', 'mushroom_brown', 'grass'];
                    setBlock(fx, villageY + 1, fz, flowers[Math.floor(Math.random() * flowers.length)]);
                }
            }
        }
    });

    // Village entrance signs
    const entrances = [
        {x: 0, z: 40, text: 'North Gate'},
        {x: 40, z: 0, text: 'East Gate'},
        {x: 0, z: -40, text: 'South Gate'},
        {x: -40, z: 0, text: 'West Gate'}
    ];

    entrances.forEach(entrance => {
        const ex = centerX + entrance.x;
        const ez = centerZ + entrance.z;

        // Sign post
        for (let dy = 0; dy < 3; dy++) {
            setBlock(ex, villageY + 1 + dy, ez, 'planks');
        }

        // Sign board
        for (let i = -1; i <= 1; i++) {
            if (Math.abs(entrance.x) > Math.abs(entrance.z)) {
                setBlock(ex, villageY + 3, ez + i, 'planks');
            } else {
                setBlock(ex + i, villageY + 3, ez, 'planks');
            }
        }

        // Lantern on top
        setBlock(ex, villageY + 4, ez, 'lantern');
    });

    // Random small decorations throughout village
    for (let i = 0; i < 20; i++) {
        const dx = Math.floor((Math.random() - 0.5) * 60);
        const dz = Math.floor((Math.random() - 0.5) * 60);

        // Avoid center area
        if (Math.abs(dx) < 10 && Math.abs(dz) < 10) continue;

        const decor = ['mushroom_red', 'mushroom_brown', 'grass', 'leaves'];
        setBlock(
            centerX + dx,
            villageY + 1,
            centerZ + dz,
            decor[Math.floor(Math.random() * decor.length)]
        );
    }

    console.log('Village decorations added');
}


// Update function for villagers
function updateVillagers() {
    if (typeof villagers !== 'undefined') {
        villagers.forEach(villager => {
            if (villager && villager.update) {
                try {
                    villager.update();
                } catch (error) {
                    console.error('Error updating villager:', error);
                }
            }
        });
    }
}

// Export functions for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Villager,
        generateVillage,
        updateVillagers,
        buildHouse,
        buildChurch,
        buildMarket,
        buildLibrary,
        buildTavern,
        buildBakery,
        buildBlacksmith,
        buildFarm,
        buildWindmill,
        buildWatchTower,
        buildWell,
        buildGarden,
        buildFountain
    };
}