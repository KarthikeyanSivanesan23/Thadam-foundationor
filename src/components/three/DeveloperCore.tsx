import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr, Float, useGLTF } from '@react-three/drei'
import { AdditiveBlending, Box3, Group, InstancedMesh, MathUtils, Object3D, PointLight, Vector3 } from 'three'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { ParticleField } from './ParticleField'
import { CoreFallback } from './CoreFallback'

function Football({ reduced }: { reduced: boolean }) {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}football.glb`)
  const group = useRef<Group>(null)
  const spin = useRef(0)
  const { model, scale, offset } = useMemo(() => {
    const model = scene.clone(true)
    const box = new Box3().setFromObject(model)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const scale = 2.1 / Math.max(size.x, size.y, size.z)
    return { model, scale, offset: center.multiplyScalar(-scale) }
  }, [scene])
  useFrame((_, delta) => {
    if (!group.current || reduced) return
    const dt = Math.min(delta, .05)
    spin.current = MathUtils.damp(spin.current, .16, 2.5, dt)
    group.current.rotation.y += spin.current * dt
  })
  return <group ref={group}>
    <primitive object={model} scale={scale} position={offset} />
  </group>
}

function Fragments({ reduced }: { reduced: boolean }) {
  const mesh = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  useEffect(() => {
    if (!mesh.current) return
    for (let i = 0; i < 24; i++) {
      const angle = i * 2.399
      const r = 1.7 + (i % 4) * .25
      dummy.position.set(Math.cos(angle) * r, Math.sin(i * 1.7) * 1.65, Math.sin(angle) * r)
      dummy.rotation.set(i * .7, i * 1.3, i * .5)
      dummy.scale.set(.025 + (i % 3) * .015, .09 + (i % 4) * .025, .018)
      dummy.updateMatrix(); mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  }, [dummy])
  useFrame((_, delta) => { if (mesh.current && !reduced) mesh.current.rotation.y -= Math.min(delta, .05) * .04 })
  return <instancedMesh ref={mesh} args={[undefined, undefined, 24]}><boxGeometry /><meshStandardMaterial color="#aea4cc" metalness={.8} roughness={.25} emissive="#76638d" emissiveIntensity={.2} /></instancedMesh>
}

function EnergyCore({ mobile, reduced, scroll }: { mobile: boolean; reduced: boolean; scroll: React.RefObject<number> }) {
  const core = useRef<Group>(null)
  const rings = useRef<Group>(null)
  const light = useRef<PointLight>(null)
  const coreScale = mobile ? 1.12 : 1.22
  useFrame((state, delta) => {
    if (reduced) return
    const t = state.clock.elapsedTime
    const dt = Math.min(delta, .05)
    if (core.current) {
      core.current.rotation.y = MathUtils.damp(core.current.rotation.y, state.pointer.x * .15, 3, delta)
      core.current.rotation.x = MathUtils.damp(core.current.rotation.x, -state.pointer.y * .09, 3, delta)
    }
    if (rings.current) { rings.current.rotation.y += dt * .12; rings.current.rotation.z = .16 + Math.sin(t * .16) * .09; rings.current.scale.setScalar(1 + scroll.current * .09) }
    if (light.current) light.current.position.x = 2 + state.pointer.x * 2
    state.camera.position.x = MathUtils.damp(state.camera.position.x, state.pointer.x * .22, 2, delta)
    state.camera.position.y = MathUtils.damp(state.camera.position.y, state.pointer.y * .15, 2, delta)
    state.camera.position.z = MathUtils.damp(state.camera.position.z, (mobile ? 9.2 : 7.6) - scroll.current * .5, 2, delta)
    state.camera.lookAt(0, 0, 0)
  })
  return <>
    <ambientLight intensity={.6} />
    <pointLight ref={light} position={[2, 3, 4]} color="#c0b0ff" intensity={28} distance={12} />
    <pointLight position={[-3, -1, 2]} color="#81cbdf" intensity={20} distance={10} />
    <Float speed={reduced ? 0 : 1.4} rotationIntensity={reduced ? 0 : .16} floatIntensity={reduced ? 0 : .32}>
      <group ref={core} rotation={[.15, 0, -.2]} scale={coreScale}>
        <Football reduced={reduced} />
        <mesh rotation={[.3, .2, .3]}><icosahedronGeometry args={[1.48, 1]} /><meshBasicMaterial color="#a295c7" wireframe transparent opacity={.14} /></mesh>
        <group ref={rings}>
          {[{ radius: 2.14, rotation: [1.13,.25,.35], color: '#b5a0f0' }, { radius: 2.46, rotation: [.54,1.02,-.55], color: '#6f788d' }, { radius: 1.85, rotation: [1.64,-.5,.23], color: '#a3cfda' }].map((ring, i) => <group key={i} rotation={ring.rotation as [number,number,number]}>
            <mesh><torusGeometry args={[ring.radius, i === 0 ? .024 : .012, 8, mobile ? 100 : 160]} /><meshStandardMaterial color={ring.color} metalness={.85} roughness={.28} emissive={ring.color} emissiveIntensity={i === 0 ? .5 : .18} /></mesh>
            <mesh rotation={[0,0,.15]}><torusGeometry args={[ring.radius + .065, .003, 4, 120, Math.PI * 1.3]} /><meshBasicMaterial color={ring.color} transparent opacity={.5} /></mesh>
            <mesh position={[ring.radius,0,0]}><sphereGeometry args={[i === 0 ? .065 : .04, 12, 12]} /><meshBasicMaterial color={i === 1 ? '#c5dded' : '#dac8ff'} /></mesh>
            <mesh position={[-ring.radius,0,0]}><octahedronGeometry args={[.085]} /><meshStandardMaterial color="#d1c6e6" metalness={.7} roughness={.2} /></mesh>
          </group>)}
        </group>
        <Fragments reduced={reduced} />
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.04,.008,6,100]} /><meshBasicMaterial color="#c6b4ff" blending={AdditiveBlending} transparent opacity={.7} /></mesh>
      </group>
    </Float>
    <ParticleField count={mobile ? 70 : 190} reduced={reduced} />
  </>
}

export default function DeveloperCore() {
  const container = useRef<HTMLDivElement>(null)
  const mobile = useMediaQuery('(max-width: 767px)')
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [visible, setVisible] = useState(true)
  const [failed, setFailed] = useState(false)
  const scroll = useRef(0)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && !document.hidden), { threshold: .01 })
    if (container.current) observer.observe(container.current)
    const update = () => { scroll.current = Math.min(1, window.scrollY / window.innerHeight) }
    const visibility = () => setVisible(!document.hidden && (container.current?.getBoundingClientRect().bottom || 0) > 0)
    window.addEventListener('scroll', update, { passive: true })
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); window.removeEventListener('scroll', update); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  if (failed) return <CoreFallback />
  return <div ref={container} className="developer-canvas" aria-hidden="true">
    <Canvas camera={{ position: [0, 0, mobile ? 9.2 : 7.6], fov: 42 }} dpr={mobile ? [1, 1.25] : [1, 1.6]} style={{ pointerEvents: 'none' }} frameloop={visible && !reduced ? 'always' : 'demand'} gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }} fallback={<CoreFallback />} onCreated={({ gl }) => { gl.domElement.addEventListener('webglcontextlost', () => setFailed(true), { once: true }) }}>
      <Suspense fallback={null}><EnergyCore mobile={mobile} reduced={reduced} scroll={scroll} /><AdaptiveDpr pixelated /></Suspense>
    </Canvas>
  </div>
}
