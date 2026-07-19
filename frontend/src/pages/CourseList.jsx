import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadCourses() {
    try {
      const { courses } = await apiFetch("/courses");
      setCourses(courses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await apiFetch("/courses", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setName("");
      loadCourses();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="container">
      <header className="page-header">
        <div>
          <p className="eyebrow">Your study space</p>
          <h1>Courses, <span className="highlight">made clearer.</span></h1>
          <p className="subtitle">Keep every lecture, revision pack, and quiz in one focused place.</p>
        </div>
        <div className="course-symbol">✦</div>
      </header>

      <form className="card create-course" onSubmit={handleCreate}>
        <input
          placeholder="e.g. Intro to Macroeconomics"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">+ New course</button>
      </form>

      {error && <p className="notice">{error}</p>}
      {loading && <p className="muted">Loading your courses...</p>}

      <section className="course-grid">
        {courses.map((course) => (
          <Link key={course.id} to={`/courses/${course.id}`} className="card course-card">
            <span className="course-arrow">↗</span><span className="course-symbol">◌</span>
            <strong>{course.name}</strong>
            <p>{course.description || "Add course materials to start building your revision pack."}</p>
          </Link>
        ))}
      </section>

      {!loading && courses.length === 0 && <div className="empty-state">Your study space is ready. Create your first course to begin.</div>}
    </main>
  );
}
