import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

export default function Quiz() {
  const { id } = useParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [focusedPack, setFocusedPack] = useState(null);
  const [generatingFocusedPack, setGeneratingFocusedPack] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/quiz/${id}`)
      .then((data) => setQuestions(data.questions))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
      };
      const data = await apiFetch(`/quiz/${id}/submit`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleFocusedRegeneration() {
    setError(null);
    setGeneratingFocusedPack(true);

    try {
      const data = await apiFetch(`/generate/${id}/pack`, {
        method: "POST",
        body: JSON.stringify({ focusTopics: result.weakTopics }),
      });
      setFocusedPack(data.revisionPack);
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingFocusedPack(false);
    }
  }

  if (result) {
    return (
      <main className="container">
        <section className="score-hero"><p className="score-label">Quiz complete</p><h1>{result.score}%</h1><p>Here’s where to focus next.</p></section>
        {result.weakTopics.length > 0 ? (
          <div className="card">
            <div className="section-title"><span className="section-icon">◎</span><div><h3>Strengthen these topics</h3><p className="muted">A focused pack can help you close the gaps.</p></div></div>
            <ul className="topic-list">
              {result.weakTopics.map((t) => <li key={t}>{t}</li>)}
            </ul>
            <button
              onClick={handleFocusedRegeneration}
              disabled={generatingFocusedPack}
            >
              {generatingFocusedPack
                ? "Generating focused revision pack..."
                : "Generate a pack for these weak topics"}
            </button>
          </div>
        ) : (
          <p>No weak topics — nice work!</p>
        )}

        {error && <p className="notice">{error}</p>}

        {focusedPack && (
          <div className="card">
            <div className="section-title"><span className="section-icon">✦</span><div><h3>Focused revision pack</h3><p className="muted">Built around the topics you missed.</p></div></div>
            {focusedPack.content_json.concepts?.map((concept, index) => (
              <div className="concept" key={index}>
                <strong>{concept.title}</strong>
                <p>{concept.explanation}</p>
                {concept.mnemonic && <p><em>Mnemonic: {concept.mnemonic}</em></p>}
              </div>
            ))}
            {focusedPack.content_json.predictedQuestions?.length > 0 && (
              <div>
                <h4>Predicted questions</h4>
                {focusedPack.content_json.predictedQuestions.map((item, index) => (
                  <div key={index} style={{ marginBottom: "1rem" }}>
                    <strong>{item.question}</strong>
                    <p>{item.modelAnswer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <Link className="back-link" to={`/courses/${id}`}>← Back to course</Link>
      </main>
    );
  }

  return (
    <main className="container">
      <Link className="back-link" to={`/courses/${id}`}>← Back to course</Link>
      <header className="page-header"><div><p className="eyebrow">Self-check</p><h1>Knowledge check</h1><p className="subtitle">Take your time—your results will shape the next revision pack.</p></div></header>
      {error && <p className="notice">{error}</p>}

      {questions.length === 0 && !error && !loading ? (
        <div className="empty-state">
          No quiz yet for this course. Go back and click <strong>Generate quiz</strong> first — you'll need a revision pack in place before a quiz can be created.
        </div>
      ) : loading ? (
        <p className="muted">Loading quiz...</p>
      ) : (
        <>
          <div className="quiz-meta"><span>✦ {questions.length} questions</span><span>•</span><span>Answer every question</span></div>
          <form onSubmit={handleSubmit}>
            {questions.map((q) => (
              <div className="card quiz-question" key={q.id}>
                <span className="question-number">Question {questions.indexOf(q) + 1}</span>
                <p className="question-text"><strong>{q.question}</strong></p>
                {q.type === "mcq" ? (
                  q.options.map((opt) => (
                    <label className="answer-option" key={opt}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        onChange={() => setAnswer(q.id, opt)}
                      />{" "}
                      {opt}
                    </label>
                  ))
                ) : (
                  <input
                    type="text"
                    placeholder="Your answer"
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                  />
                )}
              </div>
            ))}

            {questions.length > 0 && <button type="submit">Submit answers →</button>}
          </form>
        </>
      )}
    </main>
  );
}
