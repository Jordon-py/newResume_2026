import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import FloatingCrystal from './FloatingCrystal'

/**
 * "Neural Network" Scene - Luxury Edition
 * 
 * Enhancements:
 * 1. Materials: Upgraded to MeshPhysicalMaterial for better light interaction.
 * 2. Lighting: Added ambient and point lights for depth.
 * 3. Post-Processing: Bloom and Vignette for a cinematic feel.
 * 4. Crystal: Added a central floating glass element.
 */

const PARTICLE_COUNT = 250 // Slightly reduced for performance with expensive materials
const CONNECTION_DISTANCE = 2.5
const INTERACTION_RADIUS = 3

function NeuralNetwork() {
  const meshRef = useRef()
  const linesGeometryRef = useRef()
  const { viewport } = useThree()

  const [particles, lines] = useMemo(() => {
    const tempParticles = []
    const tempLines = new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 3 * 2)
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = (Math.random() - 0.5) * 20
        const y = (Math.random() - 0.5) * 20
        const z = (Math.random() - 0.5) * 10
        tempParticles.push({
            position: new THREE.Vector3(x, y, z),
            velocity: new THREE.Vector3((Math.random() - 0.5) * 0.015, (Math.random() - 0.5) * 0.015, (Math.random() - 0.5) * 0.01), // Slower, smoother
            originalPos: new THREE.Vector3(x, y, z)
        })
    }
    return [tempParticles, tempLines]
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  // Upgraded Line Material: slightly brighter for Bloom pickup
  const lineMaterial = useMemo(() => new THREE.LineBasicMaterial({ color: '#88ccff', transparent: true, opacity: 0.15 }), [])

  useFrame((state) => {
    if (!meshRef.current || !linesGeometryRef.current) return

    const mouseVector = new THREE.Vector3(
      (state.mouse.x * viewport.width) / 2,
      (state.mouse.y * viewport.height) / 2,
      0
    )

    let lineIndex = 0

    particles.forEach((particle, i) => {
      particle.position.add(particle.velocity)

      if (Math.abs(particle.position.x) > 10) particle.velocity.x *= -1
      if (Math.abs(particle.position.y) > 10) particle.velocity.y *= -1
      if (Math.abs(particle.position.z) > 5) particle.velocity.z *= -1

      const distanceToMouse = particle.position.distanceTo(mouseVector)
      if (distanceToMouse < INTERACTION_RADIUS) {
        const repelDir = new THREE.Vector3().subVectors(particle.position, mouseVector).normalize()
        particle.position.add(repelDir.multiplyScalar(0.05))
      }

      dummy.position.copy(particle.position)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const other = particles[j]
        const dist = particle.position.distanceTo(other.position)

        if (dist < CONNECTION_DISTANCE) {
            lines[lineIndex * 6] = particle.position.x
            lines[lineIndex * 6 + 1] = particle.position.y
            lines[lineIndex * 6 + 2] = particle.position.z
            lines[lineIndex * 6 + 3] = other.position.x
            lines[lineIndex * 6 + 4] = other.position.y
            lines[lineIndex * 6 + 5] = other.position.z
            lineIndex++
        }
      }
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    linesGeometryRef.current.setAttribute(
        'position',
        new THREE.BufferAttribute(lines.slice(0, lineIndex * 6), 3)
    )
    linesGeometryRef.current.attributes.position.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={meshRef} args={[null, null, PARTICLE_COUNT]}>
        <sphereGeometry args={[0.06, 16, 16]} /> 
        {/* MeshPhysicalMaterial for "Pearl" look */}
        <meshPhysicalMaterial 
            color="#ffffff" 
            metalness={0.5} 
            roughness={0.2} 
            clearcoat={1} 
            clearcoatRoughness={0} 
        />
      </instancedMesh>

      <lineSegments>
        <bufferGeometry ref={linesGeometryRef} />
        <primitive object={lineMaterial} attach="material" />
      </lineSegments>
    </>
  )
}

const Experience = () => {
    return (
        <div id="canvas-container">
            <Canvas
                camera={{ position: [0, 0, 10], fov: 60 }}
                dpr={[1, 1.5]} // Cap DPR for performance with post-processing
                gl={{ antialias: false, alpha: true, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }} // Disable default AA when using EffectComposer
            >
                <color attach="background" args={['#020205']} /> {/* Deeper, richer black */}
                
                {/* Lighting System */}
                <ambientLight intensity={0.5} color="#444466" />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#88ccff" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff88cc" />

                {/* Content */}
                <group position={[0, 0, -2]}>
                    <NeuralNetwork />
                </group>

                {/* New Floating Crystal Element */}
                <FloatingCrystal position={[4, 2, -5]} scale={1.5} />
                <FloatingCrystal position={[-5, -3, -8]} scale={1} rotation={[0.5, 0.5, 0]} />

                {/* Post-Processing Effects */}
                <EffectComposer disableNormalPass>
                    {/* Bloom: Adds glow to bright elements (crystal reflections, lines) */}
                    <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.5} intensity={1.2} />
                    <Vignette eskil={false} offset={0.1} darkness={0.5} />
                </EffectComposer>
                
                <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} autoRotate autoRotateSpeed={0.2} />
            </Canvas>
        </div>
    )
}

export default Experience
