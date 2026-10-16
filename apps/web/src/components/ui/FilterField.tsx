import type { ReactNode } from "react";

type FilterFieldProps = {
  children: ReactNode;
  label: string;
};

export const FilterField = ({ children, label }: FilterFieldProps) => (
  <label className="filter-field">
    <span>{label}</span>
    {children}
  </label>
);
