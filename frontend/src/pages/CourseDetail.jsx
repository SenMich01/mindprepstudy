import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [revisionPacks, setRevisionPacks] = useState([]);
  const [pastedText, setPastedText] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const data = await apiFetch(`/courses/${id}`);
      setCourse(data.course);
      setDocuments(data.documents);
      setRevisionPacks(data.revisionPacks);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handlePasteSubmit(e) {
    e.preventDefault();
    if (!pastedText.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/upload/${id}/text`, {
        method: "POST",
        body: JSON.stringify({ text: pastedText }),
      });
      setPastedText("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await apiFetch(`/upload/${id}/file`, { method: "POST", body: formData });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGeneratePack() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/generate/${id}/pack`, { method: "POST", body: JSON.stringify({}) });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateQuiz() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/generate/${id}/quiz`, { method: "POST", body: JSON.stringify({}) });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCourse() {
    const confirmed = window.confirm(
      `Delete "${course.name}"? This removes all its documents, revision packs, and quizzes. This can't be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      await apiFetch(`/courses/${id}`, { method: "DELETE" });
      navigate("/courses");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (!course) return <div className="container muted">Opening course...</div>;

  const latestPack = revisionPacks[0];

  return (
    <main className="container">
      <Link className="back-link" to="/courses">← All courses</Link>
      <header className="page-header">
        <div><p className="eyebrow">Course workspace</p><h1>{course.name}</h1><p className="subtitle">Add your materials, then turn them into focused practice.</p></div>
        <button className="button-secondary" onClick={handleDeleteCourse} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete course"}
        </button>
      </header>

      <div className="detail-grid">
        <section className="card">
          <div className="section-title"><span className="section-icon">✎</span><div><h3>Add material</h3><p className="muted">Paste notes or upload a course file.</p></div></div>
        <form onSubmit={handlePasteSubmit}>
          <textarea
            rows={4}
            placeholder="Paste lecture notes here..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />
          <button type="submit" disabled={busy}>Add notes</button>
        </form>
        <p className="material-caption">Or upload a PDF, DOCX, or PPTX</p>
        <input type="file" accept=".pdf,.docx,.pptx" onChange={handleFileUpload} disabled={busy} />
        <p className="document-count">{documents.length} {documents.length === 1 ? "source" : "sources"} ready</p>
        </section>

        <aside className="card card-accent">
          <div className="section-title"><span className="section-icon">✦</span><div><h3>Ready to revise?</h3><p className="muted">Create an AI-guided pack and quiz.</p></div></div>
          <div className="action-stack">
            <button className="button-light" onClick={handleGeneratePack} disabled={busy || documents.length === 0}>{busy ? "Working..." : "Generate revision pack"}</button>
            <button className="button-light" onClick={handleGenerateQuiz} disabled={busy || !latestPack}>Generate quiz</button>
            <Link className="button button-light" to={`/courses/${id}/quiz`}>Take quiz →</Link>
          </div>
        </aside>
      </div>

      {error && <p className="notice">{error}</p>}

      <section className="card">
        <div className="section-title"><span className="section-icon">▤</span><div><h3>Revision pack</h3><p className="muted">Your key concepts, explanations, and memory hooks.</p></div></div>
        {latestPack ? (
          <div>
            {latestPack.content_json.concepts?.map((c, i) => (
              <div className="concept" key={i}>
                <strong>{c.title}</strong>
                <p>{c.explanation}</p>
                {c.mnemonic && <p className="mnemonic"><em>Memory hook: {c.mnemonic}</em></p>}
              </div>
            ))}
            {latestPack.content_json.predictedQuestions?.length > 0 && (
              <div className="predicted-block">
                <h4>Predicted questions</h4>
                {latestPack.content_json.predictedQuestions.map((item, i) => (
                  <div className="predicted-item" key={i}>
                    <strong>{item.question}</strong>
                    <p>{item.modelAnswer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : <p className="muted">Your generated revision pack will appear here.</p>}
      </section>
    </main>
  );
}
