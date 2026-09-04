import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import CircuitAnimation from "../components/CircuitAnimation";
import LoadingScreen from "../components/LoadingScreen";


export default function Login() {

  const navigate = useNavigate();

  const { usuario, login } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [carregando, setCarregando] = useState(false);

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


  async function handleSubmit(event) {
    event.preventDefault();

    console.log("[Login] Submit iniciado", {
      email,
      senha: "***",
    });

    setErro("");

    if (!email || !senha) {
      setErro("Preencha todos os campos.");
      return;
    }

    try {
      setCarregando(true);

      console.log("[Login] Chamando login do AuthContext...");

      const resultado = await login(email, senha);

      console.log("[Login] Resultado do login:", resultado);

      if (!resultado?.sucesso) {
        console.log("[Login] Login retornou falha");

        setErro(
          resultado?.mensagem ||
          "Não foi possível realizar o login."
        );

        return;
      }

      console.log("[Login] Login confirmado!");

      const tempoMinimo = 350;
      const inicio = Date.now();

      await new Promise((resolve) => setTimeout(resolve, tempoMinimo));

      const tempoDecorrido = Date.now() - inicio;
      if (tempoDecorrido < tempoMinimo) {
        await new Promise((resolve) =>
          setTimeout(resolve, tempoMinimo - tempoDecorrido)
        );
      }

        // Limpa os campos
    setEmail("");
    setSenha("");


      console.log("[Login] Navegando para /painel");
      navigate("/painel", {
        replace: true,
      });
    } catch (error) {
      console.error("[Login] Erro no submit:", error);

      setErro(
        error?.response?.data?.message ||
        error?.message ||
        "Não foi possível realizar o login."
      );
    } finally {
      setCarregando(false);
      console.log("[Login] Finalizou o submit");
    }
  }

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  if (carregando) {
    return <LoadingScreen />;
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
                onChange={(event) => setEmail(event.target.value)}
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
                onChange={(event) => setSenha(event.target.value)}
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

            {erro && (
              <p>{erro}</p>
            )}

            <button type="submit"
              className="btn btn--primary login__submit"
              disabled={carregando}
            >
              {carregando ? "Entrando..." : "Entrar"} <span aria-hidden="true">→</span>
            </button>

            <Link to="/recuperar-senha" className="login__forgot-password">
              Recuperar senha
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
