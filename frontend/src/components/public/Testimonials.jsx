function Testimonials({ items = [] }) {
  return (
    <section className="testimonial-grid">
      {items.map((item) => (
        <article className="testimonial-card" key={item.name}>
          <p>"{item.quote}"</p>
          <strong>{item.name}</strong>
          <span>{item.role}</span>
        </article>
      ))}
    </section>
  );
}

export default Testimonials;
