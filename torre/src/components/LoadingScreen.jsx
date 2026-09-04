export default function LoadingScreen() {
  return (
    <div className="loading-screen" aria-live="polite" aria-busy="true">
      <div className="loading-screen__logo-wrap">
        <div className="loading-screen__ring" aria-hidden="true" />

        <div className="loading-screen__word" aria-label="N.O.S.">
          N.O.S
        </div>
      </div>

      <p className="loading-screen__text">Carregando...</p>

      <div className="loading-screen__dots" aria-hidden="true">
        <span className="loading-screen__dot loading-screen__dot--active" />
        <span className="loading-screen__dot" />
        <span className="loading-screen__dot" />
        <span className="loading-screen__dot" />
        <span className="loading-screen__dot" />
      </div>
    </div>
  );
}
