import { useEffect, useRef, useState } from "react";
import "../styles/CustomSelect.css";
 
export default function CustomSelect({ value, options, onChange, id }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
 
  // fecha ao clicar fora
  useEffect(() => {
    const close = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
 
  // Abre ou fecha a lista e posiciona o foco na opção selecionada.
  const toggle = () => {
    setOpen((o) => !o);
    setActive(Math.max(0, options.indexOf(value)));
  };
 
  // Notifica a tela sobre a opção escolhida e fecha a lista.
  const choose = (opt) => {
    onChange(opt);
    setOpen(false);
  };
 
  // Permite navegar e selecionar opções pelo teclado.
  const onKeyDown = (e) => {
    if (e.key === "Escape") return setOpen(false);
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      return toggle();
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (active >= 0) choose(options[active]);
    }
  };
 
  // Exibe o seletor e, quando aberto, as opções disponíveis.
  return (
    <div className="selecao-personalizada" ref={rootRef}>
      <button
        type="button"
        id={id}
        className="selecao-personalizada__acionador"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <span>{value}</span>
        <span className="selecao-personalizada__seta" aria-hidden="true" />
      </button>
 
      {open && (
        <ul className="selecao-personalizada__menu" role="listbox">
          {options.map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
              className={
                "selecao-personalizada__opcao" +
                (opt === value ? " esta-selecionado" : "") +
                (i === active ? " esta-ativo" : "")
              }
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(opt)}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}