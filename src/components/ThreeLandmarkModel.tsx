import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Landmark } from '../data/landmarks';
import { RotateCw, Sun, Moon, Sunset, Maximize2, Sparkles, Eye } from 'lucide-react';

interface ThreeLandmarkModelProps {
  landmark: Landmark;
  height?: string;
  className?: string;
}

type TimeOfDay = 'day' | 'sunset' | 'night';

export const ThreeLandmarkModel: React.FC<ThreeLandmarkModelProps> = ({
  landmark,
  height = '100%',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('sunset');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);

  // References to keep across renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Lighting updater function
  const updateLighting = (mode: TimeOfDay, scene: THREE.Scene, lightsGroup: THREE.Group) => {
    // Clear previous lights
    while (lightsGroup.children.length > 0) {
      lightsGroup.remove(lightsGroup.children[0]);
    }

    if (mode === 'day') {
      scene.background = new THREE.Color(0x0f172a); // Deep blue sky background for canvas
      scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

      const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 1.2);
      lightsGroup.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.0);
      sunLight.position.set(20, 35, 20);
      sunLight.castShadow = true;
      lightsGroup.add(sunLight);
    } else if (mode === 'sunset') {
      scene.background = new THREE.Color(0x180b26); // Andean sunset violet
      scene.fog = new THREE.FogExp2(0x180b26, 0.018);

      const hemiLight = new THREE.HemisphereLight(0xf472b6, 0x312e81, 0.9);
      lightsGroup.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xfb923c, 2.5); // Golden orange
      sunLight.position.set(30, 15, 10);
      sunLight.castShadow = true;
      lightsGroup.add(sunLight);

      const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
      rimLight.position.set(-20, 10, -20);
      lightsGroup.add(rimLight);
    } else {
      // Night
      scene.background = new THREE.Color(0x030712);
      scene.fog = new THREE.FogExp2(0x030712, 0.022);

      const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x020617, 0.4);
      lightsGroup.add(hemiLight);

      const moonLight = new THREE.DirectionalLight(0x7dd3fc, 1.0);
      moonLight.position.set(15, 30, -15);
      lightsGroup.add(moonLight);

      // Starfield
      const starsGeometry = new THREE.BufferGeometry();
      const starsCount = 400;
      const starPositions = new Float32Array(starsCount * 3);
      for (let i = 0; i < starsCount * 3; i += 3) {
        starPositions[i] = (Math.random() - 0.5) * 120;
        starPositions[i + 1] = Math.random() * 60 + 10;
        starPositions[i + 2] = (Math.random() - 0.5) * 120;
      }
      starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.6,
        transparent: true,
        opacity: 0.8,
      });
      const starPoints = new THREE.Points(starsGeometry, starsMaterial);
      lightsGroup.add(starPoints);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const heightPx = container.clientHeight || 300;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 500);
    camera.position.set(18, 14, 22);
    camera.lookAt(0, 4, 0);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Lights Group
    const lightsGroup = new THREE.Group();
    scene.add(lightsGroup);
    lightsGroupRef.current = lightsGroup;
    updateLighting(timeOfDay, scene, lightsGroup);

    // 4. Model Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Dynamic animation elements
    const dynamicUpdaters: ((delta: number, elapsed: number) => void)[] = [];

    // Helper: Ground base platform
    const createBasePlatform = (radius = 12, color = 0x1e293b) => {
      const baseGeo = new THREE.CylinderGeometry(radius, radius + 1, 1.2, 32);
      const baseMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.8,
        metalness: 0.2,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = -0.6;
      baseMesh.receiveShadow = true;
      modelGroup.add(baseMesh);

      // Argentine Sun Emblem ring
      const ringGeo = new THREE.RingGeometry(radius - 1.5, radius - 0.5, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.3,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.02;
      modelGroup.add(ringMesh);
    };

    // 5. Procedural 3D Models according to landmark type
    const modelType = landmark.threeModelType;

    if (modelType === 'obelisk') {
      createBasePlatform(14, 0x1e293b);

      // Plaza de la República circular pavement
      const plazaGeo = new THREE.CircleGeometry(10, 32);
      const plazaMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.7,
      });
      const plaza = new THREE.Mesh(plazaGeo, plazaMat);
      plaza.rotation.x = -Math.PI / 2;
      plaza.position.y = 0.05;
      modelGroup.add(plaza);

      // Obelisk Shaft (Trunk)
      const shaftGeo = new THREE.CylinderGeometry(0.8, 1.8, 16, 4, 1, false);
      const shaftMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.35,
        metalness: 0.05,
      });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.y = 8;
      shaft.rotation.y = Math.PI / 4;
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      modelGroup.add(shaft);

      // Obelisk Pyramidion Apex
      const apexGeo = new THREE.ConeGeometry(0.8 * Math.SQRT2, 2.2, 4);
      const apexMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.2,
        metalness: 0.1,
      });
      const apex = new THREE.Mesh(apexGeo, apexMat);
      apex.position.y = 17.1;
      apex.rotation.y = Math.PI / 4;
      apex.castShadow = true;
      modelGroup.add(apex);

      // Lightning rod needle at summit
      const rodGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
      const rodMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
      const rod = new THREE.Mesh(rodGeo, rodMat);
      rod.position.y = 18.5;
      modelGroup.add(rod);

      // Argentine Flag on Plaza pole
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 9, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(5.5, 4.5, 0);
      modelGroup.add(pole);

      // Waving Flag with cloth mesh
      const flagWidth = 3;
      const flagHeight = 1.8;
      const flagSegments = 16;
      const flagGeo = new THREE.PlaneGeometry(flagWidth, flagHeight, flagSegments, 8);
      
      // Canvas texture for Argentine flag (Celeste, White, Celeste + Sol de Mayo)
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 160;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#75AADB'; // Celeste argentino
      ctx.fillRect(0, 0, 256, 160);
      ctx.fillStyle = '#FFFFFF'; // White stripe
      ctx.fillRect(0, 53, 256, 54);
      // Sol de mayo
      ctx.fillStyle = '#F4B400';
      ctx.beginPath();
      ctx.arc(128, 80, 16, 0, Math.PI * 2);
      ctx.fill();

      const flagTexture = new THREE.CanvasTexture(canvas);
      const flagMat = new THREE.MeshStandardMaterial({
        map: flagTexture,
        side: THREE.DoubleSide,
        roughness: 0.5,
      });
      const flagMesh = new THREE.Mesh(flagGeo, flagMat);
      flagMesh.position.set(5.5 + flagWidth / 2, 7.8, 0);
      modelGroup.add(flagMesh);

      dynamicUpdaters.push((_delta, elapsed) => {
        const pos = flagGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const u = pos.getX(i);
          const wave = Math.sin(u * 2.5 - elapsed * 5) * 0.25 * (u / flagWidth);
          pos.setZ(i, wave);
        }
        pos.needsUpdate = true;
      });

    } else if (modelType === 'waterfall') {
      createBasePlatform(14, 0x14532d);

      // Basalt tiered gorge
      const gorgeGeo = new THREE.BoxGeometry(16, 8, 8);
      const gorgeMat = new THREE.MeshStandardMaterial({
        color: 0x3f2e21, // Basalt rock
        roughness: 0.9,
      });
      const gorge = new THREE.Mesh(gorgeGeo, gorgeMat);
      gorge.position.set(0, 4, -4);
      modelGroup.add(gorge);

      // River basin water
      const waterGeo = new THREE.PlaneGeometry(16, 12, 16, 16);
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.1,
        metalness: 0.3,
        transparent: true,
        opacity: 0.85,
      });
      const water = new THREE.Mesh(waterGeo, waterMat);
      water.rotation.x = -Math.PI / 2;
      water.position.set(0, 0.2, 2);
      modelGroup.add(water);

      // Cascading water sheets (curtains)
      const curtainCount = 5;
      const waterfalls: THREE.Mesh[] = [];
      for (let i = 0; i < curtainCount; i++) {
        const fallGeo = new THREE.PlaneGeometry(2.4, 7.8, 6, 16);
        const fallMat = new THREE.MeshStandardMaterial({
          color: 0xe0f2fe,
          roughness: 0.2,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
        });
        const fall = new THREE.Mesh(fallGeo, fallMat);
        fall.position.set((i - 2) * 3, 4, -0.1);
        modelGroup.add(fall);
        waterfalls.push(fall);
      }

      // Mist particle system
      const mistGeo = new THREE.BufferGeometry();
      const mistCount = 200;
      const mistPositions = new Float32Array(mistCount * 3);
      for (let i = 0; i < mistCount * 3; i += 3) {
        mistPositions[i] = (Math.random() - 0.5) * 14;
        mistPositions[i + 1] = Math.random() * 5 + 0.5;
        mistPositions[i + 2] = Math.random() * 4 - 1;
      }
      mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPositions, 3));
      const mistMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.8,
        transparent: true,
        opacity: 0.4,
      });
      const mistPoints = new THREE.Points(mistGeo, mistMat);
      modelGroup.add(mistPoints);

      // Rainbow arc above Garganta del Diablo
      const rainbowGeo = new THREE.TorusGeometry(5, 0.15, 8, 32, Math.PI);
      const rainbowMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.6,
      });
      const rainbow = new THREE.Mesh(rainbowGeo, rainbowMat);
      rainbow.position.set(0, 3, 0);
      rainbow.rotation.x = 0.3;
      modelGroup.add(rainbow);

      dynamicUpdaters.push((_delta, elapsed) => {
        // Water waves & mist rise
        const mPos = mistGeo.attributes.position;
        for (let i = 1; i < mistCount * 3; i += 3) {
          mPos.array[i] += 0.05;
          if (mPos.array[i] > 6) mPos.array[i] = 0.5;
        }
        mPos.needsUpdate = true;

        waterfalls.forEach((f, idx) => {
          f.scale.y = 1 + Math.sin(elapsed * 4 + idx) * 0.03;
        });
      });

    } else if (modelType === 'glacier') {
      createBasePlatform(14, 0x0f172a);

      // Deep turquoise glacial lake (Lago Argentino)
      const lakeGeo = new THREE.PlaneGeometry(20, 16);
      const lakeMat = new THREE.MeshStandardMaterial({
        color: 0x0369a1,
        roughness: 0.15,
        metalness: 0.4,
      });
      const lake = new THREE.Mesh(lakeGeo, lakeMat);
      lake.rotation.x = -Math.PI / 2;
      lake.position.y = 0.1;
      modelGroup.add(lake);

      // Massive jagged ice wall blocks
      const iceGroup = new THREE.Group();
      modelGroup.add(iceGroup);

      const iceMat = new THREE.MeshPhysicalMaterial({
        color: 0xbae6fd,
        emissive: 0x0284c7,
        emissiveIntensity: 0.15,
        roughness: 0.1,
        transmission: 0.6,
        thickness: 2.0,
      });

      for (let x = -6; x <= 6; x += 1.8) {
        for (let z = -6; z <= -1; z += 1.5) {
          const height = 4.5 + Math.sin(x * 2 + z) * 1.5 + (z < -3 ? 3 : 0);
          const blockGeo = new THREE.BoxGeometry(1.6, height, 1.4);
          const block = new THREE.Mesh(blockGeo, iceMat);
          block.position.set(x + (Math.random() - 0.5) * 0.4, height / 2, z);
          block.rotation.y = (Math.random() - 0.5) * 0.3;
          block.castShadow = true;
          iceGroup.add(block);
        }
      }

      // Floating Icebergs in front
      const bergMat = new THREE.MeshStandardMaterial({
        color: 0xe0f2fe,
        roughness: 0.2,
      });
      const icebergs: THREE.Mesh[] = [];
      for (let i = 0; i < 6; i++) {
        const bergGeo = new THREE.DodecahedronGeometry(0.6 + Math.random() * 0.5, 0);
        const berg = new THREE.Mesh(bergGeo, bergMat);
        berg.position.set((Math.random() - 0.5) * 10, 0.4, Math.random() * 4 + 2);
        berg.castShadow = true;
        modelGroup.add(berg);
        icebergs.push(berg);
      }

      dynamicUpdaters.push((_delta, elapsed) => {
        icebergs.forEach((berg, i) => {
          berg.position.y = 0.4 + Math.sin(elapsed * 2 + i) * 0.08;
          berg.rotation.y += 0.003;
        });
      });

    } else if (modelType === 'mountain') {
      createBasePlatform(14, 0x1e293b);

      // Mountain terrain peak (Aconcagua / Fitz Roy)
      const peakGeo = new THREE.ConeGeometry(8, 12, 7);
      const peakMat = new THREE.MeshStandardMaterial({
        color: 0x475569, // Granite rock
        roughness: 0.85,
        flatShading: true,
      });
      const peak = new THREE.Mesh(peakGeo, peakMat);
      peak.position.y = 6;
      peak.castShadow = true;
      modelGroup.add(peak);

      // Snow cap at top
      const snowGeo = new THREE.ConeGeometry(4.2, 5.5, 7);
      const snowMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.3,
        metalness: 0.1,
        flatShading: true,
      });
      const snow = new THREE.Mesh(snowGeo, snowMat);
      snow.position.y = 9.25;
      modelGroup.add(snow);

      // Secondary jagged spires (Chaltén style)
      for (let i = 0; i < 4; i++) {
        const spireGeo = new THREE.ConeGeometry(2.5, 8 + i, 5);
        const spire = new THREE.Mesh(spireGeo, peakMat);
        const angle = (i * Math.PI) / 2 + 0.4;
        spire.position.set(Math.cos(angle) * 5, 4 + i * 0.5, Math.sin(angle) * 5);
        spire.castShadow = true;
        modelGroup.add(spire);
      }

      // Circling Cloud Ring
      const cloudsCount = 18;
      const cloudsGroup = new THREE.Group();
      const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        transparent: true,
        opacity: 0.75,
      });
      for (let i = 0; i < cloudsCount; i++) {
        const cloudBall = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9 + Math.random() * 0.5, 1), cloudMat);
        const ang = (i / cloudsCount) * Math.PI * 2;
        const rad = 7.5 + Math.sin(i * 3) * 0.8;
        cloudBall.position.set(Math.cos(ang) * rad, 7 + Math.sin(i) * 0.5, Math.sin(ang) * rad);
        cloudsGroup.add(cloudBall);
      }
      modelGroup.add(cloudsGroup);

      dynamicUpdaters.push((_delta, elapsed) => {
        cloudsGroup.rotation.y = elapsed * 0.15;
      });

    } else if (modelType === 'lighthouse') {
      createBasePlatform(14, 0x0f172a);

      // Beagle Channel rocky islet
      const islandGeo = new THREE.CylinderGeometry(5.5, 7, 2, 8);
      const islandMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.9,
        flatShading: true,
      });
      const island = new THREE.Mesh(islandGeo, islandMat);
      island.position.y = 1;
      modelGroup.add(island);

      // Ocean water plane
      const seaGeo = new THREE.PlaneGeometry(24, 24);
      const seaMat = new THREE.MeshStandardMaterial({
        color: 0x0c4a6e,
        roughness: 0.2,
        metalness: 0.3,
      });
      const sea = new THREE.Mesh(seaGeo, seaMat);
      sea.rotation.x = -Math.PI / 2;
      sea.position.y = 0.2;
      modelGroup.add(sea);

      // Lighthouse base (Red)
      const b1 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 3, 16), new THREE.MeshStandardMaterial({ color: 0xb91c1c }));
      b1.position.y = 3.5;
      b1.castShadow = true;
      modelGroup.add(b1);

      // Middle stripe (White)
      const b2 = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.6, 3, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
      b2.position.y = 6.5;
      b2.castShadow = true;
      modelGroup.add(b2);

      // Top stripe (Red)
      const b3 = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.3, 3, 16), new THREE.MeshStandardMaterial({ color: 0xb91c1c }));
      b3.position.y = 9.5;
      b3.castShadow = true;
      modelGroup.add(b3);

      // Lantern gallery dome
      const lanternMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      const lantern = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.2, 16), lanternMat);
      lantern.position.y = 11.5;
      modelGroup.add(lantern);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), lanternMat);
      dome.position.y = 12.1;
      modelGroup.add(dome);

      // Revolving Spotlight Beam
      const beamGroup = new THREE.Group();
      beamGroup.position.set(0, 11.5, 0);
      modelGroup.add(beamGroup);

      const beamGeo = new THREE.ConeGeometry(5, 22, 16, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.rotation.x = Math.PI / 2;
      beamMesh.position.z = 11;
      beamGroup.add(beamMesh);

      const lightSource = new THREE.PointLight(0xfef08a, 3, 20);
      beamGroup.add(lightSource);

      dynamicUpdaters.push((_delta, elapsed) => {
        beamGroup.rotation.y = elapsed * 1.5; // Revolving beacon
      });

    } else if (modelType === 'canyon') {
      createBasePlatform(14, 0x78350f);

      // Seven Colors / Ischigualasto geological strata layers
      const colors = [0x991b1b, 0xd97706, 0x15803d, 0x7e22ce, 0xb45309, 0xfef08a, 0xbe123c];
      colors.forEach((col, idx) => {
        const layerGeo = new THREE.CylinderGeometry(
          11 - idx * 1.2,
          12 - idx * 1.2,
          1.2,
          16,
          1,
          false
        );
        const layerMat = new THREE.MeshStandardMaterial({
          color: col,
          roughness: 0.9,
          flatShading: true,
        });
        const layer = new THREE.Mesh(layerGeo, layerMat);
        layer.position.y = 0.6 + idx * 1.2;
        layer.castShadow = true;
        modelGroup.add(layer);
      });

      // Cardón cactus in foreground
      const cactusGroup = new THREE.Group();
      cactusGroup.position.set(6, 0, 4);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 3.5, 8), stemMat);
      stem.position.y = 1.75;
      cactusGroup.add(stem);

      const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8), stemMat);
      arm1.position.set(0.6, 2.2, 0);
      cactusGroup.add(arm1);
      modelGroup.add(cactusGroup);

    } else if (modelType === 'saltflat') {
      createBasePlatform(14, 0x334155);

      // Endless salt crust hexagonal tiles
      const saltGeo = new THREE.PlaneGeometry(24, 24, 12, 12);
      const saltMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.15,
        metalness: 0.1,
      });
      const salt = new THREE.Mesh(saltGeo, saltMat);
      salt.rotation.x = -Math.PI / 2;
      salt.position.y = 0.1;
      salt.receiveShadow = true;
      modelGroup.add(salt);

      // Turquoise brine extraction pools
      for (let i = 0; i < 4; i++) {
        const poolGeo = new THREE.BoxGeometry(4, 0.2, 2.8);
        const poolMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          roughness: 0.05,
          metalness: 0.5,
        });
        const pool = new THREE.Mesh(poolGeo, poolMat);
        pool.position.set((i % 2 === 0 ? -4 : 4), 0.15, (i < 2 ? -3 : 3));
        modelGroup.add(pool);
      }

      // Pyramidal Salt heaps (parvas de sal)
      for (let j = 0; j < 5; j++) {
        const coneGeo = new THREE.ConeGeometry(0.9, 1.2, 6);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.set((j - 2) * 2.5, 0.7, 0);
        cone.castShadow = true;
        modelGroup.add(cone);
      }
    } else {
      // Theater or default neoclassical portico
      createBasePlatform(14, 0x1e293b);

      // Grand Columns
      const colMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
      for (let c = -4; c <= 4; c += 2) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 7, 12), colMat);
        col.position.set(c, 3.5, 3);
        col.castShadow = true;
        modelGroup.add(col);
      }

      // Pediment / Triangular roof
      const pedimentGeo = new THREE.ConeGeometry(6, 3, 4);
      const pediment = new THREE.Mesh(pedimentGeo, colMat);
      pediment.position.set(0, 8.5, 3);
      pediment.rotation.y = Math.PI / 4;
      pediment.scale.set(1.4, 1, 0.5);
      modelGroup.add(pediment);

      // Back auditorium block
      const hall = new THREE.Mesh(new THREE.BoxGeometry(11, 8, 8), new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 }));
      hall.position.set(0, 4, -1);
      modelGroup.add(hall);
    }

    // 6. Interactive Drag to Orbit / Rotate controls
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
        cameraRef.current.position.y = Math.max(3, Math.min(30, cameraRef.current.position.y - deltaY * 0.08));
        cameraRef.current.lookAt(0, 4, 0);
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
      if (dist + zoomFactor > 8 && dist + zoomFactor < 50) {
        cameraRef.current.position.multiplyScalar((dist + zoomFactor) / dist);
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // Touch support for mobile/trackpad
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
        if (currentCamDist + diff * 0.05 > 8 && currentCamDist + diff * 0.05 < 50) {
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

    // 7. Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (autoRotate && modelGroupRef.current && !isDragging) {
        modelGroupRef.current.rotation.y += delta * 0.35;
      }

      dynamicUpdaters.forEach((updater) => updater(delta, elapsed));

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Resize observer
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
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
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
      updateLighting(timeOfDay, sceneRef.current, lightsGroupRef.current);
    }
  }, [timeOfDay]);

  const handleResetCamera = () => {
    if (cameraRef.current && modelGroupRef.current) {
      cameraRef.current.position.set(18, 14, 22);
      cameraRef.current.lookAt(0, 4, 0);
      modelGroupRef.current.rotation.set(0, 0, 0);
    }
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-sky-500/20 shadow-2xl ${className}`} style={{ height }}>
      {/* Canvas container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Controls HUD */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-auto">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl p-2.5 shadow-lg text-xs">
          <div className="flex items-center gap-2 text-sky-400 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemelo Digital 3D</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-tight">
            Arrastrá para orbitar • Rueda para zoom
          </p>
        </div>

        {/* Time of day picker */}
        <div className="flex items-center gap-1 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl p-1 shadow-lg">
          <button
            onClick={() => setTimeOfDay('day')}
            title="Luz de Día"
            className={`p-1.5 rounded-lg transition-colors ${
              timeOfDay === 'day' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTimeOfDay('sunset')}
            title="Atardecer Dorado"
            className={`p-1.5 rounded-lg transition-colors ${
              timeOfDay === 'sunset' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sunset className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTimeOfDay('night')}
            title="Noche Austral"
            className={`p-1.5 rounded-lg transition-colors ${
              timeOfDay === 'night' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action buttons (Right HUD) */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 pointer-events-auto">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-md border transition-all ${
            autoRotate
              ? 'bg-sky-500/25 border-sky-400/50 text-sky-200'
              : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
          }`}
          title="Alternar rotación automática"
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          <span>{autoRotate ? 'Pausar' : 'Girar'}</span>
        </button>

        <button
          onClick={() => setIsWireframe(!isWireframe)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-md border transition-all ${
            isWireframe
              ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
              : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
          }`}
          title="Ver malla poligonal 3D"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Malla</span>
        </button>

        <button
          onClick={handleResetCamera}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all self-end"
          title="Restablecer punto de vista"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Landmark Tag */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
          <span>Modelo 3D Interactivo: <strong className="text-white">{landmark.shortTitle}</strong></span>
        </div>
      </div>
    </div>
  );
};
