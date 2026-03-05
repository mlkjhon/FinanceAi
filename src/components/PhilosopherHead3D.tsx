import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from 'framer-motion';
import { Icosahedron, Wireframe, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const PhilosopherHead3D = () => {
    const groupRef = useRef<THREE.Group>(null);
    const { scrollYProgress } = useScroll();
    const { viewport } = useThree();

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Current scroll progress (0 to 1)
        const scroll = scrollYProgress.get();

        // Rotate the head based on scroll
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
            groupRef.current.rotation.y,
            scroll * Math.PI * 2, // Rotate 360 degrees as we scroll down
            0.1
        );

        // Move the head vertically or horizontally based on scroll to "follow the info"
        // Move from center-right (hero) to left (features)
        const targetX = THREE.MathUtils.lerp(viewport.width / 4, -viewport.width / 4, scroll);
        const targetY = THREE.MathUtils.lerp(0, viewport.height / 4, scroll);

        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.05);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05);

        // Gentle breathing animation
        groupRef.current.position.y += Math.sin(state.clock.elapsedTime) * 0.002;
    });

    return (
        <group ref={groupRef}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                {/* As an abstract representation of an AI Philosopher, we use a complex Icosahedron */}
                <mesh castShadow receiveShadow>
                    <icosahedronGeometry args={[2.5, 1]} />
                    <MeshDistortMaterial
                        color="#050505"
                        emissive="#ef4444"
                        emissiveIntensity={0.5}
                        wireframe
                        distort={0.3}
                        speed={2}
                        roughness={0.2}
                        metalness={1}
                    />
                </mesh>

                {/* Inner Core */}
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

                {/* Floating particles around the head */}
                {Array.from({ length: 15 }).map((_, i) => (
                    <mesh
                        key={i}
                        position={[
                            Math.sin(i) * 3 + (Math.random() - 0.5),
                            Math.cos(i) * 3 + (Math.random() - 0.5),
                            Math.sin(i * 2) * 3 + (Math.random() - 0.5)
                        ]}
                    >
                        <boxGeometry args={[0.1, 0.1, 0.1]} />
                        <meshBasicMaterial color={i % 2 === 0 ? "#ffffff" : "#ef4444"} />
                    </mesh>
                ))}
            </Float>
        </group>
    );
};

export default PhilosopherHead3D;
