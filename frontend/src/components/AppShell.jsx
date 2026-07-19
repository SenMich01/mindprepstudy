import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AppShell({ children }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <div className="app-topbar">
        <div className="app-topbar-brand">
          <span className="brand-mark">M</span> MindPrepStudy
        </div>
        <button className="button-secondary app-logout" onClick={handleLogout}>
          Log out
        </button>
      </div>
      {children}
    </div>
  );
}
