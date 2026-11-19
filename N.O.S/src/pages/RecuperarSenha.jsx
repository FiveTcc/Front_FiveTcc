import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim()) {
      setErro("Informe um e-mail válido.");
      return;
    }

    setErro("");
    setCarregando(true);

    try {
      await api.post("auth/recuperar-senha", {
        email: email.trim(),
      });

      console.log(email);

      setEnviado(true);
    } catch (error) {
      console.error("Erro ao solicitar recuperação:", error);
      setErro(
        error.response?.data?.message ||
          "Não foi possível enviar as instruções. Tente novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="acesso recuperacao-pagina">
      <div className="recuperacao-card">
        <span className="rotulo-superior">Acesso seguro</span>
        <h1>Recuperar senha</h1>
        <p className="esmaecido">
          Informe seu e-mail e enviaremos as instruções para redefinir sua
          senha.
        </p>

        {enviado ? (
          <div className="recuperacao-mensagem" role="status">
            Se o e-mail estiver cadastrado, você receberá as instruções em
            instantes.
          </div>
        ) : (
          <form className="recuperacao-formulario" onSubmit={handleSubmit}>
            <label className="recuperacao-campo">
              <span>E-mail corporativo</span>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="E-mail de recuperação"
                required
              />
            </label>

            {erro && <div className="recuperacao-erro">{erro}</div>}

            <button
              type="submit"
              className="botao botao--principal recuperacao-formulario__envio"
              disabled={carregando}
            >
              {carregando ? "Enviando..." : "Enviar"}
            </button>
          </form>
        )}

        <Link to="/login" className="recuperacao-voltar">
          ← Voltar para o login
        </Link>
      </div>
    </div>
  );
}
