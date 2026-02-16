import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { Environment, Lightformer, ContactShadows, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing'
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

const PARTICLE_COUNT = 45 // Slightly reduced for performance with expensive materials
const CONNECTION_DISTANCE = 7
const INTERACTION_RADIUS = 3
const CONNECTION_DISTANCE2 = CONNECTION_DISTANCE * CONNECTION_DISTANCE
const INTERACTION_RADIUS2 = INTERACTION_RADIUS * INTERACTION_RADIUS

// Mobile-safe defaults + easy tuning. Change QUALITY to "low" on phones if needed.
const QUALITY = "med" // "low" | "med" | "high"
const QUALITY_PRESETS = {
  low:  { dpr: [1, 1.25], envRes: 128, contactRes: 256, contactBlur: 2.2, contactOpacity: 0.22, bloom: { i: 0.85, t: 0.85, s: 0.55, mb: false }, vignette: { o: 0.12, d: 0.45 }, exposure: 1.25, smaa: false, orbitSpeed: 0.18, fog: { near: 10, far: 30 } },
  med:  { dpr: [1, 1.5 ], envRes: 192, contactRes: 384, contactBlur: 2.8, contactOpacity: 0.28, bloom: { i: 1.05, t: 0.82, s: 0.50, mb: true  }, vignette: { o: 0.11, d: 0.48 }, exposure: 1.35, smaa: true,  orbitSpeed: 0.20, fog: { near: 9,  far: 28 } },
  high: { dpr: [1, 2   ], envRes: 256, contactRes: 512, contactBlur: 3.4, contactOpacity: 0.34, bloom: { i: 1.20, t: 0.80, s: 0.45, mb: true  }, vignette: { o: 0.10, d: 0.50 }, exposure: 1.45, smaa: true,  orbitSpeed: 0.22, fog: { near: 8,  far: 26 } },
}

function NeuralNetwork() {
  const meshRef = useRef()
  const linesGeometryRef = useRef()
  const linesAttrRef = useRef()
  const { viewport } = useThree()

  const [particles, linePositions] = useMemo(() => {
    const tempParticles = []
    // Max possible segments = n(n-1)/2; each segment has 2 vertices (6 floats).
    const maxSegments = (PARTICLE_COUNT * (PARTICLE_COUNT - 1)) / 2
    const tempLinePositions = new Float32Array(maxSegments * 6)
    
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
    return [tempParticles, tempLinePositions]
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const mouseVector = useMemo(() => new THREE.Vector3(), [])
  const repelDir = useMemo(() => new THREE.Vector3(), [])
  
  // Upgraded line material: additive + not tone-mapped so Bloom picks it up cleanly.
  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#a9dcff",
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  )

  // Avoid drawing "zeroed" lines on the first frame.
  useEffect(() => {
    if (linesGeometryRef.current) linesGeometryRef.current.setDrawRange(0, 0)
  }, [])

  useFrame((state) => {
    if (!meshRef.current || !linesGeometryRef.current || !linesAttrRef.current) return

    mouseVector.set(
      (state.mouse.x * viewport.width) / 2,
      (state.mouse.y * viewport.height) / 2,
      0
    )

    let lineIndex = 0
    const t = state.clock.elapsedTime

    particles.forEach((particle, i) => {
      particle.position.add(particle.velocity)

      if (Math.abs(particle.position.x) > 10) particle.velocity.x *= -1
      if (Math.abs(particle.position.y) > 10) particle.velocity.y *= -1
      if (Math.abs(particle.position.z) > 5) particle.velocity.z *= -1

      const d2Mouse = particle.position.distanceToSquared(mouseVector)
      if (d2Mouse < INTERACTION_RADIUS2) {
        // Falloff-based push: smooth near edge, stronger near cursor.
        const d = Math.sqrt(d2Mouse)
        const falloff = 1 - d / INTERACTION_RADIUS
        repelDir.subVectors(particle.position, mouseVector).normalize()
        particle.position.addScaledVector(repelDir, 0.03 + falloff * 0.05)
      }

      dummy.position.copy(particle.position)
      // Subtle "neural pulse" + interaction boost near cursor.
      const pulse = 0.92 + 0.10 * Math.sin(t * 1.25 + i * 0.35)
      const interactBoost = d2Mouse < INTERACTION_RADIUS2 ? (1 - Math.sqrt(d2Mouse) / INTERACTION_RADIUS) * 0.35 : 0
      dummy.scale.setScalar(THREE.MathUtils.clamp(pulse + interactBoost, 0.75, 1.55))
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const other = particles[j]
        const dist2 = particle.position.distanceToSquared(other.position)

        if (dist2 < CONNECTION_DISTANCE2) {
            // Write into the preallocated buffer (no slice/no new BufferAttribute per frame).
            const k = lineIndex * 6
            linePositions[k]     = particle.position.x
            linePositions[k + 1] = particle.position.y
            linePositions[k + 2] = particle.position.z
            linePositions[k + 3] = other.position.x
            linePositions[k + 4] = other.position.y
            linePositions[k + 5] = other.position.z
            lineIndex++
        }
      }
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    linesGeometryRef.current.setDrawRange(0, lineIndex * 2) // 2 vertices per segment
    linesAttrRef.current.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={meshRef} args={[null, null, PARTICLE_COUNT]} frustumCulled={false}>
        <sphereGeometry args={[0.06, 16, 16]} /> 
        {/* MeshPhysicalMaterial for "Pearl" look */}
        <meshPhysicalMaterial 
            color="#ffffff" 
            metalness={0.5} 
            roughness={0.2} 
            clearcoat={1} 
            clearcoatRoughness={0} 
            emissive="#7fbfff"          // subtle energy so Bloom has something stable to pick up
            emissiveIntensity={0.12}
        />
      </instancedMesh>

      <lineSegments frustumCulled={false}>
        <bufferGeometry ref={linesGeometryRef}>
          <bufferAttribute
            ref={linesAttrRef}
            attach="attributes-position"
            args={[linePositions, 3]}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <primitive object={lineMaterial} attach="material" />
      </lineSegments>
    </>
  )
}

const Experience = () => {
    const q = QUALITY_PRESETS[QUALITY]
    return (
        <div id="canvas-container">
            <Canvas
                camera={{ position: [0, 0, 10], fov: 60 }}
                dpr={q.dpr} // mobile-safe DPR caps (drives postFX cost)
                gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }} // AA handled via SMAA when enabled
                onCreated={({ gl }) => {
                  // Production-safe color + lighting model (prevents washed-out / inconsistent looks).
                  gl.outputColorSpace = THREE.SRGBColorSpace
                  gl.toneMapping = THREE.ACESFilmicToneMapping
                  gl.toneMappingExposure = q.exposure
                  gl.physicallyCorrectLights = true
                }}
            >
                <color attach="background" args={['#020205']} /> {/* Deeper, richer black */}
                <fog attach="fog" args={['#020205', q.fog.near, q.fog.far]} /> {/* depth + composition */}
                
                {/* Lighting System */}
                <hemisphereLight intensity={0.35} color="#9bbcff" groundColor="#120818" />
                {/* Key / rim rig (cleaner spec than point-only) */}
                <directionalLight position={[6, 8, 6]} intensity={1.2} color="#cfe9ff" />
                <directionalLight position={[-8, 4, -6]} intensity={0.6} color="#ff9ad6" />
                {/* Accent points keep your original vibe */}
                <pointLight position={[10, 10, 10]} intensity={0.8} color="#88ccff" />
                <pointLight position={[-10, -10, -10]} intensity={0.35} color="#ff88cc" />

                {/* IBL reflections for Physical materials (asset-free preset) */}
                <Environment preset="city" resolution={q.envRes}>
                  {/* Lightformer cards shape highlight bands (high ROI for “premium” look) */}
                  <Lightformer intensity={2} position={[0, 5, 5]} scale={[10, 10, 1]} color="#bfe2ff" />
                  <Lightformer intensity={1} position={[-6, 2, -2]} scale={[6, 6, 1]} color="#ff9ad6" />
                </Environment>

                {/* Content */}
                <group position={[0, 0, -2]}>
                    <NeuralNetwork />
                </group>

                {/* New Floating Crystal Element */}
                <FloatingCrystal position={[4, 2, -5]} scale={1.5} />
                <FloatingCrystal position={[-5, -3, -8]} scale={1} rotation={[0.5, 0.5, 0]} />

                {/* Grounding layer (subtle, not a “hard floor”) */}
                <ContactShadows
                  position={[0, -7.5, 0]}
                  scale={40}
                  resolution={q.contactRes}
                  opacity={q.contactOpacity}
                  blur={q.contactBlur}
                  far={25}
                />

                {/* Post-Processing Effects */}
                <EffectComposer disableNormalPass multisampling={0}>
                    {q.smaa ? <SMAA /> : null}
                    {/* Bloom: Adds glow to bright elements (crystal reflections, lines) */}
                    <Bloom
                      intensity={q.bloom.i}
                      luminanceThreshold={q.bloom.t}
                      luminanceSmoothing={q.bloom.s}
                      mipmapBlur={q.bloom.mb}
                    />
                    < Vignette eskil={false} offset={q.vignette.o} darkness={q.vignette.d} />
                </EffectComposer>
                
                <OrbitControls
                  enableZoom={false}
                  enablePan={false}
                  enableRotate={true}
                  enableDamping
                  dampingFactor={0.08}
                  autoRotate
                  autoRotateSpeed={q.orbitSpeed}
                />
            </Canvas>
        </div>
    )
}

export default Experience
