import { CustomSelector, SelectorItem } from "./CustomSelector";
import { useState, useRef, useEffect } from "react";

export default function ExperimentSelector({
  options,
  value,
  onChange,
  label,
  open: controlledOpen,
  onToggle: controlledOnToggle,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const selectorRef = useRef(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleToggle = () => {
    if (isControlled && controlledOnToggle) {
      controlledOnToggle();
    } else {
      setInternalOpen(!internalOpen);
    }
  };

  const handleClose = () => {
    if (isControlled && controlledOnToggle) {
      if (isOpen) controlledOnToggle();
    } else {
      setInternalOpen(false);
    }
  };

  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        if (!isControlled) {
          setInternalOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isControlled]);

  return (
    <CustomSelector
      label={selected.label}
      sublabel={label}
      open={isOpen}
      onToggle={handleToggle}
      selectorRef={selectorRef}
    >
      {options.map((option) => (
        <SelectorItem
          key={option.value}
          label={option.label}
          subtitle={option.description}
          active={value === option.value}
          onClick={() => {
            onChange(option.value);
            handleClose();
          }}
        />
      ))}
    </CustomSelector>
  );
}