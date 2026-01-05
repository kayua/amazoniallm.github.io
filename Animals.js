class Animal {
    constructor(type, x, y, z) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.z = z;
        this.health = animalTypes[type].health;
        this.targetX = x;
        this.targetZ = z;
        this.speed = animalTypes[type].speed;
        this.mesh = null;
        this.direction = new THREE.Vector3(0, 0, 1);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.boundingBox = null;

        // Animação avançada
        this.animationTime = 0;
        this.walkCycle = 0;
        this.headBob = 0;
        this.tailWag = 0;
        this.breathing = 0;
        this.earTwitch = 0;
        this.blinkTimer = 0;

        // Física
        this.verticalVelocity = 0;
        this.gravity = -0.025;
        this.jumpStrength = 0.3;
        this.onGround = true;

        // Comportamento inteligente
        this.state = 'idle';
        this.stateTimer = 0;
        this.alertness = 0;
        this.hunger = 0;
        this.energy = 100;
        this.fear = 0;

        // Memória e IA
        this.nearbyAnimals = [];
        this.visitedPositions = [];
        this.maxMemory = 10;

        this.createMesh();
    }

    createSmoothSphere(radius, color, widthSegments = 16, heightSegments = 12) {
        const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.8,
            metalness: 0.1
        });
        return new THREE.Mesh(geometry, material);
    }

    createSmoothCylinder(radiusTop, radiusBottom, height, color, segments = 12) {
        const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.75,
            metalness: 0.1
        });
        return new THREE.Mesh(geometry, material);
    }

    createRoundedBox(width, height, depth, color, radius = 0.1) {
        const shape = new THREE.Shape();
        const x = width / 2 - radius;
        const y = height / 2 - radius;

        shape.moveTo(-x, -y + radius);
        shape.lineTo(-x, y - radius);
        shape.quadraticCurveTo(-x, y, -x + radius, y);
        shape.lineTo(x - radius, y);
        shape.quadraticCurveTo(x, y, x, y - radius);
        shape.lineTo(x, -y + radius);
        shape.quadraticCurveTo(x, -y, x - radius, -y);
        shape.lineTo(-x + radius, -y);
        shape.quadraticCurveTo(-x, -y, -x, -y + radius);

        const extrudeSettings = {
            depth: depth,
            bevelEnabled: true,
            bevelThickness: radius,
            bevelSize: radius,
            bevelSegments: 3
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.center();

        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.8,
            metalness: 0.1
        });

        return new THREE.Mesh(geometry, material);
    }

    createCowMesh() {
        const group = new THREE.Group();

        // Materiais
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xF8F8F8, roughness: 0.85 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.75 });
        const pinkMat = new THREE.MeshStandardMaterial({ color: 0xFFB6C1, roughness: 0.6 });
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xC9A24D, roughness: 0.5 });

        // Corpo principal (esfera achatada)
        const body = this.createSmoothSphere(0.8, 0xF8F8F8, 20, 16);
        body.scale.set(1.0, 0.6, 0.7);
        body.position.set(0, 1.0, 0);
        body.material = whiteMat;
        group.add(body);

        // Barriga
        const belly = this.createSmoothSphere(0.5, 0xF8F8F8, 16, 12);
        belly.scale.set(0.9, 0.5, 0.8);
        belly.position.set(0, 0.7, 0);
        belly.material = whiteMat;
        group.add(belly);

        // Manchas (esferas achatadas)
        const addSpot = (x, y, z, scale) => {
            const spot = this.createSmoothSphere(0.2, 0x222222, 12, 8);
            spot.scale.set(scale[0], scale[1], 0.1);
            spot.position.set(x, y, z);
            spot.material = blackMat;
            group.add(spot);
        };

        addSpot(-0.3, 1.05, 0.56, [1.5, 1.2]);
        addSpot(0.25, 1.15, -0.56, [1.2, 1.0]);
        addSpot(-0.6, 1.0, 0.1, [1.3, 1.4]);

        // Úbere
        const udder = this.createSmoothSphere(0.22, 0xFFB6C1, 12, 10);
        udder.scale.set(1.0, 0.8, 0.9);
        udder.position.set(-0.4, 0.62, 0);
        udder.material = pinkMat;
        group.add(udder);

        // Tetos
        for (let i = 0; i < 4; i++) {
            const teat = this.createSmoothCylinder(0.03, 0.025, 0.1, 0xFFB6C1, 8);
            const x = i < 2 ? -0.35 : -0.45;
            const z = i % 2 === 0 ? 0.08 : -0.08;
            teat.position.set(x, 0.58, z);
            teat.material = pinkMat;
            group.add(teat);
        }

        // Pescoço
        const neck = this.createSmoothCylinder(0.25, 0.3, 0.3, 0xF8F8F8, 12);
        neck.position.set(0.65, 1.15, 0);
        neck.material = whiteMat;
        group.add(neck);

        // Cabeça
        const head = new THREE.Group();
        head.position.set(1.0, 1.35, 0);

        const skull = this.createSmoothSphere(0.28, 0xF8F8F8, 16, 12);
        skull.scale.set(1.0, 0.9, 0.95);
        skull.material = whiteMat;
        head.add(skull);

        // Focinho
        const snout = this.createSmoothSphere(0.18, 0xFFB6C1, 12, 10);
        snout.scale.set(1.2, 0.8, 1.0);
        snout.position.set(0.35, -0.08, 0);
        snout.material = pinkMat;
        head.add(snout);

        // Narinas
        const nostril1 = this.createSmoothSphere(0.03, 0x222222, 8, 6);
        nostril1.position.set(0.48, -0.08, 0.08);
        nostril1.material = blackMat;
        head.add(nostril1);

        const nostril2 = nostril1.clone();
        nostril2.position.z = -0.08;
        head.add(nostril2);

        // Olhos
        const eyeWhite1 = this.createSmoothSphere(0.05, 0xFFFFFF, 10, 8);
        eyeWhite1.position.set(0.15, 0.05, 0.23);
        head.add(eyeWhite1);

        const eyePupil1 = this.createSmoothSphere(0.03, 0x222222, 8, 6);
        eyePupil1.position.set(0.18, 0.05, 0.25);
        eyePupil1.material = blackMat;
        head.add(eyePupil1);

        const eyeWhite2 = eyeWhite1.clone();
        eyeWhite2.position.z = -0.23;
        head.add(eyeWhite2);

        const eyePupil2 = eyePupil1.clone();
        eyePupil2.position.z = -0.25;
        head.add(eyePupil2);

        // Orelhas
        const ear1 = this.createSmoothSphere(0.12, 0xF8F8F8, 12, 10);
        ear1.scale.set(1.5, 0.6, 2.0);
        ear1.position.set(-0.08, 0.1, 0.28);
        ear1.rotation.z = 0.3;
        ear1.material = whiteMat;
        ear1.userData.isEar = true;
        head.add(ear1);

        const ear2 = ear1.clone();
        ear2.position.z = -0.28;
        ear2.rotation.z = -0.3;
        ear2.userData.isEar = true;
        head.add(ear2);

        // Chifres
        const horn1 = this.createSmoothCylinder(0.04, 0.02, 0.25, 0xC9A24D, 10);
        horn1.position.set(-0.1, 0.28, 0.15);
        horn1.rotation.z = -0.4;
        horn1.material = hornMat;
        head.add(horn1);

        const horn2 = horn1.clone();
        horn2.position.z = -0.15;
        horn2.rotation.z = 0.4;
        head.add(horn2);

        head.userData.isHead = true;
        group.add(head);

        // Pernas
        const createLeg = (x, z) => {
            const leg = new THREE.Group();

            const upper = this.createSmoothCylinder(0.12, 0.11, 0.35, 0xF8F8F8, 12);
            upper.material = whiteMat;
            upper.position.y = 0.175;
            leg.add(upper);

            const joint = this.createSmoothSphere(0.1, 0xF8F8F8, 10, 8);
            joint.material = whiteMat;
            joint.position.y = 0;
            leg.add(joint);

            const lower = this.createSmoothCylinder(0.1, 0.09, 0.35, 0xF8F8F8, 12);
            lower.material = whiteMat;
            lower.position.y = -0.175;
            leg.add(lower);

            const hoof = this.createSmoothCylinder(0.11, 0.1, 0.12, 0x222222, 12);
            hoof.material = blackMat;
            hoof.position.y = -0.42;
            leg.add(hoof);

            leg.position.set(x, 0.75, z);
            leg.userData.isLeg = true;
            leg.userData.baseY = 0.75;
            return leg;
        };

        const frontLeft = createLeg(0.5, 0.35);
        const frontRight = createLeg(0.5, -0.35);
        const backLeft = createLeg(-0.5, 0.35);
        const backRight = createLeg(-0.5, -0.35);

        group.add(frontLeft);
        group.add(frontRight);
        group.add(backLeft);
        group.add(backRight);

        // Cauda
        const tail = this.createSmoothCylinder(0.04, 0.03, 0.5, 0xF8F8F8, 10);
        tail.material = whiteMat;
        tail.position.set(-0.8, 1.0, 0);
        tail.rotation.x = 0.3;
        tail.userData.isTail = true;
        group.add(tail);

        const tuft = this.createSmoothSphere(0.08, 0x222222, 12, 10);
        tuft.material = blackMat;
        tuft.position.set(-0.85, 0.7, 0);
        group.add(tuft);

        // Configurar sombras
        group.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });

        group.userData.isGeometric = true;
        group.userData.bodyParts = { body, head, legs: [frontLeft, frontRight, backLeft, backRight], tail };

        return group;
    }

    createPigMesh() {
        const group = new THREE.Group();

        const pinkMat = new THREE.MeshStandardMaterial({ color: 0xFFC0CB, roughness: 0.8 });
        const darkPinkMat = new THREE.MeshStandardMaterial({ color: 0xFF9AA2, roughness: 0.75 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });

        // Corpo redondo
        const body = this.createSmoothSphere(0.6, 0xFFC0CB, 20, 16);
        body.scale.set(1.0, 0.75, 0.9);
        body.position.set(0, 0.8, 0);
        body.material = pinkMat;
        group.add(body);

        // Barriga
        const belly = this.createSmoothSphere(0.45, 0xFFC0CB, 16, 12);
        belly.scale.set(0.85, 0.6, 0.8);
        belly.position.set(0, 0.58, 0);
        belly.material = pinkMat;
        group.add(belly);

        // Cabeça
        const head = new THREE.Group();
        head.position.set(0.7, 0.88, 0);

        const skull = this.createSmoothSphere(0.22, 0xFFC0CB, 16, 12);
        skull.scale.set(1.1, 1.0, 0.95);
        skull.material = pinkMat;
        head.add(skull);

        // Focinho característico
        const snout = this.createSmoothCylinder(0.11, 0.1, 0.15, 0xFF9AA2, 12);
        snout.rotation.z = Math.PI / 2;
        snout.position.set(0.3, -0.03, 0);
        snout.material = darkPinkMat;
        head.add(snout);

        // Narinas no focinho
        const nostril1 = this.createSmoothSphere(0.02, 0x222222, 8, 6);
        nostril1.position.set(0.38, -0.03, 0.05);
        nostril1.material = blackMat;
        head.add(nostril1);

        const nostril2 = nostril1.clone();
        nostril2.position.z = -0.05;
        head.add(nostril2);

        // Olhos pequenos
        const eye1 = this.createSmoothSphere(0.025, 0x222222, 8, 6);
        eye1.position.set(0.12, 0.08, 0.18);
        eye1.material = blackMat;
        head.add(eye1);

        const eye2 = eye1.clone();
        eye2.position.z = -0.18;
        head.add(eye2);

        // Orelhas pontudas
        const ear1 = this.createSmoothSphere(0.08, 0xFFC0CB, 12, 10);
        ear1.scale.set(1.2, 0.4, 1.5);
        ear1.position.set(-0.02, 0.22, 0.2);
        ear1.rotation.z = 0.5;
        ear1.material = pinkMat;
        ear1.userData.isEar = true;
        head.add(ear1);

        const ear2 = ear1.clone();
        ear2.position.z = -0.2;
        ear2.rotation.z = -0.5;
        ear2.userData.isEar = true;
        head.add(ear2);

        head.userData.isHead = true;
        group.add(head);

        // Pernas curtas
        const createLeg = (x, z) => {
            const leg = new THREE.Group();

            const upper = this.createSmoothCylinder(0.08, 0.075, 0.22, 0xFFC0CB, 12);
            upper.material = pinkMat;
            upper.position.y = 0.11;
            leg.add(upper);

            const hoof = this.createSmoothCylinder(0.08, 0.075, 0.1, 0x222222, 12);
            hoof.material = blackMat;
            hoof.position.y = -0.05;
            leg.add(hoof);

            leg.position.set(x, 0.45, z);
            leg.userData.isLeg = true;
            leg.userData.baseY = 0.45;
            return leg;
        };

        const frontLeft = createLeg(0.35, 0.25);
        const frontRight = createLeg(0.35, -0.25);
        const backLeft = createLeg(-0.35, 0.25);
        const backRight = createLeg(-0.35, -0.25);

        group.add(frontLeft);
        group.add(frontRight);
        group.add(backLeft);
        group.add(backRight);

        // Rabinho enrolado
        const tail = this.createSmoothCylinder(0.025, 0.02, 0.25, 0xFFC0CB, 10);
        tail.material = pinkMat;
        tail.position.set(-0.62, 0.92, 0);
        tail.rotation.x = 0.8;
        tail.userData.isTail = true;
        group.add(tail);

        // Configurar sombras
        group.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });

        group.userData.isGeometric = true;
        group.userData.bodyParts = { body, head, legs: [frontLeft, frontRight, backLeft, backRight], tail };

        return group;
    }

    createSheepMesh() {
        const group = new THREE.Group();

        const woolMat = new THREE.MeshStandardMaterial({
            color: 0xf2f2f2,
            roughness: 1.0
        });

        const faceMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.8
        });

        const blackMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.7
        });

        // Corpo
        const body = this.createSmoothSphere(0.6, 0xf2f2f2, 20, 16);
        body.scale.set(1.05, 0.85, 0.95);
        body.position.set(0, 0.85, 0);
        body.material = woolMat;
        group.add(body);

        // Barriga
        const belly = this.createSmoothSphere(0.48, 0xf2f2f2, 16, 12);
        belly.scale.set(0.9, 0.65, 0.85);
        belly.position.set(0, 0.62, 0);
        belly.material = woolMat;
        group.add(belly);

        // Cabeça
        const head = new THREE.Group();
        head.position.set(0.65, 0.88, 0);

        const skull = this.createSmoothSphere(0.2, 0x2a2a2a, 16, 12);
        skull.scale.set(1.05, 1.0, 0.95);
        skull.material = faceMat;
        head.add(skull);

        // Focinho
        const snout = this.createSmoothSphere(0.1, 0x2a2a2a, 12, 10);
        snout.scale.set(1.2, 0.7, 0.9);
        snout.position.set(0.18, -0.04, 0);
        snout.material = faceMat;
        head.add(snout);

        // Nariz
        const nose = this.createSmoothSphere(0.03, 0x111111, 8, 6);
        nose.position.set(0.26, -0.04, 0);
        nose.material = blackMat;
        head.add(nose);

        // Olhos
        const eye1 = this.createSmoothSphere(0.025, 0x111111, 8, 6);
        eye1.material = blackMat;
        eye1.position.set(0.1, 0.08, 0.16);
        head.add(eye1);

        const eye2 = this.createSmoothSphere(0.025, 0x111111, 8, 6);
        eye2.material = blackMat;
        eye2.position.set(0.1, 0.08, -0.16);
        head.add(eye2);

        // Orelhas
        const ear1 = this.createSmoothSphere(0.075, 0x2a2a2a, 12, 10);
        ear1.scale.set(0.5, 1.6, 1.2);
        ear1.position.set(-0.03, -0.02, 0.18);
        ear1.rotation.z = 0.25;
        ear1.material = faceMat;
        head.add(ear1);

        const ear2 = this.createSmoothSphere(0.075, 0x2a2a2a, 12, 10);
        ear2.scale.set(0.5, 1.6, 1.2);
        ear2.position.set(-0.03, -0.02, -0.18);
        ear2.rotation.z = -0.25;
        ear2.material = faceMat;
        head.add(ear2);

        group.add(head);

        // Pernas
        const createLeg = (x, z) => {
            const leg = new THREE.Group();

            const upper = this.createSmoothCylinder(0.055, 0.05, 0.28, 0x2a2a2a, 10);
            upper.material = faceMat;
            upper.position.y = 0.14;
            leg.add(upper);

            const hoof = this.createSmoothCylinder(0.055, 0.05, 0.1, 0x111111, 10);
            hoof.material = blackMat;
            hoof.position.y = -0.05;
            leg.add(hoof);

            leg.position.set(x, 0.45, z);
            group.add(leg);
        };

        createLeg(0.32, 0.23);
        createLeg(0.32, -0.23);
        createLeg(-0.32, 0.23);
        createLeg(-0.32, -0.23);

        // Rabo
        const tail = this.createSmoothSphere(0.06, 0xf2f2f2, 10, 8);
        tail.material = woolMat;
        tail.position.set(-0.62, 0.92, 0);
        group.add(tail);

        // Configurar sombras
        group.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });

        group.userData.isGeometric = true;
        group.userData.bodyParts = { body, head };

        return group;
    }
    createChickenMesh() {
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.85 });
        const beakMat = new THREE.MeshStandardMaterial({ color: 0xFFA500, roughness: 0.6 });
        const combMat = new THREE.MeshStandardMaterial({ color: 0xFF0000, roughness: 0.7 });

        // Corpo (ovo)
        const body = this.createSmoothSphere(0.35, 0xFFFFFF, 16, 14);
        body.scale.set(1.0, 1.2, 0.85);
        body.position.set(0, 0.42, 0);
        body.material = bodyMat;
        group.add(body);

        // Cabeça
        const head = new THREE.Group();
        head.position.set(0.42, 0.62, 0);

        const skull = this.createSmoothSphere(0.15, 0xFFFFFF, 12, 10);
        skull.material = bodyMat;
        head.add(skull);

        // Bico
        const beak = this.createSmoothCylinder(0.02, 0.04, 0.1, 0xFFA500, 8);
        beak.rotation.z = Math.PI / 2;
        beak.position.set(0.12, -0.02, 0);
        beak.material = beakMat;
        head.add(beak);

        // Crista
        const comb = this.createSmoothSphere(0.08, 0xFF0000, 10, 8);
        comb.scale.set(1.2, 0.6, 2.0);
        comb.position.set(0, 0.12, 0);
        comb.material = combMat;
        head.add(comb);

        // Barbela
        const wattle = this.createSmoothSphere(0.04, 0xFF0000, 8, 6);
        wattle.scale.set(1.0, 1.5, 1.0);
        wattle.position.set(0.08, -0.08, 0);
        wattle.material = combMat;
        head.add(wattle);

        // Olhos
        const eye1 = this.createSmoothSphere(0.02, 0x000000, 8, 6);
        eye1.position.set(0.08, 0.02, 0.08);
        head.add(eye1);

        const eye2 = eye1.clone();
        eye2.position.z = -0.08;
        head.add(eye2);

        head.userData.isHead = true;
        head.userData.baseY = 0.62;
        group.add(head);

        // Asas
        const wing1 = this.createSmoothSphere(0.15, 0xFFFFFF, 12, 10);
        wing1.scale.set(1.8, 0.6, 1.2);
        wing1.position.set(0.05, 0.42, 0.32);
        wing1.rotation.z = 0.3;
        wing1.material = bodyMat;
        wing1.userData.isWing = true;
        group.add(wing1);

        const wing2 = wing1.clone();
        wing2.position.z = -0.32;
        wing2.rotation.z = -0.3;
        wing2.userData.isWing = true;
        group.add(wing2);

        // Pernas
        const createLeg = (z) => {
            const leg = new THREE.Group();

            const thigh = this.createSmoothCylinder(0.03, 0.025, 0.15, 0xFFA500, 8);
            thigh.position.y = 0.075;
            thigh.material = beakMat;
            leg.add(thigh);

            const shin = this.createSmoothCylinder(0.025, 0.02, 0.12, 0xFFA500, 8);
            shin.position.y = -0.06;
            shin.material = beakMat;
            leg.add(shin);

            // Pé
            const foot1 = this.createSmoothCylinder(0.015, 0.01, 0.08, 0xFFA500, 6);
            foot1.rotation.x = Math.PI / 3;
            foot1.position.set(0.03, -0.12, 0);
            foot1.material = beakMat;
            leg.add(foot1);

            const foot2 = foot1.clone();
            foot2.position.x = -0.03;
            leg.add(foot2);

            const foot3 = foot1.clone();
            foot3.rotation.x = -Math.PI / 6;
            foot3.position.set(0, -0.12, -0.02);
            leg.add(foot3);

            leg.position.set(0, 0.15, z);
            leg.userData.isLeg = true;
            leg.userData.baseY = 0.15;
            return leg;
        };

        const legLeft = createLeg(0.08);
        const legRight = createLeg(-0.08);
        group.add(legLeft);
        group.add(legRight);

        // Rabo
        const tail = this.createSmoothSphere(0.12, 0xFFFFFF, 10, 8);
        tail.scale.set(0.5, 1.5, 1.2);
        tail.position.set(-0.35, 0.52, 0);
        tail.rotation.x = -0.4;
        tail.material = bodyMat;
        tail.userData.isTail = true;
        group.add(tail);

        // Configurar sombras
        group.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });

        group.userData.isGeometric = true;
        group.userData.bodyParts = { body, head, legs: [legLeft, legRight], wings: [wing1, wing2], tail };

        return group;
    }

    createHorseMesh() {
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.85 });
        const maneMat = new THREE.MeshStandardMaterial({ color: 0x3C2415, roughness: 0.9 });
        const hoofMat = new THREE.MeshStandardMaterial({ color: 0x1C1C1C, roughness: 0.7 });

        // Corpo elegante
        const body = this.createSmoothSphere(0.65, 0x8B4513, 20, 16);
        body.scale.set(1.4, 0.75, 0.9);
        body.position.set(0, 1.0, 0);
        body.material = bodyMat;
        group.add(body);

        // Peito
        const chest = this.createSmoothSphere(0.35, 0x8B4513, 14, 12);
        chest.scale.set(0.9, 1.0, 0.95);
        chest.position.set(0.7, 0.95, 0);
        chest.material = bodyMat;
        group.add(chest);

        // Pescoço longo e elegante
        const neck = this.createSmoothCylinder(0.18, 0.22, 0.75, 0x8B4513, 14);
        neck.position.set(0.75, 1.35, 0);
        neck.rotation.z = -0.35;
        neck.material = bodyMat;
        group.add(neck);

        // Cabeça
        const head = new THREE.Group();
        head.position.set(1.25, 1.65, 0);

        const skull = this.createSmoothSphere(0.2, 0x8B4513, 14, 12);
        skull.scale.set(1.3, 0.9, 0.85);
        skull.material = bodyMat;
        head.add(skull);

        // Focinho
        const snout = this.createSmoothSphere(0.12, 0x6B3410, 12, 10);
        snout.scale.set(1.2, 0.85, 0.9);
        snout.position.set(0.28, -0.08, 0);
        head.add(snout);

        // Narinas
        const nostril1 = this.createSmoothSphere(0.02, 0x000000, 8, 6);
        nostril1.position.set(0.38, -0.08, 0.06);
        head.add(nostril1);

        const nostril2 = nostril1.clone();
        nostril2.position.z = -0.06;
        head.add(nostril2);

        // Olhos
        const eye1 = this.createSmoothSphere(0.03, 0x000000, 10, 8);
        eye1.position.set(0.12, 0.05, 0.18);
        head.add(eye1);

        const eye2 = eye1.clone();
        eye2.position.z = -0.18;
        head.add(eye2);

        // Orelhas pontudas
        const ear1 = this.createSmoothCylinder(0.03, 0.04, 0.12, 0x8B4513, 10);
        ear1.position.set(0.0, 0.18, 0.09);
        ear1.rotation.z = 0.3;
        ear1.material = bodyMat;
        ear1.userData.isEar = true;
        head.add(ear1);

        const ear2 = ear1.clone();
        ear2.position.z = -0.09;
        ear2.rotation.z = -0.3;
        ear2.userData.isEar = true;
        head.add(ear2);

        head.userData.isHead = true;
        group.add(head);

        // Crina
        for (let i = 0; i < 5; i++) {
            const maneSegment = this.createSmoothSphere(0.08, 0x3C2415, 10, 8);
            maneSegment.scale.set(0.6, 1.2, 1.5);
            maneSegment.position.set(0.8 - i * 0.15, 1.55 - i * 0.1, 0);
            maneSegment.material = maneMat;
            group.add(maneSegment);
        }

        // Pernas longas e elegantes
        const createLeg = (x, z, isFront) => {
            const leg = new THREE.Group();

            const upper = this.createSmoothCylinder(0.09, 0.08, 0.45, 0x8B4513, 12);
            upper.material = bodyMat;
            upper.position.y = 0.225;
            leg.add(upper);

            const knee = this.createSmoothSphere(0.08, 0x8B4513, 10, 8);
            knee.material = bodyMat;
            knee.position.y = 0;
            leg.add(knee);

            const lower = this.createSmoothCylinder(0.07, 0.06, 0.4, 0x8B4513, 12);
            lower.material = bodyMat;
            lower.position.y = -0.2;
            leg.add(lower);

            const hoof = this.createSmoothCylinder(0.07, 0.065, 0.1, 0x1C1C1C, 12);
            hoof.material = hoofMat;
            hoof.position.y = -0.45;
            leg.add(hoof);

            leg.position.set(x, 0.55, z);
            leg.userData.isLeg = true;
            leg.userData.baseY = 0.55;
            leg.userData.isFront = isFront;
            return leg;
        };

        const frontLeft = createLeg(0.6, 0.28, true);
        const frontRight = createLeg(0.6, -0.28, true);
        const backLeft = createLeg(-0.6, 0.28, false);
        const backRight = createLeg(-0.6, -0.28, false);

        group.add(frontLeft);
        group.add(frontRight);
        group.add(backLeft);
        group.add(backRight);

        // Cauda longa
        const tail = this.createSmoothCylinder(0.04, 0.02, 0.85, 0x3C2415, 12);
        tail.material = maneMat;
        tail.position.set(-0.9, 1.05, 0);
        tail.rotation.x = 0.25;
        tail.userData.isTail = true;
        group.add(tail);

        // Configurar sombras
        group.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });

        group.userData.isGeometric = true;
        group.userData.bodyParts = {
            body,
            head,
            neck,
            legs: [frontLeft, frontRight, backLeft, backRight],
            tail
        };

        return group;
    }

    createRabbitMesh() {
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.9 });
        const innerMat = new THREE.MeshStandardMaterial({ color: 0xFFB6C1, roughness: 0.8 });
        const noseMat = new THREE.MeshStandardMaterial({ color: 0xFF1493, roughness: 0.7 });

        // Corpo fofo
        const body = this.createSmoothSphere(0.4, 0xD2B48C, 18, 14);
        body.scale.set(1.1, 0.95, 1.0);
        body.position.set(0, 0.45, 0);
        body.material = bodyMat;
        group.add(body);

        // Cabeça
        const head = new THREE.Group();
        head.position.set(0.52, 0.62, 0);

        const skull = this.createSmoothSphere(0.18, 0xD2B48C, 14, 12);
        skull.scale.set(1.1, 1.0, 0.95);
        skull.material = bodyMat;
        head.add(skull);

        // Orelhas longas
        const ear1 = this.createSmoothSphere(0.06, 0xD2B48C, 12, 10);
        ear1.scale.set(0.8, 3.5, 1.2);
        ear1.position.set(-0.02, 0.35, 0.12);
        ear1.rotation.z = 0.15;
        ear1.material = bodyMat;
        ear1.userData.isEar = true;
        head.add(ear1);

        const earInner1 = this.createSmoothSphere(0.04, 0xFFB6C1, 10, 8);
        earInner1.scale.set(0.7, 3.0, 1.0);
        earInner1.position.set(-0.01, 0.35, 0.125);
        earInner1.rotation.z = 0.15;
        earInner1.material = innerMat;
        head.add(earInner1);

        const ear2 = ear1.clone();
        ear2.position.z = -0.12;
        ear2.rotation.z = -0.15;
        ear2.userData.isEar = true;
        head.add(ear2);

        const earInner2 = earInner1.clone();
        earInner2.position.z = -0.125;
        earInner2.rotation.z = -0.15;
        head.add(earInner2);

        // Olhos grandes
        const eye1 = this.createSmoothSphere(0.035, 0x000000, 10, 8);
        eye1.position.set(0.12, 0.05, 0.12);
        head.add(eye1);

        const eye2 = eye1.clone();
        eye2.position.z = -0.12;
        head.add(eye2);

        // Nariz rosa
        const nose = this.createSmoothSphere(0.025, 0xFF1493, 10, 8);
        nose.scale.set(1.2, 0.8, 1.0);
        nose.position.set(0.2, -0.02, 0);
        nose.material = noseMat;
        head.add(nose);

        // Bigodes
        for (let side = 0; side < 2; side++) {
            for (let i = 0; i < 3; i++) {
                const whisker = this.createSmoothCylinder(0.003, 0.003, 0.15, 0xFFFFFF, 6);
                whisker.rotation.z = (side === 0 ? 1 : -1) * (Math.PI / 6 + i * 0.1);
                whisker.position.set(0.18, -0.01 + i * 0.015, (side === 0 ? 0.06 : -0.06));
                head.add(whisker);
            }
        }

        head.userData.isHead = true;
        head.userData.baseY = 0.62;
        group.add(head);

        // Pernas traseiras poderosas
        const createBackLeg = (z) => {
            const leg = new THREE.Group();

            const thigh = this.createSmoothSphere(0.1, 0xD2B48C, 12, 10);
            thigh.scale.set(1.2, 0.8, 1.1);
            thigh.position.y = 0.08;
            thigh.material = bodyMat;
            leg.add(thigh);

            const shin = this.createSmoothCylinder(0.06, 0.05, 0.15, 0xD2B48C, 10);
            shin.position.y = -0.05;
            shin.rotation.x = 0.3;
            shin.material = bodyMat;
            leg.add(shin);

            const foot = this.createSmoothSphere(0.08, 0xD2B48C, 10, 8);
            foot.scale.set(1.5, 0.6, 1.0);
            foot.position.set(0.04, -0.12, 0.02);
            foot.material = bodyMat;
            leg.add(foot);

            leg.position.set(-0.25, 0.18, z);
            leg.userData.isLeg = true;
            leg.userData.isBack = true;
            leg.userData.baseY = 0.18;
            return leg;
        };

        // Pernas dianteiras pequenas
        const createFrontLeg = (z) => {
            const leg = new THREE.Group();

            const upper = this.createSmoothCylinder(0.04, 0.035, 0.15, 0xD2B48C, 10);
            upper.material = bodyMat;
            upper.position.y = 0.075;
            leg.add(upper);

            const paw = this.createSmoothSphere(0.04, 0xD2B48C, 10, 8);
            paw.scale.set(1.0, 0.7, 1.0);
            paw.material = bodyMat;
            paw.position.y = 0;
            leg.add(paw);

            leg.position.set(0.32, 0.15, z);
            leg.userData.isLeg = true;
            leg.userData.isBack = false;
            leg.userData.baseY = 0.15;
            return leg;
        };

        const backLeft = createBackLeg(0.18);
        const backRight = createBackLeg(-0.18);
        const frontLeft = createFrontLeg(0.15);
        const frontRight = createFrontLeg(-0.15);

        group.add(backLeft);
        group.add(backRight);
        group.add(frontLeft);
        group.add(frontRight);

        // Rabinho fofo
        const tail = this.createSmoothSphere(0.08, 0xFFFFFF, 12, 10);
        tail.position.set(-0.45, 0.52, 0);
        tail.userData.isTail = true;
        group.add(tail);

        // Configurar sombras
        group.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });

        group.userData.isGeometric = true;
        group.userData.bodyParts = {
            body,
            head,
            legs: [frontLeft, frontRight, backLeft, backRight],
            tail
        };

        return group;
    }

    createWolfMesh() {
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.85 });
        const underMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.9 });

        // Corpo musculoso
        const body = this.createSmoothSphere(0.55, 0x808080, 18, 14);
        body.scale.set(1.3, 0.8, 0.95);
        body.position.set(0, 0.75, 0);
        body.material = bodyMat;
        group.add(body);

        // Peito claro
        const chest = this.createSmoothSphere(0.28, 0xC0C0C0, 14, 12);
        chest.scale.set(1.1, 0.9, 0.9);
        chest.position.set(0.45, 0.68, 0);
        chest.material = underMat;
        group.add(chest);

        // Cabeça agressiva
        const head = new THREE.Group();
        head.position.set(0.88, 0.9, 0);

        const skull = this.createSmoothSphere(0.22, 0x808080, 14, 12);
        skull.scale.set(1.2, 0.95, 0.9);
        skull.material = bodyMat;
        head.add(skull);

        // Focinho alongado
        const snout = this.createSmoothCylinder(0.1, 0.08, 0.22, 0x606060, 12);
        snout.rotation.z = Math.PI / 2;
        snout.position.set(0.28, -0.05, 0);
        head.add(snout);

        // Nariz preto
        const nose = this.createSmoothSphere(0.03, 0x000000, 10, 8);
        nose.position.set(0.42, -0.05, 0);
        head.add(nose);

        // Olhos predadores
        const eye1 = this.createSmoothSphere(0.025, 0xFFFF00, 10, 8);
        eye1.position.set(0.15, 0.08, 0.15);
        head.add(eye1);

        const pupil1 = this.createSmoothSphere(0.015, 0x000000, 8, 6);
        pupil1.position.set(0.17, 0.08, 0.16);
        head.add(pupil1);

        const eye2 = eye1.clone();
        eye2.position.z = -0.15;
        head.add(eye2);

        const pupil2 = pupil1.clone();
        pupil2.position.z = -0.16;
        head.add(pupil2);

        // Orelhas pontudas
        const ear1 = this.createSmoothCylinder(0.04, 0.05, 0.15, 0x808080, 10);
        ear1.position.set(0.05, 0.22, 0.12);
        ear1.rotation.z = 0.3;
        ear1.material = bodyMat;
        ear1.userData.isEar = true;
        head.add(ear1);

        const ear2 = ear1.clone();
        ear2.position.z = -0.12;
        ear2.rotation.z = -0.3;
        ear2.userData.isEar = true;
        head.add(ear2);

        // Dentes
        for (let i = 0; i < 4; i++) {
            const tooth = this.createSmoothCylinder(0.015, 0.01, 0.06, 0xFFFFFF, 6);
            tooth.position.set(0.32 + i * 0.03, -0.12, (i % 2 === 0 ? 0.04 : -0.04));
            head.add(tooth);
        }

        head.userData.isHead = true;
        group.add(head);

        // Pernas ágeis
        const createLeg = (x, z, isFront) => {
            const leg = new THREE.Group();

            const upper = this.createSmoothCylinder(0.08, 0.07, 0.35, 0x808080, 12);
            upper.material = bodyMat;
            upper.position.y = 0.175;
            leg.add(upper);

            const joint = this.createSmoothSphere(0.065, 0x808080, 10, 8);
            joint.material = bodyMat;
            joint.position.y = 0;
            leg.add(joint);

            const lower = this.createSmoothCylinder(0.06, 0.05, 0.3, 0x808080, 12);
            lower.material = bodyMat;
            lower.position.y = -0.15;
            leg.add(lower);

            const paw = this.createSmoothSphere(0.06, 0x404040, 10, 8);
            paw.scale.set(1.2, 0.8, 1.1);
            paw.position.y = -0.32;
            leg.add(paw);

            leg.position.set(x, 0.4, z);
            leg.userData.isLeg = true;
            leg.userData.baseY = 0.4;
            leg.userData.isFront = isFront;
            return leg;
        };

        const frontLeft = createLeg(0.5, 0.28, true);
        const frontRight = createLeg(0.5, -0.28, true);
        const backLeft = createLeg(-0.5, 0.28, false);
        const backRight = createLeg(-0.5, -0.28, false);

        group.add(frontLeft);
        group.add(frontRight);
        group.add(backLeft);
        group.add(backRight);

        // Cauda peluda
        const tail = this.createSmoothCylinder(0.06, 0.03, 0.75, 0x808080, 12);
        tail.material = bodyMat;
        tail.position.set(-0.85, 0.82, 0);
        tail.rotation.x = 0.25;
        tail.userData.isTail = true;
        group.add(tail);

        // Configurar sombras
        group.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });

        group.userData.isGeometric = true;
        group.userData.bodyParts = { body, head, legs: [frontLeft, frontRight, backLeft, backRight], tail };

        return group;
    }

    createCatMesh() {
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xFF8C00, roughness: 0.85 });
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xCD5C5C, roughness: 0.8 });

        // Corpo esguio
        const body = this.createSmoothSphere(0.38, 0xFF8C00, 18, 14);
        body.scale.set(1.35, 0.8, 0.85);
        body.position.set(0, 0.52, 0);
        body.material = bodyMat;
        group.add(body);

        // Listras
        for (let i = 0; i < 6; i++) {
            const stripe = this.createSmoothSphere(0.1, 0xCD5C5C, 10, 8);
            stripe.scale.set(0.4, 0.08, 1.2);
            stripe.position.set(-0.35 + i * 0.15, 0.56, 0);
            stripe.material = stripeMat;
            group.add(stripe);
        }

        // Cabeça
        const head = new THREE.Group();
        head.position.set(0.62, 0.68, 0);

        const skull = this.createSmoothSphere(0.16, 0xFF8C00, 14, 12);
        skull.scale.set(1.1, 1.0, 1.05);
        skull.material = bodyMat;
        head.add(skull);

        // Focinho
        const snout = this.createSmoothSphere(0.08, 0xFFFFFF, 10, 8);
        snout.scale.set(1.0, 0.7, 1.1);
        snout.position.set(0.18, -0.05, 0);
        head.add(snout);

        // Nariz
        const nose = this.createSmoothSphere(0.02, 0xFF69B4, 8, 6);
        nose.position.set(0.24, -0.03, 0);
        head.add(nose);

        // Olhos de gato
        const eye1 = this.createSmoothSphere(0.03, 0x00FF00, 10, 8);
        eye1.scale.set(1.0, 1.3, 0.8);
        eye1.position.set(0.12, 0.05, 0.13);
        head.add(eye1);

        const pupil1 = this.createSmoothSphere(0.012, 0x000000, 8, 10);
        pupil1.scale.set(1.0, 2.0, 1.0);
        pupil1.position.set(0.14, 0.05, 0.14);
        head.add(pupil1);

        const eye2 = eye1.clone();
        eye2.position.z = -0.13;
        head.add(eye2);

        const pupil2 = pupil1.clone();
        pupil2.position.z = -0.14;
        head.add(pupil2);

        // Orelhas triangulares
        const ear1 = this.createSmoothCylinder(0.04, 0.06, 0.12, 0xFF8C00, 8);
        ear1.position.set(0.02, 0.2, 0.12);
        ear1.rotation.z = 0.25;
        ear1.material = bodyMat;
        ear1.userData.isEar = true;
        head.add(ear1);

        const ear2 = ear1.clone();
        ear2.position.z = -0.12;
        ear2.rotation.z = -0.25;
        ear2.userData.isEar = true;
        head.add(ear2);

        // Bigodes
        for (let side = 0; side < 2; side++) {
            for (let i = 0; i < 3; i++) {
                const whisker = this.createSmoothCylinder(0.002, 0.002, 0.14, 0xFFFFFF, 6);
                whisker.rotation.z = (side === 0 ? 1 : -1) * (Math.PI / 8 + i * 0.08);
                whisker.position.set(0.2, 0.0 + i * 0.015, (side === 0 ? 0.08 : -0.08));
                head.add(whisker);
            }
        }

        head.userData.isHead = true;
        head.userData.baseY = 0.68;
        group.add(head);

        // Pernas ágeis
        const createLeg = (x, z) => {
            const leg = new THREE.Group();

            const upper = this.createSmoothCylinder(0.04, 0.035, 0.18, 0xFF8C00, 10);
            upper.material = bodyMat;
            upper.position.y = 0.09;
            leg.add(upper);

            const paw = this.createSmoothSphere(0.04, 0xFF8C00, 10, 8);
            paw.scale.set(1.0, 0.7, 1.0);
            paw.material = bodyMat;
            paw.position.y = 0;
            leg.add(paw);

            leg.position.set(x, 0.18, z);
            leg.userData.isLeg = true;
            leg.userData.baseY = 0.18;
            return leg;
        };

        const frontLeft = createLeg(0.32, 0.18);
        const frontRight = createLeg(0.32, -0.18);
        const backLeft = createLeg(-0.32, 0.18);
        const backRight = createLeg(-0.32, -0.18);

        group.add(frontLeft);
        group.add(frontRight);
        group.add(backLeft);
        group.add(backRight);

        // Cauda longa e flexível
        const tail = this.createSmoothCylinder(0.04, 0.02, 0.7, 0xFF8C00, 12);
        tail.material = bodyMat;
        tail.position.set(-0.7, 0.62, 0);
        tail.rotation.x = 0.2;
        tail.userData.isTail = true;
        group.add(tail);

        // Configurar sombras
        group.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });

        group.userData.isGeometric = true;
        group.userData.bodyParts = { body, head, legs: [frontLeft, frontRight, backLeft, backRight], tail };

        return group;
    }

    createRaccoonMesh() {
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x505050, roughness: 0.85 });
        const maskMat = new THREE.MeshStandardMaterial({ color: 0x1C1C1C, roughness: 0.8 });

        // Corpo
        const body = this.createSmoothSphere(0.45, 0x505050, 18, 14);
        body.scale.set(1.15, 0.85, 1.0);
        body.position.set(0, 0.58, 0);
        body.material = bodyMat;
        group.add(body);

        // Cabeça
        const head = new THREE.Group();
        head.position.set(0.68, 0.75, 0);

        const skull = this.createSmoothSphere(0.18, 0x505050, 14, 12);
        skull.scale.set(1.15, 1.0, 1.05);
        skull.material = bodyMat;
        head.add(skull);

        // Máscara característica
        const mask = this.createSmoothSphere(0.15, 0x1C1C1C, 12, 10);
        mask.scale.set(1.3, 0.8, 1.15);
        mask.position.set(0.12, 0.0, 0);
        mask.material = maskMat;
        head.add(mask);

        // Áreas brancas ao redor dos olhos
        const eyePatch1 = this.createSmoothSphere(0.05, 0xFFFFFF, 10, 8);
        eyePatch1.scale.set(1.2, 1.0, 1.0);
        eyePatch1.position.set(0.1, 0.03, 0.12);
        head.add(eyePatch1);

        const eyePatch2 = eyePatch1.clone();
        eyePatch2.position.z = -0.12;
        head.add(eyePatch2);

        // Olhos
        const eye1 = this.createSmoothSphere(0.02, 0x000000, 8, 6);
        eye1.position.set(0.12, 0.03, 0.12);
        head.add(eye1);

        const eye2 = eye1.clone();
        eye2.position.z = -0.12;
        head.add(eye2);

        // Focinho
        const snout = this.createSmoothSphere(0.08, 0x808080, 10, 8);
        snout.scale.set(1.1, 0.8, 0.9);
        snout.position.set(0.22, -0.08, 0);
        head.add(snout);

        // Nariz
        const nose = this.createSmoothSphere(0.02, 0x000000, 8, 6);
        nose.position.set(0.3, -0.08, 0);
        head.add(nose);

        // Orelhas arredondadas
        const ear1 = this.createSmoothSphere(0.06, 0x505050, 12, 10);
        ear1.scale.set(1.0, 0.6, 1.2);
        ear1.position.set(0.0, 0.18, 0.15);
        ear1.material = bodyMat;
        ear1.userData.isEar = true;
        head.add(ear1);

        const ear2 = ear1.clone();
        ear2.position.z = -0.15;
        ear2.userData.isEar = true;
        head.add(ear2);

        head.userData.isHead = true;
        group.add(head);

        // Pernas
        const createLeg = (x, z) => {
            const leg = new THREE.Group();

            const upper = this.createSmoothCylinder(0.05, 0.045, 0.22, 0x505050, 10);
            upper.material = bodyMat;
            upper.position.y = 0.11;
            leg.add(upper);

            const paw = this.createSmoothSphere(0.05, 0x303030, 10, 8);
            paw.scale.set(1.1, 0.7, 1.0);
            paw.position.y = 0;
            leg.add(paw);

            leg.position.set(x, 0.22, z);
            leg.userData.isLeg = true;
            leg.userData.baseY = 0.22;
            return leg;
        };

        const frontLeft = createLeg(0.38, 0.22);
        const frontRight = createLeg(0.38, -0.22);
        const backLeft = createLeg(-0.38, 0.22);
        const backRight = createLeg(-0.38, -0.22);

        group.add(frontLeft);
        group.add(frontRight);
        group.add(backLeft);
        group.add(backRight);

        // Cauda anelada
        const tailSegments = 6;
        for (let i = 0; i < tailSegments; i++) {
            const isBlack = i % 2 === 0;
            const segment = this.createSmoothCylinder(0.05 - i * 0.005, 0.045 - i * 0.005, 0.12, isBlack ? 0x1C1C1C : 0x808080, 10);
            segment.position.set(-0.7 - i * 0.11, 0.65 - i * 0.02, 0);
            segment.rotation.x = 0.15 + i * 0.05;
            if (i === 0) segment.userData.isTail = true;
            group.add(segment);
        }

        // Configurar sombras
        group.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });

        group.userData.isGeometric = true;
        group.userData.bodyParts = { body, head, legs: [frontLeft, frontRight, backLeft, backRight] };

        return group;
    }

    createMesh() {
        const meshCreators = {
            'cow': () => this.createCowMesh(),
            'pig': () => this.createPigMesh(),
            'sheep': () => this.createSheepMesh(),
            'chicken': () => this.createChickenMesh(),
            'horse': () => this.createHorseMesh(),
            'rabbit': () => this.createRabbitMesh(),
            'wolf': () => this.createWolfMesh(),
            'cat': () => this.createCatMesh(),
            'raccoon': () => this.createRaccoonMesh()
        };

        this.mesh = meshCreators[this.type] ? meshCreators[this.type]() : this.createDefaultMesh();
        this.mesh.position.set(this.x, this.y, this.z);

        scene.add(this.mesh);
        animalMeshes.push(this.mesh);
        this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
    }

    updatePhysics() {
        if (!this.onGround) {
            this.verticalVelocity += this.gravity;
            this.y += this.verticalVelocity;

            if (this.y <= getHeight(this.x, this.z) + 0.5) {
                this.y = getHeight(this.x, this.z) + 0.5;
                this.verticalVelocity = 0;
                this.onGround = true;
            }
        }
    }

    animateAdvanced() {
        if (!this.mesh || !this.mesh.userData.isGeometric) return;

        this.animationTime += 0.016; // ~60fps
        const bodyParts = this.mesh.userData.bodyParts;

        // Respiração sutil

        const isMoving = this.state === 'wandering' || this.state === 'fleeing';
        const speedMult = this.state === 'fleeing' ? 2.5 : 1.0;

        // Animação de caminhada
        if (isMoving && bodyParts.legs) {
            this.walkCycle += 0.15 * speedMult;

            bodyParts.legs.forEach((leg, index) => {
                if (!leg.userData.isLeg) return;

                const phase = (index % 2 === 0) ? this.walkCycle : this.walkCycle + Math.PI;
                const swing = Math.sin(phase) * 0.4;

                // Rotação da perna
                leg.rotation.x = swing;

                // Movimento vertical (levantando a perna)
                const lift = Math.max(0, Math.sin(phase)) * 0.08;
                leg.position.y = leg.userData.baseY + lift;
            });

            // Balanço do corpo
            if (bodyParts.body) {
                bodyParts.body.position.y += Math.sin(this.walkCycle * 2) * 0.01;
                bodyParts.body.rotation.z = Math.sin(this.walkCycle) * 0.03;
            }
        } else {
            // Retornar suavemente à posição original
            if (bodyParts.legs) {
                bodyParts.legs.forEach(leg => {
                    leg.rotation.x *= 0.9;
                    if (leg.userData.baseY) {
                        leg.position.y += (leg.userData.baseY - leg.position.y) * 0.1;
                    }
                });
            }
            if (bodyParts.body) {
                bodyParts.body.rotation.z *= 0.9;
            }
        }

        // Animação de cabeça
        if (bodyParts.head) {
            if (isMoving) {
                // Balanço da cabeça ao andar
                this.headBob = Math.sin(this.walkCycle * 2) * 0.02;
                bodyParts.head.position.y += this.headBob;
                bodyParts.head.rotation.y = Math.sin(this.walkCycle * 0.5) * 0.05;
            } else if (this.state === 'idle') {
                // Olhar ao redor quando parado
                const lookAround = Math.sin(this.animationTime * 0.5) * 0.3;
                bodyParts.head.rotation.y = lookAround;

                // Movimento sutil de cabeça
                bodyParts.head.rotation.x = Math.sin(this.animationTime * 0.8) * 0.05;
            }

            // Piscar
            this.blinkTimer += 0.016;
            if (this.blinkTimer > 3 + Math.random() * 2) {
                this.blinkTimer = 0;
                bodyParts.head.traverse(child => {
                    if (child.isMesh && child.geometry.parameters && child.geometry.parameters.radius < 0.04) {
                        child.scale.y = 0.1;
                        setTimeout(() => { child.scale.y = 1; }, 100);
                    }
                });
            }
        }

        // Animação de orelhas
        if (bodyParts.head) {
            this.earTwitch += 0.016;
            bodyParts.head.traverse(child => {
                if (child.userData.isEar) {
                    const twitch = Math.sin(this.earTwitch * 8 + Math.random()) * 0.1;
                    child.rotation.x = twitch;
                }
            });
        }

        // Animação de cauda
        if (bodyParts.tail) {
            switch(this.type) {
                case 'cow':
                case 'horse':
                    // Balançar para espantar moscas
                    this.tailWag += 0.1;
                    bodyParts.tail.rotation.z = Math.sin(this.tailWag) * 0.4;
                    bodyParts.tail.rotation.x = Math.sin(this.tailWag * 0.5) * 0.2;
                    break;

                case 'cat':
                    if (this.state === 'idle') {
                        // Movimento lento e ondulante
                        this.tailWag += 0.05;
                        bodyParts.tail.rotation.y = Math.sin(this.tailWag) * 0.5;
                        bodyParts.tail.rotation.z = Math.sin(this.tailWag * 0.7) * 0.3;
                    } else if (isMoving) {
                        // Cauda levantada ao caminhar
                        bodyParts.tail.rotation.x = -0.5 + Math.sin(this.walkCycle) * 0.2;
                    }
                    break;

                case 'wolf':
                    if (this.state === 'fleeing' || this.state === 'wandering') {
                        // Cauda para cima quando em movimento
                        bodyParts.tail.rotation.x = -0.3;
                    } else {
                        // Cauda baixa quando parado
                        bodyParts.tail.rotation.x = 0.5;
                    }
                    break;

                case 'pig':
                    // Rabinho enrolado balançando
                    this.tailWag += 0.15;
                    bodyParts.tail.rotation.y = Math.sin(this.tailWag) * 0.5;
                    break;

                case 'rabbit':
                    // Rabinho fofo tremendo
                    bodyParts.tail.scale.set(
                        1 + Math.sin(this.animationTime * 10) * 0.1,
                        1 + Math.sin(this.animationTime * 10) * 0.1,
                        1 + Math.sin(this.animationTime * 10) * 0.1
                    );
                    break;

                case 'chicken':
                    // Rabo balançando para cima e para baixo
                    bodyParts.tail.rotation.x = -0.4 + Math.sin(this.walkCycle * 2) * 0.2;
                    break;
            }
        }

        // Animações específicas por tipo
        switch(this.type) {
            case 'chicken':
                if (bodyParts.wings) {
                    // Asas batendo ocasionalmente
                    const flapIntensity = isMoving ? 0.2 : (Math.random() < 0.01 ? 1.0 : 0);
                    bodyParts.wings.forEach((wing, index) => {
                        const side = index === 0 ? 1 : -1;
                        wing.rotation.y = side * (0.3 + Math.sin(this.animationTime * 15) * 0.1 * flapIntensity);
                    });
                }
                // Cabeça bicando
                if (!isMoving && Math.random() < 0.02 && bodyParts.head) {
                    bodyParts.head.rotation.x = -0.8;
                    setTimeout(() => {
                        if (bodyParts.head) bodyParts.head.rotation.x = 0;
                    }, 300);
                }
                break;

            case 'rabbit':
                // Pular ocasionalmente
                if (isMoving && Math.sin(this.walkCycle) > 0.9) {
                    this.mesh.position.y += 0.15;
                }

                break;
        }
    }

    updateBehavior() {
        this.stateTimer++;
        this.detectNearbyAnimals();

        this.hunger = Math.min(100, this.hunger + 0.05);
        this.energy = Math.max(0, this.energy - (this.state === 'fleeing' ? 0.3 : 0.05));
        this.fear = Math.max(0, this.fear - 0.1);

        switch(this.state) {
            case 'idle':
                this.behaviorIdle();
                break;
            case 'wandering':
                this.behaviorWander();
                break;
            case 'grazing':
                this.behaviorGraze();
                break;
            case 'fleeing':
                this.behaviorFlee();
                break;
            case 'socializing':
                this.behaviorSocialize();
                break;
        }

        this.checkStateTransitions();
    }

    detectNearbyAnimals() {
        this.nearbyAnimals = [];
        if (typeof animals !== 'undefined') {
            animals.forEach(other => {
                if (other !== this) {
                    const dx = other.x - this.x;
                    const dz = other.z - this.z;
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    if (distance < 15) {
                        this.nearbyAnimals.push({ animal: other, distance: distance, dx: dx, dz: dz });
                    }
                }
            });
        }
    }

    behaviorIdle() {
        if (this.stateTimer > 60 + Math.random() * 120) {
            this.setState(Math.random() < 0.7 ? 'wandering' : 'grazing');
        }
    }

    behaviorWander() {
        if (!this.hasTarget() || this.stateTimer > 100) {
            this.setRandomTarget(8);
            this.stateTimer = 0;
        }
        this.moveToTarget();
        if (this.reachedTarget()) {
            this.visitedPositions.push({x: this.targetX, z: this.targetZ});
            if (this.visitedPositions.length > this.maxMemory) {
                this.visitedPositions.shift();
            }
            this.setState(Math.random() < 0.4 ? 'idle' : 'grazing');
        }
    }

    behaviorGraze() {
        if (this.stateTimer > 80 + Math.random() * 100) {
            this.hunger = Math.max(0, this.hunger - 30);
            this.energy = Math.min(100, this.energy + 10);
            this.setState('idle');
        }
    }

    behaviorFlee() {
        const threat = this.findNearestThreat();
        if (threat) {
            const fleeX = this.x - threat.dx * 2;
            const fleeZ = this.z - threat.dz * 2;
            this.setTarget(fleeX, fleeZ);
            this.moveToTarget(1.8);
        } else {
            this.setState('idle');
        }
        if (this.stateTimer > 100 || this.fear < 20) {
            this.setState('idle');
        }
    }

    behaviorSocialize() {
        const sameSpecies = this.nearbyAnimals.filter(n => n.animal.type === this.type);
        if (sameSpecies.length > 0) {
            const nearest = sameSpecies[0];
            if (nearest.distance > 2) {
                this.setTarget(nearest.animal.x, nearest.animal.z);
                this.moveToTarget(0.7);
            }
        }
        if (this.stateTimer > 150) {
            this.setState('idle');
        }
    }

    checkStateTransitions() {
        const predators = this.nearbyAnimals.filter(n => (n.animal.type === 'wolf' || n.animal.type === 'cat') && n.distance < 8);
        if (predators.length > 0 && this.state !== 'fleeing') {
            this.fear = 100;
            this.setState('fleeing');
            return;
        }

        if (['cow', 'sheep', 'pig'].includes(this.type)) {
            const sameSpecies = this.nearbyAnimals.filter(n => n.animal.type === this.type && n.distance < 5);
            if (sameSpecies.length > 0 && Math.random() < 0.01 && this.state === 'idle') {
                this.setState('socializing');
                return;
            }
        }

        if (this.hunger > 70 && this.state === 'idle' && Math.random() < 0.02) {
            this.setState('grazing');
        }

        if (this.energy < 30 && this.state !== 'idle') {
            this.setState('idle');
        }
    }

    setState(newState) {
        this.state = newState;
        this.stateTimer = 0;
    }

    setRandomTarget(radius) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius + 2;
        this.targetX = this.x + Math.cos(angle) * distance;
        this.targetZ = this.z + Math.sin(angle) * distance;
    }

    setTarget(x, z) {
        this.targetX = x;
        this.targetZ = z;
    }

    hasTarget() {
        return this.targetX !== undefined && this.targetZ !== undefined;
    }

    reachedTarget() {
        const dx = this.targetX - this.x;
        const dz = this.targetZ - this.z;
        return Math.sqrt(dx * dx + dz * dz) < 0.5;
    }

    findNearestThreat() {
        const threats = this.nearbyAnimals.filter(n => n.animal.type === 'wolf' || n.animal.type === 'cat');
        return threats.length > 0 ? threats.sort((a, b) => a.distance - b.distance)[0] : null;
    }

    moveToTarget(speedMultiplier = 1) {
        const dx = this.targetX - this.x;
        const dz = this.targetZ - this.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance > 0.5) {
            const moveX = (dx / distance) * this.speed * speedMultiplier * 0.1;
            const moveZ = (dz / distance) * this.speed * speedMultiplier * 0.1;

            const newY = getHeight(this.x + moveX, this.z + moveZ);
            if (Math.abs(newY - this.y) < 2) {
                this.x += moveX;
                this.z += moveZ;
                this.y = newY + 0.5;
                this.direction.set(dx, 0, dz).normalize();
            } else {
                this.setRandomTarget(5);
            }
        }
    }

    update() {
        this.updatePhysics();
        this.updateBehavior();

        if (this.mesh) {
            this.mesh.position.set(this.x, this.y, this.z);

            // Rotação suave
            if (this.direction.length() > 0.1) {
                const targetRotation = Math.atan2(-this.direction.x, -this.direction.z);
                const currentRotation = this.mesh.rotation.y;
                let diff = targetRotation - currentRotation;

                // Normalizar diferença para -PI a PI
                while (diff > Math.PI) diff -= 2 * Math.PI;
                while (diff < -Math.PI) diff += 2 * Math.PI;

                this.mesh.rotation.y += diff * 0.1;
            }

            this.animateAdvanced();

            if (this.boundingBox) {
                this.boundingBox.setFromObject(this.mesh);
            }
        }
    }

    damage(amount) {
        this.health -= amount;
        this.fear = 100;
        this.setState('fleeing');

        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.material && child.material.emissive) {
                    child.material.emissive.setHex(0xFF0000);
                    setTimeout(() => {
                        if (child.material && child.material.emissive) {
                            child.material.emissive.setHex(0x000000);
                        }
                    }, 200);
                }
            });
        }

        if (this.health <= 0) {
            this.dropItems();
            this.remove();
            const animalIndex = animals.indexOf(this);
            if (animalIndex > -1) animals.splice(animalIndex, 1);
            return true;
        }
        return false;
    }

    dropItems() {
        const animalType = animalTypes[this.type];
        if (animalType && animalType.drops) {
            animalType.drops.forEach(drop => {
                const count = Math.floor(Math.random() * (animalType.dropCount.max - animalType.dropCount.min + 1)) + animalType.dropCount.min;
                if (count > 0 && typeof addToInventory === 'function') {
                    addToInventory(drop, count);
                }
            });
        }
    }

    remove() {
        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            scene.remove(this.mesh);
            const index = animalMeshes.indexOf(this.mesh);
            if (index > -1) animalMeshes.splice(index, 1);
        }
    }

    createDefaultMesh() {
        const animalType = animalTypes[this.type];
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({ color: animalType.color, roughness: 0.8 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }
}

function updateAnimals() {
    animals.forEach(animal => {
        if (animal.update) {
            animal.update();
        }
    });
    if (document.getElementById('animals-count')) {
        document.getElementById('animals-count').textContent = animals.length;
    }
}

function spawnAnimals(chunkX, chunkZ) {
    const sx = chunkX * 16;
    const sz = chunkZ * 16;

    if (animals.length >= 50) return;

    const animalCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < animalCount; i++) {
        if (animals.length >= 50) break;

        const x = sx + Math.random() * 16;
        const z = sz + Math.random() * 16;
        const y = getHeight(x, z) + 0.5;

        const types = ['cow', 'pig', 'sheep', 'chicken', 'rabbit'];
        const type = types[Math.floor(Math.random() * types.length)];

        const animal = new Animal(type, x, y, z);
        animals.push(animal);
    }
}