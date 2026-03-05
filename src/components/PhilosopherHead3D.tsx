import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from 'framer-motion';
import { useGLTF, Float, Point, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const PhilosopherHead3D = () => {
    const groupRef = useRef<THREE.Group>(null);
    const pointsRef = useRef<THREE.Points>(null);
    const { scrollYProgress } = useScroll();

    // Load the head model to use its geometry for particles
    const { nodes } = useGLTF('/philosopher.glb') as any;

    const particles = useMemo(() => {
        if (!nodes || !nodes.Mesh_Mesh_head_geo001_lambert2SG001) return null;

        const geometry = nodes.Mesh_Mesh_head_geo001_lambert2SG001.geometry;
        const positions = geometry.attributes.position.array;
        const count = positions.length / 3;

        // Downsample or use all points
        const stride = 1; // Use every point for high density
        const particlePositions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            particlePositions[i * 3] = positions[i * 3];
            particlePositions[i * 3 + 1] = positions[i * 3 + 1];
            particlePositions[i * 3 + 2] = positions[i * 3 + 2];
        }

        return particlePositions;
    }, [nodes]);

    useFrame((state) => {
        if (!groupRef.current) return;

        const scroll = scrollYProgress.get();

        // High-end rotation logic
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
            groupRef.current.rotation.y,
            scroll * Math.PI * 6, // Multiple spins as we scroll
            0.05
        );

        // Position shifts based on scroll
        const viewportWidth = 15; // Rough estimate for positioning
        let targetX = viewportWidth / 4;
        let targetY = 0;

        if (scroll > 0.3) {
            targetX = -viewportWidth / 3;
            targetY = -1;
        }
        if (scroll > 0.7) {
            targetX = 0;
            targetY = 1;
        }

        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.03);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.03);

        // Subtle pulse for particles
        if (pointsRef.current) {
            pointsRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
        }
    });

    if (!particles) return null;

    return (
        <group ref={groupRef}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                {/* The "Neural" Particle Head */}
                <points ref={pointsRef} scale={15} rotation={[0, -Math.PI / 2, 0]}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={particles.length / 3}
                            array={particles}
                            itemSize={3}
                        />
                    </bufferGeometry>
                    <PointsMaterial
                        transparent
                        size={0.015}
                        sizeAttenuation={true}
                        color="#ef4444"
                        opacity={0.8}
                    />
                </points>

                {/* Subtle core glow inside the particle cloud */}
                <mesh position={[0, 1.5, 0]}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshStandardMaterial
                        color="#000000"
                        emissive="#ef4444"
                        emissiveIntensity={1.5}
                        transparent
                        opacity={0.3}
                    />
                </mesh>

                {/* Cyber accent rings */}
                <mesh rotation={[Math.PI / 2, 0.2, 0]} position={[0, -1, 0]}>
                    <torusGeometry args={[2.5, 0.01, 16, 100]} />
                    <meshBasicMaterial color="#ef4444" transparent opacity={0.4} />
                </mesh>
                <mesh rotation={[Math.PI / 2, -0.2, 0]} position={[0, -1.2, 0]}>
                    <torusGeometry args={[2.8, 0.01, 16, 100]} />
                    <meshBasicMaterial color="#ef4444" transparent opacity={0.2} />
                </mesh>
            </Float>
        </group>
    );
};

// Custom helper for a more "glowy" point
const PointsMaterial = (props: any) => {
    return (
        <shaderMaterial
            {...props}
            uniforms={{
                uColor: { value: new THREE.Color(props.color) },
                uSize: { value: props.size },
                uOpacity: { value: props.opacity }
            }}
            vertexShader={`
                varying vec3 vColor;
                uniform float uSize;
                void main() {
                    vColor = vec3(1.0, 0.2, 0.2);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = uSize * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `}
            fragmentShader={`
                varying vec3 vColor;
                uniform float uOpacity;
                void main() {
                    float r = distance(gl_PointCoord, vec2(0.5));
                    if (r > 0.5) discard;
                    float strength = 1.0 - (r * 2.0);
                    gl_FragColor = vec4(vColor, strength * uOpacity);
                }
            `}
        />
    );
};

useGLTF.preload('/philosopher.glb');

export default PhilosopherHead3D;
