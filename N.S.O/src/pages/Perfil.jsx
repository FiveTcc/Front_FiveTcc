import { useEffect, useState, useRef, useMemo, } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import AvatarCropper from "../components/AvatarCropper";
import api from "../services/api";
import userService from "../services/userServices";

const PERFIL_LABEL = { admin: 'Administrador',  tecnico: 'Técnico', funcionario: 'Funcionário' };

function dataUrlParaArquivo(dataUrl, nomeArquivo = "perfil.jpg") {
  const divisao = dataUrl.split(",");
  const mimeMatch = divisao[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const dados = atob(divisao[1]);
  const array = new Uint8Array(dados.length);

  for (let i = 0; i < dados.length; i += 1) {
    array[i] = dados.charCodeAt(i);
  }

  return new File([array], nomeArquivo, { type: mime });
}

export default function Perfil() {
  const { usuario, logout } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(false);
  const [perfilForm, setPerfilForm] = useState({ nome: "", email: "", telefone: "", setor: "" , cargo: ""});
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [perfilErro, setPerfilErro] = useState("");
  const [perfilSucesso, setPerfilSucesso] = useState("");
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const notificacoesRef = useRef(null);
  const [theme, setTheme] = useState(getInitialTheme);
  const [mostrarCropModal, setMostrarCropModal] = useState(false);
  const [imagemOriginal, setImagemOriginal] = useState("");

  function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) return savedTheme;

    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }

    return "light";
  } catch {
    return "light";
  }
}

  const notificacoes = [];

 useEffect(() => {
  try {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  } catch {
    // Ignora erros de localStorage
  }
}, [theme]);

 useEffect(() => {
    function handleClickFora(event) {
      if (
        notificacoesRef.current &&
        !notificacoesRef.current.contains(event.target)
      ) {
        setMostrarNotificacoes(false);
      }
    }

    document.addEventListener("mousedown", handleClickFora);
    return () => {
      document.removeEventListener("mousedown", handleClickFora);
    };
  }, []);
  
  useEffect(() => {
    async function carregarPerfil() {
      try {
        setCarregandoPerfil(true);
        const perfilData = await userService.buscarperfil();
        console.log("buscarperfil ->", perfilData);
        setPerfil(perfilData);

       setFotoPerfil(perfilData.user_imagem || null);


        setPerfilForm({
          nome: perfilData.nome || perfilData.user_nome || "",
          email: perfilData.email || perfilData.user_email || "",
          telefone: perfilData.telefone || perfilData.user_telefone || perfilData.user_tel || "",
          cargo: perfilData.user_tipo || perfilData.cargo || perfilData.user_cargo || ""
        });
      } catch (err) {
        console.error(err);
        setPerfilErro("Erro ao carregar perfil.");
      }
      finally {
        setCarregandoPerfil(false);
      }
    }

    carregarPerfil();
  }, []);


  function handlePerfilChange(event) {
    const { name, value } = event.target;
    setPerfilForm((prev) => ({ ...prev, [name]: value }));
    if (perfilErro) setPerfilErro("");
    if (perfilSucesso) setPerfilSucesso("");
  }

  function handleFotoPerfilChange(event) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = () => {
      setImagemOriginal(leitor.result);
      setMostrarCropModal(true);
    };
    leitor.readAsDataURL(arquivo);
    event.target.value = "";
  }

  async function handleSalvarFotoPerfil(imagemCortada) {
    if (!imagemCortada) {
      setPerfilErro("Selecione uma imagem antes de salvar.");
      return;
    }

    try {
      const arquivoFoto = dataUrlParaArquivo(imagemCortada, "perfil.jpg");
      const respostaUpload = await userService.adicionarFoto(arquivoFoto);
      const novaUrlFoto =
        respostaUpload?.foto ||
        respostaUpload?.url ||
        respostaUpload?.imagem ||
        respostaUpload?.user_imagem_url ||
        respostaUpload?.imagem_url ||
        imagemCortada;

      setFotoPerfil(novaUrlFoto);
      setPerfil((prev) => ({
        ...(prev || {}),
        user_imagem_url: novaUrlFoto,
        imagem_url: novaUrlFoto,
        user_foto: novaUrlFoto,
        foto_perfil: novaUrlFoto,
      }));

      setPerfilSucesso("Foto de perfil atualizada com sucesso.");
      setPerfilErro("");
      setMostrarCropModal(false);
      setImagemOriginal("");
    } catch (error) {
      console.error(error);
      setPerfilErro(
        error?.message || "Erro ao processar a imagem do perfil.",
      );
      setPerfilSucesso("");
    }
  }

  async function handleSalvarPerfil(event) {
    event.preventDefault();

    try {
      const response = await api.put("/user/perfil", perfilForm);
      setPerfil(response.data || perfilForm);
      setPerfilSucesso("Perfil salvo com sucesso.");
      setPerfilErro("");
      setEditMode(false);
    } catch (error) {
      console.error(error);
      setPerfilErro(error?.response?.data?.message || error.message || "Erro ao salvar perfil.");
      setPerfilSucesso("");
    }
  }

  return (
    <div className="profile-shell">
      {carregandoPerfil && <p>Carregando perfil...</p>}

      <header className="profile-page-header">
        <div className="profile-page-header__brand">
          <div className="profile-page-header__title">
            <h1>Meu Perfil</h1>
            <p>Gerencie suas informações pessoais e mantenha seus dados sempre atualizados.</p>
          </div>
        </div>

        <div className="topbar__actions">
          <div className="topbar__notifications-wrap">
            <button
              type="button"
              className="topbar__icon-button"
              aria-label="Notificações"
              onClick={() => setMostrarNotificacoes((valor) => !valor)}
            >
              🕭
            </button>

            {mostrarNotificacoes && (
              <div
                className="topbar__notifications"
                role="menu"
                aria-label="Notificações"
              >
                <div className="topbar__notifications-header">
                  <strong>Notificações</strong>
                  <span>{notificacoes.length}</span>
                </div>

                {notificacoes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="topbar__notification-item"
                  >
                    <span>{item.titulo}</span>
                    <small>{item.tempo}</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="topbar__icon-button"
            aria-label={
              theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"
            }
            onClick={() =>
              setTheme((currentTheme) =>
                currentTheme === "dark" ? "light" : "dark"
              )
            }
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
      </header>

      <div className="profile-layout">
        <aside className="profile-summary">
          <div className="profile-summary__avatar-wrap">
            <div className="profile-summary__avatar">
              {fotoPerfil ? (
                <img
                  src={fotoPerfil}
                  alt="Foto de perfil"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                    setFotoPerfil(null);
                  }}
                />
              ) : (
                (perfilForm.nome || usuario?.nome || "U")
                  .charAt(0)
                  .toUpperCase()
              )}
            </div>

            
          </div>

          <div className="profile-summary__content">
            <h2>{perfilForm.nome || usuario?.nome || "Usuário"}</h2>
            <p>{PERFIL_LABEL[perfilForm.cargo || perfil?.user_tipo || usuario?.perfil || usuario?.user_tipo] || "Usuário"}</p>

            <div className="profile-summary__list">
              <div className="profile-summary__item">
                <span className="profile-summary__icon" aria-hidden>✉</span>
                <span>{perfilForm.email || usuario?.email || "-"}</span>
              </div>

              <div className="profile-summary__item">
                <span className="profile-summary__icon" aria-hidden>◔</span>
                <span>{perfilForm.telefone || usuario?.telefone || "-"}</span>
              </div>
            </div>

            <div className="profile-summary__status">
              <span className="profile-summary__status-dot" aria-hidden />
              Conta ativa
            </div>
          </div>
        </aside>

        <section className="profile-main-panel">
          <form className="profile-main-panel__body" onSubmit={handleSalvarPerfil}>
            <div className="profile-form__title-group">
              <h3>Dados Pessoais</h3>
              <p>Atualize suas informações pessoais e de contato.</p>
            </div>

            <div className="profile-form__grid">
              <label className="field-block">
                <span>Nome completo</span>
                <input type="text" name="nome" value={perfilForm.nome} onChange={handlePerfilChange} readOnly />
              </label>

                <label className="field-block">
                  <span>E-mail</span>
                  <input type="email" name="email" value={perfilForm.email} onChange={handlePerfilChange} readOnly />
                </label>

              <label className="field-block">
                <span>Telefone</span>
                <input type="text" name="telefone" value={perfilForm.telefone} onChange={handlePerfilChange} readOnly />
              </label>

              <label className="field-block">
                <span>Cargo</span>
                  <select name="cargo" value={perfilForm.cargo} onChange={handlePerfilChange} disabled>
                  <option value="admin">Administrador</option>
                  <option value="tecnico">Técnico</option>
                  <option value="funcionario">Funcionário</option>
                </select>
              </label>
            </div>

            <div className="profile-form__upload">
              <h4>Alterar Foto de Perfil</h4>
              <p>Use uma imagem de boa qualidade para facilitar o seu reconhecimento no sistema.</p>

              <input
                id="input-foto-perfil"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFotoPerfilChange}
              />

              <label
                htmlFor="input-foto-perfil"
                className="btn btn--ghost profile-form__upload-button"
              >
                Escolher imagem
              </label>
            </div>

            <AvatarCropper
              isOpen={mostrarCropModal}
              imageSrc={imagemOriginal}
              onClose={() => {
                setMostrarCropModal(false);
                setImagemOriginal("");
              }}
              onSave={handleSalvarFotoPerfil}
            />

            {(perfilErro || perfilSucesso) && (
              <p className={`form-message ${perfilErro ? "form-message--error" : "form-message--success"}`}>
                {perfilErro || perfilSucesso}
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
