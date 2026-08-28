import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import CircuitAnimation from "../components/CircuitAnimation";

export default function Login() {
  const { usuario, login } = useAuth();
  const [email, setEmail] = useState("admin@torre.edu");
  const [senha, setSenha] = useState("admin123");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) return saved;
      return window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  if (usuario) return <Navigate to="/painel" replace />;

  function handleSubmit(e) {
    e.preventDefault();
    const resultado = login(email, senha);
    if (!resultado.ok) setErro(resultado.erro);
  }

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <div className="login">
      <button
        type="button"
        className="login__theme-toggle"
        onClick={toggleTheme}
        aria-label="Alternar tema"
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>

      <div className="login__panel">
        <div className="login__visual">
          {/* <div className="login__brand"> */}
          {/* <span className="sidebar__brand-mark sidebar__brand-mark--lg" aria-hidden="true" /> */}
          {/* <div className="login__brand-copy">
              <strong>N.O.S.</strong>
              <small>New Occurrence System</small>
            </div> */}
          {/* </div> */}

          <div className="login__hero">
            <h2>Abra chamados em segundos.</h2>
            <p>
              Registre e acompanhe suas ocorrências de forma simples e
              transparente.
            </p>

            <div className="login__illustration" aria-hidden="true">
              <CircuitAnimation className="login__circuit" />
            </div>
          </div>
        </div>

        <div className="login__form-panel">
          <h3>Bem-vindo!</h3>
          <p>Entre com suas credenciais para acessar seus chamados.</p>

          <form className="login__form" onSubmit={handleSubmit}>
            <div className="login__field login__field--icon">
              <span className="login__field-icon" aria-hidden="true">
                ✉
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email corporativo"
                required
              />
            </div>

            <div className="login__field login__field--icon login__field--password">
              <span className="login__field-icon" aria-hidden="true">
                🔒
              </span>
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Senha"
                required
              />
              <button
                type="button"
                className="login__toggle-password"
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={mostrarSenha}
                onClick={() => setMostrarSenha((value) => !value)}
              >
                {mostrarSenha ? "🙈" : "👁"}
              </button>
            </div>

            {erro && <p className="login__erro">{erro}</p>}

            <button type="submit" className="btn btn--primary login__submit">
              Entrar <span aria-hidden="true">→</span>
            </button>

            <Link to="/recuperar-senha" className="login__forgot-password">
              Recuperar senha
            </Link>

            {/* <button type="button" className="btn btn--ghost login__secondary">
              Criar conta
            </button> */}
          </form>
        </div>
      </div>
    </div>
  );
}
