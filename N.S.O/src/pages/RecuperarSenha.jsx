import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

// Solicita à API o envio das instruções de recuperação para o e-mail informado.
export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  // Valida o endereço e trata o resultado do pedido de recuperação.
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
      <div className="recuperacao-cartao">
        <span className="rotulo-superior">Acesso seguro</span>
        <h1>Recuperar senha</h1>
        <p className="atenuado">
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
                placeholder="seu.email@torre.edu"
                required
              />
            </label>

            {erro && <div className="recuperacao-erro">{erro}</div>}

            <button
              type="submit"
              className="botao botao--principal recuperacao-formulario__enviar"
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
