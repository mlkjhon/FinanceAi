import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Icosahedron, Float, Stars } from '@react-three/drei';
import { useScroll } from 'framer-motion';
import * as THREE from 'three';

const Hero3DElement = () => {
    const groupRef = useRef<THREE.Group>(null);
    const innerRef = useRef<THREE.Mesh>(null);
    const outerRef = useRef<THREE.Mesh>(null);
    const { scrollYProgress } = useScroll();
    const { viewport } = useThree();

    useFrame((state) => {
        if (!groupRef.current || !innerRef.current || !outerRef.current) return;

        const scroll = scrollYProgress.get();
        const time = state.clock.getElapsedTime();

        // 1. Continuous Slow Rotation Base
        const baseRotationSpeed = 0.002;
        groupRef.current.rotation.y += baseRotationSpeed;
        groupRef.current.rotation.x += baseRotationSpeed * 0.5;

        // 2. Inner and Outer Counter-Rotation for depth
        innerRef.current.rotation.y = time * 0.1;
        outerRef.current.rotation.x = -time * 0.05;

        // 3. Scroll Dynamics
        // Element rotates faster and scales up slightly as you scroll down
        const targetRotation = scroll * Math.PI * 2;
        groupRef.current.rotation.z = THREE.MathUtils.lerp(
            groupRef.current.rotation.z,
            targetRotation,
            0.05
        );

        // Position shifts slightly based on scroll
        const targetY = THREE.MathUtils.lerp(0, viewport.height / 4, scroll);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05);
    });

    return (
        <group ref={groupRef} scale={viewport.width > 5 ? 2.5 : 1.8}>
            <Float
                speed={2}
                rotationIntensity={0.5}
                floatIntensity={0.5}
                floatingRange={[-0.2, 0.2]}
            >
                {/* Subtle Background Stars for Depth */}
                <Stars radius={10} depth={50} count={100} factor={4} saturation={0} fade speed={1} />

                {/* Lighting */}
                <ambientLight intensity={0.2} />
                <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
                <spotLight position={[-10, -10, -10]} angle={0.3} penumbra={1} intensity={2} color="#ef4444" />

                {/* Core Inner Body - Solid Dark Red/Black */}
                <Icosahedron ref={innerRef} args={[1, 0]} scale={0.8}>
                    <meshStandardMaterial
                        color="#050505"
                        roughness={0.2}
                        metalness={0.8}
                        emissive="#ef4444"
                        emissiveIntensity={0.2}
                    />
                </Icosahedron>

                {/* Outer Wireframe - Glowing Red Edges */}
                <Icosahedron ref={outerRef} args={[1.2, 1]}>
                    <meshStandardMaterial
                        color="#ef4444"
                        wireframe
                        transparent
                        opacity={0.3}
                        emissive="#ef4444"
                        emissiveIntensity={2}
                    />
                </Icosahedron>

                {/* Point Lights acting as "data nodes" floating around */}
                <pointLight position={[2, 2, 2]} color="#ffffff" intensity={0.5} distance={5} />
                <pointLight position={[-2, -2, -2]} color="#ef4444" intensity={1} distance={5} />
            </Float>
        </group>
    );
};

export default Hero3DElement;
