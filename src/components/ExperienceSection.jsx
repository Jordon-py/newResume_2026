const ExperienceSection = ({ experience }) => {
  return (
    <section className="experience-section">
      <h2>Experience</h2>
      <div className="experience-list">
        {experience.map((job, idx) => (
          <div key={idx} className="experience-item glass-card">
            <div className="exp-header">
              <h3>{job.role}</h3>
              <p className="company">{job.company} | {job.location}</p>
            </div>
            <ul className="bullets">
              {job.bullets.map((bullet, bIdx) => (
                <li key={bIdx}>{bullet}</li>
              ))}
            </ul>
            {job.translation_to_dev && (
              <div className="dev-translation">
                <strong>Dev Translaton:</strong>
                <p>{job.translation_to_dev.join(' ')}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default ExperienceSection
