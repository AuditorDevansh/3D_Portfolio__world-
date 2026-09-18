"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function SignalOrb() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.z = 4.3;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.18, 3),
      new THREE.MeshBasicMaterial({ color: 0x73e7ff, wireframe: true, transparent: true, opacity: 0.72 })
    );
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.78, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x1957ff, transparent: true, opacity: 0.15 })
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.48, 0.012, 8, 100),
      new THREE.MeshBasicMaterial({ color: 0x9ff5ff, transparent: true, opacity: 0.65 })
    );
    scene.add(orb, core, ring);

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let frame = 0;
    const animate = () => {
      orb.rotation.x += 0.002;
      orb.rotation.y += 0.004;
      core.rotation.y -= 0.001;
      ring.rotation.x = Math.PI / 2.8;
      ring.rotation.z += 0.003;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.dispose();
      orb.geometry.dispose();
      (orb.material as THREE.Material).dispose();
      core.geometry.dispose();
      (core.material as THREE.Material).dispose();
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="signal-orb" ref={mountRef} aria-label="Animated wireframe signal orb" role="img" />;
}
