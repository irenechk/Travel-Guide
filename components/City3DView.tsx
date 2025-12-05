import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { getCityPanorama } from '../services/geminiService';
import { Loader2, Move, View, Plus, Minus, RotateCw, Sparkles } from 'lucide-react';

interface City3DViewProps {
  city: string;
}

const City3DView: React.FC<City3DViewProps> = ({ city }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const isAutoRotatingRef = useRef(true); // Ref to access inside animation loop without stale closure
  const [zoomLevel, setZoomLevel] = useState(75); // FOV

  // Sync state with ref for loop access
  useEffect(() => {
    isAutoRotatingRef.current = isAutoRotating;
  }, [isAutoRotating]);

  // Handle Zoom
  useEffect(() => {
    if (cameraRef.current) {
        // Smoothly interpolate zoom if we were using a loop, but simple assignment works for this level
        cameraRef.current.fov = zoomLevel;
        cameraRef.current.updateProjectionMatrix();
    }
  }, [zoomLevel]);

  const handleZoomIn = () => setZoomLevel(prev => Math.max(30, prev - 10));
  const handleZoomOut = () => setZoomLevel(prev => Math.min(100, prev + 10));

  useEffect(() => {
    let scene: THREE.Scene;
    let isUserInteracting = false;
    let onPointerDownPointerX = 0;
    let onPointerDownPointerY = 0;
    let lon = 0;
    let onPointerDownLon = 0;
    let lat = 0;
    let onPointerDownLat = 0;
    let phi = 0;
    let theta = 0;
    let particlesMesh: THREE.Points;

    const init = async () => {
      if (!containerRef.current) return;

      // Clean up previous scene if any
      while(containerRef.current.firstChild){
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      setLoading(true);
      const panoramaUrl = await getCityPanorama(city);
      
      if (!panoramaUrl) {
        setLoading(false);
        setError(true);
        return;
      }

      const container = containerRef.current;

      const camera = new THREE.PerspectiveCamera(zoomLevel, container.clientWidth / container.clientHeight, 1, 1100);
      cameraRef.current = camera;
      
      scene = new THREE.Scene();

      // Background Sphere
      const geometry = new THREE.SphereGeometry(500, 60, 40);
      // invert the geometry on the x-axis so that all of the faces point inward
      geometry.scale(-1, 1, 1);

      const textureLoader = new THREE.TextureLoader();
      
      try {
        const texture = textureLoader.load(panoramaUrl, () => {
           setLoading(false);
        });
        texture.colorSpace = THREE.SRGBColorSpace;
        
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      } catch (e) {
        console.error("Texture error", e);
        setError(true);
        setLoading(false);
      }

      // --- ADD INTERACTIVE PARTICLES ---
      // This adds depth to the scene
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = 1000;
      const posArray = new Float32Array(particlesCount * 3);

      for(let i = 0; i < particlesCount * 3; i++) {
        // Distribute particles randomly within the sphere volume
        // Range -400 to 400
        posArray[i] = (Math.random() - 0.5) * 800;
      }

      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const particlesMaterial = new THREE.PointsMaterial({
        size: 2,
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });

      particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particlesMesh);
      // -------------------------------

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      container.style.touchAction = 'none';
      container.addEventListener('pointerdown', onPointerDown);

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      
      // Handle Resize
      window.addEventListener('resize', onWindowResize);

      animate();
    };

    const onWindowResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.isPrimary === false) return;
      isUserInteracting = true;
      onPointerDownPointerX = event.clientX;
      onPointerDownPointerY = event.clientY;
      onPointerDownLon = lon;
      onPointerDownLat = lat;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.isPrimary === false || !isUserInteracting) return;
      lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
      lat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.isPrimary === false) return;
      isUserInteracting = false;
    };

    const animate = () => {
      if (!rendererRef.current || !scene || !cameraRef.current) return;
      requestAnimationFrame(animate);
      update();
    };

    const update = () => {
      // Auto rotate if enabled and not dragging
      if (!isUserInteracting && isAutoRotatingRef.current) {
        lon += 0.05; 
      }

      lat = Math.max(-85, Math.min(85, lat));
      phi = THREE.MathUtils.degToRad(90 - lat);
      theta = THREE.MathUtils.degToRad(lon);

      const x = 500 * Math.sin(phi) * Math.cos(theta);
      const y = 500 * Math.cos(phi);
      const z = 500 * Math.sin(phi) * Math.sin(theta);

      cameraRef.current!.lookAt(x, y, z);
      
      // Subtle particle rotation to make the air feel "alive"
      if (particlesMesh) {
         particlesMesh.rotation.y += 0.0005;
      }

      rendererRef.current!.render(scene, cameraRef.current!);
    };

    init();

    return () => {
        // Cleanup
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('resize', onWindowResize);
        if (rendererRef.current) rendererRef.current.dispose();
    };
  }, [city]); // Re-run if city changes

  return (
    <div className="w-full h-[600px] relative rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/10 group">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      {/* Controls Overlay */}
      {!loading && !error && (
         <div className="absolute top-6 right-6 flex flex-col gap-2 z-20">
             <div className="bg-black/40 backdrop-blur-md rounded-xl p-1 border border-white/10 flex flex-col gap-1">
                <button 
                    onClick={handleZoomIn} 
                    className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                    title="Zoom In"
                >
                    <Plus className="w-5 h-5" />
                </button>
                <div className="h-px bg-white/10 w-full"></div>
                <button 
                    onClick={handleZoomOut}
                    className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                    title="Zoom Out"
                >
                    <Minus className="w-5 h-5" />
                </button>
             </div>

             <button 
                onClick={() => setIsAutoRotating(!isAutoRotating)}
                className={`p-3 rounded-xl border backdrop-blur-md transition-all ${isAutoRotating ? 'bg-blue-600/80 border-blue-500 text-white' : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'}`}
                title={isAutoRotating ? "Pause Rotation" : "Auto Rotate"}
             >
                <RotateCw className={`w-5 h-5 ${isAutoRotating ? 'animate-spin-slow' : ''}`} />
             </button>
         </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-10">
           <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
           <p className="text-white font-light animate-pulse">Generating High-Fidelity 3D Environment...</p>
           <p className="text-xs text-slate-500 mt-2">Rendering 8K Textures & Volumetric Detail</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
           <p className="text-red-400">Failed to load 3D view. Please try again.</p>
        </div>
      )}

      {!loading && !error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-3 text-white pointer-events-none border border-white/10 transition-opacity duration-300 opacity-50 hover:opacity-100">
            <Move className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium hidden md:inline">Drag to look around</span>
            <div className="w-px h-4 bg-white/20 hidden md:block"></div>
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-medium">Interactive Ambience</span>
        </div>
      )}
    </div>
  );
};

export default City3DView;
