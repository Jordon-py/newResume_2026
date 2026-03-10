import { useSpring, animated, config } from '@react-spring/web'

const AnimatedSection = animated.section
const AnimatedDiv = animated.div

const calc = (x, y) => [-(y - window.innerHeight / 2) / 100, (x - window.innerWidth / 2) / 100, 1.01]
const trans = (x, y, s) => `perspective(600px) rotateX(${x}deg) rotateY(${y}deg) scale(${s})`

const Hero = ({ basics, variant, contact }) => {
  // Staggered fade-in
  const fadeIn = useSpring({
    from: { opacity: 0, scale: 0.5 },
    to: { opacity: 1, scale: 1 },
    config: config.slow,
    delay: 200,
  })

  // Tilt spring
  const [props, set] = useSpring(() => ({ xys: [0, 0, .95], config: { mass: 5, tension: 350, friction: 40 } }))
  const emailHref = contact?.email
    ? `mailto:${contact.email}?subject=${encodeURIComponent('Opportunity for Christopher Jordon')}`
    : '#'
  const phoneHref = contact?.phone ? `tel:${contact.phone.replace(/\D/g, '')}` : '#'

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

        <div className="hero-cta">
          <p className="hero-cta__eyebrow">Open to hiring teams and freelance clients</p>
          <div className="hero-cta__actions">
            <a href={emailHref} className="cta-button">
              Email Christopher
            </a>
            <a href={phoneHref} className="contact-link">
              Call or text {contact?.phone}
            </a>
          </div>
          <p className="hero-cta__note">
            Prefer email for the fastest response. You can also call or text {contact?.phone}. If
            I miss your call, please leave a voice message and I will get back to you as soon as I can.
          </p>
        </div>
      </AnimatedDiv>
    </AnimatedSection>
  )
}

export default Hero
