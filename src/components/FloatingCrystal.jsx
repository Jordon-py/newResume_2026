import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, MeshTransmissionMaterial } from '@react-three/drei'

/**
 * FloatingCrystal Component
 * 
 * A subtle, high-quality 3D element that adds a "luxury" feel.
 * It uses MeshTransmissionMaterial to create a glass-like refractive effect.
 * 
 * @param {object} props - Position and scale props
 */
const FloatingCrystal = (props) => {
  const meshRef = useRef()

  // Slowly rotate the crystal
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2
      meshRef.current.rotation.y += delta * 0.1
    }
  })

  return (
    <Float 
      speed={2} // Animation speed
      rotationIntensity={1} // Rotation intensity
      floatIntensity={2} // Float height intensity
      floatingRange={[-0.5, 0.5]} // Range of y-axis values
    >
      <mesh ref={meshRef} {...props}>
        {/* IcosahedronGeometry is a nice complex shape for refraction */}
        <icosahedronGeometry args={[1, 0]} /> 
        
        {/* 
          MeshTransmissionMaterial: The key to the "luxury" glass look.
          - transmission: 1 = fully transparent (like glass)
          - thickness: controls refraction depth
          - roughness: 0 = perfectly polished
          - chromaticAberration: splits colors at edges (diamond look)
        */}
        <MeshTransmissionMaterial 
          backside
          backsideThickness={5}
          thickness={2}
          roughness={0}
          transmission={1}
          ior={1.5} // Index of Refraction (1.5 = glass)
          chromaticAberration={1} // High value for "diamond" rainbow edges
          anisotropy={0.5}
          color="#aaccff"
        />
      </mesh>
    </Float>
  )
}

export default FloatingCrystal
