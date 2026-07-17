import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

export default function Quiz() {
  const { id } = useParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch(`/quiz/${id}`)
      .then((data) => setQuestions(data.questions))
      .catch((err) => setError(err.message));
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

  if (result) {
    return (
      <div className="container">
        <h1>Score: {result.score}%</h1>
        {result.weakTopics.length > 0 ? (
          <div className="card">
            <h3>Weak topics</h3>
            <ul>
              {result.weakTopics.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        ) : (
          <p>No weak topics — nice work!</p>
        )}
        <Link to={`/courses/${id}`}>&larr; Back to course</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to={`/courses/${id}`}>&larr; Back to course</Link>
      <h1>Quiz</h1>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        {questions.map((q) => (
          <div className="card" key={q.id}>
            <p><strong>{q.question}</strong></p>
            {q.type === "mcq" ? (
              q.options.map((opt) => (
                <label key={opt} style={{ display: "block", marginBottom: "0.4rem" }}>
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

        {questions.length > 0 && <button type="submit">Submit Quiz</button>}
      </form>
    </div>
  );
}
