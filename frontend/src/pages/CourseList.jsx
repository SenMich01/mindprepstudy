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
    <div className="container">
      <h1>Your Courses</h1>

      <form className="card" onSubmit={handleCreate}>
        <input
          placeholder="e.g. Intro to Macroeconomics"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Create Course</button>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {courses.map((course) => (
        <Link key={course.id} to={`/courses/${course.id}`} className="card" style={{ display: "block" }}>
          <strong>{course.name}</strong>
          {course.description && <p>{course.description}</p>}
        </Link>
      ))}

      {!loading && courses.length === 0 && <p>No courses yet — create one above to get started.</p>}
    </div>
  );
}
