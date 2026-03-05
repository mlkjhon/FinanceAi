import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Float } from '@react-three/drei';
import { useScroll } from 'framer-motion';
import * as THREE from 'three';

const SocratesModel = () => {
    // Load the 3D Model from public/socrates.glb
    const { scene } = useGLTF('/socrates.glb');
    const groupRef = useRef<THREE.Group>(null);
    const { scrollYProgress } = useScroll();
    const { viewport } = useThree();

    // Traverse the scene and modify materials to fit the FinanceAI aesthetic
    useMemo(() => {
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Apply a dark red metallic reflective material to give the aesthetic look
                child.material = new THREE.MeshStandardMaterial({
                    color: '#020202', // Even darker core
                    emissive: '#ef4444', // Red glow
                    emissiveIntensity: 0.8, // Increased glow for edges
                    roughness: 0.1,
                    metalness: 0.9,
                });
            }
        });
    }, [scene]);

    useFrame((state) => {
        if (!groupRef.current) return;

        const scroll = scrollYProgress.get();

        // 1. Continuous rotation (base rotation + scroll-based extra rotation)
        groupRef.current.rotation.y += 0.003;

        // Add extra rotation effect smoothly when scrolling
        const targetRotation = scroll * Math.PI;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
            groupRef.current.rotation.y,
            groupRef.current.rotation.y + targetRotation,
            0.02
        );

        // 2. Responsive Positioning & Parallax
        const targetX = viewport.width > 5 ? viewport.width / 4 : 0;
        const targetY = THREE.MathUtils.lerp(-1.5, viewport.height / 3, scroll);

        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.05);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05);
    });

    return (
        <group ref={groupRef} scale={1.5}>
            {/* The Float wrapper adds a nice subtle breathing effect regardless of scroll */}
            <Float
                speed={1.5}
                rotationIntensity={0.1}
                floatIntensity={0.5}
                floatingRange={[-0.1, 0.1]}
            >
                {/* 
                    Intense Red Rim Lighting. 
                    Positioned behind and to the sides to catch the silhouette
                */}
                <spotLight position={[10, 10, -10]} color="#ef4444" intensity={800} distance={30} angle={0.6} penumbra={1} />
                <spotLight position={[-10, 10, -10]} color="#ef4444" intensity={800} distance={30} angle={0.6} penumbra={1} />
                <pointLight position={[0, -5, 5]} color="#ef4444" intensity={500} distance={20} />

                <primitive object={scene} />
            </Float>
        </group>
    );
};

// Preload the model to ensure it doesn't flicker on load
useGLTF.preload('/socrates.glb');

export default SocratesModel;
