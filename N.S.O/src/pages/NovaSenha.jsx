import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function NovaSenha() {
  const navigate = useNavigate();

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (!token) {
      setErro("Token de recuperação não encontrado ou inválido.");
      return;
    }

    if (!novaSenha || novaSenha.length < 8) {
      setErro("A nova senha deve ter pelo menos 8 caracteres.");
      setSucesso("");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("A confirmação da senha não confere com a nova senha.");
      setSucesso("");
      return;
    }

    setCarregando(true);

    try {
      await api.post("/auth/redefinir-senha", {
        token,
        novaSenha,
      });

      setSucesso("");
      setConfirmarSenha("");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      setErro(
        error.response?.data?.message ||
          "Não foi possível redefinir a senha. O token pode estar expirado ou inválido.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="acesso recuperacao-pagina">
      <div className="recuperacao-card">
        <span className="rotulo-superior">Acesso seguro</span>
        <h1>Definir nova senha</h1>
        <p className="esmaecido">
          Crie uma nova senha para continuar com acesso ao sistema.
        </p>

        <form
          className="recuperacao-formulario recuperacao-formulario--redefinicao"
          onSubmit={handleSubmit}
        >
          <label className="recuperacao-campo">
            <span>Nova senha</span>
            <input
              type="password"
              value={novaSenha}
              onChange={(event) => setNovaSenha(event.target.value)}
              placeholder="Digite a nova senha"
              autoComplete="new-password"
            />
          </label>

          <label className="recuperacao-campo">
            <span>Confirmar senha</span>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(event) => setConfirmarSenha(event.target.value)}
              placeholder="Confirme a nova senha"
              autoComplete="new-password"
            />
          </label>

          {erro && <div className="recuperacao-erro">{erro}</div>}
          {sucesso && <div className="recuperacao-sucesso">{sucesso}</div>}

          <button
            type="submit"
            className="botao botao--principal recuperacao-formulario__envio"
            disabled={carregando}
          >
            {carregando ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>

        <Link to="/login" className="recuperacao-voltar">
          ← Voltar para o login
        </Link>
      </div>
    </div>
  );
}
