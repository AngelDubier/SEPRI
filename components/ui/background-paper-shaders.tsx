"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

// Sombreadores personalizados para efectos avanzados
const vertexShader = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    vec3 pos = position;
    pos.y += sin(pos.x * 10.0 + time) * 0.1 * intensity;
    pos.x += cos(pos.y * 8.0 + time * 1.5) * 0.05 * intensity;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec3 color1;
  uniform vec3 color2;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vec2 uv = vUv;
    
    // Crear patrón de ruido animado
    float noise = sin(uv.x * 20.0 + time) * cos(uv.y * 15.0 + time * 0.8);
    noise += sin(uv.x * 35.0 - time * 2.0) * cos(uv.y * 25.0 + time * 1.2) * 0.5;
    
    // Mezclar colores institucionales (Azul y Amarillo)
    vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
    color = mix(color, vec3(1.0), pow(abs(noise), 2.0) * intensity);
    
    // Añadir efecto de resplandor sutil
    float glow = 1.0 - length(uv - 0.5) * 2.0;
    glow = pow(glow, 2.0);
    
    gl_FragColor = vec4(color * glow, glow * 0.4);
  }
`

export function ShaderPlane({
  position = [0, 0, 0],
  color1 = "#164E87", // sepri-medium
  color2 = "#FFB000", // sepri-yellow
}: {
  position?: [number, number, number]
  color1?: string
  color2?: string
}) {
  const mesh = useRef<THREE.Mesh>(null!)

  // Variables para bypass de tipos intrínsecos de JSX en entorno TS estricto
  const MeshTag = 'mesh' as any
  const PlaneGeometryTag = 'planeGeometry' as any
  const ShaderMaterialTag = 'shaderMaterial' as any

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      intensity: { value: 0.5 },
      color1: { value: new THREE.Color(color1) },
      color2: { value: new THREE.Color(color2) },
    }),
    [color1, color2],
  )

  useFrame((state: any) => {
    if (mesh.current) {
      uniforms.time.value = state.clock.elapsedTime * 0.5
      uniforms.intensity.value = 0.5 + Math.sin(state.clock.elapsedTime) * 0.1
    }
  })

  return (
    <MeshTag ref={mesh} position={position} scale={[15, 15, 1]}>
      <PlaneGeometryTag args={[2, 2, 64, 64]} />
      <ShaderMaterialTag
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
      />
    </MeshTag>
  )
}

export function EnergyRing({
  radius = 1,
  position = [0, 0, 0],
  color = "#FFB000"
}: {
  radius?: number
  position?: [number, number, number]
  color?: string
}) {
  const mesh = useRef<THREE.Mesh>(null!)
  const MeshTag = 'mesh' as any
  const RingGeometryTag = 'ringGeometry' as any
  const MeshBasicMaterialTag = 'meshBasicMaterial' as any

  useFrame((state: any) => {
    if (mesh.current) {
      mesh.current.rotation.z = state.clock.elapsedTime * 0.2
      if (mesh.current.material instanceof THREE.MeshBasicMaterial) {
        mesh.current.material.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1
      }
    }
  })

  return (
    <MeshTag ref={mesh} position={position}>
      <RingGeometryTag args={[radius * 0.95, radius, 64]} />
      <MeshBasicMaterialTag color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
    </MeshTag>
  )
}