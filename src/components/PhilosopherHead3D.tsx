import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from 'framer-motion';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const PhilosopherHead3D = () => {
    const groupRef = useRef<THREE.Group>(null);
    const { scrollYProgress } = useScroll();
    const { viewport } = useThree();

    useFrame((state) => {
        if (!groupRef.current) return;

        const scroll = scrollYProgress.get();

        // Rotate the head based on scroll
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
            groupRef.current.rotation.y,
            scroll * Math.PI * 2,
            0.1
        );

        // Move the head based on scroll
        const targetX = THREE.MathUtils.lerp(viewport.width / 4, -viewport.width / 4, scroll);
        const targetY = THREE.MathUtils.lerp(0, viewport.height / 4, scroll);

        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.05);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05);

        // Breathe
        groupRef.current.position.y += Math.sin(state.clock.elapsedTime) * 0.02;
    });

    return (
        <group ref={groupRef}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                <mesh castShadow receiveShadow>
                    <icosahedronGeometry args={[2.5, 1]} />
                    <MeshDistortMaterial
                        color="#050505"
                        emissive="#ef4444"
                        emissiveIntensity={0.5}
                        wireframe
                        distort={0.4}
                        speed={2}
                        roughness={0.2}
                        metalness={1}
                    />
                </mesh>

                <mesh>
                    <sphereGeometry args={[1.5, 32, 32]} />
                    <meshStandardMaterial
                        color="#000000"
                        emissive="#991b1b"
                        emissiveIntensity={2}
                        roughness={0.1}
                        metalness={0.8}
                    />
                </mesh>

                {Array.from({ length: 20 }).map((_, i) => (
                    <mesh
                        key={i}
                        position={[
                            Math.sin(i) * 4 + (Math.random() - 0.5),
                            Math.cos(i) * 4 + (Math.random() - 0.5),
                            Math.sin(i * 2) * 4 + (Math.random() - 0.5)
                        ]}
                    >
                        <boxGeometry args={[0.05, 0.05, 0.05]} />
                        <meshBasicMaterial color={i % 2 === 0 ? "#ffffff" : "#ef4444"} />
                    </mesh>
                ))}
            </Float>
        </group>
    );
};

export default PhilosopherHead3D;
