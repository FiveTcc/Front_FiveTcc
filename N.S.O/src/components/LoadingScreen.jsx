// Apresenta a animação enquanto a aplicação aguarda uma operação.
export default function LoadingScreen() {
  return (
    <div className="carregamento-tela" aria-live="polite" aria-busy="true">
      <div className="carregamento-tela__logotipo-wrap">
        <div className="carregamento-tela__anel" aria-hidden="true" />

        <div className="carregamento-tela__palavra" aria-label="N.O.S.">
          N.O.S
        </div>
      </div>

      <p className="carregamento-tela__texto">Carregando...</p>

      <div className="carregamento-tela__pontos" aria-hidden="true">
        <span className="carregamento-tela__ponto carregamento-tela__ponto--ativo" />
        <span className="carregamento-tela__ponto" />
        <span className="carregamento-tela__ponto" />
        <span className="carregamento-tela__ponto" />
        <span className="carregamento-tela__ponto" />
      </div>
    </div>
  );
}
