import { FilterField } from "../../components/ui/FilterField";

type OperatorOption = { id: string; name: string };

type DashboardFiltersProps = {
  onOperatorChange: (value: string) => void;
  operatorId: string;
  operators: OperatorOption[];
  role: "ADMIN" | "OPERATOR";
};

export const DashboardFilters = ({
  onOperatorChange,
  operatorId,
  operators,
  role,
}: DashboardFiltersProps) => (
  <div className="dashboard-filters" aria-label="Filtros do dashboard">
    {role === "ADMIN" && (
      <FilterField label="Operador">
        <select className="input" value={operatorId} onChange={(event) => onOperatorChange(event.target.value)}>
          <option value="">Todos</option>
          {operators.map((operator) => <option key={operator.id} value={operator.id}>{operator.name}</option>)}
        </select>
      </FilterField>
    )}
  </div>
);
