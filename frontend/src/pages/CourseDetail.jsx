import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [revisionPacks, setRevisionPacks] = useState([]);
  const [quizCount, setQuizCount] = useState(0);
  const [pastedText, setPastedText] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState(null); // "pack" | "quiz" | null
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  async function load() {
    try {
      const data = await apiFetch(`/courses/${id}`);
      setCourse(data.course);
      setDocuments(data.documents);
      setRevisionPacks(data.revisionPacks);

      // Also check whether a quiz already exists for this course, so the
      // "Take quiz" action can reflect real state instead of guessing.
      try {
        const quizData = await apiFetch(`/quiz/${id}`);
        setQuizCount(quizData.questions?.length || 0);
      } catch {
        setQuizCount(0);
      }
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
    setStatus(null);
    try {
      await apiFetch(`/upload/${id}/text`, {
        method: "POST",
        body: JSON.stringify({ text: pastedText }),
      });
      setPastedText("");
      setStatus("Notes added.");
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
    setStatus(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await apiFetch(`/upload/${id}/file`, { method: "POST", body: formData });
      setStatus(`${file.name} added.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = ""; // allow re-uploading the same file if needed
    }
  }

  async function handleGeneratePack() {
    setBusy(true);
    setBusyAction("pack");
    setError(null);
    setStatus(null);
    try {
      const data = await apiFetch(`/generate/${id}/pack`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const conceptCount = data.revisionPack?.content_json?.concepts?.length || 0;
      setStatus(
        data.reused
          ? "Showing your existing revision pack (no new documents since last time)."
          : `Revision pack ready — ${conceptCount} concept${conceptCount === 1 ? "" : "s"} generated.`
      );
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }

  async function handleGenerateQuiz() {
    setBusy(true);
    setBusyAction("quiz");
    setError(null);
    setStatus(null);
    try {
      const data = await apiFetch(`/generate/${id}/quiz`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const count = data.questions?.length || 0;
      setQuizCount(count);
      setStatus(`Quiz ready — ${count} question${count === 1 ? "" : "s"} generated. Click "Take quiz" below.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      setBusyAction(null);
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
            <button
              className="button-light"
              onClick={handleGeneratePack}
              disabled={busy || documents.length === 0}
            >
              {busyAction === "pack" ? "Generating pack..." : "Generate revision pack"}
            </button>
            {documents.length === 0 && (
              <p className="hint">Add course material first (left panel) before generating a pack.</p>
            )}

            <button
              className="button-light"
              onClick={handleGenerateQuiz}
              disabled={busy || !latestPack}
            >
              {busyAction === "quiz" ? "Generating quiz..." : "Generate quiz"}
            </button>
            {!latestPack && documents.length > 0 && (
              <p className="hint">Generate a revision pack first — the quiz is built from it.</p>
            )}

            <Link
              className={`button ${quizCount === 0 ? "button-disabled" : "button-light"}`}
              to={quizCount > 0 ? `/courses/${id}/quiz` : "#"}
              onClick={(e) => quizCount === 0 && e.preventDefault()}
              aria-disabled={quizCount === 0}
            >
              {quizCount > 0 ? `Take quiz (${quizCount} questions) →` : "Take quiz →"}
            </Link>
          </div>

          {status && <p className="notice success">{status}</p>}
          {error && <p className="notice">{error}</p>}
        </aside>
      </div>

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
