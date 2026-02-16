import './App.css'
import Experience from './components/Experience'
import Hero from './components/Hero'
import ProjectCard from './components/ProjectCard'
import Skills from './components/Skills'
import ExperienceSection from './components/ExperienceSection'
import Certifications from './components/Certifications'
import resumeData from './data/resumeData.json'

function App() {
  const activeVariant = resumeData.variants[resumeData.activeVariant]

  return (
    <>
      <Experience />
      
      <main className="content-container">
        <Hero basics={resumeData.basics} variant={activeVariant} />
        
        <section className="projects-section">
          <h2>Featured Projects</h2>
          <div className="projects-grid">
            {resumeData.projects.map((project, idx) => (
              <ProjectCard key={idx} project={project} />
            ))}
          </div>
        </section>

        <Skills skills={resumeData.skills} />

        <ExperienceSection experience={resumeData.experience} />

        <Certifications certifications={resumeData.certifications} />

        <footer className="glass-card" style={{ textAlign: 'center', marginTop: '4rem' }}>
          <p>© 2026 Christopher Jordon | Built with React & Three Fiber</p>
        </footer>
      </main>
    </>
  )
}

export default App
