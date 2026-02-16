const Skills = ({ skills }) => {
  return (
    <section className="skills-section">
      <h2>Tech Toolkit</h2>
      <div className="skills-grid">
        {Object.entries(skills).map(([key, category]) => (
          <div key={key} className="skill-category glass-card">
            <h4>{category.label}</h4>
            <div className="skill-items">
              {category.items.map(skill => (
                <div key={skill.name} className="skill-tag">
                  <span className="skill-name">{skill.name}</span>
                  <span className={`skill-level level-${skill.level}`}>{skill.level}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Skills
