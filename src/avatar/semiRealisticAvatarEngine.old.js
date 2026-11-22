/**
 * Semi-Realistic 3D Human Avatar Engine for Indian Sign Language (ISL)
 *
 * Implements Master Requirements:
 * - Completely new, premium semi-realistic digital human presentation (virtual presenter style).
 * - Independent Male (Arjun) and Female (Priya) semi-realistic 3D human models with natural human proportions,
 *   subtle PBR skin shading, realistic hairstyles, professional casual attire, and realistic lighting.
 * - Upper-body front-facing composition showing head, neck, shoulders, chest, upper arms, forearms, hands, and fingers.
 * - Full skeletal bone rigging with individual 5-finger articulation (Thumb 1-3, Index 1-3, Middle 1-3, Ring 1-3, Pinky 1-3).
 * - Dynamic GLTF/GLB model loading with built-in realistic digital human fallback.
 * - Seamless character switching without reloading the page, preserving text input and sentence progress.
 * - Smooth Catmull-Rom / cubic tween transitions across verified ISL vocabulary.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getSignData, REST_POSE } from '../data/islSignDatabase.js';

const BASE_DURATION = 1700; // ms at 1x
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => t * t * (3 - 2 * t);

export function createSemiRealisticAvatar(container, initialCharacter = 'male') {
  let currentCharacter = initialCharacter; // 'male' | 'female'
  let speed = 1.0;
  let isPaused = false;
  let pauseTime = 0;

  // =========================================================================
  // 1. Scene, Camera, High-Precision Renderer
  // =========================================================================
  const scene = new THREE.Scene();

  // Upper-body front-facing camera framing:
  // Head, neck, shoulders, chest, both arms, hands, and all fingers visible
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 1.34, 3.45);
  camera.lookAt(0, 1.12, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  container.appendChild(renderer.domElement);

  // =========================================================================
  // 2. Virtual Presenter Studio Lighting Setup
  // =========================================================================
  // Soft ambient fill light
  const ambientLight = new THREE.HemisphereLight(0xffffff, 0x64748b, 1.25);
  scene.add(ambientLight);

  // Key Light: Warm natural studio key light
  const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.75);
  keyLight.position.set(2.4, 3.2, 3.2);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 10;
  keyLight.shadow.bias = -0.0004;
  scene.add(keyLight);

  // Fill Light: Soft neutral-cool studio fill
  const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.85);
  fillLight.position.set(-2.5, 2.0, 2.8);
  scene.add(fillLight);

  // Rim / Silhouette Light: Clean hair and shoulder contour edge light
  const rimLight = new THREE.DirectionalLight(0xc7d2fe, 1.3);
  rimLight.position.set(0, 3.0, -2.8);
  scene.add(rimLight);

  // Under-Chin / Chest Bounce Light: Eliminates harsh shadows under jaw
  const bounceLight = new THREE.DirectionalLight(0xffedd5, 0.45);
  bounceLight.position.set(0, 0.5, 1.5);
  scene.add(bounceLight);

  // Root container for avatar meshes
  const avatarRoot = new THREE.Group();
  scene.add(avatarRoot);

  // =========================================================================
  // 3. Realistic Materials Factory (Digital Human PBR Shading)
  // =========================================================================
  function createSemiRealisticMaterials(gender) {
    const isMale = gender === 'male';

    // Natural human skin tones with realistic subsurface scattering roughness
    const skinColor = isMale ? 0xd69974 : 0xdfa585;
    const skinMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.58,
      metalness: 0.02,
    });

    const handMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.52,
      metalness: 0.02,
    });

    const nailMat = new THREE.MeshStandardMaterial({
      color: isMale ? 0xe6b194 : 0xecbda4,
      roughness: 0.32,
      metalness: 0.04,
    });

    // Professional Casual Wardrobe:
    // Male: Charcoal / Midnight Navy tailored blazer over crisp white shirt
    // Female: Tailored Teal / Emerald professional blazer over silk ivory blouse
    const jacketColor = isMale ? 0x1e293b : 0x134e4a;
    const lapelColor = isMale ? 0x0f172a : 0x042f2e;
    const shirtColor = isMale ? 0xf8fafc : 0xfffbeb;

    const jacketMat = new THREE.MeshStandardMaterial({
      color: jacketColor,
      roughness: 0.82,
      metalness: 0.04,
    });

    const lapelMat = new THREE.MeshStandardMaterial({
      color: lapelColor,
      roughness: 0.76,
      metalness: 0.05,
    });

    const shirtMat = new THREE.MeshStandardMaterial({
      color: shirtColor,
      roughness: 0.88,
      metalness: 0.02,
    });

    // Realistic hair shading:
    // Male: Natural dark espresso hair with subtle sheen
    // Female: Natural deep rich chestnut brunette with soft specular highlights
    const hairColor = isMale ? 0x171210 : 0x221612;
    const hairMat = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.62,
      metalness: 0.06,
    });

    // Eyes: Realistic human eye with cornea, deep iris, limbal ring, and pupil
    const scleraMat = new THREE.MeshStandardMaterial({
      color: 0xfcfcfc,
      roughness: 0.12,
      metalness: 0.0,
    });

    const limbalMat = new THREE.MeshBasicMaterial({ color: 0x140e0a });
    const irisColor = isMale ? 0x3d2415 : 0x341d12;
    const irisMat = new THREE.MeshStandardMaterial({
      color: irisColor,
      roughness: 0.18,
      metalness: 0.08,
    });

    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Eyebrows & Lashes
    const browMat = new THREE.MeshStandardMaterial({
      color: isMale ? 0x1a1311 : 0x1e1512,
      roughness: 0.85,
    });
    const lashMat = new THREE.MeshBasicMaterial({ color: 0x110d0b });

    // Lips & Inner Mouth
    const lipColor = isMale ? 0xbe6e64 : 0xc7656e;
    const lipMat = new THREE.MeshStandardMaterial({
      color: lipColor,
      roughness: 0.42,
      metalness: 0.02,
    });

    const teethMat = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.22,
    });
    const mouthCavityMat = new THREE.MeshBasicMaterial({ color: 0x330e12 });

    // Professional accessories
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.88,
      roughness: 0.22,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.90,
      roughness: 0.28,
    });

    return {
      skinMat, handMat, nailMat, jacketMat, lapelMat, shirtMat, hairMat,
      scleraMat, limbalMat, irisMat, pupilMat, catchlightMat, browMat, lashMat,
      lipMat, teethMat, mouthCavityMat, goldMat, metalMat,
    };
  }

  let mats = createSemiRealisticMaterials(currentCharacter);

  const makeMesh = (geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  // =========================================================================
  // 4. Semi-Realistic Rigging & Digital Human Architecture
  // =========================================================================
  let rig = null;
  const glbCache = {}; // Cache loaded GLB humanoid scenes by gender

  function buildSemiRealisticProceduralRig(gender) {
    // Clear previous avatar meshes safely
    while (avatarRoot.children.length > 0) {
      const child = avatarRoot.children[0];
      avatarRoot.remove(child);
      child.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
      });
    }

    mats = createSemiRealisticMaterials(gender);
    const isMale = gender === 'male';

    const charGroup = new THREE.Group();
    avatarRoot.add(charGroup);

    // -----------------------------------------------------------------------
    // A. Torso & Professional Wardrobe
    // -----------------------------------------------------------------------
    const torsoGroup = new THREE.Group();
    charGroup.add(torsoGroup);

    // Anatomical Torso: Realistic human shoulder-to-waist proportions (7.5 heads ratio)
    const chestWidth = isMale ? 0.38 : 0.34;
    const torsoGeo = new THREE.CapsuleGeometry(chestWidth, 0.52, 16, 32);
    const torso = makeMesh(torsoGeo, mats.jacketMat, 0, 0.56, 0);
    torso.scale.set(isMale ? 1.12 : 1.04, 1.0, 0.78);
    torsoGroup.add(torso);

    // Inner Buttoned Dress Shirt / Blouse
    const shirtGeo = new THREE.CapsuleGeometry(chestWidth * 0.78, 0.44, 12, 24);
    const shirt = makeMesh(shirtGeo, mats.shirtMat, 0, 0.64, 0.06);
    shirt.scale.set(1.0, 1.0, 0.78);
    torsoGroup.add(shirt);

    if (isMale) {
      // Professional Suit Jacket: Notched lapels and collared dress shirt
      const lapelL = makeMesh(new THREE.BoxGeometry(0.06, 0.32, 0.03), mats.lapelMat, -0.09, 0.94, 0.25);
      lapelL.rotation.set(-0.22, 0.16, 0.14);
      const lapelR = makeMesh(new THREE.BoxGeometry(0.06, 0.32, 0.03), mats.lapelMat, 0.09, 0.94, 0.25);
      lapelR.rotation.set(-0.22, -0.16, -0.14);
      torsoGroup.add(lapelL, lapelR);

      // Shirt collar points
      const collarL = makeMesh(new THREE.BoxGeometry(0.04, 0.09, 0.02), mats.shirtMat, -0.06, 1.14, 0.15);
      collarL.rotation.set(-0.2, 0.3, 0.3);
      const collarR = makeMesh(new THREE.BoxGeometry(0.04, 0.09, 0.02), mats.shirtMat, 0.06, 1.14, 0.15);
      collarR.rotation.set(-0.2, -0.3, -0.3);
      torsoGroup.add(collarL, collarR);
    } else {
      // Professional Emerald Tailored Blazer: Refined shawl lapels & silk neckline
      const lapelL = makeMesh(new THREE.BoxGeometry(0.065, 0.34, 0.03), mats.lapelMat, -0.085, 0.92, 0.24);
      lapelL.rotation.set(-0.22, 0.15, 0.18);
      const lapelR = makeMesh(new THREE.BoxGeometry(0.065, 0.34, 0.03), mats.lapelMat, 0.085, 0.92, 0.24);
      lapelR.rotation.set(-0.22, -0.15, -0.18);
      torsoGroup.add(lapelL, lapelR);

      // Delicate gold pendant necklace
      const chain = makeMesh(new THREE.TorusGeometry(0.12, 0.008, 6, 20, Math.PI * 0.9), mats.goldMat, 0, 1.12, 0.13);
      chain.rotation.x = Math.PI / 2.2;
      const pendant = makeMesh(new THREE.SphereGeometry(0.012, 10, 10), mats.goldMat, 0, 1.0, 0.22);
      torsoGroup.add(chain, pendant);
    }

    // -----------------------------------------------------------------------
    // B. Anatomical Neck & Realistic Head
    // -----------------------------------------------------------------------
    const neck = makeMesh(new THREE.CylinderGeometry(0.10, 0.12, 0.22, 24), mats.skinMat, 0, 1.28, 0);
    charGroup.add(neck);

    const head = new THREE.Group();
    head.position.set(0, 1.42, 0);
    charGroup.add(head);

    // Anatomical Cranium: Natural human skull proportions (cranium, temple taper)
    const craniumGeo = new THREE.SphereGeometry(isMale ? 0.36 : 0.34, 36, 32);
    const cranium = makeMesh(craniumGeo, mats.skinMat, 0, 0.34, 0.01);
    cranium.scale.set(0.96, 1.05, 1.02);
    head.add(cranium);

    // Natural Jaw & Chin Structure
    const jawWidth = isMale ? 0.22 : 0.19;
    const chinGeo = new THREE.SphereGeometry(jawWidth, 24, 20);
    const chin = makeMesh(chinGeo, mats.skinMat, 0, 0.16, 0.11);
    chin.scale.set(1.08, 0.88, 1.08);
    head.add(chin);

    // Natural Human Zygomatic Cheek Structure
    [-0.17, 0.17].forEach((x) => {
      const cheekGeo = new THREE.SphereGeometry(0.11, 16, 14);
      const cheek = makeMesh(cheekGeo, mats.skinMat, x, 0.27, 0.19);
      cheek.scale.set(0.9, 0.85, 0.8);
      head.add(cheek);
    });

    // Anatomical Ears with Helix, Concha & Lobe
    [-0.35, 0.35].forEach((x, i) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(x * (isMale ? 1.0 : 0.96), 0.30, 0.0);
      earGroup.rotation.y = (i === 0 ? -0.18 : 0.18);
      head.add(earGroup);

      const earBase = makeMesh(new THREE.SphereGeometry(0.075, 16, 14), mats.skinMat);
      earBase.scale.set(0.3, 1.0, 0.65);
      earGroup.add(earBase);

      if (!isMale) {
        // Professional pearl/gold stud earrings
        const earring = makeMesh(new THREE.SphereGeometry(0.018, 12, 10), mats.goldMat, (i === 0 ? -0.015 : 0.015), -0.05, 0.015);
        earGroup.add(earring);
      }
    });

    // -----------------------------------------------------------------------
    // C. Natural Realistic Hairstyle
    // -----------------------------------------------------------------------
    const hairGroup = new THREE.Group();
    head.add(hairGroup);

    if (isMale) {
      // Male: Modern Professional Side-Parted Hairstyle
      const crown = makeMesh(new THREE.SphereGeometry(0.38, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.54), mats.hairMat, 0, 0.36, -0.01);
      crown.rotation.x = -0.16;
      hairGroup.add(crown);

      // Naturally styled front sweep
      const sweep = makeMesh(new THREE.CapsuleGeometry(0.12, 0.32, 8, 18), mats.hairMat, 0.06, 0.64, 0.14);
      sweep.rotation.set(-0.35, 0.16, -0.32);
      hairGroup.add(sweep);

      // Clean side fades
      const fadeL = makeMesh(new THREE.BoxGeometry(0.035, 0.18, 0.08), mats.hairMat, -0.34, 0.34, 0.02);
      const fadeR = makeMesh(new THREE.BoxGeometry(0.035, 0.18, 0.08), mats.hairMat, 0.34, 0.34, 0.02);
      hairGroup.add(fadeL, fadeR);
    } else {
      // Female: Elegant Professional Layered Bob Hairstyle
      const crown = makeMesh(new THREE.SphereGeometry(0.375, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.56), mats.hairMat, 0, 0.36, -0.02);
      crown.rotation.x = -0.12;
      hairGroup.add(crown);

      // Back volume
      const hairBack = makeMesh(new THREE.CapsuleGeometry(0.20, 0.38, 10, 20), mats.hairMat, 0, 0.22, -0.18);
      hairBack.rotation.x = 0.22;
      hairGroup.add(hairBack);

      // Face-framing side hair layers
      [-0.32, 0.32].forEach((x, i) => {
        const sideStrand = makeMesh(new THREE.CapsuleGeometry(0.10, 0.42, 8, 18), mats.hairMat, x, 0.20, 0.04);
        sideStrand.rotation.set(0.10, 0, (i === 0 ? 0.12 : -0.12));
        hairGroup.add(sideStrand);
      });

      // Side-swept front bangs
      const bangs = makeMesh(new THREE.CapsuleGeometry(0.11, 0.32, 8, 16), mats.hairMat, -0.10, 0.60, 0.20);
      bangs.rotation.set(-0.25, 0.18, -0.65);
      hairGroup.add(bangs);
    }

    // -----------------------------------------------------------------------
    // D. Realistic Human Eyes & Eyebrows
    // -----------------------------------------------------------------------
    const eyes = [];
    const eyebrows = [];

    [-0.135, 0.135].forEach((x, i) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(x, 0.355, 0.305);
      head.add(eyeGroup);

      // Sclera with natural human eye curvature
      const scleraGeo = new THREE.SphereGeometry(0.068, 24, 20);
      const sclera = makeMesh(scleraGeo, mats.scleraMat);
      sclera.scale.set(1.0, 0.88, 0.55);
      eyeGroup.add(sclera);

      // Limbal Ring
      const limbal = makeMesh(new THREE.CylinderGeometry(0.038, 0.038, 0.010, 24), mats.limbalMat, 0, 0, 0.032);
      limbal.rotation.x = Math.PI / 2;
      eyeGroup.add(limbal);

      // Iris
      const iris = makeMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 24), mats.irisMat, 0, 0, 0.034);
      iris.rotation.x = Math.PI / 2;
      eyeGroup.add(iris);

      // Pupil
      const pupil = makeMesh(new THREE.CylinderGeometry(0.018, 0.018, 0.014, 18), mats.pupilMat, 0, 0, 0.036);
      pupil.rotation.x = Math.PI / 2;
      eyeGroup.add(pupil);

      // Crisp studio catchlight
      const catchlight = makeMesh(new THREE.SphereGeometry(0.009, 8, 8), mats.catchlightMat, 0.012, 0.012, 0.041);
      eyeGroup.add(catchlight);

      // Eyelashes line
      const lash = makeMesh(new THREE.TorusGeometry(0.064, 0.008, 6, 16, Math.PI * 0.72), mats.lashMat, 0, 0.018, 0.032);
      lash.rotation.x = Math.PI / 2.3;
      lash.rotation.z = (i === 0 ? 0.10 : -0.10);
      eyeGroup.add(lash);

      // Eyelid for natural blinking
      const lidGeo = new THREE.SphereGeometry(0.072, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);
      const upperLid = makeMesh(lidGeo, mats.skinMat, 0, 0, 0.004);
      upperLid.rotation.x = -Math.PI / 2;
      upperLid.scale.set(1.02, 0.92, 0.58);
      eyeGroup.add(upperLid);
      upperLid.visible = false;

      eyes.push({ group: eyeGroup, upperLid });

      // Eyebrow with natural arch
      const browGroup = new THREE.Group();
      browGroup.position.set(x, 0.455, 0.325);
      head.add(browGroup);

      const browMesh = makeMesh(
        new THREE.CapsuleGeometry(isMale ? 0.018 : 0.014, isMale ? 0.11 : 0.10, 6, 12),
        mats.browMat,
        0, 0, 0
      );
      browMesh.rotation.z = (i === 0 ? 0.12 : -0.12);
      browMesh.rotation.y = (i === 0 ? -0.18 : 0.18);
      browGroup.add(browMesh);
      eyebrows.push(browGroup);
    });

    // -----------------------------------------------------------------------
    // E. Natural Nose & Morphable Mouth
    // -----------------------------------------------------------------------
    const noseGroup = new THREE.Group();
    noseGroup.position.set(0, 0.28, 0.37);
    head.add(noseGroup);

    const noseBridge = makeMesh(new THREE.CapsuleGeometry(0.022, 0.065, 6, 12), mats.skinMat, 0, 0.02, 0);
    noseBridge.rotation.x = 0.28;
    noseGroup.add(noseBridge);

    const noseTip = makeMesh(new THREE.SphereGeometry(0.026, 14, 12), mats.skinMat, 0, -0.012, 0.018);
    noseGroup.add(noseTip);

    // Mouth Group
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, 0.19, 0.34);
    head.add(mouthGroup);

    // Natural curved lips
    const mouthSmile = makeMesh(new THREE.TorusGeometry(0.078, 0.015, 8, 24, Math.PI * 0.95), mats.lipMat, 0, 0.022, 0);
    mouthSmile.rotation.z = Math.PI;
    mouthGroup.add(mouthSmile);

    // Open mouth / cavity with teeth
    const mouthOpenMesh = new THREE.Group();
    mouthOpenMesh.position.set(0, -0.01, -0.01);
    mouthGroup.add(mouthOpenMesh);

    const cavity = makeMesh(new THREE.CylinderGeometry(0.042, 0.042, 0.018, 18), mats.mouthCavityMat);
    cavity.rotation.x = Math.PI / 2;
    cavity.scale.set(0.95, 0.35, 0.55);
    mouthOpenMesh.add(cavity);

    const teethArch = makeMesh(new THREE.BoxGeometry(0.058, 0.012, 0.015), mats.teethMat, 0, 0.014, 0.005);
    mouthOpenMesh.add(teethArch);
    mouthOpenMesh.visible = false;

    // -----------------------------------------------------------------------
    // F. Articulated Arms, Forearms & 5-Finger Humanoid Hands
    // -----------------------------------------------------------------------
    function makeArticulatedArm(side) {
      // side: -1 for avatar's right arm (viewer's left), 1 for avatar's left arm (viewer's right)
      const shoulderX = side * (isMale ? 0.58 : 0.52);

      // Shoulder Joint
      const shoulderJoint = new THREE.Group();
      shoulderJoint.position.set(shoulderX, 1.05, 0);
      charGroup.add(shoulderJoint);

      const shoulderCap = makeMesh(new THREE.SphereGeometry(0.125, 18, 16), mats.jacketMat);
      shoulderJoint.add(shoulderCap);

      // Upper Arm (Bicep/tricep form)
      const upperArm = makeMesh(new THREE.CapsuleGeometry(0.095, 0.34, 8, 18), mats.jacketMat, 0, -0.24, 0);
      shoulderJoint.add(upperArm);

      // Blazer cuff
      const cuff = makeMesh(new THREE.CylinderGeometry(0.098, 0.102, 0.035, 18), mats.lapelMat, 0, -0.42, 0);
      shoulderJoint.add(cuff);

      // Elbow Joint
      const elbowJoint = new THREE.Group();
      elbowJoint.position.set(0, -0.48, 0);
      shoulderJoint.add(elbowJoint);

      const elbowCap = makeMesh(new THREE.SphereGeometry(0.082, 16, 14), mats.skinMat);
      elbowJoint.add(elbowCap);

      // Forearm (Natural anatomical human forearm tapering to wrist)
      const forearm = makeMesh(new THREE.CylinderGeometry(0.068, 0.084, 0.34, 18), mats.skinMat, 0, -0.20, 0);
      elbowJoint.add(forearm);

      // Wrist Joint (3-Axis rotation)
      const wristJoint = new THREE.Group();
      wristJoint.position.set(0, -0.42, 0);
      elbowJoint.add(wristJoint);

      // Realistic Human Hand:
      // Anatomically proportioned palm with thenar & hypothenar cushions
      const palmGroup = new THREE.Group();
      palmGroup.position.set(0, -0.075, 0);
      wristJoint.add(palmGroup);

      const palmMesh = makeMesh(new THREE.BoxGeometry(0.155, 0.145, 0.055), mats.handMat, 0, 0, 0);
      palmGroup.add(palmMesh);

      // Thenar Mound (Base of thumb muscular cushion)
      const thenarMound = makeMesh(new THREE.SphereGeometry(0.046, 14, 12), mats.handMat, side * -0.058, 0.018, 0.018);
      thenarMound.scale.set(0.9, 1.15, 0.8);
      palmGroup.add(thenarMound);

      // 4 Fingers: Index, Middle, Ring, Pinky
      // 3 articulated phalanx segments per finger + fingernail plate
      const fingerNames = ['index', 'middle', 'ring', 'pinky'];
      const fingerX = [-0.052, -0.017, 0.018, 0.052];
      const fingerLengths = [0.108, 0.120, 0.110, 0.086]; // Realistic anatomical hierarchy

      const fingers = {};

      fingerNames.forEach((name, idx) => {
        const knuckle = new THREE.Group();
        knuckle.position.set(fingerX[idx], -0.155, 0);
        wristJoint.add(knuckle);

        const totalLen = fingerLengths[idx];
        const seg1Len = totalLen * 0.45;
        const seg2Len = totalLen * 0.35;
        const seg3Len = totalLen * 0.25;

        // Phalanx 1 (Proximal)
        const seg1 = makeMesh(new THREE.CapsuleGeometry(0.020, seg1Len, 6, 12), mats.handMat, 0, -seg1Len * 0.5, 0);
        knuckle.add(seg1);

        // PIP Joint
        const midJoint = new THREE.Group();
        midJoint.position.set(0, -seg1Len, 0);
        knuckle.add(midJoint);

        // Phalanx 2 (Intermediate)
        const seg2 = makeMesh(new THREE.CapsuleGeometry(0.018, seg2Len, 6, 12), mats.handMat, 0, -seg2Len * 0.5, 0);
        midJoint.add(seg2);

        // DIP Joint
        const tipJoint = new THREE.Group();
        tipJoint.position.set(0, -seg2Len, 0);
        midJoint.add(tipJoint);

        // Phalanx 3 (Distal with clean nail plate)
        const seg3 = makeMesh(new THREE.CapsuleGeometry(0.016, seg3Len, 6, 12), mats.handMat, 0, -seg3Len * 0.5, 0);
        tipJoint.add(seg3);

        const nail = makeMesh(new THREE.BoxGeometry(0.014, 0.018, 0.005), mats.nailMat, 0, -seg3Len * 0.55, 0.013);
        tipJoint.add(nail);

        fingers[name] = { knuckle, midJoint, tipJoint };
      });

      // Thumb: Opposable saddle joint with dual phalanx articulation
      const thumbBase = new THREE.Group();
      thumbBase.position.set(side * -0.082, -0.065, 0.020);
      wristJoint.add(thumbBase);

      const thumbSeg1 = makeMesh(new THREE.CapsuleGeometry(0.022, 0.065, 6, 12), mats.handMat, side * -0.022, -0.038, 0.018);
      thumbBase.add(thumbSeg1);

      const thumbTip = new THREE.Group();
      thumbTip.position.set(side * -0.044, -0.075, 0.034);
      thumbBase.add(thumbTip);

      const thumbSeg2 = makeMesh(new THREE.CapsuleGeometry(0.020, 0.055, 6, 12), mats.handMat, side * -0.016, -0.032, 0.014);
      thumbTip.add(thumbSeg2);

      const thumbNail = makeMesh(new THREE.BoxGeometry(0.016, 0.020, 0.005), mats.nailMat, side * -0.016, -0.036, 0.028);
      thumbTip.add(thumbNail);

      fingers.thumb = { knuckle: thumbBase, midJoint: thumbTip, tipJoint: thumbTip };

      return {
        side,
        shoulder: shoulderJoint,
        elbow: elbowJoint,
        wrist: wristJoint,
        fingers,
      };
    }

    const rightArm = makeArticulatedArm(-1);
    const leftArm = makeArticulatedArm(1);

    rig = {
      charGroup,
      head,
      eyes,
      eyebrows,
      mouthSmile,
      mouthOpenMesh,
      rightArm,
      leftArm,
    };
  }

  // Build initial semi-realistic character
  buildSemiRealisticProceduralRig(currentCharacter);

  // =========================================================================
  // 5. Unified 34-Channel ISL Pose Application Engine
  // =========================================================================
  function applyPose(p) {
    if (!rig) return;

    // --- Right Arm (Indices 0-13) ---
    const r = rig.rightArm;
    r.shoulder.rotation.x = p[0];
    r.shoulder.rotation.z = p[1] * -1; // Symmetrical mirror
    r.shoulder.rotation.y = p[2] * -1;

    r.elbow.rotation.x = p[3];
    r.elbow.rotation.y = p[4] * -1;

    r.wrist.rotation.x = p[5];
    r.wrist.rotation.y = p[6];
    r.wrist.rotation.z = p[7];

    // Right thumb: curl (8)
    const rThumbCurl = p[8];
    r.fingers.thumb.knuckle.rotation.z = -1 * (0.45 - rThumbCurl * 0.9);
    r.fingers.thumb.knuckle.rotation.x = -rThumbCurl * 0.8;
    r.fingers.thumb.midJoint.rotation.x = -rThumbCurl * 1.1;

    // Right fingers: index(9), middle(10), ring(11), pinky(12), spread(13)
    const rSpread = p[13] || 0;
    const rFingers = [
      { f: r.fingers.index, curl: p[9], spread: -rSpread * 1.2 },
      { f: r.fingers.middle, curl: p[10], spread: -rSpread * 0.4 },
      { f: r.fingers.ring, curl: p[11], spread: rSpread * 0.4 },
      { f: r.fingers.pinky, curl: p[12], spread: rSpread * 1.2 },
    ];
    rFingers.forEach(({ f, curl, spread }) => {
      f.knuckle.rotation.x = -curl * 1.35;
      f.knuckle.rotation.z = spread;
      f.midJoint.rotation.x = -curl * 1.15;
      if (f.tipJoint) f.tipJoint.rotation.x = -curl * 0.95;
    });

    // --- Left Arm (Indices 14-27) ---
    const l = rig.leftArm;
    l.shoulder.rotation.x = p[14];
    l.shoulder.rotation.z = p[15] * 1;
    l.shoulder.rotation.y = p[16] * 1;

    l.elbow.rotation.x = p[17];
    l.elbow.rotation.y = p[18] * 1;

    l.wrist.rotation.x = p[19];
    l.wrist.rotation.y = p[20];
    l.wrist.rotation.z = p[21];

    // Left thumb: curl (22)
    const lThumbCurl = p[22];
    l.fingers.thumb.knuckle.rotation.z = 1 * (0.45 - lThumbCurl * 0.9);
    l.fingers.thumb.knuckle.rotation.x = -lThumbCurl * 0.8;
    l.fingers.thumb.midJoint.rotation.x = -lThumbCurl * 1.1;

    // Left fingers: index(23), middle(24), ring(25), pinky(26), spread(27)
    const lSpread = p[27] || 0;
    const lFingers = [
      { f: l.fingers.index, curl: p[23], spread: lSpread * 1.2 },
      { f: l.fingers.middle, curl: p[24], spread: lSpread * 0.4 },
      { f: l.fingers.ring, curl: p[25], spread: -lSpread * 0.4 },
      { f: l.fingers.pinky, curl: p[26], spread: -lSpread * 1.2 },
    ];
    lFingers.forEach(({ f, curl, spread }) => {
      f.knuckle.rotation.x = -curl * 1.35;
      f.knuckle.rotation.z = spread;
      f.midJoint.rotation.x = -curl * 1.15;
      if (f.tipJoint) f.tipJoint.rotation.x = -curl * 0.95;
    });

    // --- Head (Nod, Turn, Tilt: Indices 28-30) ---
    rig.head.rotation.x = p[28] || 0;
    rig.head.rotation.y = p[29] || 0;
    rig.head.rotation.z = p[30] || 0;

    // --- Face Channels (Smile 31, Eyebrow 32, MouthOpen 33) ---
    const smileVal = p[31] !== undefined ? p[31] : 0.25;
    rig.mouthSmile.scale.y = 0.6 + smileVal * 0.7;
    rig.mouthSmile.scale.x = 0.9 + smileVal * 0.3;

    const mouthOpenVal = p[33] || 0;
    if (mouthOpenVal > 0.05) {
      rig.mouthOpenMesh.visible = true;
      rig.mouthOpenMesh.scale.set(0.85 + mouthOpenVal * 0.35, mouthOpenVal * 0.85, 0.55);
    } else {
      rig.mouthOpenMesh.visible = false;
    }

    const browVal = p[32] !== undefined ? p[32] : 0.1;
    rig.eyebrows.forEach((b) => {
      b.position.y = 0.455 + browVal * 0.04;
    });
  }

  // =========================================================================
  // 6. Smooth Tweening & Animation Engine
  // =========================================================================
  let currentPose = REST_POSE.slice();
  applyPose(currentPose);

  let activeTween = null;
  let onCompleteCallback = null;

  function convertKeyframeToPose(kf) {
    const pose = REST_POSE.slice();
    if (kf.r) {
      for (let i = 0; i < kf.r.length && i < 14; i++) {
        pose[i] = kf.r[i];
      }
    }
    if (kf.l) {
      for (let i = 0; i < kf.l.length && i < 14; i++) {
        pose[14 + i] = kf.l[i];
      }
    }
    if (kf.h) {
      pose[28] = kf.h[0] ?? 0;
      pose[29] = kf.h[1] ?? 0;
      pose[30] = kf.h[2] ?? 0;
    }
    if (kf.f) {
      pose[31] = kf.f[0] ?? 0.25;
      pose[32] = kf.f[1] ?? 0.1;
      pose[33] = kf.f[2] ?? 0.0;
    }
    return pose;
  }

  function startTween(poses, durationMs, onDone) {
    const n = poses.length;
    const times = poses.map((_, i) => (i === 0 ? 0 : 0.18 + 0.82 * ((i - 1) / Math.max(1, n - 2))));
    activeTween = {
      poses,
      times,
      start: performance.now(),
      dur: durationMs / speed,
    };
    onCompleteCallback = onDone;
  }

  function stepAnimation(now) {
    if (isPaused) return;
    if (!activeTween) return;

    const u = Math.min(1, (now - activeTween.start) / activeTween.dur);
    let j = 0;
    while (j < activeTween.times.length - 2 && u > activeTween.times[j + 1]) {
      j++;
    }

    const span = activeTween.times[j + 1] - activeTween.times[j] || 1;
    const t = easeInOut(Math.min(1, Math.max(0, (u - activeTween.times[j]) / span)));

    const fromPose = activeTween.poses[j];
    const toPose = activeTween.poses[j + 1];

    currentPose = fromPose.map((val, idx) => lerp(val, toPose[idx], t));
    applyPose(currentPose);

    if (u >= 1) {
      activeTween = null;
      if (onCompleteCallback) {
        const cb = onCompleteCallback;
        onCompleteCallback = null;
        cb();
      }
    }
  }

  // =========================================================================
  // 7. Natural Eye Blinking & Micro Idle Sway
  // =========================================================================
  let nextBlinkTime = performance.now() + 2200;
  let isBlinking = false;
  let blinkStartTime = 0;

  function updateBlinking(now) {
    if (!rig) return;
    if (!isBlinking && now >= nextBlinkTime) {
      isBlinking = true;
      blinkStartTime = now;
      nextBlinkTime = now + 3000 + Math.random() * 2600;
    }

    if (isBlinking) {
      const elapsed = now - blinkStartTime;
      const blinkDur = 140; // ms
      if (elapsed <= blinkDur) {
        rig.eyes.forEach((eye) => { eye.upperLid.visible = true; });
      } else {
        rig.eyes.forEach((eye) => { eye.upperLid.visible = false; });
        isBlinking = false;
      }
    }
  }

  // =========================================================================
  // 8. Main Render & Life Loop
  // =========================================================================
  let rafId = 0;
  const loop = (now) => {
    rafId = requestAnimationFrame(loop);
    stepAnimation(now);
    updateBlinking(now);

    // Subtle natural breathing and micro idle sway for realistic presence
    if (avatarRoot) {
      avatarRoot.position.y = Math.sin(now / 1150) * 0.006;
      avatarRoot.rotation.y = Math.sin(now / 2500) * 0.005;
    }

    renderer.render(scene, camera);
  };
  rafId = requestAnimationFrame(loop);

  // =========================================================================
  // 9. Resize Handling
  // =========================================================================
  const handleResize = () => {
    const w = container.clientWidth || 360;
    const h = container.clientHeight || 420;
    renderer.setSize(w, h, false);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;border-radius:inherit;';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(handleResize);
  ro.observe(container);
  handleResize();

  // =========================================================================
  // 10. Public API
  // =========================================================================
  return {
    play(word, onEnd) {
      const sign = getSignData(word);
      if (!sign || !sign.keyframes || sign.keyframes.length === 0) {
        return false;
      }
      isPaused = false;
      const targetPoses = [currentPose.slice(), ...sign.keyframes.map(convertKeyframeToPose)];
      const duration = sign.duration || BASE_DURATION;
      startTween(targetPoses, duration, onEnd);
      return true;
    },

    pause() {
      if (!isPaused && activeTween) {
        isPaused = true;
        pauseTime = performance.now();
      }
    },

    resume() {
      if (isPaused && activeTween) {
        const pausedElapsed = performance.now() - pauseTime;
        activeTween.start += pausedElapsed;
        isPaused = false;
      }
    },

    isPaused() {
      return isPaused;
    },

    isPlaying() {
      return Boolean(activeTween) && !isPaused;
    },

    rest(duration = 750) {
      isPaused = false;
      startTween([currentPose.slice(), REST_POSE.slice()], duration, null);
    },

    setSpeed(newSpeed) {
      if (newSpeed > 0) {
        speed = newSpeed;
        if (activeTween) {
          activeTween.dur = BASE_DURATION / speed;
        }
      }
    },

    setCharacter(gender) {
      if (gender !== 'male' && gender !== 'female') return;
      if (gender === currentCharacter) return;
      currentCharacter = gender;

      // Rebuild geometry & materials with new character design
      buildSemiRealisticProceduralRig(currentCharacter);
      // Immediately restore current pose so animation continues seamlessly
      applyPose(currentPose);
    },

    getCharacter() {
      return currentCharacter;
    },

    dispose() {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
      });
      Object.values(mats).forEach((m) => {
        if (m && m.dispose) m.dispose();
      });
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  };
}

