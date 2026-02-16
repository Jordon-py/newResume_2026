import { useSpring, animated } from '@react-spring/web'

const AnimatedDiv = animated.div

const calc = (x, y) => [-(y - window.innerHeight / 2) / 40, (x - window.innerWidth / 2) / 40, 1.05]
const trans = (x, y, s) => `perspective(800px) rotateX(${x}deg) rotateY(${y}deg) scale(${s})`

const ProjectCard = ({ project }) => {
  const [props, set] = useSpring(() => ({ xys: [0, 0, 1], config: { mass: 5, tension: 350, friction: 40 } }))

  return (
    <AnimatedDiv
      className="project-card glass-card"
      onMouseMove={({ clientX: x, clientY: y }) => set({ xys: calc(x, y) })}
      onMouseLeave={() => set({ xys: [0, 0, 1] })}
      style={{ transform: props.xys.to(trans) }}
    >
      <div className="project-header">
        <h3>{project.name}</h3>
        <span className="project-type">{project.type}</span>
      </div>
      <div className="project-stack">
        {project.stack.map(tech => (
          <span key={tech} className="tech-badge">{tech}</span>
        ))}
      </div>
      <ul className="impact-bullets">
        {project.impactBullets.map((bullet, idx) => (
          <li key={idx}>{bullet}</li>
        ))}
      </ul>
      <div className="project-links">
        {project.links.map(link => (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="link-button">
            {link.label}
          </a>
        ))}
      </div>
    </AnimatedDiv>
  )
}

export default ProjectCard
