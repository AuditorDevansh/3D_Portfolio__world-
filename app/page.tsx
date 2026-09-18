"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { Water } from "three/examples/jsm/objects/Water.js";

type ZoneKey = "about" | "skills" | "work" | "contact";
type Zone = { label: string; kicker: string; title: string; copy: string; color: string; position: [number, number]; detail: string; href: string; cta: string };
const zones: Record<ZoneKey, Zone> = {
  about: { label: "ABOUT", kicker: "BASE CAMP / 01", title: "Curiosity is the compass.", copy: "I’m Devansh Mishra — a cloud & DevOps explorer, Salesforce builder, and hackathon tinkerer who likes turning complex systems into useful experiences.", detail: "Based in India, I enjoy the space between a good idea and the system that makes it useful.", color: "#7de7ff", position: [-24, -14], href: "https://www.linkedin.com/in/devanshmishra29", cta: "Meet Devansh" },
  skills: { label: "SKILLS", kicker: "SIGNAL TOWER / 02", title: "The stack behind the scenes.", copy: "Linux, Git, Docker, Kubernetes, Terraform, CI/CD, AWS, Azure, and Salesforce flows, objects, relationships, permission sets and dashboards.", detail: "Infrastructure thinking, product curiosity, and a bias for shipping are the common thread.", color: "#c4ff76", position: [23, -13], href: "https://github.com/AuditorDevansh", cta: "See the toolbox" },
  work: { label: "WORK", kicker: "BUILD DOCK / 03", title: "Built, shipped, still learning.", copy: "GroundTruth civic issue reporter, an AW Computing recruiting workflow, and a custom Salesforce project management app — practical systems for real work.", detail: "Projects are experiments with receipts: useful interfaces, clear workflows, and systems that hold up beyond the demo.", color: "#ffb86b", position: [24, 24], href: "https://github.com/AuditorDevansh", cta: "Explore the builds" },
  contact: { label: "CONTACT", kicker: "LIGHTHOUSE / 04", title: "Let’s make something useful.", copy: "Have a problem worth solving? Send a signal and let’s start a conversation.", detail: "Open to thoughtful collaborations, platform work, and teams that care about the details.", color: "#ff7ea8", position: [-24, 23], href: "mailto:auditor.devansh.in@gmail.com", cta: "Send a signal" }
};

type NPC = { group: THREE.Group; home: THREE.Vector3; phase: number; name: string; line: string; color: string };
type AssetStatus = "loading" | "ready" | "fallback";
function makeLabel(text: string, color: string, width = 512) {
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = 128; const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(4,10,20,.88)"; ctx.beginPath(); ctx.roundRect(8, 8, width - 16, 112, 20); ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.stroke();
  ctx.font = "600 30px monospace"; ctx.fillStyle = "#f2f7ff"; ctx.textAlign = "center"; ctx.fillText(text, width / 2, 78);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthTest: false })); sprite.scale.set(width === 512 ? 3.8 : 4.5, .95, 1); return sprite;
}
function createTree(scene: THREE.Scene, x: number, z: number, scale: number) { const tree = new THREE.Group(); const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.14, .24, 1.7, 7), new THREE.MeshStandardMaterial({ color: 0x664332 })); trunk.position.y = .85; const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.05, 1), new THREE.MeshStandardMaterial({ color: 0x267461, roughness: .9, flatShading: true })); crown.position.y = 2.1; tree.add(trunk, crown); tree.position.set(x, 0, z); tree.scale.setScalar(scale); scene.add(tree); }
function addBuilding(scene: THREE.Scene, x: number, z: number, color: number, height: number, width = 2.5) { const group = new THREE.Group(); group.userData.cameraIgnore = true; const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, width * .8), new THREE.MeshStandardMaterial({ color, roughness: .92, flatShading: true })); body.position.y = height / 2; body.castShadow = true; group.add(body); const roof = new THREE.Mesh(new THREE.ConeGeometry(width * .7, 1.1, 5), new THREE.MeshStandardMaterial({ color: 0x293347, roughness: .95, flatShading: true })); roof.position.y = height + .55; group.add(roof); const arch = new THREE.Mesh(new THREE.TorusGeometry(width * .18, .07, 5, 12, Math.PI), new THREE.MeshStandardMaterial({ color: 0xc49b65, roughness: .8 })); arch.rotation.set(Math.PI / 2, 0, Math.PI / 2); arch.position.set(0, height * .5, width * .405); group.add(arch); for (let i = 0; i < 2; i++) { const win = new THREE.Mesh(new THREE.BoxGeometry(.22, .48, .025), new THREE.MeshBasicMaterial({ color: 0xffd788 })); win.position.set(-width * .24 + i * width * .48, height * .58, width * .405); group.add(win); } group.position.set(x, 0, z); scene.add(group); }
function addWizardTower(scene: THREE.Scene, x: number, z: number, color: string) {
  const tower = new THREE.Group();
  tower.userData.cameraIgnore = true;
  const stone = new THREE.MeshStandardMaterial({ color: 0x39445b, roughness: .9, flatShading: true });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x241a3a, emissive: 0x120d24, emissiveIntensity: .3, flatShading: true });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.65, .5, 8), stone);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.95, 1.2, 3.8, 8), stone);
  body.position.y = 2.15;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.8, 8), roofMaterial);
  roof.position.y = 4.95;
  const orb = new THREE.Mesh(new THREE.OctahedronGeometry(.28), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2 }));
  orb.position.y = 6.25;
  tower.add(base, body, roof, orb);
  tower.position.set(x, 0, z);
  scene.add(tower);
  return tower;
}
function addWaterfallGarden(scene: THREE.Scene) {
  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x405766, roughness: 1, flatShading: true });
  const mossMaterial = new THREE.MeshStandardMaterial({ color: 0x39705d, roughness: 1, flatShading: true });
  for (let i = 0; i < 30; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.55 + (i % 4) * .22, 0), i % 3 ? rockMaterial : mossMaterial);
    rock.position.set(((i * 31) % 130) - 65, .35 + (i % 2) * .15, ((i * 19) % 125) - 62);
    rock.scale.set(1.4, .65 + (i % 3) * .18, .9);
    rock.rotation.set(i * .31, i * .8, i * .17);
    rock.castShadow = true;
    scene.add(rock);
  }
  const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x79a86e, roughness: 1, flatShading: true });
  for (let i = 0; i < 180; i++) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(.08 + (i % 3) * .035, .55 + (i % 4) * .12, 4), grassMaterial);
    blade.position.set(((i * 17) % 145) - 72, .3, ((i * 43) % 138) - 69);
    blade.rotation.y = i;
    scene.add(blade);
  }
  const lilyMaterial = new THREE.MeshStandardMaterial({ color: 0x65a77d, roughness: .8, flatShading: true });
  for (let i = 0; i < 9; i++) {
    const lily = new THREE.Mesh(new THREE.CircleGeometry(.28 + (i % 3) * .1, 7), lilyMaterial);
    lily.rotation.x = -Math.PI / 2;
    lily.position.set(-43 + ((i * 11) % 7) - 3, .13, 3 + ((i * 7) % 5) - 2);
    scene.add(lily);
  }
  const fenceMaterial = new THREE.MeshStandardMaterial({ color: 0x7b5840, roughness: 1, flatShading: true });
  for (let i = 0; i < 7; i++) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, 1.25, 6), fenceMaterial);
    post.position.set(-49 + i * 1.2, .62, -1.5);
    scene.add(post);
    if (i < 6) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.35, .1, .1), fenceMaterial);
      rail.position.set(-48.4 + i * 1.2, .82, -1.5);
      rail.rotation.z = i % 2 ? -.05 : .05;
      scene.add(rail);
    }
  }
}

