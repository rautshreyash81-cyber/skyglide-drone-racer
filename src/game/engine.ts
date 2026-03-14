import * as THREE from 'three';
import { DroneControls, GameState, DroneCustomization, PowerUpType } from '../types/game';

export class GameEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private drone: THREE.Group;
  private obstacles: THREE.Object3D[] = [];
  private rings: THREE.Object3D[] = [];
  private powerUps: THREE.Object3D[] = [];
  private coins: THREE.Object3D[] = [];
  private clouds: THREE.Group[] = [];
  private particles: THREE.Points;
  
  private humans: THREE.Group[] = [];
  private tunnel: THREE.Mesh | null = null;
  private tunnelRadius = 12;
  private pathAmplitudeX = 30;
  private pathAmplitudeY = 15;
  private pathFrequency = 0.05;
  
  private clock: THREE.Clock;
  private controls: DroneControls = { up: false, down: false, left: false, right: false, boost: false, brake: false };
  private gameState: GameState;
  private onStateChange: (state: GameState) => void;

  private forwardSpeed = 0.5;
  private sideSpeed = 0.25;
  private verticalSpeed = 0.25;
  private boostMultiplier = 2;
  private brakeMultiplier = 0.3;
  
  private levelLength = 2000;
  private distanceTraveled = 0;

  constructor(container: HTMLDivElement, onStateChange: (state: GameState) => void, initialCustomization: DroneCustomization) {
    this.onStateChange = onStateChange;
    this.gameState = {
      status: 'START',
      level: 1,
      score: 0,
      coins: 0,
      lives: 3,
      progress: 0,
      speed: 0,
      activePowerUps: [],
      customization: initialCustomization
    };

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky Blue
    this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.0005);

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 10000);
    this.camera.position.set(0, 2, 8);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(100, 200, 100);
    this.scene.add(sunLight);

    // Drone
    this.drone = this.createDrone();
    this.scene.add(this.drone);

    // Environment
    this.createEnvironment();
    this.createParticles();
    this.createClouds();

    this.clock = new THREE.Clock();
    
    window.addEventListener('resize', () => this.onWindowResize(container));
  }

  public updateCustomization(customization: DroneCustomization) {
    this.gameState.customization = customization;
    this.scene.remove(this.drone);
    this.drone = this.createDrone();
    this.scene.add(this.drone);
  }

  private createDrone(): THREE.Group {
    const group = new THREE.Group();
    const color = new THREE.Color(this.gameState.customization.color);
    const model = this.gameState.customization.model;

    // Add Pilot (Man)
    const pilot = this.createPilot();
    pilot.position.set(0, 0.2, 0);
    group.add(pilot);

    if (model === 'RACER') {
      const bodyGeo = new THREE.BoxGeometry(1, 0.2, 1.2);
      const bodyMat = new THREE.MeshPhongMaterial({ color: color, shininess: 100 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(body);

      const armGeo = new THREE.BoxGeometry(0.1, 0.1, 1.4);
      const armMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
      const arm1 = new THREE.Mesh(armGeo, armMat);
      arm1.rotation.y = Math.PI / 4;
      group.add(arm1);
      const arm2 = new THREE.Mesh(armGeo, armMat);
      arm2.rotation.y = -Math.PI / 4;
      group.add(arm2);
    } else if (model === 'PHANTOM') {
      const bodyGeo = new THREE.SphereGeometry(0.6, 16, 16);
      const bodyMat = new THREE.MeshPhongMaterial({ color: color, shininess: 100 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.scale.set(1, 0.4, 1.5);
      group.add(body);

      const ringGeo = new THREE.TorusGeometry(0.8, 0.05, 8, 32);
      const ringMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
    } else { // WASP
      const bodyGeo = new THREE.CylinderGeometry(0.3, 0.5, 1.5, 8);
      const bodyMat = new THREE.MeshPhongMaterial({ color: color, shininess: 100 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.x = Math.PI / 2;
      group.add(body);

      const wingGeo = new THREE.BoxGeometry(2, 0.05, 0.5);
      const wingMat = new THREE.MeshPhongMaterial({ color: 0x222222, transparent: true, opacity: 0.8 });
      const wing = new THREE.Mesh(wingGeo, wingMat);
      group.add(wing);
    }

    const propGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.02, 8);
    const propMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    const positions = [[0.6, 0.1, 0.6], [-0.6, 0.1, 0.6], [0.6, 0.1, -0.6], [-0.6, 0.1, -0.6]];
    positions.forEach(pos => {
      const prop = new THREE.Mesh(propGeo, propMat);
      prop.position.set(pos[0], pos[1], pos[2]);
      group.add(prop);
    });

    const shieldGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const shieldMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3, wireframe: true });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.name = 'shield_visual';
    shield.visible = false;
    group.add(shield);

    return group;
  }

  private createEnvironment() {
    const groundGeo = new THREE.PlaneGeometry(10000, 10000);
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x3a5a40 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -50;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(10000, 200, 0xffffff, 0x222222);
    grid.position.y = -49.9;
    this.scene.add(grid);
  }

  private createClouds() {
    const cloudCount = 50;
    for (let i = 0; i < cloudCount; i++) {
      const cloud = new THREE.Group();
      const partCount = 3 + Math.floor(Math.random() * 5);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
      for (let j = 0; j < partCount; j++) {
        const geo = new THREE.SphereGeometry(5 + Math.random() * 10, 8, 8);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(j * 10, Math.random() * 5, Math.random() * 5);
        cloud.add(mesh);
      }
      cloud.position.set(THREE.MathUtils.randFloatSpread(2000), THREE.MathUtils.randFloat(100, 500), THREE.MathUtils.randFloatSpread(5000));
      this.scene.add(cloud);
      this.clouds.push(cloud);
    }
  }

  private createParticles() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 2000; i++) {
      vertices.push(THREE.MathUtils.randFloatSpread(1000), THREE.MathUtils.randFloatSpread(1000), THREE.MathUtils.randFloatSpread(5000));
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 1, transparent: true, opacity: 0.5 });
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private generateLevel(level: number) {
    this.obstacles.forEach(o => this.scene.remove(o));
    this.rings.forEach(r => this.scene.remove(r));
    this.powerUps.forEach(p => this.scene.remove(p));
    this.coins.forEach(c => this.scene.remove(c));
    this.humans.forEach(h => this.scene.remove(h));
    if (this.tunnel) {
      this.scene.remove(this.tunnel);
      this.tunnel.geometry.dispose();
      this.tunnel = null;
    }
    this.obstacles = [];
    this.rings = [];
    this.powerUps = [];
    this.coins = [];
    this.humans = [];

    const spacing = 100;
    const count = 50 + level * 10;

    // Add humans at the start
    for (let i = 0; i < 8; i++) {
      const human = this.createHuman();
      const side = i % 2 === 0 ? 1 : -1;
      // Place them along the sides of the starting area
      const x = side * (10 + Math.random() * 5);
      const z = 20 - (i * 10); // Spread them out along Z
      human.position.set(x, 0, z);
      human.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
      this.scene.add(human);
      this.humans.push(human);
    }
    
    // Create Tunnel Path
    const curvePoints = [];
    for (let i = 0; i <= count; i++) {
      const z = -i * spacing;
      const tx = Math.sin(i * this.pathFrequency) * this.pathAmplitudeX;
      const ty = 20 + Math.cos(i * this.pathFrequency * 0.5) * this.pathAmplitudeY;
      curvePoints.push(new THREE.Vector3(tx, ty, z));
    }
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, count * 4, this.tunnelRadius, 12, false);
    const tubeMat = new THREE.MeshPhongMaterial({ 
      color: 0x00ffff, 
      transparent: true, 
      opacity: 0.15, 
      wireframe: false,
      side: THREE.BackSide,
      emissive: 0x00ffff,
      emissiveIntensity: 0.3
    });
    this.tunnel = new THREE.Mesh(tubeGeo, tubeMat);
    
    // Add a wireframe overlay for better visibility
    const wireframeGeo = new THREE.EdgesGeometry(tubeGeo);
    const wireframeMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.2 });
    const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
    this.tunnel.add(wireframe);
    
    this.scene.add(this.tunnel);

    // Fixed Path Generation
    for (let i = 1; i <= count; i++) {
      const z = -i * spacing;
      
      const targetX = Math.sin(i * this.pathFrequency) * this.pathAmplitudeX;
      const targetY = 20 + Math.cos(i * this.pathFrequency * 0.5) * this.pathAmplitudeY;

      // Place a ring every 3 segments
      if (i % 3 === 0) {
        const hurdleType = Math.floor(Math.random() * 4);
        const hurdle = this.createHurdle(hurdleType, level);
        hurdle.position.set(targetX, targetY, z);
        this.scene.add(hurdle);
        this.rings.push(hurdle);
      }

      // Place coins along the path
      const coinCount = 5;
      for (let j = 0; j < coinCount; j++) {
        const coinZ = z + (j * (spacing / coinCount));
        const coinX = Math.sin((i + j/coinCount) * this.pathFrequency) * this.pathAmplitudeX;
        const coinY = 20 + Math.cos((i + j/coinCount) * this.pathFrequency * 0.5) * this.pathAmplitudeY;
        
        const coin = this.createCoin();
        coin.position.set(coinX, coinY, coinZ);
        this.scene.add(coin);
        this.coins.push(coin);
      }

      // Place power-ups occasionally
      if (i % 10 === 0) {
        const pType = ['SHIELD', 'BOOST', 'MULTIPLIER'][Math.floor(Math.random() * 3)] as PowerUpType;
        const pUp = this.createPowerUp(pType);
        pUp.position.set(targetX, targetY + 5, z - spacing / 2);
        this.scene.add(pUp);
        this.powerUps.push(pUp);
      }

      // Place obstacles INSIDE the tunnel path
      const obsCount = 1 + Math.floor(level / 3);
      for (let j = 0; j < obsCount; j++) {
        const obs = this.createObstacle(level);
        // Randomly place obstacles within the tunnel radius
        const angle = Math.random() * Math.PI * 2;
        const distFromCenter = THREE.MathUtils.randFloat(4, this.tunnelRadius - 2);
        
        const obsX = targetX + Math.cos(angle) * distFromCenter;
        const obsY = targetY + Math.sin(angle) * distFromCenter;
        const obsZ = z + THREE.MathUtils.randFloatSpread(spacing * 0.8);

        obs.position.set(obsX, obsY, obsZ);
        
        // Rotate obstacle to face the path direction roughly
        obs.lookAt(targetX, targetY, obsZ - 10);
        
        this.scene.add(obs);
        this.obstacles.push(obs);
      }
    }
    this.levelLength = count * spacing + 200;
  }

  private createPilot(): THREE.Group {
    const group = new THREE.Group();
    
    // Seat/Cockpit base
    const seatGeo = new THREE.BoxGeometry(0.4, 0.1, 0.4);
    const seatMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    group.add(seat);

    // Pilot Body
    const bodyGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.4);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.2;
    group.add(body);

    // Pilot Head (Helmet)
    const headGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const headMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.45;
    group.add(head);

    // Visor
    const visorGeo = new THREE.SphereGeometry(0.1, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const visorMat = new THREE.MeshPhongMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.y = 0.48;
    visor.position.z = 0.05;
    visor.rotation.x = -Math.PI / 2;
    group.add(visor);

    return group;
  }

  private createHuman(): THREE.Group {
    const group = new THREE.Group();
    
    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.6, 8);
    const bodyMat = new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    group.add(body);
    
    // Head
    const headGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const headMat = new THREE.MeshPhongMaterial({ color: 0xffdbac }); // Skin tone
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.8;
    group.add(head);
    
    // Arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    const armMat = new THREE.MeshPhongMaterial({ color: bodyMat.color });
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.5, 1.2, 0);
    leftArm.rotation.z = 0.2;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.5, 1.2, 0);
    rightArm.rotation.z = -0.2;
    group.add(rightArm);

    return group;
  }

  private createCoin(): THREE.Group {
    const group = new THREE.Group();
    const geo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
    const mat = new THREE.MeshStandardMaterial({ 
      color: 0xffd700, 
      emissive: 0xffd700, 
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    group.add(mesh);
    
    // Add a small glow
    const glowGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.2 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    return group;
  }

  private createHurdle(type: number, level: number): THREE.Group {
    const group = new THREE.Group();
    const radius = 4;
    let geometry: THREE.BufferGeometry;
    const material = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5, transparent: true, opacity: 0.7 });

    switch(type) {
      case 0: geometry = new THREE.TorusGeometry(radius, 0.3, 16, 64); break;
      case 1: 
        const shape = new THREE.Shape();
        shape.moveTo(-radius, -radius); shape.lineTo(radius, -radius); shape.lineTo(radius, radius); shape.lineTo(-radius, radius); shape.lineTo(-radius, -radius);
        const hole = new THREE.Path();
        hole.moveTo(-radius + 0.5, -radius + 0.5); hole.lineTo(radius - 0.5, -radius + 0.5); hole.lineTo(radius - 0.5, radius - 0.5); hole.lineTo(-radius + 0.5, radius - 0.5); hole.lineTo(-radius + 0.5, -radius + 0.5);
        shape.holes.push(hole);
        geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false });
        break;
      case 2:
        const tShape = new THREE.Shape();
        tShape.moveTo(0, radius); tShape.lineTo(radius, -radius); tShape.lineTo(-radius, -radius); tShape.lineTo(0, radius);
        const tHole = new THREE.Path();
        tHole.moveTo(0, radius - 1); tHole.lineTo(radius - 1, -radius + 0.5); tHole.lineTo(-radius + 1, -radius + 0.5); tHole.lineTo(0, radius - 1);
        tShape.holes.push(tHole);
        geometry = new THREE.ExtrudeGeometry(tShape, { depth: 0.5, bevelEnabled: false });
        break;
      case 3:
        geometry = new THREE.CylinderGeometry(radius + 1, radius + 1, 20, 32, 1, true);
        group.rotation.x = Math.PI / 2;
        break;
      default: geometry = new THREE.TorusGeometry(radius, 0.3, 16, 64);
    }

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    if (level >= 3 && Math.random() > 0.5) {
      group.userData.rotating = true;
      group.userData.rotSpeed = (Math.random() - 0.5) * 0.05;
    }
    return group;
  }

  private createPowerUp(type: PowerUpType): THREE.Group {
    const group = new THREE.Group();
    const geo = new THREE.OctahedronGeometry(1);
    let color = 0xffffff;
    if (type === 'SHIELD') color = 0x00ffff;
    if (type === 'BOOST') color = 0xffff00;
    if (type === 'MULTIPLIER') color = 0xff00ff;
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1 });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
    group.userData.powerUpType = type;
    return group;
  }

  private createObstacle(level: number): THREE.Object3D {
    const type = Math.floor(Math.random() * 3);
    const mat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    if (type === 0) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 1, 1), mat);
      mesh.userData.rotating = true;
      mesh.userData.rotSpeed = (Math.random() - 0.5) * 0.04;
      return mesh;
    } else if (type === 1) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 20, 1), mat);
      mesh.userData.moving = true;
      mesh.userData.moveDir = 1;
      mesh.userData.moveRange = 20;
      mesh.userData.startX = 0;
      return mesh;
    } else {
      const group = new THREE.Group();
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 20), mat); p1.position.x = -5;
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 20), mat); p2.position.x = 5;
      const laser = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 10), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
      laser.rotation.z = Math.PI / 2;
      group.add(p1, p2, laser);
      return group;
    }
  }

  public setControls(controls: DroneControls) { this.controls = controls; }

  public start() {
    this.gameState.status = 'PLAYING';
    this.distanceTraveled = 0;
    this.drone.position.set(0, 10, 0);
    this.generateLevel(this.gameState.level);
    this.onStateChange({ ...this.gameState });
    this.animate();
  }

  public pause() { this.gameState.status = 'PAUSED'; this.onStateChange({ ...this.gameState }); }
  public resume() { this.gameState.status = 'PLAYING'; this.onStateChange({ ...this.gameState }); }
  public restart() { 
    this.gameState.level = 1; 
    this.gameState.score = 0; 
    this.gameState.coins = 0;
    this.gameState.lives = 3; 
    this.gameState.activePowerUps = []; 
    this.start(); 
  }

  private onWindowResize(container: HTMLDivElement) {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  private animate = () => {
    if (this.gameState.status !== 'PLAYING') return;
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    this.drone.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CylinderGeometry && child.name !== 'shield_visual') child.rotation.y += 0.8;
    });

    const now = Date.now();
    this.gameState.activePowerUps = this.gameState.activePowerUps.filter(p => p.endTime > now);
    const hasShield = this.gameState.activePowerUps.some(p => p.type === 'SHIELD');
    const hasBoost = this.gameState.activePowerUps.some(p => p.type === 'BOOST');
    const hasMultiplier = this.gameState.activePowerUps.some(p => p.type === 'MULTIPLIER');

    const shieldVisual = this.drone.getObjectByName('shield_visual');
    if (shieldVisual) shieldVisual.visible = hasShield;

    let currentForwardSpeed = this.forwardSpeed + (this.gameState.level * 0.05);
    if (this.controls.boost || hasBoost) currentForwardSpeed *= this.boostMultiplier;
    if (this.controls.brake) currentForwardSpeed *= this.brakeMultiplier;
    
    this.drone.position.z -= currentForwardSpeed;
    this.distanceTraveled += currentForwardSpeed;

    const moveSpeed = this.sideSpeed * (hasBoost ? 1.5 : 1);
    if (this.controls.up) this.drone.position.y += moveSpeed;
    if (this.controls.down) this.drone.position.y -= moveSpeed;
    if (this.controls.left) this.drone.position.x -= moveSpeed;
    if (this.controls.right) this.drone.position.x += moveSpeed;

    // Limit path logic
    const zIndex = -this.drone.position.z / 100;
    const targetX = Math.sin(zIndex * this.pathFrequency) * this.pathAmplitudeX;
    const targetY = 20 + Math.cos(zIndex * this.pathFrequency * 0.5) * this.pathAmplitudeY;

    // Clamp within tunnel
    const dx = this.drone.position.x - targetX;
    const dy = this.drone.position.y - targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > this.tunnelRadius - 1) {
      const angle = Math.atan2(dy, dx);
      this.drone.position.x = targetX + Math.cos(angle) * (this.tunnelRadius - 1);
      this.drone.position.y = targetY + Math.sin(angle) * (this.tunnelRadius - 1);
      
      // Visual feedback and damage for hitting the wall
      if (Math.random() > 0.95 && !hasShield) {
        this.createExplosion(this.drone.position.clone().add(new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, 0)));
        this.handleWallHit();
      }
    }

    this.drone.rotation.z = THREE.MathUtils.lerp(this.drone.rotation.z, (this.controls.left ? 0.4 : 0) + (this.controls.right ? -0.4 : 0), 0.1);
    this.drone.rotation.x = THREE.MathUtils.lerp(this.drone.rotation.x, (this.controls.up ? -0.3 : 0) + (this.controls.down ? 0.3 : 0), 0.1);

    const targetCamPos = new THREE.Vector3(this.drone.position.x * 0.5, this.drone.position.y + 3, this.drone.position.z + 10);
    this.camera.position.lerp(targetCamPos, 0.1);
    this.camera.lookAt(this.drone.position.x, this.drone.position.y, this.drone.position.z - 15);

    this.obstacles.forEach(obs => {
      if (obs.userData.rotating) obs.rotation.z += obs.userData.rotSpeed;
      if (obs.userData.moving) {
        obs.position.x += obs.userData.moveDir * 0.2;
        if (Math.abs(obs.position.x - obs.userData.startX) > obs.userData.moveRange) obs.userData.moveDir *= -1;
      }
    });
    this.rings.forEach(ring => { if (ring.userData.rotating) ring.rotation.z += ring.userData.rotSpeed; });
    this.powerUps.forEach(p => { p.rotation.y += 0.05; p.position.y += Math.sin(time * 2) * 0.02; });
    this.coins.forEach(c => { c.rotation.y += 0.1; });
    this.clouds.forEach(cloud => { cloud.position.z += 0.1; if (cloud.position.z > this.drone.position.z + 1000) cloud.position.z -= 5000; });

    this.humans.forEach((human, i) => {
      const leftArm = human.children[2];
      const rightArm = human.children[3];
      if (leftArm && rightArm) {
        leftArm.rotation.z = 0.2 + Math.sin(time * 3 + i) * 0.5;
        rightArm.rotation.z = -0.2 - Math.sin(time * 3 + i + 0.5) * 0.5;
      }
    });

    this.checkCollisions(hasShield, hasMultiplier);
    this.gameState.progress = Math.min(100, (this.distanceTraveled / this.levelLength) * 100);
    this.gameState.speed = Math.round(currentForwardSpeed * 100);
    if (this.gameState.progress >= 100) this.completeLevel();
    this.onStateChange({ ...this.gameState });
    this.renderer.render(this.scene, this.camera);
  };

  private checkCollisions(hasShield: boolean, hasMultiplier: boolean) {
    const droneBox = new THREE.Box3().setFromObject(this.drone);
    
    // Rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      if (Math.abs(ring.position.z - this.drone.position.z) < 5) {
        const dist = this.drone.position.distanceTo(ring.position);
        if (dist < 5) { 
          this.gameState.score += 500 * (hasMultiplier ? 2 : 1); 
          this.scene.remove(ring); 
          this.rings.splice(i, 1); 
        }
      }
    }

    // Coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (Math.abs(coin.position.z - this.drone.position.z) < 5) {
        const dist = this.drone.position.distanceTo(coin.position);
        if (dist < 2) {
          this.gameState.coins += 1;
          this.gameState.score += 50 * (hasMultiplier ? 2 : 1);
          this.scene.remove(coin);
          this.coins.splice(i, 1);
        }
      }
    }

    // Power Ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pUp = this.powerUps[i];
      const pBox = new THREE.Box3().setFromObject(pUp);
      if (droneBox.intersectsBox(pBox)) {
        this.gameState.activePowerUps.push({ type: pUp.userData.powerUpType, endTime: Date.now() + 10000 });
        this.scene.remove(pUp); this.powerUps.splice(i, 1);
      }
    }

    // Obstacles
    for (const obs of this.obstacles) {
      const obsBox = new THREE.Box3().setFromObject(obs);
      if (droneBox.intersectsBox(obsBox)) {
        if (hasShield) {
          this.gameState.activePowerUps = this.gameState.activePowerUps.filter(p => p.type !== 'SHIELD');
          this.scene.remove(obs); 
          this.obstacles = this.obstacles.filter(o => o !== obs);
        } else { 
          this.handleCrash(); 
        }
        break;
      }
    }
    if (this.drone.position.y < 0.5) this.handleCrash();
  }

  private handleWallHit() {
    // Wall hits are less damaging than direct crashes
    // We'll just flash the screen and maybe reduce score or slightly damage hull
    const originalBg = this.scene.background;
    this.scene.background = new THREE.Color(0x440000);
    setTimeout(() => { this.scene.background = originalBg; }, 50);
    
    // Optional: reduce score or lives slowly
    this.gameState.score = Math.max(0, this.gameState.score - 10);
    this.onStateChange({ ...this.gameState });
  }

  private handleCrash() {
    this.gameState.lives = 0; // Immediate fail
    this.createExplosion(this.drone.position);
    const originalBg = this.scene.background;
    this.scene.background = new THREE.Color(0xff0000);
    setTimeout(() => { this.scene.background = originalBg; }, 100);
    this.gameState.status = 'GAMEOVER';
    this.onStateChange({ ...this.gameState });
  }

  private createExplosion(position: THREE.Vector3) {
    const geo = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 100; i++) vertices.push(position.x, position.y, position.z);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const mat = new THREE.PointsMaterial({ color: 0xff4400, size: 0.5 });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    const startTime = Date.now();
    const animateExplosion = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 1000) { this.scene.remove(points); return; }
      const posAttr = points.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        posAttr.setX(i, posAttr.getX(i) + (Math.random() - 0.5) * 0.5);
        posAttr.setY(i, posAttr.getY(i) + (Math.random() - 0.5) * 0.5);
        posAttr.setZ(i, posAttr.getZ(i) + (Math.random() - 0.5) * 0.5);
      }
      posAttr.needsUpdate = true;
      requestAnimationFrame(animateExplosion);
    };
    animateExplosion();
  }

  private completeLevel() { this.gameState.status = 'LEVEL_COMPLETE'; this.gameState.level += 1; this.onStateChange({ ...this.gameState }); }
}
