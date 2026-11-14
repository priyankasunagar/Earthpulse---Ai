import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Eye, EyeOff, Globe2, Orbit, RotateCw, Layers } from 'lucide-react';
import type { BenchmarkRegion } from '../types/earthpulse';
import { CONTINENT_POLYGONS } from '../utils/worldCoastlines';

export type GlobeLayerMode = 'natural' | 'thermal' | 'vegetation';

interface EarthGlobe3DProps {
  selectedLat: number;
  selectedLon: number;
  regionName?: string;
  benchmarkRegions?: BenchmarkRegion[];
  onSelectLocation?: (lat: number, lon: number, matchedBenchmark?: BenchmarkRegion) => void;
  heightClass?: string;
  interactivePicking?: boolean;
  showDock?: boolean;
}

const EARTH_RADIUS = 1.0;

// Shared reusable math helpers (zero per-frame allocations)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();

function latLonToVec3(lat: number, lon: number, radius: number, out = new THREE.Vector3()): THREE.Vector3 {
  const phi = ((lon + 180) / 360) * Math.PI * 2;
  const theta = ((90 - lat) / 180) * Math.PI;
  out.set(
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta)
  );
  return out;
}

function vec3ToLatLon(point: THREE.Vector3): { lat: number; lon: number } {
  const n = point.clone().normalize();
  const theta = Math.acos(THREE.MathUtils.clamp(n.y, -1, 1));
  const lat = 90 - THREE.MathUtils.radToDeg(theta);
  let phi = Math.atan2(n.z, -n.x);
  if (phi < 0) phi += Math.PI * 2;
  const lon = (phi / (Math.PI * 2)) * 360 - 180;
  return {
    lat: Number(lat.toFixed(4)),
    lon: Number(lon.toFixed(4)),
  };
}

