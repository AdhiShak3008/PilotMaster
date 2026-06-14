import {
  CustomSelector,
  SelectorItem,
} from "./CustomSelector";

import {
  useState,
  useRef,
  useEffect,
} from "react";

export default function ExperimentSelector({
  options,
  value,
  onChange,
  label,
}) {
  const [open, setOpen] =
    useState(false);

  const selectorRef =
    useRef(null);

  const selected =
    options.find(
      (o) => o.value === value,
    ) || options[0];

  useEffect(() => {
    const handleClickOutside = (
      event,
    ) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(
          event.target,
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
  }, []);

  return (
    <CustomSelector
      label={selected.label}
      sublabel={label}
      open={open}
      onToggle={() =>
        setOpen(!open)
      }
      selectorRef={selectorRef}
    >
      {options.map((option) => (
        <SelectorItem
          key={option.value}
          label={option.label}
          subtitle={
            option.description
          }
          active={
            value === option.value
          }
          onClick={() => {
            onChange(option.value);
            setOpen(false);
          }}
        />
      ))}
    </CustomSelector>
  );
}