function createAvatar() {
  const player = new THREE.Group();
  const mat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: .55, flatShading: true });
  const torso = new THREE.Group(); torso.position.y = 1.2; const shirt = new THREE.Mesh(new THREE.BoxGeometry(.72, .82, .48), mat(0x176b83)); shirt.position.y = 0; shirt.castShadow = true; torso.add(shirt);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.3, .05, 6, 18), mat(0xffb86b)); collar.rotation.x = Math.PI / 2; collar.position.y = .43; torso.add(collar);
  const head = new THREE.Group(); head.position.y = 2.15; const face = new THREE.Mesh(new THREE.SphereGeometry(.34, 16, 12), mat(0xc9825f)); face.scale.set(.9, 1.08, .88); head.add(face);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(.37, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x241a20)); hair.position.y = .1; hair.scale.set(1.05, .8, 1.02); head.add(hair);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x7de7ff }); [-.12, .12].forEach(x => { const eye = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), eyeMat); eye.position.set(x, -.01, .31); head.add(eye); });
  const limb = (color: number, x: number, y: number, z: number) => { const pivot = new THREE.Group(); pivot.position.set(x, y, z); const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .68, 4, 8), mat(color)); mesh.position.y = -.34; mesh.castShadow = true; pivot.add(mesh); return pivot; };
  const leftArm = limb(0x17607a, -.53, 1.48, 0), rightArm = limb(0x17607a, .53, 1.48, 0), leftLeg = limb(0x29344d, -.23, .62, 0), rightLeg = limb(0x29344d, .23, .62, 0);
  const bootL = new THREE.Mesh(new THREE.BoxGeometry(.28, .14, .48), mat(0x101827)); bootL.position.set(0, -.72, .08); leftLeg.add(bootL); const bootR = bootL.clone(); rightLeg.add(bootR);
  player.add(torso, head, leftArm, rightArm, leftLeg, rightLeg); player.userData = { torso, head, limbs: [leftArm, rightArm, leftLeg, rightLeg] }; return player;
}
function addMagic(scene: THREE.Scene) {
  const crystalMat = new THREE.MeshStandardMaterial({ color: 0x77eaff, emissive: 0x167ea5, emissiveIntensity: 1.8, transparent: true, opacity: .9, flatShading: true });
  for (let i = 0; i < 14; i++) { const g = new THREE.Group(); const crystal = new THREE.Mesh(new THREE.ConeGeometry(.3 + i % 3 * .12, 1.4 + i % 4 * .35, 5), crystalMat); crystal.position.y = .7; g.add(crystal); g.position.set(((i * 29) % 120) - 60, 0, ((i * 47) % 110) - 55); g.rotation.y = i; scene.add(g); }
  const portal = new THREE.Group(); portal.userData.cameraIgnore = true; const ring = new THREE.Mesh(new THREE.TorusGeometry(3.3, .12, 10, 64), new THREE.MeshBasicMaterial({ color: 0xd778ff, transparent: true, opacity: .85 })); ring.rotation.x = Math.PI / 2; const inner = new THREE.Mesh(new THREE.CircleGeometry(3.15, 48), new THREE.MeshBasicMaterial({ color: 0x411b68, transparent: true, opacity: .38, side: THREE.DoubleSide })); inner.rotation.x = -Math.PI / 2; portal.add(ring, inner); portal.position.set(0, .2, -29); scene.add(portal);
  const shrine = new THREE.Group(); shrine.userData.cameraIgnore = true; const base = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.5, .45, 8), new THREE.MeshStandardMaterial({ color: 0x594270, emissive: 0x321c52, emissiveIntensity: .4 })); const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, .8, 4), new THREE.MeshStandardMaterial({ color: 0x241a3a })); roof.position.y = 2.8; const glow = new THREE.Mesh(new THREE.OctahedronGeometry(.42), new THREE.MeshStandardMaterial({ color: 0xffd788, emissive: 0xff8c38, emissiveIntensity: 2 })); glow.position.y = 1.9; shrine.add(base, roof, glow); shrine.position.set(0, 0, 54); scene.add(shrine);
  const count = 230; const positions = new Float32Array(count * 3); for (let i = 0; i < count; i++) { positions[i * 3] = ((i * 73) % 150) - 75; positions[i * 3 + 1] = 2 + ((i * 31) % 220) / 20; positions[i * 3 + 2] = ((i * 47) % 150) - 75; } const particles = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xb8efff, size: .09, transparent: true, opacity: .7 })); particles.geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); scene.add(particles); return { portal, shrine, particles };
}
function createNPC(scene: THREE.Scene, name: string, line: string, color: string, x: number, z: number, phase: number): NPC { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CapsuleGeometry(.3, .58, 4, 8), new THREE.MeshStandardMaterial({ color: 0x6b3d83, flatShading: true })); body.position.y = .78; const head = new THREE.Mesh(new THREE.SphereGeometry(.27, 12, 8), new THREE.MeshStandardMaterial({ color: 0xe2a27c })); head.position.y = 1.55; const orb = new THREE.Mesh(new THREE.OctahedronGeometry(.17), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2 })); orb.position.set(.42, 1.2, .16); g.add(body, head, orb, makeLabel(name, color, 384)); g.children[3].position.y = 2.25; g.position.set(x, 0, z); scene.add(g); return { group: g, home: new THREE.Vector3(x, 0, z), phase, name, line, color }; }
function addWaterfall(scene: THREE.Scene) {
  const group = new THREE.Group(); group.position.set(-43, 0, 2);
  const rock = new THREE.MeshStandardMaterial({ color: 0x344b59, roughness: 1, flatShading: true });
  for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2 + (i % 3) * .35, 0), rock); b.scale.set(1.2, .7 + (i % 2) * .35, .8); b.position.set((i - 3) * 2.25, 1.1 + (i % 3) * 1.2, -i * .7); b.rotation.set(i * .3, i, i * .2); b.castShadow = true; group.add(b); }
  const waterMat = new THREE.MeshBasicMaterial({ color: 0x8deaff, transparent: true, opacity: .72, side: THREE.DoubleSide, depthWrite: false });
  for (let i = 0; i < 5; i++) { const sheet = new THREE.Mesh(new THREE.PlaneGeometry(.72 + (i % 2) * .25, 6, 1, 10), waterMat); sheet.position.set((i - 2) * .72, 3.35, .7); sheet.rotation.y = (i - 2) * .08; group.add(sheet); }
  const pool = new THREE.Mesh(new THREE.CircleGeometry(4.2, 32), new THREE.MeshStandardMaterial({ color: 0x287a91, transparent: true, opacity: .82, roughness: .25, metalness: .1 })); pool.rotation.x = -Math.PI / 2; pool.position.set(0, .08, 1.2); group.add(pool);
  const mist = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xd8fbff, size: .11, transparent: true, opacity: .55 })); const p = new Float32Array(90); for (let i = 0; i < 30; i++) { p[i * 3] = (i % 10 - 5) * .55; p[i * 3 + 1] = .3 + (i % 6) * .16; p[i * 3 + 2] = .2 + (i % 5) * .2; } mist.geometry.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); group.add(mist);
  const title = makeLabel("CASCADE / PROCEDURAL REFERENCE", "#8deaff", 512); title.position.set(0, 6.5, 0); group.add(title); scene.add(group);
  return { group, update: (elapsed: number) => { group.children.slice(7, 12).forEach((mesh, i) => { mesh.position.y = 3.35 + Math.sin(elapsed * 3.5 + i) * .08; }); mist.position.y = Math.sin(elapsed * 2) * .08; pool.scale.setScalar(1 + Math.sin(elapsed * 1.7) * .025); } };
}

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null); const controlsRef = useRef({ forward: 0, side: 0 });
  const lightingRef = useRef<((isNight: boolean) => void) | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);
  const [active, setActive] = useState<ZoneKey | null>(null); const [started, setStarted] = useState(false); const [mobile, setMobile] = useState(false); const [near, setNear] = useState<ZoneKey | null>(null); const [nearNpc, setNearNpc] = useState<NPC | null>(null); const [dialogue, setDialogue] = useState(""); const [discovered, setDiscovered] = useState<ZoneKey[]>([]); const [sprinting, setSprinting] = useState(false); const [assetStatus, setAssetStatus] = useState<AssetStatus>("loading"); const [nightMode, setNightMode] = useState(false);
  useEffect(() => { const mount = mountRef.current; if (!mount) return; const isMobile = window.matchMedia("(pointer: coarse)").matches; setMobile(isMobile);
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x8fb3cc); scene.fog = new THREE.Fog(0x668eae, 44, 130);
    const camera = new THREE.PerspectiveCamera(64, 1, .1, 180); const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .85; mount.appendChild(renderer.domElement);
    const resize = () => { const { width, height } = mount.getBoundingClientRect(); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); }; resize(); const observer = new ResizeObserver(resize); observer.observe(mount); scene.add(new THREE.HemisphereLight(0xbbe9ff, 0x193226, 2.5)); const sun = new THREE.DirectionalLight(0xffd2a2, 3.2); sun.position.set(-35, 55, 22); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); scene.add(sun); const playerLight = new THREE.PointLight(0xffc477, 0, 14, 2); playerLight.castShadow = true; scene.add(playerLight);
    const sky = new Sky(); sky.scale.setScalar(450); scene.add(sky);
    const skyUniforms = sky.material.uniforms;
    skyUniforms.turbidity.value = 7;
    skyUniforms.rayleigh.value = 1.7;
    skyUniforms.mieCoefficient.value = .004;
    skyUniforms.mieDirectionalG.value = .78;
    const sunPosition = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(72), THREE.MathUtils.degToRad(145));
    skyUniforms.sunPosition.value.copy(sunPosition);
    const environmentScene = new THREE.Scene();
    environmentScene.add(sky.clone());
    const environment = new THREE.PMREMGenerator(renderer).fromScene(environmentScene).texture;
    scene.environment = environment;
    const waterNormals = new THREE.TextureLoader().load("/assets/waternormals.jpg", (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    });
    const ocean = new Water(new THREE.PlaneGeometry(500, 500), {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: sunPosition.clone().normalize(),
      sunColor: 0xffe2bc,
      waterColor: 0x0b5370,
      distortionScale: 2.8,
      fog: true
    });
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -.35;
    scene.add(ocean);
    const hemi = scene.children.find((object): object is THREE.HemisphereLight => object instanceof THREE.HemisphereLight);
    lightingRef.current = (isNight) => {
      const sunColor = isNight ? 0x7da7ff : 0xffd2a2;
      scene.background = new THREE.Color(isNight ? 0x02030a : 0xd49a7f);
      scene.fog = new THREE.Fog(isNight ? 0x03040d : 0x8b6570, 38, 118);
      skyUniforms.turbidity.value = isNight ? 18 : 6;
      skyUniforms.rayleigh.value = isNight ? .18 : 2.2;
      skyUniforms.sunPosition.value.setFromSphericalCoords(1, THREE.MathUtils.degToRad(isNight ? 105 : 72), THREE.MathUtils.degToRad(isNight ? 35 : 145));
      sun.color.setHex(sunColor);
      sun.intensity = isNight ? .08 : 2.8;
      if (hemi) hemi.intensity = isNight ? .12 : 2.2;
      playerLight.intensity = isNight ? 2.4 : 0;
      ocean.material.uniforms.sunColor.value.setHex(isNight ? 0x16204f : 0xffb18c);
      ocean.material.uniforms.waterColor.value.setHex(isNight ? 0x020817 : 0x14536b);
      renderer.toneMappingExposure = isNight ? .42 : .9;
    };
    const islandAsset = new THREE.Group(); islandAsset.name = "island-asset"; islandAsset.visible = false; scene.add(islandAsset);
    const islandLoader = new GLTFLoader();
    islandLoader.load("/assets/island.glb", (gltf) => {
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const footprint = Math.max(size.x, size.z);
      if (!footprint) {
        setAssetStatus("fallback");
        return;
      }
      const worldFootprint = 132;
      model.scale.setScalar(worldFootprint / footprint);
      const fittedBounds = new THREE.Box3().setFromObject(model);
      const center = fittedBounds.getCenter(new THREE.Vector3());
      model.position.set(-center.x, -fittedBounds.min.y, -center.z);
      model.rotation.y = -0.35;
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          object.material = materials.map((material) => {
            const cloned = material.clone();
            if (cloned instanceof THREE.MeshStandardMaterial) cloned.roughness = Math.max(cloned.roughness, .8);
            return cloned;
          });
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      islandAsset.add(model);
      islandAsset.visible = true;
      setAssetStatus("ready");
    }, undefined, () => setAssetStatus("fallback"));
    const birds = new THREE.Group();
    const mixers: THREE.AnimationMixer[] = [];
    islandLoader.load("/assets/flamingo.glb", (gltf) => {
      const bird = gltf.scene;
      bird.scale.setScalar(.065);
      bird.position.set(-38, 17, -34);
      bird.rotation.y = -.7;
      bird.traverse((object) => {
        if (object instanceof THREE.Mesh) object.castShadow = true;
      });
      birds.add(bird);
      const secondBird = bird.clone(true);
      secondBird.position.set(30, 18, -48);
      secondBird.rotation.y = .8;
      birds.add(secondBird);
      if (gltf.animations[0]) {
        const firstMixer = new THREE.AnimationMixer(bird);
        firstMixer.clipAction(gltf.animations[0]).play();
        mixers.push(firstMixer);
        const secondMixer = new THREE.AnimationMixer(secondBird);
        secondMixer.clipAction(gltf.animations[0]).play();
        mixers.push(secondMixer);
      }
      birds.userData.flight = true;
      scene.add(birds);
    });
    const terrain = new THREE.Mesh(new THREE.PlaneGeometry(170, 170, 18, 18), new THREE.MeshStandardMaterial({ color: 0x426d5e, roughness: 1 })); terrain.rotation.x = -Math.PI / 2; terrain.receiveShadow = true; scene.add(terrain); const road = new THREE.MeshStandardMaterial({  color: 0x293945, roughness: .94 }); [[0, 0, 7, 150], [0, 0, 150, 7], [0, -29, 150, 3], [-29, 12, 3, 90], [29, 12, 3, 90]].forEach(([x, z, w, d]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, .06, d), road); m.position.set(x, .03, z); m.receiveShadow = true; scene.add(m); }); const lane = new THREE.MeshStandardMaterial({ color: 0xc9ad69, emissive: 0x4b3e20, emissiveIntensity: .15 }); for (let i = -70; i < 70; i += 8) { const l = new THREE.Mesh(new THREE.BoxGeometry(.12, .065, 3), lane); l.position.set(0, .08, i); scene.add(l); const l2 = l.clone(); l2.position.set(i, .08, 0); l2.rotation.y = Math.PI / 2; scene.add(l2); }
    const districtColors = [0x55795e, 0x3e6970, 0x806657, 0x5f6e84]; for (let i = 0; i < 42; i++) { const x = ((i * 37) % 122) - 61, z = ((i * 53) % 112) - 56; if (Math.abs(x) < 7 || Math.abs(z) < 7) continue; addBuilding(scene, x, z, districtColors[i % 4], 2 + (i % 4) * .8, 2 + (i % 3) * .5); } for (let i = 0; i < 150; i++) { const x = ((i * 23) % 148) - 74, z = ((i * 41) % 145) - 72; if (Math.abs(x) < 10 || Math.abs(z) < 10) continue; createTree(scene, x, z, .55 + (i % 4) * .12); }     const water = new THREE.Mesh(new THREE.CircleGeometry(80, 64), new THREE.MeshStandardMaterial({ color: 0x194d67, roughness: .3, metalness: .15 })); water.rotation.x = -Math.PI / 2; water.position.y = -.12; scene.add(water); addWaterfallGarden(scene);
    const magic = addMagic(scene); const waterfall = addWaterfall(scene); const landmarks: Record<string, THREE.Group> = {}; Object.entries(zones).forEach(([key, zone]) => { const g = new THREE.Group(); const [x, z] = zone.position; addWizardTower(scene, x, z, zone.color); const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2, .5, 8), new THREE.MeshStandardMaterial({ color: zone.color, emissive: zone.color, emissiveIntensity: .3 })); base.position.y = .3; const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(.8), new THREE.MeshStandardMaterial({ color: zone.color, emissive: zone.color, emissiveIntensity: .9, flatShading: true })); beacon.position.y = 6.25; const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45, .045, 6, 32), new THREE.MeshBasicMaterial({ color: zone.color })); ring.rotation.x = Math.PI / 2; ring.position.y = .58; const label = makeLabel(zone.label, zone.color); label.position.y = 7.25; g.add(base, beacon, ring, label); g.position.set(x, 0, z); scene.add(g); landmarks[key] = g; });
    const npcs = [createNPC(scene, "LUMI", "The crystals answer to curious builders. Try the glowing beacons!", "#ffcf70", -8, 7, 0), createNPC(scene, "KAI", "Sprint in short bursts — your camera will follow your momentum.", "#93c8ff", 10, -5, 2.2), createNPC(scene, "NOVA", "Every district hides a story. Discover all four signals.", "#ff8fce", 7, 22, 4.4)];
    const avatar = createAvatar(); avatar.userData.avatar = true; avatar.scale.setScalar(.76); const player = new THREE.Vector3(0, 0, 16); scene.add(avatar); const colliders = [...Object.values(zones).map((zone) => ({ x: zone.position[0], z: zone.position[1], radius: 2.6 })), { x: 0, z: 54, radius: 3.2 }]; const keys = new Set<string>(); let yaw = Math.PI; let pitch = -.12; let cameraYaw = yaw; let cameraPitch = pitch; let cameraDistance = 7.5; let smoothedCameraDistance = cameraDistance; let dragging = false; let cameraDragging = false; let lastX = 0; let lastY = 0; let pinchDistance = 0; let velocity = new THREE.Vector3(); let lastNearZone: ZoneKey | null = null; let lastNearNpc: NPC | null = null; const anchor = new THREE.Vector3(); const desiredCamera = new THREE.Vector3(); const cameraOffset = new THREE.Vector3(); const lookTarget = new THREE.Vector3(); const raycaster = new THREE.Raycaster(); raycaster.camera = camera;
    resetCameraRef.current = () => { yaw = Math.PI; pitch = -.12; cameraYaw = yaw; cameraPitch = pitch; cameraDistance = 7.5; smoothedCameraDistance = cameraDistance; };
    const onKey = (e: KeyboardEvent) => { if (e.type === "keydown") { keys.add(e.key.toLowerCase()); setStarted(true); if (e.key.toLowerCase() === "e" && lastNearNpc) setDialogue(lastNearNpc.line); else if (e.key.toLowerCase() === "e" && lastNearZone) chooseZone(lastNearZone); if (e.key.toLowerCase() === "r") resetCameraRef.current?.(); } else keys.delete(e.key.toLowerCase()); };
    const onMouseDown = (e: MouseEvent) => { if (e.button !== 0) return; cameraDragging = true; lastX = e.clientX; lastY = e.clientY; setStarted(true); renderer.domElement.classList.add("is-dragging"); };
    const onMouseMove = (e: MouseEvent) => { if (!cameraDragging) return; yaw -= (e.clientX - lastX) * .003; pitch = THREE.MathUtils.clamp(pitch - (e.clientY - lastY) * .002, -.48, .12); lastX = e.clientX; lastY = e.clientY; };
    const onMouseUp = () => { cameraDragging = false; renderer.domElement.classList.remove("is-dragging"); };
    const onWheel = (e: WheelEvent) => { cameraDistance = THREE.MathUtils.clamp(cameraDistance + e.deltaY * .006, 5.5, 11); };
    const onTouchStart = (e: TouchEvent) => { if (e.touches.length > 1) { pinchDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); dragging = false; return; } const t = e.touches[0]; if (t) { dragging = true; lastX = t.clientX; lastY = t.clientY; setStarted(true); } };
    const onTouchMove = (e: TouchEvent) => { if (e.touches.length > 1) { const distance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pinchDistance) cameraDistance = THREE.MathUtils.clamp(cameraDistance - (distance - pinchDistance) * .012, 5.5, 11); pinchDistance = distance; return; } const t = e.touches[0]; if (t && dragging) { yaw -= (t.clientX - lastX) * .003; pitch = THREE.MathUtils.clamp(pitch - (t.clientY - lastY) * .0015, -.48, .12); lastX = t.clientX; lastY = t.clientY; } };
    const onTouchEnd = () => { dragging = false; pinchDistance = 0; };
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKey); renderer.domElement.addEventListener("mousedown", onMouseDown); window.addEventListener("mousemove", onMouseMove); window.addEventListener("mouseup", onMouseUp); renderer.domElement.addEventListener("wheel", onWheel, { passive: true }); renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: true }); renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: true }); renderer.domElement.addEventListener("touchend", onTouchEnd, { passive: true });
    const clock = new THREE.Clock(); let frame = 0; let stateTick = 0; const animate = () => { const delta = Math.min(clock.getDelta(), .05), elapsed = clock.elapsedTime, touch = controlsRef.current; const rawForward = Number(keys.has("w") || keys.has("arrowup")) - Number(keys.has("s") || keys.has("arrowdown")); const rawSide = Number(keys.has("d") || keys.has("arrowright")) - Number(keys.has("a") || keys.has("arrowleft")); const input = new THREE.Vector3(rawSide + touch.side, rawForward + touch.forward, 0); const moveInput = new THREE.Vector3(input.x, 0, input.y); if (moveInput.lengthSq() > 1) moveInput.normalize(); const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), strafe = new THREE.Vector3(-Math.cos(yaw), 0, Math.sin(yaw)); const desired = strafe.multiplyScalar(moveInput.x).add(forward.multiplyScalar(moveInput.z)); const running = keys.has("shift") && desired.lengthSq() > 0; const maxSpeed = running ? 12 : 7; velocity.lerp(desired.multiplyScalar(maxSpeed), 1 - Math.pow(.001, delta)); if (!desired.lengthSq()) velocity.multiplyScalar(Math.pow(.035, delta)); const nextPlayer = player.clone().addScaledVector(velocity, delta); colliders.forEach((collider) => { const dx = nextPlayer.x - collider.x; const dz = nextPlayer.z - collider.z; const distance = Math.hypot(dx, dz); const minimum = collider.radius + .7; if (distance < minimum && distance > .001) { nextPlayer.x = collider.x + (dx / distance) * minimum; nextPlayer.z = collider.z + (dz / distance) * minimum; velocity.multiplyScalar(.2); } }); player.copy(nextPlayer); player.x = THREE.MathUtils.clamp(player.x, -72, 72); player.z = THREE.MathUtils.clamp(player.z, -72, 72);         const moving = velocity.length() > .15; avatar.position.copy(player); playerLight.position.set(player.x, player.y + 2.4, player.z); avatar.rotation.y = moving ? Math.atan2(velocity.x, velocity.z) : avatar.rotation.y; const limbs = avatar.userData.limbs as THREE.Object3D[]; const torso = avatar.userData.torso as THREE.Object3D; const head = avatar.userData.head as THREE.Object3D; const stride = moving ? Math.sin(elapsed * (running ? 14 : 9)) * (running ? .72 : .48) : 0; limbs[0].rotation.x = stride; limbs[1].rotation.x = -stride; limbs[2].rotation.x = -stride; limbs[3].rotation.x = stride; const breathing = moving ? 0 : Math.sin(elapsed * 2.2) * .018; torso.position.y = 1.2 + breathing; torso.rotation.z = THREE.MathUtils.lerp(torso.rotation.z, -input.x * .12, .12); head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, input.x * .08, .12); head.position.y = 2.15 + breathing * .45; avatar.position.y = moving ? Math.abs(Math.sin(elapsed * (running ? 14 : 9))) * (running ? .13 : .07) : Math.sin(elapsed * 1.5) * .015;
      magic.portal.children[0].rotation.z = elapsed * .5; magic.portal.children[1].rotation.z = -elapsed * .2; magic.shrine.children[2].scale.setScalar(1 + Math.sin(elapsed * 3) * .12); magic.particles.rotation.y = elapsed * .012; birds.position.x = Math.sin(elapsed * .08) * 7; birds.position.y = Math.sin(elapsed * .45) * .65; birds.position.z = Math.cos(elapsed * .06) * 5; ocean.material.uniforms.time.value += delta; mixers.forEach((mixer) => mixer.update(delta)); waterfall.update(elapsed); cameraYaw = THREE.MathUtils.damp(cameraYaw, yaw, 5, delta); cameraPitch = THREE.MathUtils.damp(cameraPitch, pitch, 5, delta); cameraDistance = THREE.MathUtils.clamp(cameraDistance, 5.5, 11); anchor.set(player.x, player.y + 1.35, player.z); cameraOffset.set(-Math.sin(cameraYaw), .24 + cameraPitch * .16, -Math.cos(cameraYaw)).normalize().multiplyScalar(cameraDistance); desiredCamera.copy(anchor).add(cameraOffset); raycaster.set(anchor, desiredCamera.clone().sub(anchor).normalize()); const hit = raycaster.intersectObjects(scene.children, true).find((intersection) => { let object: THREE.Object3D | null = intersection.object; while (object) { if (object.userData.avatar || object.userData.cameraIgnore) return false; object = object.parent; } return !(intersection.object instanceof THREE.Sprite) && !(intersection.object instanceof THREE.Points); }); const targetDistance = hit ? Math.max(5.5, Math.min(cameraDistance, hit.distance - .65)) : cameraDistance; smoothedCameraDistance = THREE.MathUtils.damp(smoothedCameraDistance, targetDistance, 14, delta); cameraOffset.normalize().multiplyScalar(smoothedCameraDistance); desiredCamera.copy(anchor).add(cameraOffset); camera.position.lerp(desiredCamera, 1 - Math.pow(.00005, delta)); lookTarget.set(player.x, player.y + 1.25, player.z); camera.lookAt(lookTarget);
      let closest: ZoneKey | null = null; let closestDistance = 3.5; (Object.keys(zones) as ZoneKey[]).forEach((key, index) => { const lm = landmarks[key]; lm.children[1].rotation.y += delta * 1.5; lm.children[2].rotation.z = elapsed * .6; lm.children[3].position.y = 3.2 + Math.sin(elapsed * 2 + index) * .12; const [x, z] = zones[key].position; const d = Math.hypot(player.x - x, player.z - z); if (d < closestDistance) { closest = key; closestDistance = d; } }); let npcClosest: NPC | null = null; let npcDistance = 3.2; npcs.forEach(npc => { const d = Math.hypot(player.x - npc.group.position.x, player.z - npc.group.position.z); npc.group.position.x = npc.home.x + Math.sin(elapsed * .35 + npc.phase) * 1.3; npc.group.position.z = npc.home.z + Math.cos(elapsed * .28 + npc.phase) * 1.1; npc.group.rotation.y = Math.atan2(player.x - npc.group.position.x, player.z - npc.group.position.z); npc.group.children[3].position.y = 2.25 + Math.sin(elapsed * 2 + npc.phase) * .08; if (d < npcDistance) { npcClosest = npc; npcDistance = d; } }); if (stateTick++ % 12 === 0) { setNear(closest); setNearNpc(npcClosest); setSprinting(running); lastNearZone = closest; lastNearNpc = npcClosest; } renderer.render(scene, camera); frame = requestAnimationFrame(animate); }; animate();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); renderer.domElement.removeEventListener("mousedown", onMouseDown); window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); renderer.domElement.removeEventListener("wheel", onWheel); renderer.domElement.removeEventListener("touchstart", onTouchStart); renderer.domElement.removeEventListener("touchmove", onTouchMove); renderer.domElement.removeEventListener("touchend", onTouchEnd); renderer.domElement.classList.remove("is-dragging"); scene.traverse((object) => { if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach((material) => { if (material.map instanceof THREE.Texture) material.map.dispose(); material.dispose(); }); } }); if (scene.background instanceof THREE.Texture) scene.background.dispose(); renderer.dispose(); if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement); };
    lightingRef.current?.(nightMode);
  }, []);
  const chooseZone = (key: ZoneKey) => { setActive(key); setStarted(true); if (!discovered.includes(key)) setDiscovered([...discovered, key]); }; const nudge = (forward: number, side: number) => { controlsRef.current.forward = forward; controlsRef.current.side = side; setStarted(true); }; const current = active ? zones[active] : null; const interact = () => { if (nearNpc) setDialogue(nearNpc.line); else if (near) chooseZone(near); };
  useEffect(() => { lightingRef.current?.(nightMode); }, [nightMode]);
  return <main className={`world-shell ${nightMode ? "is-night" : ""}`}><div className="world-canvas" ref={mountRef} /><header className="world-header"><a className="world-brand" href="#top">DM<span>.</span></a><div className="world-status"><i /> {nightMode ? "NIGHT MODE / OPEN WORLD" : "DAY MODE / OPEN WORLD"}</div><div className="world-header-actions"><button className="mode-toggle" onClick={() => setNightMode((value) => !value)} aria-pressed={nightMode}>{nightMode ? "☼ DAY" : "☾ NIGHT"}</button><a className="world-mail" href="mailto:auditor.devansh.in@gmail.com">LET&apos;S TALK ↗</a></div></header><div className="crosshair" aria-hidden="true"><span /></div><section className={`intro-card ${started ? "is-started" : ""}`}><p className="world-kicker">DEVANSH MISHRA / PORTFOLIO REALM</p><h1>Build<br /><em>magic.</em></h1><p className="intro-copy">A living portfolio for cloud systems, Salesforce builds, and curious experiments. Explore the realm, meet its guides, and discover the work.</p><button onClick={() => setStarted(true)}>Enter the world <span>↗</span></button></section>{(near || nearNpc) && !active && !dialogue && <button className="near-prompt" onClick={interact}><span>✦</span>{nearNpc ? `Talk to ${nearNpc.name}` : `Enter ${zones[near!].label} district`}<b> E / ↗</b></button>}{dialogue && <aside className="dialogue"><b>✦ GUIDE SIGNAL</b><p>{dialogue}</p><button onClick={() => setDialogue("")}>Continue exploring</button></aside>}  <div className="hud"><div><b>MOVE</b> WASD / ARROWS</div><div><b>CAMERA</b> {mobile ? "DRAG / PINCH" : "CLICK / DRAG · WHEEL"}</div><div><b>STATE</b> {sprinting ? "SPRINTING" : "EXPLORING"}</div><div><b>DISCOVERY</b> {discovered.length}/4 SIGNALS</div><button className="reset-camera" onClick={() => resetCameraRef.current?.()}>RESET VIEW <span>R</span></button></div>{mobile && <div className="mobile-controls" aria-label="Touch movement controls"><button onPointerDown={() => nudge(1, 0)} onPointerUp={() => nudge(0, 0)}>↑</button><div><button onPointerDown={() => nudge(0, -1)} onPointerUp={() => nudge(0, 0)}>←</button><button onPointerDown={() => nudge(-1, 0)} onPointerUp={() => nudge(0, 0)}>↓</button><button onPointerDown={() => nudge(0, 1)} onPointerUp={() => nudge(0, 0)}>→</button></div></div>}<nav className="zone-nav" aria-label="World zones">{Object.entries(zones).map(([key, zone]) => <button key={key} onClick={() => chooseZone(key as ZoneKey)} style={{ "--zone-color": zone.color } as React.CSSProperties}><span />{zone.label}{discovered.includes(key as ZoneKey) && " ✓"}</button>)}</nav>{current && <aside className="zone-panel" style={{ "--zone-color": current.color } as React.CSSProperties}><button className="close-panel" onClick={() => setActive(null)} aria-label="Close station">×</button><p className="world-kicker">{current.kicker}</p><h2>{current.title}</h2><p>{current.copy}</p><p className="panel-detail">{current.detail}</p><div className="skill-chips">{active === "skills" ? ["LINUX", "KUBERNETES", "AWS", "SALESFORCE"].map(x => <span key={x}>{x}</span>) : active === "work" ? ["GROUNDTRUTH", "AW COMPUTING", "PROJECT OPS"].map(x => <span key={x}>{x}</span>) : ["CURIOUS", "SYSTEMS", "COLLABORATIVE"].map(x => <span key={x}>{x}</span>)}</div><a className="panel-link" href={current.href} target={current.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer">{current.cta} ↗</a>{active === "contact" && <div className="panel-socials"><a href="https://github.com/AuditorDevansh" target="_blank" rel="noreferrer">GitHub ↗</a><a href="https://www.linkedin.com/in/devanshmishra29" target="_blank" rel="noreferrer">LinkedIn ↗</a><a href="https://www.salesforce.com/trailblazer/devanshm29" target="_blank" rel="noreferrer">Trailblazer ↗</a></div>}</aside>}<footer className="world-footer"><span>© 2026 DEVANSH MISHRA</span><span className={`asset-status asset-status-${assetStatus}`} aria-live="polite">{assetStatus === "ready" ? "ISLAND ASSET / ONLINE" : assetStatus === "loading" ? "ISLAND ASSET / LOADING" : "PROCEDURAL TERRAIN / ACTIVE"}</span><span>INDIA · UTC +05:30</span></footer></main>;
}
