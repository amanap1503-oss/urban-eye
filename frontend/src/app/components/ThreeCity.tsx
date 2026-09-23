import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeCity: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050816, 0.015);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(25, 18, 35);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x3b82f6, 2.5);
    dirLight1.position.set(20, 40, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 1.5);
    dirLight2.position.set(-20, 20, -20);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x8b5cf6, 4, 100);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    // City Group
    const cityGroup = new THREE.Group();
    scene.add(cityGroup);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(60, 40, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // Buildings procedural generation
    const buildings: THREE.Mesh[] = [];
    const buildingCount = 70;
    const size = 50;

    for (let i = 0; i < buildingCount; i++) {
      const h = Math.random() * 12 + 2;
      const w = Math.random() * 2 + 1.2;
      const d = Math.random() * 2 + 1.2;

      const geometry = new THREE.BoxGeometry(w, h, d);

      // Cyber glow material
      const material = new THREE.MeshPhongMaterial({
        color: 0x0b1329,
        transparent: true,
        opacity: 0.85,
        shininess: 90,
        emissive: new THREE.Color(i % 2 === 0 ? 0x06b6d4 : 0x3b82f6),
        emissiveIntensity: 0.15
      });

      const building = new THREE.Mesh(geometry, material);

      // Position on a grid, avoid placing in center block
      let px = (Math.random() - 0.5) * size;
      let pz = (Math.random() - 0.5) * size;

      while (Math.abs(px) < 4 && Math.abs(pz) < 4) {
        px = (Math.random() - 0.5) * size;
        pz = (Math.random() - 0.5) * size;
      }

      building.position.set(px, h / 2, pz);
      cityGroup.add(building);
      buildings.push(building);

      // Add elegant wireframe outline
      const wireframeGeom = new THREE.EdgesGeometry(geometry);
      const wireframeMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0x06b6d4 : 0x3b82f6,
        transparent: true,
        opacity: 0.35
      });
      const wireframe = new THREE.LineSegments(wireframeGeom, wireframeMat);
      building.add(wireframe);
    }

    // Interactive Raycasting for Hover glow
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let lastIntersected: THREE.Mesh | null = null;

    const onMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    container.addEventListener('mousemove', onMouseMove);

    // Road networks & Animated data flows (flowing particles)
    const particleCount = 250;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    const directions: string[] = [];

    // Define random road routes on the grid
    for (let i = 0; i < particleCount; i++) {
      // Choose horizontal or vertical roads
      const isHorizontal = Math.random() > 0.5;
      const roadCoord = (Math.floor(Math.random() * 10) - 5) * 6; // snap to grid helper lines

      const x = isHorizontal ? (Math.random() - 0.5) * size : roadCoord;
      const y = 0.1; // Float just above floor
      const z = isHorizontal ? roadCoord : (Math.random() - 0.5) * size;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      speeds[i] = Math.random() * 0.15 + 0.05;
      directions.push(isHorizontal ? 'x' : 'z');
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.3,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const flowParticles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(flowParticles);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Soft rotating perspective
      cityGroup.rotation.y = elapsed * 0.025;
      flowParticles.rotation.y = elapsed * 0.025;

      // Animate road networks
      const positionAttr = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let val = positionAttr.getComponent(i, directions[i] === 'x' ? 0 : 2);
        val += speeds[i];
        if (val > size / 2) val = -size / 2;
        positionAttr.setComponent(i, directions[i] === 'x' ? 0 : 2, val);
      }
      positionAttr.needsUpdate = true;

      // Pulse ambient lights slightly
      pointLight.position.y = 12 + Math.sin(elapsed * 2) * 3;
      pointLight.intensity = 3 + Math.sin(elapsed * 1.5) * 1;

      // Mouse-based hover highlights
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(buildings, false);

      if (intersects.length > 0) {
        const intersected = intersects[0].object as THREE.Mesh;
        if (lastIntersected !== intersected) {
          if (lastIntersected) {
            if (lastIntersected.material) {
              (lastIntersected.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.15;
            }
            if (lastIntersected.children && lastIntersected.children[0]) {
              const wireframe = lastIntersected.children[0] as THREE.LineSegments;
              if (wireframe.material) {
                (wireframe.material as THREE.LineBasicMaterial).color.setHex(0x06b6d4);
              }
            }
          }
          lastIntersected = intersected;
          if (intersected.material) {
            (intersected.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.8;
          }
          // Glow pink/cyan when hovered
          if (intersected.children && intersected.children[0]) {
            const wireframe = intersected.children[0] as THREE.LineSegments;
            if (wireframe.material) {
              (wireframe.material as THREE.LineBasicMaterial).color.setHex(0xec4899);
            }
          }
        }
      } else {
        if (lastIntersected) {
          if (lastIntersected.material) {
            (lastIntersected.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.15;
          }
          if (lastIntersected.children && lastIntersected.children[0]) {
            const wireframe = lastIntersected.children[0] as THREE.LineSegments;
            if (wireframe.material) {
              (wireframe.material as THREE.LineBasicMaterial).color.setHex(0x06b6d4);
            }
          }
          lastIntersected = null;
        }
      }

      // Parallax effect
      camera.position.x = 25 + mouse.x * 5;
      camera.position.y = 18 + mouse.y * 3;
      camera.lookAt(0, 2, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', onMouseMove);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      // dispose geometries/materials
      buildings.forEach(b => {
        b.geometry.dispose();
        if (Array.isArray(b.material)) {
          b.material.forEach(m => m.dispose());
        } else {
          b.material.dispose();
        }
      });
      gridHelper.geometry.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full select-none cursor-crosshair">
      <div ref={containerRef} className="w-full h-full" id="three-city-container" />
      <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
        <span className="flex h-2 w-2 relative mt-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <div className="font-mono text-xs text-slate-400">
          <span className="text-cyan-400">Hologram Engine:</span> Active City Simulation
        </div>
      </div>
    </div>
  );
};
