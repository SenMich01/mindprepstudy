import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("sign-in"); // "sign-in" | "sign-up"
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const { data, error: authError } =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/login` },
          });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    // With Confirm email enabled in Supabase, sign-up creates the user but does
    // not issue a session until they use the confirmation link.
    if (mode === "sign-up" && !data.session) {
      setNotice("Check your inbox to confirm your email, then sign in.");
      setMode("sign-in");
      return;
    }

    navigate("/courses");
  }

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <section className="auth-intro">
          <div className="brand"><span className="brand-mark">M</span> MindPrepStudy</div>
          <div className="auth-copy">
            <p className="eyebrow" style={{ color: "#f3c9aa" }}>Study with intention</p>
            <h1>Your <span className="highlight">clearest path</span> to exam day.</h1>
            <p>Turn lecture notes and course files into focused revision packs, smart quizzes, and a plan for what to study next.</p>
          </div>
        </section>
        <section className="auth-form">
          <p className="eyebrow">Welcome</p>
          <h2>{mode === "sign-in" ? "Pick up where you left off" : "Start your study space"}</h2>
          <p className="muted">{mode === "sign-in" ? "Sign in to continue your revision." : "Create an account to keep your courses organised."}</p>
          <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="notice">{error}</p>}
        {notice && <p className="notice success">{notice}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Sign up"}
        </button>
          </form>

          <button
        className="auth-switch"
        onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          >
        {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </section>
      </div>
    </main>
  );
}