function buildEarthCanvasTexture(mode: GlobeLayerMode, showGraticule: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  // Deep ocean bathymetric gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  if (mode === 'thermal') {
    oceanGrad.addColorStop(0, '#091529');
    oceanGrad.addColorStop(0.5, '#0c2342');
    oceanGrad.addColorStop(1, '#091529');
  } else if (mode === 'vegetation') {
    oceanGrad.addColorStop(0, '#070f1d');
    oceanGrad.addColorStop(0.5, '#09182b');
    oceanGrad.addColorStop(1, '#070f1d');
  } else {
    oceanGrad.addColorStop(0, '#081b33');
    oceanGrad.addColorStop(0.25, '#0a2647');
    oceanGrad.addColorStop(0.5, '#0b2d52');
    oceanGrad.addColorStop(0.75, '#0a2647');
    oceanGrad.addColorStop(1, '#081b33');
  }
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle oceanic circulation & shelf bands
  for (let i = 0; i < 65; i++) {
    const cx = ((i * 313) % w);
    const cy = ((i * 197) % h);
    const rx = 80 + ((i * 47) % 180);
    const ry = 35 + ((i * 29) % 90);
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, rx);
    g.addColorStop(0, mode === 'thermal' ? 'rgba(14, 116, 144, 0.14)' : 'rgba(14, 165, 233, 0.09)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw continents accurately from lon/lat polygons
  for (const poly of CONTINENT_POLYGONS) {
    ctx.save();
    ctx.beginPath();
    poly.ring.forEach(([lon, lat], idx) => {
      const px = ((lon + 180) / 360) * w;
      const py = ((90 - lat) / 180) * h;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();

    // Soft continental shelf glow
    ctx.lineWidth = 10;
    ctx.strokeStyle =
      mode === 'thermal'
        ? 'rgba(56, 189, 248, 0.14)'
        : 'rgba(6, 182, 212, 0.16)';
    ctx.stroke();

    // Biome/layer-specific landmass fill
    if (mode === 'thermal') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#38bdf8');
      g.addColorStop(0.25, '#22d3ee');
      g.addColorStop(0.42, '#f59e0b');
      g.addColorStop(0.5, '#ef4444');
      g.addColorStop(0.62, '#f59e0b');
      g.addColorStop(0.85, '#38bdf8');
      g.addColorStop(1, '#bae6fd');
      ctx.fillStyle = poly.biome === 'polar' ? '#7dd3fc' : g;
    } else if (mode === 'vegetation') {
      if (poly.biome === 'polar') ctx.fillStyle = '#334155';
      else if (poly.biome === 'arid') ctx.fillStyle = '#5c4d32';
      else if (poly.biome === 'tropical') ctx.fillStyle = '#15803d';
      else ctx.fillStyle = '#166534';
    } else {
      if (poly.biome === 'polar') ctx.fillStyle = '#cbd5e1';
      else if (poly.biome === 'arid') ctx.fillStyle = '#8c7250';
      else if (poly.biome === 'tropical') ctx.fillStyle = '#1e523a';
      else ctx.fillStyle = '#275341';
    }
    ctx.fill();

    // Crisp coastline outline
    ctx.lineWidth = 1.6;
    ctx.strokeStyle =
      mode === 'thermal'
        ? 'rgba(255, 255, 255, 0.35)'
        : 'rgba(103, 232, 249, 0.45)';
    ctx.stroke();
    ctx.restore();
  }

  // Fine terrain & cloud texture micro-variation inside landmasses
  for (let i = 0; i < 900; i++) {
    const px = ((i * 7919) % w);
    const py = ((i * 3571) % h);
    const rad = 2 + (i % 5);
    ctx.fillStyle =
      mode === 'thermal'
        ? 'rgba(251, 191, 36, 0.05)'
        : mode === 'vegetation'
        ? 'rgba(74, 222, 128, 0.05)'
        : 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Optional scientific lat/lon graticule
  if (showGraticule) {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 1;
    for (let lon = -150; lon <= 180; lon += 30) {
      const x = ((lon + 180) / 360) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = ((90 - lat) / 180) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Equator highlight
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.32)';
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  }

  return canvas;
}

/** Composite 6-part procedural Earth Observation Satellite (THREE.Group) */
function createSatelliteModel(accentHex: number): THREE.Group {
  const sat = new THREE.Group();

  // 1. Primary Spacecraft Bus (Gold MLI thermal foil)
  const busGeo = new THREE.BoxGeometry(0.032, 0.024, 0.044);
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4a024,
    metalness: 0.88,
    roughness: 0.28,
  });
  const bus = new THREE.Mesh(busGeo, goldMat);
  sat.add(bus);

  // 2. Solar Wing Boom & Dual Photovoltaic Arrays
  const boomGeo = new THREE.CylinderGeometry(0.0025, 0.0025, 0.16, 8);
  boomGeo.rotateZ(Math.PI / 2);
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.25,
  });
  sat.add(new THREE.Mesh(boomGeo, metalMat));

  const panelGeo = new THREE.BoxGeometry(0.06, 0.003, 0.028);
  const solarMat = new THREE.MeshStandardMaterial({
    color: 0x0f2b5c,
    metalness: 0.72,
    roughness: 0.18,
  });
  const leftPanel = new THREE.Mesh(panelGeo, solarMat);
  leftPanel.position.set(-0.055, 0, 0);
  const rightPanel = new THREE.Mesh(panelGeo, solarMat);
  rightPanel.position.set(0.055, 0, 0);
  sat.add(leftPanel, rightPanel);

  // 3. Nadir Optical/Thermal Radiometer Aperture Barrel
  const barrelGeo = new THREE.CylinderGeometry(0.01, 0.012, 0.018, 14);
  const darkHousingMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.65,
    roughness: 0.45,
  });
  const barrel = new THREE.Mesh(barrelGeo, darkHousingMat);
  barrel.position.set(0, -0.018, 0.006);
  sat.add(barrel);

  // 4. High-Gain Parabolic Dish (LatheGeometry)
  const dishPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.006, 0.0015),
    new THREE.Vector2(0.012, 0.0055),
    new THREE.Vector2(0.015, 0.011),
  ];
  const dishGeo = new THREE.LatheGeometry(dishPoints, 16);
  const dishMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.55,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });
  const dish = new THREE.Mesh(dishGeo, dishMat);
  dish.position.set(0, 0.017, -0.012);
  dish.rotation.x = Math.PI * 0.15;
  sat.add(dish);

  // 5. Nadir Telemetry Scan Swath Cone (subtle translucent beam)
  const swathGeo = new THREE.ConeGeometry(0.065, 0.24, 16, 1, true);
  const swathMat = new THREE.MeshBasicMaterial({
    color: accentHex,
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const swath = new THREE.Mesh(swathGeo, swathMat);
  swath.position.set(0, -0.14, 0.006);
  swath.name = 'swathCone';
  sat.add(swath);

  return sat;
}

export const EarthGlobe3D: React.FC<EarthGlobe3DProps> = ({
  selectedLat,
  selectedLon,
  regionName,
  benchmarkRegions = [],
  onSelectLocation,
  heightClass = 'h-[560px]',
  interactivePicking = true,
  showDock = true,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onSelectRef = useRef(onSelectLocation);
  onSelectRef.current = onSelectLocation;
  const benchmarksRef = useRef(benchmarkRegions);
  benchmarksRef.current = benchmarkRegions;

  const [webglFailed, setWebglFailed] = useState(false);
  const [layerMode, setLayerMode] = useState<GlobeLayerMode>('natural');
  const [showGraticule, setShowGraticule] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [dockVisible, setDockVisible] = useState(true);

  const controlsStateRef = useRef({
    layerMode: 'natural' as GlobeLayerMode,
    showGraticule: true,
    showOrbits: true,
    autoRotate: true,
  });
  controlsStateRef.current = { layerMode, showGraticule, showOrbits, autoRotate };

  const sceneRefs = useRef<{
    earthMat?: THREE.MeshStandardMaterial;
    earthMesh?: THREE.Mesh;
    maxAnisotropy?: number;
    orbitGroup?: THREE.Group;
    markerGroup?: THREE.Group;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    focusActive: boolean;
    targetLookVec: THREE.Vector3;
  }>({
    focusActive: false,
    targetLookVec: new THREE.Vector3(0, 0, 2.7),
  });

  // Update procedural texture when layer mode or graticule changes
  useEffect(() => {
    const { earthMat, maxAnisotropy } = sceneRefs.current;
    if (!earthMat) return;
    const canvas = buildEarthCanvasTexture(layerMode, showGraticule);
    const nextTex = new THREE.CanvasTexture(canvas);
    nextTex.colorSpace = THREE.SRGBColorSpace;
    nextTex.anisotropy = maxAnisotropy ?? 4;
    nextTex.needsUpdate = true;
    const oldTex = earthMat.map;
    earthMat.map = nextTex;
    earthMat.needsUpdate = true;
    oldTex?.dispose();
  }, [layerMode, showGraticule]);

  // Update orbit visibility
  useEffect(() => {
    if (sceneRefs.current.orbitGroup) {
      sceneRefs.current.orbitGroup.visible = showOrbits;
    }
  }, [showOrbits]);

  // Update target marker position & trigger smooth exponential camera glide
  useEffect(() => {
    const { markerGroup, camera } = sceneRefs.current;
    if (!markerGroup || !camera) return;

    latLonToVec3(selectedLat, selectedLon, EARTH_RADIUS * 1.008, _v1);
    markerGroup.position.copy(_v1);
    markerGroup.lookAt(0, 0, 0);

    // Smooth camera target toward selected hemisphere keeping current distance
    const dist = Math.max(1.9, Math.min(3.4, camera.position.length()));
    latLonToVec3(selectedLat, selectedLon, dist, sceneRefs.current.targetLookVec);
    sceneRefs.current.focusActive = true;
  }, [selectedLat, selectedLon]);

  // Initialize Three.js WebGL scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2') || probe.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: true,
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    const width = Math.max(300, container.clientWidth);
    const height = Math.max(300, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);
    scene.fog = new THREE.FogExp2(0x07090e, 0.035);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    latLonToVec3(selectedLat, selectedLon, 2.65, camera.position);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 1.55;
    controls.maxDistance = 4.5;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.65;

    controls.addEventListener('start', () => {
      sceneRefs.current.focusActive = false;
    });

    // Studio & Solar Lighting Rig (warm solar key + cool fill + rim)
    const hemiLight = new THREE.HemisphereLight(0x67e8f9, 0x0f172a, 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff6e5, 2.2);
    sunLight.position.set(5, 2.2, 4);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 0.9);
    rimLight.position.set(-4, -1.5, -3);
    scene.add(rimLight);

    // Background Starfield (InstancedMesh > 20 items)
    const starCount = 450;
    const starGeo = new THREE.OctahedronGeometry(0.015, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xcbd5e1 });
    const stars = new THREE.InstancedMesh(starGeo, starMat, starCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < starCount; i++) {
      const r = 18 + (i % 15);
      const theta = Math.acos(1 - (2 * (i + 0.5)) / starCount);
      const phi = Math.PI * (1 + Math.sqrt(5)) * i;
      dummy.position.set(
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.cos(theta),
        r * Math.sin(theta) * Math.sin(phi)
      );
      const s = 0.4 + ((i * 17) % 10) * 0.09;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      stars.setMatrixAt(i, dummy.matrix);
    }
    stars.computeBoundingSphere();
    scene.add(stars);

    // Earth Sphere Mesh
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const earthCanvas = buildEarthCanvasTexture(
      controlsStateRef.current.layerMode,
      controlsStateRef.current.showGraticule
    );
    const earthTexture = new THREE.CanvasTexture(earthCanvas);
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthTexture.anisotropy = maxAniso;

    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 72, 48);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.62,
      metalness: 0.08,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    // Rayleigh Atmospheric Fresnel Halo Shader
    const atmoGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.045, 64, 48);
    const atmoMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float rim = pow(0.65 - dot(vNormal, -viewDir), 3.0);
          vec3 col = mix(vec3(0.02, 0.45, 0.78), vec3(0.13, 0.83, 0.93), clamp(rim, 0.0, 1.0));
          gl_FragColor = vec4(col, clamp(rim * 0.85, 0.0, 0.65));
        }
      `,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    // Benchmark Pins
    const pinsGroup = new THREE.Group();
    for (const reg of benchmarksRef.current) {
      const pinGeo = new THREE.SphereGeometry(0.016, 12, 12);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      latLonToVec3(reg.lat, reg.lon, EARTH_RADIUS * 1.006, pin.position);
      pin.userData.benchmark = reg;
      pinsGroup.add(pin);
    }
    scene.add(pinsGroup);

    // Selected Location Target Reticle
    const markerGroup = new THREE.Group();
    const ringGeo = new THREE.RingGeometry(0.028, 0.04, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    const dotGeo = new THREE.SphereGeometry(0.012, 12, 12);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    markerGroup.add(ring, new THREE.Mesh(dotGeo, dotMat));
    latLonToVec3(selectedLat, selectedLon, EARTH_RADIUS * 1.008, markerGroup.position);
    markerGroup.lookAt(0, 0, 0);
    scene.add(markerGroup);

    // Orbital Rings & 4 Composite NASA Satellites
    const orbitGroup = new THREE.Group();
    const orbitConfigs = [
      { name: 'Terra (MODIS)', radius: 1.24, incl: 1.71, asc: 0.4, speed: 0.32, color: 0x22d3ee },
      { name: 'Aqua (MODIS)', radius: 1.26, incl: 1.71, asc: 2.1, speed: 0.29, color: 0x38bdf8 },
      { name: 'GPM Core', radius: 1.18, incl: 1.13, asc: -0.9, speed: 0.38, color: 0xf59e0b },
      { name: 'Suomi-NPP', radius: 1.31, incl: 1.72, asc: 1.2, speed: 0.26, color: 0x34d399 },
    ];

    const satellites: Array<{ pivot: THREE.Group; sat: THREE.Group; speed: number; radius: number }> = [];

    for (const cfg of orbitConfigs) {
      const planeGroup = new THREE.Group();
      planeGroup.rotation.y = cfg.asc;
      planeGroup.rotation.x = cfg.incl - Math.PI / 2;

      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * cfg.radius, 0, Math.sin(a) * cfg.radius));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.25,
      });
      planeGroup.add(new THREE.LineLoop(lineGeo, lineMat));

      const satPivot = new THREE.Group();
      const satModel = createSatelliteModel(cfg.color);
      satModel.position.set(cfg.radius, 0, 0);
      satModel.lookAt(0, 0, 0);
      satModel.rotateX(Math.PI / 2);
      satPivot.add(satModel);
      planeGroup.add(satPivot);

      orbitGroup.add(planeGroup);
      satellites.push({ pivot: satPivot, sat: satModel, speed: cfg.speed, radius: cfg.radius });
    }
    scene.add(orbitGroup);

    sceneRefs.current = {
      earthMat,
      earthMesh,
      maxAnisotropy: maxAniso,
      orbitGroup,
      markerGroup,
      camera,
      controls,
      focusActive: false,
      targetLookVec: camera.position.clone(),
    };

    // Pre-warm shaders when hardware WebGL
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting on pointer click (distinguishing click vs orbit drag)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!interactivePicking || !onSelectRef.current) return;
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (Math.hypot(dx, dy) > 6) return; // Dragged, not clicked

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      // Check benchmark pins first
      const pinHits = raycaster.intersectObjects(pinsGroup.children, false);
      if (pinHits.length > 0) {
        const bm = pinHits[0].object.userData.benchmark as BenchmarkRegion | undefined;
        if (bm) {
          onSelectRef.current(bm.lat, bm.lon, bm);
          return;
        }
      }

      const earthHits = raycaster.intersectObject(earthMesh, false);
      if (earthHits.length > 0) {
        const { lat, lon } = vec3ToLatLon(earthHits[0].point);
        onSelectRef.current(lat, lon);
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    // Keyboard shortcut 'H' for Zen mode dock toggle
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'h' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        setDockVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // ResizeObserver
    const resizeObs = new ResizeObserver(() => {
      const nw = Math.max(300, container.clientWidth);
      const nh = Math.max(300, container.clientHeight);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    resizeObs.observe(container);

    // Animation loop with software WebGL afterDraw pacing
    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync && gl.deleteSync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const delta = Math.min(0.1, clock.getDelta());

      // Advance orbiting satellites
      for (const s of satellites) {
        s.pivot.rotation.y += s.speed * delta;
      }

      // Smooth camera transition to selected target (canceled by user interaction)
      if (sceneRefs.current.focusActive) {
        _v2.copy(sceneRefs.current.targetLookVec);
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _v2.x, 4.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _v2.y, 4.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _v2.z, 4.5, delta);
        camera.lookAt(0, 0, 0);
        if (camera.position.distanceTo(_v2) < 0.015) {
          sceneRefs.current.focusActive = false;
        }
      } else if (controlsStateRef.current.autoRotate) {
        // Gentle orbital camera drift around Earth axis
        const angle = delta * 0.08;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const nx = camera.position.x * cosA - camera.position.z * sinA;
        const nz = camera.position.x * sinA + camera.position.z * cosA;
        camera.position.x = nx;
        camera.position.z = nz;
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObs.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      controls.dispose();
      earthGeo.dispose();
      earthMat.map?.dispose();
      earthMat.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative w-full overflow-hidden rounded-lg border border-slate-800 bg-[#07090E] ${heightClass}`}>
      {webglFailed ? (
        <div className="relative h-full w-full">
          <img
            src="/src/assets/images/earth_orbit_limb_1794592682774.jpg"
            alt="Earth observation limb from low-Earth orbit"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-transparent to-transparent" />
        </div>
      ) : (
        <div ref={mountRef} className="h-full w-full cursor-crosshair" />
      )}

      {/* Minimal Top-Left Coordinate Readout (solid rgba, zero backdrop-filter) */}
      <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-slate-800 bg-[#0B101B]/90 px-3 py-2 text-xs">
        <div className="font-mono text-cyan-400">
          {selectedLat.toFixed(4)}° N, {selectedLon.toFixed(4)}° E
        </div>
        {regionName && (
          <div className="mt-0.5 text-slate-300 truncate max-w-[260px]">{regionName}</div>
        )}
      </div>

      {/* Collapsible Bottom Control Dock (threejs §5) */}
      {showDock && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
          <button
            type="button"
            onClick={() => setDockVisible((v) => !v)}
            className="mb-1.5 flex items-center gap-1.5 rounded border border-slate-800 bg-[#0B101B]/95 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-cyan-400 cursor-pointer whitespace-nowrap"
          >
            {dockVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            <span>{dockVisible ? 'Hide Controls (H)' : 'Show Controls (H)'}</span>
          </button>

          {dockVisible && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-[#0B101B]/95 px-3 py-2">
              <div className="flex items-center gap-1 rounded border border-slate-800 bg-[#07090E] p-0.5">
                <span className="px-2 text-[11px] text-slate-400 flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Layer
                </span>
                {(
                  [
                    { id: 'natural', label: 'True Color' },
                    { id: 'thermal', label: 'Thermal IR' },
                    { id: 'vegetation', label: 'NDVI Canopy' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setLayerMode(m.id)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      layerMode === m.id
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowOrbits((v) => !v)}
                className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  showOrbits
                    ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                    : 'border-slate-800 bg-[#07090E] text-slate-400'
                }`}
              >
                <Orbit className="h-3.5 w-3.5" />
                <span>Satellites</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGraticule((v) => !v)}
                className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  showGraticule
                    ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                    : 'border-slate-800 bg-[#07090E] text-slate-400'
                }`}
              >
                <Globe2 className="h-3.5 w-3.5" />
                <span>Graticule</span>
              </button>

              <button
                type="button"
                onClick={() => setAutoRotate((v) => !v)}
                className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  autoRotate
                    ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                    : 'border-slate-800 bg-[#07090E] text-slate-400'
                }`}
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Spin</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
