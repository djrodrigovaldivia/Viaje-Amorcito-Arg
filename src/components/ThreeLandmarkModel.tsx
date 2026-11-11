import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Landmark } from '../data/landmarks';
import {
  RotateCw,
  Sun,
  Moon,
  Sunset,
  Maximize2,
  Sparkles,
  Eye,
  ZoomIn,
  ZoomOut,
  Camera,
} from 'lucide-react';

interface ThreeLandmarkModelProps {
  landmark: Landmark;
  height?: string;
  className?: string;
}

type TimeOfDay = 'day' | 'sunset' | 'night';
type CameraPreset = 'panoramic' | 'closeup' | 'street';

export const ThreeLandmarkModel: React.FC<ThreeLandmarkModelProps> = ({
  landmark,
  height = '100%',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('sunset');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('panoramic');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const autoRotateRef = useRef<boolean>(autoRotate);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  const updateLighting = (mode: TimeOfDay, scene: THREE.Scene, lightsGroup: THREE.Group, isSoftwareGl: boolean) => {
    while (lightsGroup.children.length > 0) {
      lightsGroup.remove(lightsGroup.children[0]);
    }

    if (mode === 'day') {
      scene.background = new THREE.Color(0x0b192c);
      scene.fog = new THREE.FogExp2(0x0b192c, 0.012);

      const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 1.3);
      lightsGroup.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.4);
      sunLight.position.set(22, 36, 22);
      if (!isSoftwareGl) {
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
      }
      lightsGroup.add(sunLight);

      const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
      fillLight.position.set(-20, 15, -15);
      lightsGroup.add(fillLight);
    } else if (mode === 'sunset') {
      scene.background = new THREE.Color(0x160b24);
      scene.fog = new THREE.FogExp2(0x160b24, 0.014);

      const hemiLight = new THREE.HemisphereLight(0xf472b6, 0x1e1b4b, 1.0);
      lightsGroup.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xf97316, 2.8);
      sunLight.position.set(28, 14, 14);
      if (!isSoftwareGl) {
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
      }
      lightsGroup.add(sunLight);

      const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
      rimLight.position.set(-22, 12, -18);
      lightsGroup.add(rimLight);
    } else {
      scene.background = new THREE.Color(0x020617);
      scene.fog = new THREE.FogExp2(0x020617, 0.016);

      const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x020617, 0.5);
      lightsGroup.add(hemiLight);

      const moonLight = new THREE.DirectionalLight(0x93c5fd, 1.3);
      moonLight.position.set(16, 32, -16);
      lightsGroup.add(moonLight);

      const warmSpot = new THREE.PointLight(0xfbbf24, 2.5, 28);
      warmSpot.position.set(0, 6, 6);
      lightsGroup.add(warmSpot);

      // Southern Cross & Austral Starfield
      const starsGeometry = new THREE.BufferGeometry();
      const starsCount = 500;
      const starPositions = new Float32Array(starsCount * 3);
      for (let i = 0; i < starsCount * 3; i += 3) {
        starPositions[i] = (Math.random() - 0.5) * 140;
        starPositions[i + 1] = Math.random() * 65 + 8;
        starPositions[i + 2] = (Math.random() - 0.5) * 140;
      }
      starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.65,
        transparent: true,
        opacity: 0.85,
      });
      lightsGroup.add(new THREE.Points(starsGeometry, starsMaterial));
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const heightPx = container.clientHeight || 320;

    // Detect software WebGL per Three.js skill directive
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / heightPx, 0.1, 500);
    camera.position.set(19, 13, 23);
    camera.lookAt(0, 4.5, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const lightsGroup = new THREE.Group();
    scene.add(lightsGroup);
    lightsGroupRef.current = lightsGroup;
    updateLighting(timeOfDay, scene, lightsGroup, isSoftwareGl);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    const dynamicUpdaters: ((delta: number, elapsed: number) => void)[] = [];

    // Multi-tiered ornamental diorama pedestal
    const createBasePlatform = (radius = 14, topColor = 0x1e293b) => {
      const lowerBase = new THREE.Mesh(
        new THREE.CylinderGeometry(radius + 0.8, radius + 1.4, 0.9, 48),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.6 })
      );
      lowerBase.position.y = -0.95;
      modelGroup.add(lowerBase);

      const upperBase = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius + 0.5, 0.7, 48),
        new THREE.MeshStandardMaterial({ color: topColor, roughness: 0.75, metalness: 0.15 })
      );
      upperBase.position.y = -0.35;
      upperBase.receiveShadow = true;
      modelGroup.add(upperBase);

      // Golden & Celeste rim rings
      const outerRing = new THREE.Mesh(
        new THREE.RingGeometry(radius - 0.5, radius - 0.15, 64),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.25, metalness: 0.7, side: THREE.DoubleSide })
      );
      outerRing.rotation.x = -Math.PI / 2;
      outerRing.position.y = 0.02;
      modelGroup.add(outerRing);

      const goldRing = new THREE.Mesh(
        new THREE.RingGeometry(radius - 0.9, radius - 0.7, 64),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.85, side: THREE.DoubleSide })
      );
      goldRing.rotation.x = -Math.PI / 2;
      goldRing.position.y = 0.025;
      modelGroup.add(goldRing);
    };

    const modelType = landmark.threeModelType;

    // =========================================================================
    // 1. OBELISCO DE BUENOS AIRES & AV. 9 DE JULIO
    // =========================================================================
    if (modelType === 'obelisk') {
      createBasePlatform(14.5, 0x1e293b);

      // Av. 9 de Julio & Corrientes intersecting avenues
      const aveMain = new THREE.Mesh(
        new THREE.BoxGeometry(26, 0.08, 7.5),
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 })
      );
      aveMain.position.y = 0.03;
      modelGroup.add(aveMain);

      const aveCross = new THREE.Mesh(
        new THREE.BoxGeometry(7.5, 0.08, 26),
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 })
      );
      aveCross.position.y = 0.03;
      modelGroup.add(aveCross);

      // Plaza de la República oval green & stone roundabout
      const plazaStone = new THREE.Mesh(
        new THREE.CylinderGeometry(5.6, 5.8, 0.22, 40),
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 })
      );
      plazaStone.position.y = 0.11;
      modelGroup.add(plazaStone);

      const plazaGrass = new THREE.Mesh(
        new THREE.CylinderGeometry(4.6, 4.7, 0.26, 40),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 })
      );
      plazaGrass.position.y = 0.13;
      modelGroup.add(plazaGrass);

      // Stepped Stone Base of the Obelisk
      const pedestal = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 1.2, 2.8),
        new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.45 })
      );
      pedestal.position.y = 0.7;
      modelGroup.add(pedestal);

      // Main Tapered Obelisk Shaft (Cordoba White Stone)
      const shaftGeo = new THREE.CylinderGeometry(0.75, 1.65, 15.5, 4, 1, false);
      const shaftMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.32,
        metalness: 0.08,
      });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.y = 8.45;
      shaft.rotation.y = Math.PI / 4;
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      modelGroup.add(shaft);

      // Pyramidion Apex with 4 subtle dark observation windows
      const apexGeo = new THREE.ConeGeometry(0.75 * Math.SQRT2, 2.3, 4);
      const apexMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.2,
        metalness: 0.12,
      });
      const apex = new THREE.Mesh(apexGeo, apexMat);
      apex.position.y = 17.35;
      apex.rotation.y = Math.PI / 4;
      modelGroup.add(apex);

      // 4 Observation Windows near the top
      const winMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.8 });
      for (let w = 0; w < 4; w++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.48, 0.08), winMat);
        const angle = (w * Math.PI) / 2;
        win.position.set(Math.sin(angle) * 0.56, 15.6, Math.cos(angle) * 0.56);
        win.rotation.y = angle;
        modelGroup.add(win);
      }

      // Golden Lightning Rod at Summit
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.05, 1.1, 8),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.95, roughness: 0.15 })
      );
      rod.position.y = 18.9;
      modelGroup.add(rod);

      // Iconic "BA" Green Topiary Sculpture in front of the Obelisk
      const baGroup = new THREE.Group();
      baGroup.position.set(0, 0.8, 3.6);
      const baMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });
      const bBlock = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.3, 0.4), baMat);
      bBlock.position.x = -0.6;
      const aBlock = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.35, 4), baMat);
      aBlock.position.x = 0.6;
      aBlock.rotation.y = Math.PI / 4;
      baGroup.add(bBlock, aBlock);
      modelGroup.add(baGroup);

      // Jacarandá Trees (Violet-Blue Blossoms of Buenos Aires)
      const treePositions = [
        [-4.2, -4.2],
        [4.2, -4.2],
        [-4.2, 4.2],
        [4.2, 4.2],
        [-8.5, -5.2],
        [8.5, -5.2],
        [-8.5, 5.2],
        [8.5, 5.2],
      ];
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
      const jacarandaMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.65 });

      treePositions.forEach(([tx, tz]) => {
        const tGroup = new THREE.Group();
        tGroup.position.set(tx, 0, tz);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.8, 7), trunkMat);
        trunk.position.y = 0.9;
        tGroup.add(trunk);

        const crown1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 1), jacarandaMat);
        crown1.position.set(0, 2.1, 0);
        const crown2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 1), jacarandaMat);
        crown2.position.set(0.4, 2.4, 0.3);
        tGroup.add(crown1, crown2);
        modelGroup.add(tGroup);
      });

      // Waving Argentine Flag on Flagpole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.1, 9.5, 12),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
      );
      pole.position.set(3.2, 4.75, -1.5);
      modelGroup.add(pole);

      const flagWidth = 3.0;
      const flagHeight = 1.8;
      const flagGeo = new THREE.PlaneGeometry(flagWidth, flagHeight, 18, 8);
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 160;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#74ACDF';
      ctx.fillRect(0, 0, 256, 160);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 53, 256, 54);
      ctx.fillStyle = '#F6B40E';
      ctx.beginPath();
      ctx.arc(128, 80, 17, 0, Math.PI * 2);
      ctx.fill();

      const flagMesh = new THREE.Mesh(
        flagGeo,
        new THREE.MeshStandardMaterial({
          map: new THREE.CanvasTexture(canvas),
          side: THREE.DoubleSide,
          roughness: 0.45,
        })
      );
      flagMesh.position.set(3.2 + flagWidth / 2, 8.4, -1.5);
      modelGroup.add(flagMesh);

      // Animated Cars / Traffic Lights along Av. 9 de Julio
      const cars: { mesh: THREE.Mesh; speed: number; range: number }[] = [];
      const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const taillightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      for (let c = 0; c < 10; c++) {
        const isEast = c % 2 === 0;
        const carMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.28, 0.38),
          isEast ? headlightMat : taillightMat
        );
        carMesh.position.set((Math.random() - 0.5) * 20, 0.22, isEast ? 2.2 : -2.2);
        modelGroup.add(carMesh);
        cars.push({ mesh: carMesh, speed: (isEast ? 1 : -1) * (4 + Math.random() * 2), range: 11 });
      }

      dynamicUpdaters.push((delta, elapsed) => {
        const pos = flagGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const u = pos.getX(i);
          pos.setZ(i, Math.sin(u * 2.6 - elapsed * 5.2) * 0.24 * ((u + flagWidth / 2) / flagWidth));
        }
        pos.needsUpdate = true;

        cars.forEach((car) => {
          car.mesh.position.x += car.speed * delta;
          if (car.mesh.position.x > car.range) car.mesh.position.x = -car.range;
          if (car.mesh.position.x < -car.range) car.mesh.position.x = car.range;
        });
      });

    // =========================================================================
    // 2. CATARATAS DEL IGUAZÚ - GARGANTA DEL DIABLO
    // =========================================================================
    } else if (modelType === 'waterfall') {
      createBasePlatform(14.5, 0x064e3b);

      // U-shaped Basalt Canyon Cliffs (Garganta del Diablo)
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.88, flatShading: true });
      const mossMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 });

      const horseshoeAngles = 12;
      const waterfallSheets: THREE.Mesh[] = [];

      for (let i = 0; i <= horseshoeAngles; i++) {
        const t = i / horseshoeAngles;
        const angle = Math.PI * 0.85 + t * Math.PI * 1.3;
        const rx = Math.cos(angle) * 7.2;
        const rz = Math.sin(angle) * 6.2 - 1.5;

        const cliffBlock = new THREE.Mesh(new THREE.BoxGeometry(2.8, 7.6, 2.8), rockMat);
        cliffBlock.position.set(rx, 3.8, rz);
        cliffBlock.rotation.y = -angle;
        cliffBlock.castShadow = true;
        modelGroup.add(cliffBlock);

        const mossTop = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.5, 2.9), mossMat);
        mossTop.position.set(rx, 7.75, rz);
        mossTop.rotation.y = -angle;
        modelGroup.add(mossTop);

        // Cascading Water Curtain per cliff segment
        const fallGeo = new THREE.PlaneGeometry(2.1, 7.5, 4, 12);
        const fallMat = new THREE.MeshPhysicalMaterial({
          color: 0xe0f2fe,
          emissive: 0x0284c7,
          emissiveIntensity: 0.15,
          roughness: 0.15,
          transparent: true,
          opacity: 0.88,
          side: THREE.DoubleSide,
        });
        const fall = new THREE.Mesh(fallGeo, fallMat);
        const innerRx = Math.cos(angle) * 5.65;
        const innerRz = Math.sin(angle) * 4.8 - 1.5;
        fall.position.set(innerRx, 3.8, innerRz);
        fall.lookAt(0, 3.8, 2);
        modelGroup.add(fall);
        waterfallSheets.push(fall);
      }

      // Lower Iguazú River Basin
      const river = new THREE.Mesh(
        new THREE.CircleGeometry(13.8, 48),
        new THREE.MeshPhysicalMaterial({
          color: 0x0369a1,
          roughness: 0.12,
          metalness: 0.35,
          clearcoat: 0.8,
        })
      );
      river.rotation.x = -Math.PI / 2;
      river.position.y = 0.08;
      modelGroup.add(river);

      // Iconic Metal Catwalk & Balcony ("Pasarela a la Garganta del Diablo")
      const catwalkGroup = new THREE.Group();
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });
      const walkway = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 9.5), steelMat);
      walkway.position.set(0, 7.9, 5.2);
      catwalkGroup.add(walkway);

      const balcony = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.22, 24), steelMat);
      balcony.position.set(0, 7.9, 0.3);
      catwalkGroup.add(balcony);
      modelGroup.add(catwalkGroup);

      // Double Rainbow Arc over the Mist
      const rainbow1 = new THREE.Mesh(
        new THREE.TorusGeometry(6.2, 0.16, 12, 48, Math.PI),
        new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.55 })
      );
      rainbow1.position.set(0, 3.2, 1.5);
      rainbow1.rotation.x = 0.25;
      modelGroup.add(rainbow1);

      const rainbow2 = new THREE.Mesh(
        new THREE.TorusGeometry(6.55, 0.14, 12, 48, Math.PI),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 })
      );
      rainbow2.position.set(0, 3.2, 1.5);
      rainbow2.rotation.x = 0.25;
      modelGroup.add(rainbow2);

      // Rising Mist Particles
      const mistCount = 260;
      const mistGeo = new THREE.BufferGeometry();
      const mistPositions = new Float32Array(mistCount * 3);
      for (let i = 0; i < mistCount * 3; i += 3) {
        mistPositions[i] = (Math.random() - 0.5) * 11;
        mistPositions[i + 1] = Math.random() * 6.5 + 0.4;
        mistPositions[i + 2] = (Math.random() - 0.5) * 9;
      }
      mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPositions, 3));
      const mistPoints = new THREE.Points(
        mistGeo,
        new THREE.PointsMaterial({ color: 0xffffff, size: 0.9, transparent: true, opacity: 0.42 })
      );
      modelGroup.add(mistPoints);

      dynamicUpdaters.push((_delta, elapsed) => {
        const mPos = mistGeo.attributes.position;
        for (let i = 1; i < mistCount * 3; i += 3) {
          mPos.array[i] += 0.055;
          if (mPos.array[i] > 7.2) mPos.array[i] = 0.3;
        }
        mPos.needsUpdate = true;

        waterfallSheets.forEach((f, idx) => {
          f.scale.y = 1 + Math.sin(elapsed * 5 + idx) * 0.035;
        });
      });

    // =========================================================================
    // 3. GLACIAR PERITO MORENO
    // =========================================================================
    } else if (modelType === 'glacier') {
      createBasePlatform(14.5, 0x082f49);

      // Lago Argentino Turquoise Glacial Water
      const lake = new THREE.Mesh(
        new THREE.CircleGeometry(13.8, 48),
        new THREE.MeshPhysicalMaterial({
          color: 0x0284c7,
          roughness: 0.1,
          metalness: 0.3,
          clearcoat: 0.9,
        })
      );
      lake.rotation.x = -Math.PI / 2;
      lake.position.y = 0.08;
      modelGroup.add(lake);

      // Translucent Deep Glacial Ice Wall (70m Front)
      const iceMat = new THREE.MeshPhysicalMaterial({
        color: 0xbae6fd,
        emissive: 0x0284c7,
        emissiveIntensity: 0.18,
        roughness: 0.14,
        metalness: 0.05,
        clearcoat: 0.8,
        flatShading: true,
      });

      const deepBlueIceMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        emissive: 0x0369a1,
        emissiveIntensity: 0.22,
        roughness: 0.1,
        clearcoat: 1.0,
        flatShading: true,
      });

      for (let x = -7.5; x <= 7.5; x += 1.25) {
        for (let z = -8.5; z <= -0.8; z += 1.35) {
          if (Math.hypot(x, z) > 12.2) continue;
          const h = 4.2 + Math.abs(Math.sin(x * 1.4 + z)) * 3.2 + (z < -4 ? 2.5 : 0);
          const spireGeo = new THREE.ConeGeometry(0.95 + Math.random() * 0.3, h, 5);
          const spire = new THREE.Mesh(spireGeo, Math.random() > 0.35 ? iceMat : deepBlueIceMat);
          spire.position.set(x + (Math.random() - 0.5) * 0.3, h / 2, z);
          spire.rotation.y = Math.random() * Math.PI;
          spire.castShadow = true;
          modelGroup.add(spire);
        }
      }

      // Opposite Peninsula with Viewing Catwalks (Pasarelas de Magallanes)
      const peninsula = new THREE.Mesh(
        new THREE.CylinderGeometry(3.8, 4.8, 2.2, 9),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, flatShading: true })
      );
      peninsula.position.set(0, 1.0, 8.2);
      modelGroup.add(peninsula);

      const catwalk = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 0.2, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 })
      );
      catwalk.position.set(0, 2.25, 6.2);
      modelGroup.add(catwalk);

      // Tourist Catamaran Boat sailing in front of the Glacier
      const boatGroup = new THREE.Group();
      const hull = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.45, 0.85),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
      );
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.4, 0.65),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 })
      );
      cabin.position.y = 0.4;
      boatGroup.add(hull, cabin);
      boatGroup.position.set(-3, 0.3, 2.8);
      modelGroup.add(boatGroup);

      // Floating Icebergs
      const icebergs: THREE.Mesh[] = [];
      for (let i = 0; i < 8; i++) {
        const berg = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.55 + Math.random() * 0.45, 0),
          iceMat
        );
        berg.position.set((Math.random() - 0.5) * 11, 0.35, Math.random() * 3.8 + 1.2);
        modelGroup.add(berg);
        icebergs.push(berg);
      }

      dynamicUpdaters.push((_delta, elapsed) => {
        icebergs.forEach((berg, i) => {
          berg.position.y = 0.3 + Math.sin(elapsed * 2.2 + i) * 0.08;
          berg.rotation.y += 0.004;
        });
        boatGroup.position.x = Math.sin(elapsed * 0.45) * 4.5;
        boatGroup.position.y = 0.28 + Math.sin(elapsed * 3) * 0.04;
      });

    // =========================================================================
    // 4. CERRO ACONCAGUA / MONTE FITZ ROY
    // =========================================================================
    } else if (modelType === 'mountain') {
      createBasePlatform(14.5, 0x1e293b);

      const graniteMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.82,
        flatShading: true,
      });
      const snowMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.25,
        metalness: 0.1,
        flatShading: true,
      });

      // Main Towering Andean Peak
      const mainPeak = new THREE.Mesh(new THREE.ConeGeometry(7.2, 13.5, 7), graniteMat);
      mainPeak.position.set(0, 6.75, -1.5);
      mainPeak.castShadow = true;
      modelGroup.add(mainPeak);

      const mainSnow = new THREE.Mesh(new THREE.ConeGeometry(3.9, 6.2, 7), snowMat);
      mainSnow.position.set(0, 10.5, -1.5);
      modelGroup.add(mainSnow);

      // Surrounding Granite Needles (Agujas Poincenot / Saint-Exupéry)
      const needles = [
        { x: -5.2, z: -2.2, r: 3.2, h: 10.2 },
        { x: 5.2, z: -2.0, r: 3.0, h: 9.6 },
        { x: -2.8, z: -5.5, r: 3.4, h: 11.0 },
        { x: 3.2, z: -5.2, r: 2.9, h: 9.0 },
      ];
      needles.forEach((n) => {
        const needle = new THREE.Mesh(new THREE.ConeGeometry(n.r, n.h, 6), graniteMat);
        needle.position.set(n.x, n.h / 2, n.z);
        needle.castShadow = true;
        modelGroup.add(needle);

        const cap = new THREE.Mesh(new THREE.ConeGeometry(n.r * 0.48, n.h * 0.4, 6), snowMat);
        cap.position.set(n.x, n.h * 0.81, n.z);
        modelGroup.add(cap);
      });

      // Turquoise Alpine Lagoon at Base (Laguna de los Tres / Horcones)
      const lagoon = new THREE.Mesh(
        new THREE.CircleGeometry(4.8, 32),
        new THREE.MeshPhysicalMaterial({ color: 0x06b6d4, roughness: 0.1, metalness: 0.35, clearcoat: 0.9 })
      );
      lagoon.rotation.x = -Math.PI / 2;
      lagoon.position.set(0, 0.12, 5.2);
      modelGroup.add(lagoon);

      // Andean Condor Soaring High Around the Summit
      const condorGroup = new THREE.Group();
      const birdMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 6), birdMat);
      body.rotation.x = Math.PI / 2;
      const wings = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 0.4), birdMat);
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.04, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      collar.position.z = 0.25;
      condorGroup.add(body, wings, collar);
      modelGroup.add(condorGroup);

      dynamicUpdaters.push((_delta, elapsed) => {
        const angle = elapsed * 0.7;
        condorGroup.position.set(Math.cos(angle) * 7.5, 11.5 + Math.sin(elapsed * 2) * 0.4, Math.sin(angle) * 7.5 - 1);
        condorGroup.rotation.y = -angle;
        condorGroup.rotation.z = 0.22;
      });

    // =========================================================================
    // 5. FARO DEL FIN DEL MUNDO (LES ÉCLAIREURS, USHUAIA)
    // =========================================================================
    } else if (modelType === 'lighthouse') {
      createBasePlatform(14.5, 0x082f49);

      // Beagle Channel Deep Southern Ocean
      const sea = new THREE.Mesh(
        new THREE.CircleGeometry(13.9, 48),
        new THREE.MeshPhysicalMaterial({ color: 0x0c4a6e, roughness: 0.15, metalness: 0.4, clearcoat: 0.8 })
      );
      sea.rotation.x = -Math.PI / 2;
      sea.position.y = 0.08;
      modelGroup.add(sea);

      // Rocky Islet of Les Éclaireurs
      const island = new THREE.Mesh(
        new THREE.CylinderGeometry(5.2, 6.8, 2.2, 10),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, flatShading: true })
      );
      island.position.y = 1.0;
      modelGroup.add(island);

      // Lighthouse Red-White-Red Tower
      const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 });
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
      const darkMetal = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.25 });

      const t1 = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.95, 3.2, 24), redMat);
      t1.position.y = 3.6;
      const t2 = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.55, 3.2, 24), whiteMat);
      t2.position.y = 6.8;
      const t3 = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.28, 3.2, 24), redMat);
      t3.position.y = 10.0;
      modelGroup.add(t1, t2, t3);

      // Gallery Balcony & Lantern Room
      const gallery = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.3, 24), darkMetal);
      gallery.position.y = 11.65;
      const lanternGlass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 0.95, 1.3, 16),
        new THREE.MeshPhysicalMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.8, roughness: 0.1 })
      );
      lanternGlass.position.y = 12.35;
      const cupola = new THREE.Mesh(
        new THREE.SphereGeometry(1.02, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        darkMetal
      );
      cupola.position.y = 12.95;
      modelGroup.add(gallery, lanternGlass, cupola);

      // Dual Revolving Volumetric Light Beams
      const beamGroup = new THREE.Group();
      beamGroup.position.set(0, 12.35, 0);
      modelGroup.add(beamGroup);

      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
      });
      const beam1 = new THREE.Mesh(new THREE.ConeGeometry(4.2, 18, 20, 1, true), beamMat);
      beam1.rotation.x = Math.PI / 2;
      beam1.position.z = 9;

      const beam2 = new THREE.Mesh(new THREE.ConeGeometry(4.2, 18, 20, 1, true), beamMat);
      beam2.rotation.x = -Math.PI / 2;
      beam2.position.z = -9;

      beamGroup.add(beam1, beam2);

      dynamicUpdaters.push((_delta, elapsed) => {
        beamGroup.rotation.y = elapsed * 1.4;
      });

    // =========================================================================
    // 6. CERRO DE LOS SIETE COLORES / VALLE DE LA LUNA
    // =========================================================================
    } else if (modelType === 'canyon') {
      createBasePlatform(14.5, 0x78350f);

      const strataColors = [0x991b1b, 0xd97706, 0x15803d, 0x7e22ce, 0xb45309, 0xfacc15, 0xbe123c];
      strataColors.forEach((col, idx) => {
        const layer = new THREE.Mesh(
          new THREE.CylinderGeometry(11.2 - idx * 1.25, 12.4 - idx * 1.25, 1.35, 18),
          new THREE.MeshStandardMaterial({ color: col, roughness: 0.85, flatShading: true })
        );
        layer.position.set(0, 0.65 + idx * 1.32, -1.5);
        layer.castShadow = true;
        modelGroup.add(layer);
      });

      // Multiple Cardón Cacti in Foreground
      const cactusMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.75 });
      [
        [5.5, 4.5],
        [-5.8, 4.0],
        [3.2, 6.5],
      ].forEach(([cx, cz]) => {
        const cGroup = new THREE.Group();
        cGroup.position.set(cx, 0, cz);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 3.6, 8), cactusMat);
        trunk.position.y = 1.8;
        const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 1.5, 8), cactusMat);
        armL.position.set(-0.5, 2.2, 0);
        const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 1.3, 8), cactusMat);
        armR.position.set(0.5, 2.5, 0);
        cGroup.add(trunk, armL, armR);
        modelGroup.add(cGroup);
      });

    // =========================================================================
    // 7. SALINAS GRANDES (JUJUY & SALTA)
    // =========================================================================
    } else if (modelType === 'saltflat') {
      createBasePlatform(14.5, 0xe2e8f0);

      const saltSurface = new THREE.Mesh(
        new THREE.CircleGeometry(13.8, 48),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.12, metalness: 0.1, clearcoat: 0.7 })
      );
      saltSurface.rotation.x = -Math.PI / 2;
      saltSurface.position.y = 0.08;
      modelGroup.add(saltSurface);

      // Turquoise Rectangular Brine Pools (Ojos del Salar & Piletones)
      const poolMat = new THREE.MeshPhysicalMaterial({
        color: 0x06b6d4,
        roughness: 0.05,
        metalness: 0.4,
        clearcoat: 1.0,
      });
      for (let i = 0; i < 4; i++) {
        const pool = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.18, 2.8), poolMat);
        pool.position.set(i % 2 === 0 ? -4.2 : 4.2, 0.12, i < 2 ? -3.2 : 3.2);
        modelGroup.add(pool);
      }

      // Conical Salt Mounds (Parvas de Sal)
      const saltConeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
      for (let j = -2; j <= 2; j++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.4, 12), saltConeMat);
        cone.position.set(j * 2.4, 0.75, 0);
        cone.castShadow = true;
        modelGroup.add(cone);
      }

    // =========================================================================
    // 8. CAMINITO LA BOCA vs TEATRO COLÓN
    // =========================================================================
    } else if (landmark.id === 'caminito-la-boca') {
      createBasePlatform(14.5, 0x334155);

      // Colorful Conventillos of La Boca (Yellow, Cobalt Blue, Crimson, Emerald)
      const houses = [
        { x: -5.5, z: -2.5, w: 3.6, h: 6.2, d: 3.8, col: 0xfacc15 },
        { x: -1.6, z: -3.0, w: 3.8, h: 7.4, d: 4.0, col: 0x2563eb },
        { x: 2.5, z: -2.6, w: 3.8, h: 5.8, d: 3.8, col: 0xdc2626 },
        { x: 6.2, z: -2.0, w: 3.2, h: 6.6, d: 3.6, col: 0x16a34a },
      ];
      houses.forEach((h) => {
        const building = new THREE.Mesh(
          new THREE.BoxGeometry(h.w, h.h, h.d),
          new THREE.MeshStandardMaterial({ color: h.col, roughness: 0.55 })
        );
        building.position.set(h.x, h.h / 2, h.z);
        building.castShadow = true;
        modelGroup.add(building);

        // White wooden balconies & windows
        const balcony = new THREE.Mesh(
          new THREE.BoxGeometry(h.w * 0.8, 0.35, 0.6),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
        );
        balcony.position.set(h.x, h.h * 0.55, h.z + h.d / 2 + 0.2);
        modelGroup.add(balcony);
      });
    } else {
      // Teatro Colón Neoclassical Opera House
      createBasePlatform(14.5, 0x1e293b);

      const facadeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.38 });
      const hallMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.55 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.35 });

      const mainHall = new THREE.Mesh(new THREE.BoxGeometry(12.5, 7.8, 9.5), hallMat);
      mainHall.position.set(0, 3.9, -0.5);
      mainHall.castShadow = true;
      modelGroup.add(mainHall);

      // Corinthian Columns along Front Facade
      for (let c = -5; c <= 5; c += 2) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 7.2, 16), facadeMat);
        col.position.set(c, 3.6, 4.6);
        col.castShadow = true;
        modelGroup.add(col);
      }

      // Classical Triangular Pediment & Central Dome
      const pediment = new THREE.Mesh(new THREE.ConeGeometry(6.2, 2.8, 4), facadeMat);
      pediment.position.set(0, 8.6, 4.2);
      pediment.rotation.y = Math.PI / 4;
      pediment.scale.set(1.4, 1, 0.45);
      modelGroup.add(pediment);

      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(3.4, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        roofMat
      );
      dome.position.set(0, 7.8, -0.5);
      modelGroup.add(dome);
    }

    // Orbit & Touch Controls
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !modelGroupRef.current) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      modelGroupRef.current.rotation.y += deltaX * 0.008;

      if (cameraRef.current) {
        cameraRef.current.position.y = Math.max(2.5, Math.min(32, cameraRef.current.position.y - deltaY * 0.08));
        cameraRef.current.lookAt(0, 4.5, 0);
      }
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomFactor = e.deltaY * 0.015;
      const dist = cameraRef.current.position.length();
      if (dist + zoomFactor > 7 && dist + zoomFactor < 52) {
        cameraRef.current.position.multiplyScalar((dist + zoomFactor) / dist);
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    let touchStartDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging && modelGroupRef.current) {
        const deltaX = e.touches[0].clientX - prevMousePos.x;
        modelGroupRef.current.rotation.y += deltaX * 0.01;
        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2 && cameraRef.current) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = touchStartDist - dist;
        const currentCamDist = cameraRef.current.position.length();
        if (currentCamDist + diff * 0.05 > 7 && currentCamDist + diff * 0.05 < 52) {
          cameraRef.current.position.multiplyScalar((currentCamDist + diff * 0.05) / currentCamDist);
        }
        touchStartDist = dist;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Paced Animation Loop per Three.js skill directive
    const clock = new THREE.Clock();
    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || !gl.fenceSync) {
        animFrameIdRef.current = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          animFrameIdRef.current = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          animFrameIdRef.current = window.setTimeout(cb, 80);
        }
      };
      animFrameIdRef.current = window.setTimeout(poll, 5);
    }

    function tick() {
      if (typeof document !== 'undefined' && document.hidden) {
        animFrameIdRef.current = window.setTimeout(tick, 500);
        return;
      }
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (autoRotateRef.current && modelGroupRef.current && !isDragging && !isSoftwareGl) {
        modelGroupRef.current.rotation.y += delta * 0.32;
      }

      dynamicUpdaters.forEach((updater) => updater(delta, elapsed));

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else animFrameIdRef.current = requestAnimationFrame(tick);
    }
    tick();

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    });
    resizeObserver.observe(container);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        clearTimeout(animFrameIdRef.current);
      }
      resizeObserver.disconnect();
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, [landmark.id, landmark.threeModelType]);

  // Wireframe toggle
  useEffect(() => {
    if (!modelGroupRef.current) return;
    modelGroupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => (m.wireframe = isWireframe));
        } else {
          child.material.wireframe = isWireframe;
        }
      }
    });
  }, [isWireframe]);

  // Light update on timeOfDay change
  useEffect(() => {
    if (sceneRef.current && lightsGroupRef.current) {
      updateLighting(timeOfDay, sceneRef.current, lightsGroupRef.current, false);
    }
  }, [timeOfDay]);

  const applyCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    if (!cameraRef.current) return;
    if (preset === 'panoramic') {
      cameraRef.current.position.set(19, 13, 23);
      cameraRef.current.lookAt(0, 4.5, 0);
    } else if (preset === 'closeup') {
      cameraRef.current.position.set(10, 7.5, 12);
      cameraRef.current.lookAt(0, 5.5, 0);
    } else {
      cameraRef.current.position.set(0, 2.8, 15.5);
      cameraRef.current.lookAt(0, 7.5, 0);
    }
  };

  const handleZoom = (factor: number) => {
    if (!cameraRef.current) return;
    const dist = cameraRef.current.position.length();
    const targetDist = Math.max(8, Math.min(45, dist * factor));
    cameraRef.current.position.multiplyScalar(targetDist / dist);
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-sky-500/20 shadow-2xl ${className}`}
      style={{ height }}
    >
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left HUD: Time of Day & Camera Angle Presets */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 z-10 pointer-events-auto">
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-xl p-1 shadow-xl">
          <button
            onClick={() => setTimeOfDay('day')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              timeOfDay === 'day'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Día</span>
          </button>
          <button
            onClick={() => setTimeOfDay('sunset')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              timeOfDay === 'sunset'
                ? 'bg-orange-500/25 text-orange-300 border border-orange-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sunset className="w-3.5 h-3.5" />
            <span>Atardecer</span>
          </button>
          <button
            onClick={() => setTimeOfDay('night')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              timeOfDay === 'night'
                ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Noche</span>
          </button>
        </div>

        {/* Camera Angle Buttons */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-xl p-1 shadow-xl text-[11px] font-semibold">
          <button
            onClick={() => applyCameraPreset('panoramic')}
            className={`px-2 py-1 rounded-lg transition-colors ${
              cameraPreset === 'panoramic' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Panorámica
          </button>
          <button
            onClick={() => applyCameraPreset('closeup')}
            className={`px-2 py-1 rounded-lg transition-colors ${
              cameraPreset === 'closeup' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            De Cerca
          </button>
          <button
            onClick={() => applyCameraPreset('street')}
            className={`px-2 py-1 rounded-lg transition-colors ${
              cameraPreset === 'street' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Desde Abajo
          </button>
        </div>
      </div>

      {/* Top Right HUD: Rotation, Zoom & Wireframe */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10 pointer-events-auto">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all ${
            autoRotate
              ? 'bg-sky-500/25 border-sky-400/50 text-sky-200'
              : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <RotateCw
            className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`}
            style={{ animationDuration: '6s' }}
          />
          <span>{autoRotate ? 'Girando' : 'Girar'}</span>
        </button>

        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-1 self-end">
          <button
            onClick={() => handleZoom(0.8)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Acercar 3D"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(1.25)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Alejar 3D"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsWireframe(!isWireframe)}
            className={`p-1.5 rounded-lg ${
              isWireframe ? 'bg-emerald-500/25 text-emerald-300' : 'text-slate-300 hover:text-white'
            }`}
            title="Ver malla poligonal"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Landmark Tag */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-950/85 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>
            Diorama 3D PBR: <strong className="text-white">{landmark.shortTitle}</strong> • Toca y arrastra con el dedo
          </span>
        </div>
      </div>
    </div>
  );
};

export default ThreeLandmarkModel;
