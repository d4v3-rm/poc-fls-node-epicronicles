import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import type { StarClass, SystemVisibility } from '../../domain/types';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type GalaxySystem = {
  id: string;
  name: string;
  position: { x: number; y: number };
  visibility: SystemVisibility;
  starClass: StarClass;
  hostilePower?: number;
};

const buildPositions = (systems: GalaxySystem[]) => {
  if (systems.length === 0) {
    return [];
  }

  const xs = systems.map((system) => system.position.x);
  const ys = systems.map((system) => system.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  return systems.map((system) => ({
    ...system,
    x: ((system.position.x - minX) / spanX - 0.5) * 200,
    y: ((system.position.y - minY) / spanY - 0.5) * 200,
    z: (Math.random() - 0.5) * 20,
  }));
};

export const GalaxyMap = () => {
  const systems = useGameStore((state) => state.session?.galaxy.systems ?? []);
  const scienceShips = useGameStore(
    (state) => state.session?.scienceShips ?? [],
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const systemGroupRef = useRef<THREE.Group | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070d);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 0, 160);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    const light = new THREE.PointLight(0xffffff, 1.2);
    light.position.set(50, 50, 100);
    scene.add(ambient);
    scene.add(light);

    const systemGroup = new THREE.Group();
    systemGroupRef.current = systemGroup;
    scene.add(systemGroup);

    let isDragging = false;
    let lastPointer = { x: 0, y: 0 };
    let rotation = { x: 0, y: 0 };

    const handleResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.position.z = clamp(
        camera.position.z + event.deltaY * 0.1,
        40,
        400,
      );
    };

    const handleMouseDown = (event: MouseEvent) => {
      isDragging = true;
      lastPointer = { x: event.clientX, y: event.clientY };
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) {
        return;
      }
      const deltaX = event.clientX - lastPointer.x;
      const deltaY = event.clientY - lastPointer.y;
      lastPointer = { x: event.clientX, y: event.clientY };
      rotation.x += deltaX * 0.004;
      rotation.y = clamp(rotation.y + deltaY * 0.004, -Math.PI / 2.5, Math.PI / 2.5);
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    const renderLoop = () => {
      systemGroup.rotation.y = rotation.x;
      systemGroup.rotation.x = rotation.y;
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      renderer.dispose();
      renderer.domElement.remove();
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const group = systemGroupRef.current;
    if (!group) {
      return;
    }

    group.clear();
    const converted = buildPositions(systems);
    const material = new THREE.MeshStandardMaterial({ color: 0x74b0ff });
    const hostileMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
    const shipGeometry = new THREE.SphereGeometry(0.8, 16, 16);

    converted.forEach((system) => {
      const geometry = new THREE.SphereGeometry(
        system.visibility === 'surveyed' ? 2 : 1.2,
        16,
        16,
      );
      const mesh = new THREE.Mesh(
        geometry,
        system.hostilePower && system.hostilePower > 0
          ? hostileMaterial
          : material,
      );
      mesh.position.set(system.x, system.y, system.z);
      mesh.userData = { id: system.id, name: system.name };
      group.add(mesh);
    });

    const shipGroup = new THREE.Group();
    shipGroup.name = 'ships';
    scienceShips.forEach((ship) => {
      const system = converted.find((entry) => entry.id === ship.currentSystemId);
      if (!system) {
        return;
      }
      const shipMesh = new THREE.Mesh(
        shipGeometry,
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      shipMesh.position.set(system.x, system.y, system.z + 3);
      shipGroup.add(shipMesh);
    });
    group.add(shipGroup);
  }, [systems, scienceShips]);

  return <div className="galaxy-map" ref={containerRef} />;
};
