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
    <div className="container">
      <h1>MindPrepStudy</h1>
      <p>Turn your notes into an exam-ready revision pack and quiz.</p>

      <form className="card" onSubmit={handleSubmit}>
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
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        {notice && <p style={{ color: "#166534" }}>{notice}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <button
        style={{ background: "transparent", color: "#111", textDecoration: "underline" }}
        onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
      >
        {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
