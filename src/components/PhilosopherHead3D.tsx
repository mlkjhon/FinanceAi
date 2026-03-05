import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll, useSpring } from 'framer-motion';
import { useGLTF, Float, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const PhilosopherHead3D = () => {
    const groupRef = useRef<THREE.Group>(null);
    const { scrollYProgress } = useScroll();
    const { viewport } = useThree();

    // Use the downloaded realistic head model
    const { nodes } = useGLTF('/philosopher.glb') as any;

    useFrame((state) => {
        if (!groupRef.current) return;

        const scroll = scrollYProgress.get();

        // Rotation: Slow spin that accelerates with scroll
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
            groupRef.current.rotation.y,
            scroll * Math.PI * 4,
            0.05
        );

        // Position: Moves from right side (Hero) to left side (Features) to center (CTA)
        let targetX = viewport.width / 4;
        let targetY = 0;

        if (scroll > 0.3) {
            targetX = -viewport.width / 3.5;
            targetY = -viewport.height / 8;
        }
        if (scroll > 0.7) {
            targetX = 0;
            targetY = 0;
        }

        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.03);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.03);

        // Breathing / Floating
        groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    });

    return (
        <group ref={groupRef}>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                {/* Lee Perry Smith Head Model */}
                {nodes && nodes.Mesh_Mesh_head_geo001_lambert2SG001 ? (
                    <mesh
                        geometry={nodes.Mesh_Mesh_head_geo001_lambert2SG001.geometry}
                        scale={12}
                        rotation={[0, -Math.PI / 2, 0]}
                    >
                        <meshStandardMaterial
                            color="#111111"
                            roughness={0.1}
                            metalness={1}
                            emissive="#ef4444"
                            emissiveIntensity={0.2}
                        />
                    </mesh>
                ) : (
                    /* Fallback to Socratic-like bust if nodes not found */
                    <group>
                        <mesh position={[0, -1, 0]}>
                            <boxGeometry args={[2, 3, 1.5]} />
                            <meshStandardMaterial color="#111111" roughness={0.1} metalness={1} />
                        </mesh>
                        <mesh position={[0, 1.5, 0]}>
                            <sphereGeometry args={[1.2, 32, 32]} />
                            <meshStandardMaterial
                                color="#111111"
                                roughness={0}
                                metalness={1}
                                emissive="#ef4444"
                                emissiveIntensity={0.5}
                            />
                        </mesh>
                    </group>
                )}

                {/* Cyberpunk accent ring around neck area */}
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
                    <torusGeometry args={[1.8, 0.05, 16, 100]} />
                    <meshBasicMaterial color="#ef4444" />
                </mesh>
            </Float>

            <ContactShadows
                position={[0, -4, 0]}
                opacity={0.4}
                scale={20}
                blur={2}
                far={4.5}
            />
        </group>
    );
};

// Preload the model
useGLTF.preload('/philosopher.glb');

export default PhilosopherHead3D;
