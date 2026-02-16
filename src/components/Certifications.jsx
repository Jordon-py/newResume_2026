const Certifications = ({ certifications }) => {
  return (
    <section className="certifications-section">
      <h2>Certifications</h2>
      <div className="cert-grid">
        {certifications.map((cert) => (
          <div key={cert.name} className="cert-card glass-card">
            <h4>{cert.name}</h4>
            <p className="cert-date">{cert.date}</p>
            {cert.url && (
              <a href={cert.url} target="_blank" rel="noopener noreferrer" className="link-button">
                Verify Certificate
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default Certifications
