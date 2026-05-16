function PromptRibbon({ promptsOpen, onToggle, examples, onExampleClick }) {
  return (
    <section className={`prompt-ribbon ${promptsOpen ? "open" : ""}`}>
      <button className="prompt-ribbon-toggle" onClick={onToggle} type="button">
        <span>
          <small>Suggested Prompts</small>
          <strong>Templates for projects and study tasks</strong>
        </span>
        <em>{promptsOpen ? "Hide" : "Show"}</em>
      </button>
      {promptsOpen ? (
        <div className="prompt-ribbon-list">
          {examples.map((example) => (
            <button className="prompt-chip-card" key={example.title} onClick={() => onExampleClick(example)} type="button">
              <strong>{example.title}</strong>
              <span>{example.description}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default PromptRibbon;
