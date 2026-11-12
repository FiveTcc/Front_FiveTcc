import { useEffect, useRef, useState } from "react";
import "../styles/CustomSelect.css";
 
export default function CustomSelect({
  value,
  options,
  onChange,
  id,
  label,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
  const optionValue = (option) =>
    typeof option === "string" ? option : option.value;
  const optionLabel = (option) =>
    typeof option === "string" ? option : option.label;
 
  // fecha ao clicar fora
  useEffect(() => {
    const close = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
 
  const toggle = () => {
    setOpen((o) => !o);
    setActive(Math.max(0, options.findIndex((option) => optionValue(option) === value)));
  };
 
  const choose = (opt) => {
    onChange(opt);
    setOpen(false);
  };
 
  const selectedOption = options.find(
    (option) => optionValue(option) === value,
  );

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
 
  return (
    <div className={`cselect ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        id={id}
        className="cselect__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <span>{selectedOption ? optionLabel(selectedOption) : value}</span>
        <span className="cselect__caret" aria-hidden="true" />
      </button>
 
      {open && (
        <ul className="cselect__menu" role="listbox" aria-label={label}>
          {options.map((opt, i) => (
            <li
              key={optionValue(opt)}
              role="option"
              aria-selected={optionValue(opt) === value}
              className={
                "cselect__option" +
                (optionValue(opt) === value ? " is-selected" : "") +
                (i === active ? " is-active" : "")
              }
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(optionValue(opt))}
            >
              {optionLabel(opt)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}