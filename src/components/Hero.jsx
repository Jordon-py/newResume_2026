import { useSpring, animated, config } from '@react-spring/web'

const AnimatedSection = animated.section
const AnimatedDiv = animated.div

const calc = (x, y) => [-(y - window.innerHeight / 2) / 100, (x - window.innerWidth / 2) / 100, 1.01]
const trans = (x, y, s) => `perspective(600px) rotateX(${x}deg) rotateY(${y}deg) scale(${s})`

const Hero = ({ basics, variant }) => {
  // Staggered fade-in
  const fadeIn = useSpring({
    from: { opacity: 0, scale: 0.5 },
    to: { opacity: 1, scale: 1 },
    config: config.slow,
    delay: 200,
  })

  // Tilt spring
  const [props, set] = useSpring(() => ({ xys: [0, 0, .95], config: { mass: 5, tension: 350, friction: 40 } }))

  return (
    <AnimatedSection style={fadeIn} className="hero-section">
      <AnimatedDiv 
        className="glass-card"
        onMouseMove={({ clientX: x, clientY: y }) => set({ xys: calc(x, y) })}
        onMouseLeave={() => set({ xys: [0, 0, .95] })}
        style={{ transform: props.xys.to(trans) }}
      > 
        <h1>{basics.name}</h1>
        <p className="headline">{variant.headline}</p>
        <div className="summary">
          <p>{variant.summary_short}</p>
        </div>
        <div className="social-links">
          {basics.profiles.map((profile) => (
            <a key={profile.network} href={profile.url} target="_blank" rel="noopener noreferrer" className="social-pill">
              {profile.network}
            </a>
          ))}
        </div>
      </AnimatedDiv>
    </AnimatedSection>
  )
}

export default Hero
