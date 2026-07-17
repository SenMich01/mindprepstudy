import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [revisionPacks, setRevisionPacks] = useState([]);
  const [pastedText, setPastedText] = useState("");
  const [busy, setBusy] = useState(false);
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

  if (!course) return <div className="container">Loading...</div>;

  const latestPack = revisionPacks[0];

  return (
    <div className="container">
      <Link to="/courses">&larr; All courses</Link>
      <h1>{course.name}</h1>

      <div className="card">
        <h3>Add material</h3>
        <form onSubmit={handlePasteSubmit}>
          <textarea
            rows={4}
            placeholder="Paste lecture notes here..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />
          <button type="submit" disabled={busy}>Add pasted text</button>
        </form>
        <p style={{ marginTop: "1rem" }}>Or upload a file (.pdf, .docx, .pptx):</p>
        <input type="file" accept=".pdf,.docx,.pptx" onChange={handleFileUpload} disabled={busy} />
        <p>{documents.length} document(s) added</p>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <div className="card">
        <h3>Revision Pack</h3>
        <button onClick={handleGeneratePack} disabled={busy || documents.length === 0}>
          {busy ? "Working..." : "Generate Revision Pack"}
        </button>

        {latestPack && (
          <div style={{ marginTop: "1rem" }}>
            {latestPack.content_json.concepts?.map((c, i) => (
              <div key={i} style={{ marginBottom: "1rem" }}>
                <strong>{c.title}</strong>
                <p>{c.explanation}</p>
                {c.mnemonic && <p><em>Mnemonic: {c.mnemonic}</em></p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Quiz</h3>
        <button onClick={handleGenerateQuiz} disabled={busy || !latestPack}>
          Generate Quiz
        </button>
        <Link to={`/courses/${id}/quiz`}><button style={{ marginLeft: "0.5rem" }}>Take Quiz</button></Link>
      </div>
    </div>
  );
}
