import { useEffect, useRef } from "react";
import * as THREE from "three";

export function BackgroundScene() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef(null);
  const particlePositionsRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 1.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0e1f, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // Create aurora particle system (floating sky lights)
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Spread particles more vertically (sky effect)
      const x = (Math.random() - 0.5) * 12;
      const y = (Math.random() - 0.5) * 10 + 1; // bias upward
      const z = (Math.random() - 0.5) * 6;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;

      // Aurora colors: purple, pink, blue
      const hue = 0.55 + Math.random() * 0.25; // 0.55-0.80: purple/pink/blue
      const saturation = 0.7 + Math.random() * 0.3;
      const lightness = 0.45 + Math.random() * 0.25;
      const color = new THREE.Color().setHSL(hue, saturation, lightness);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 0.2 + 0.08;
      opacities[i] = Math.random() * 0.6 + 0.3;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("opacity", new THREE.BufferAttribute(opacities, 1));

    particlePositionsRef.current = { positions, basePositions };

    // Custom shader for aurora particles with glow
    const vertexShader = `
      attribute float size;
      attribute float opacity;
      varying vec3 vColor;
      varying float vOpacity;
      uniform float time;

      void main() {
        vColor = color;
        vOpacity = opacity;
        
        // Floating animation
        vec3 pos = position;
        pos.y += sin(time * 0.3 + position.x * 0.5) * 0.3;
        pos.x += cos(time * 0.25 + position.y * 0.3) * 0.2;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (300.0 / length(mvPosition.xyz));
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vColor;
      varying float vOpacity;

      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;

        // Smooth glow effect
        float alpha = (1.0 - dist * dist) * vOpacity * 1.2;
        gl_FragColor = vec4(vColor * (1.0 + dist * 0.3), alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader,
      fragmentShader,
      transparent: true,
      sizeAttenuation: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // Create dark aurora gradient background (sky only, no landscape)
    const bgGeometry = new THREE.BufferGeometry();
    const bgPositions = new Float32Array([
      -10, 10, -5,
      10, 10, -5,
      10, -10, -5,
      -10, -10, -5
    ]);
    bgGeometry.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));

    const bgVertexShader = `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const bgFragmentShader = `
      uniform float time;
      varying vec2 vUv;

      void main() {
        // Purple to blue gradient (sky)
        vec3 darkSky = vec3(0.04, 0.06, 0.15);
        
        // Aurora glow pockets
        float auroraFlow = sin(vUv.x * 3.0 + time * 0.2) * sin(vUv.y * 2.0 + time * 0.3);
        auroraFlow = smoothstep(0.3, 0.7, auroraFlow);
        
        vec3 purpleAurora = vec3(0.8, 0.3, 1.0) * auroraFlow * 0.2;
        vec3 blueAurora = vec3(0.3, 0.6, 1.0) * auroraFlow * 0.15;
        
        vec3 finalColor = darkSky + purpleAurora + blueAurora;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const bgMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: bgVertexShader,
      fragmentShader: bgFragmentShader,
      side: THREE.DoubleSide,
    });

    const bgPlane = new THREE.Mesh(bgGeometry, bgMaterial);
    bgPlane.position.z = -8;
    scene.add(bgPlane);

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      timeRef.current += 0.016; // ~60fps

      // Update shader time
      material.uniforms.time.value = timeRef.current;
      bgMaterial.uniforms.time.value = timeRef.current;

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      bgGeometry.dispose();
      material.dispose();
      bgMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
