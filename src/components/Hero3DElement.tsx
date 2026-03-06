import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Icosahedron, Float, Stars } from '@react-three/drei';
import { useScroll } from 'framer-motion';
import * as THREE from 'three';

const Hero3DElement = () => {
    const groupRef = useRef<THREE.Group>(null);
    const innerRef = useRef<THREE.Mesh>(null);
    const outerRef = useRef<THREE.Mesh>(null);
    const starsRef = useRef<THREE.Group>(null);
    const { scrollYProgress } = useScroll();
    const { viewport } = useThree();

    useFrame((state) => {
        if (!groupRef.current || !innerRef.current || !outerRef.current || !starsRef.current) return;

        const scroll = scrollYProgress.get();
        const time = state.clock.getElapsedTime();

        // 1. Continuous Slow Rotation Base for the main element
        const baseRotationSpeed = 0.002;
        groupRef.current.rotation.y += baseRotationSpeed;
        groupRef.current.rotation.x += baseRotationSpeed * 0.5;

        // 2. Inner and Outer Counter-Rotation for depth
        innerRef.current.rotation.y = time * 0.1;
        outerRef.current.rotation.x = -time * 0.05;

        // 3. Universe Parallax (Stars rotating based on scroll and time)
        starsRef.current.rotation.y = time * 0.02 + scroll * Math.PI;
        starsRef.current.rotation.x = scroll * Math.PI * 0.5;

        // 4. Roaming Abstract Element (Dynamic X and Y positioning based on scroll)
        // Starts top-right, goes slightly left, ends slightly bottom
        const startX = viewport.width * 0.25;
        const endX = -viewport.width * 0.15;

        // Complex path interpolation
        let targetX = startX;
        let targetY = 0;

        // DECREASED overall scale to make the "bola" significantly smaller and more elegant
        let targetScale = viewport.width > 5 ? 1.4 : 1.0;

        if (scroll < 0.33) {
            // Hero section to Features
            const progress = scroll / 0.33;
            // Easing for smoother start/stop
            const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
            targetX = THREE.MathUtils.lerp(startX, endX, ease);
            targetY = THREE.MathUtils.lerp(0, -viewport.height * 0.15, ease);
        } else if (scroll < 0.66) {
            // Features to Simulator
            const progress = (scroll - 0.33) / 0.33;
            const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
            targetX = THREE.MathUtils.lerp(endX, viewport.width * 0.15, ease);
            targetY = THREE.MathUtils.lerp(-viewport.height * 0.15, viewport.height * 0.05, ease);
            targetScale = THREE.MathUtils.lerp(targetScale, targetScale * 1.1, ease); // Very slight pulse
        } else {
            // Simulator to CTA
            const progress = (scroll - 0.66) / 0.34;
            const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
            targetX = THREE.MathUtils.lerp(viewport.width * 0.15, 0, ease); // Center horizontally
            targetY = THREE.MathUtils.lerp(viewport.height * 0.05, -viewport.height * 0.1, ease); // Center vertically
            targetScale = THREE.MathUtils.lerp(targetScale * 1.1, targetScale * 0.9, ease); // Shrink slowly at the end
        }

        // Apply smooth positions and scale with a slower lerp factor (0.03) for softer, floating movement
        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.03);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.03);
        groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.03));

        // Add extra rotation based on scroll speed, but softer
        const targetRotationZ = scroll * Math.PI * 2;
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotationZ, 0.03);
    });

    return (
        <group>
            {/* Universe Stars - Separated to rotate around the whole scene */}
            <group ref={starsRef}>
                <Stars radius={20} depth={50} count={3000} factor={4} saturation={0} fade speed={1.5} />
            </group>

            {/* Roaming Abstract Element */}
            <group ref={groupRef}>
                <Float
                    speed={2}
                    rotationIntensity={0.5}
                    floatIntensity={0.5}
                    floatingRange={[-0.2, 0.2]}
                >
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
        </group>
    );
};

export default Hero3DElement;
