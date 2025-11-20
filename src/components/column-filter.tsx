"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type TextOperator = "contains" | "equals" | "startsWith" | "endsWith";
export type NumberOperator = "gt" | "lt" | "gte" | "lte" | "eq";
export type DateOperator = "before" | "after" | "on" | "between";
export type EnumOperator = "equals" | "in";

export type FilterOperator = TextOperator | NumberOperator | DateOperator | EnumOperator;

export type ColumnType = "text" | "number" | "date" | "enum";

export interface ColumnFilter {
    columnId: string;
    columnLabel: string;
    columnType: ColumnType;
    operator: FilterOperator;
    value: string;
    value2?: string; // For "between" date filter
    enumOptions?: string[]; // For enum type columns
}

interface ColumnFilterProps {
    columns: Array<{ id: string; label: string }>;
    columnTypes: Record<string, ColumnType>;
    enumOptions?: Record<string, string[]>; // columnId -> options
    onFilterChange: (filters: ColumnFilter[]) => void;
    activeFilters?: ColumnFilter[];
}

const textOperators: Array<{ value: TextOperator; label: string }> = [
    { value: "contains", label: "Contains" },
    { value: "equals", label: "Equals" },
    { value: "startsWith", label: "Starts with" },
    { value: "endsWith", label: "Ends with" },
];

const numberOperators: Array<{ value: NumberOperator; label: string }> = [
    { value: "gt", label: "Greater than (>)" },
    { value: "lt", label: "Less than (<)" },
    { value: "gte", label: "Greater or equal (≥)" },
    { value: "lte", label: "Less or equal (≤)" },
    { value: "eq", label: "Equal (=)" },
];

const dateOperators: Array<{ value: DateOperator; label: string }> = [
    { value: "before", label: "Before" },
    { value: "after", label: "After" },
    { value: "on", label: "On" },
    { value: "between", label: "Between" },
];

const enumOperators: Array<{ value: EnumOperator; label: string }> = [
    { value: "equals", label: "Equals" },
    { value: "in", label: "Is one of" },
];

const operatorLabels: Record<FilterOperator, string> = {
    contains: "contains",
    equals: "=",
    startsWith: "starts with",
    endsWith: "ends with",
    gt: ">",
    lt: "<",
    gte: "≥",
    lte: "≤",
    eq: "=",
    before: "before",
    after: "after",
    on: "on",
    between: "between",
    in: "is one of",
};

interface CurrentFilter {
    selectedColumn: string;
    operator: FilterOperator | "";
    value: string;
    value2: string;
    selectedEnumValues: string[];
}

export function ColumnFilter({
    columns,
    columnTypes,
    enumOptions = {},
    onFilterChange,
    activeFilters = [],
}: ColumnFilterProps) {
    const [currentFilter, setCurrentFilter] = useState<CurrentFilter>({
        selectedColumn: "",
        operator: "",
        value: "",
        value2: "",
        selectedEnumValues: [],
    });

    const [filters, setFilters] = useState<ColumnFilter[]>(activeFilters);

    // Sync with activeFilters prop
    useEffect(() => {
        setFilters(activeFilters);
    }, [activeFilters]);

    const selectedColumnType = currentFilter.selectedColumn
        ? columnTypes[currentFilter.selectedColumn]
        : undefined;

    const availableOperators =
        selectedColumnType === "text"
            ? textOperators
            : selectedColumnType === "number"
              ? numberOperators
              : selectedColumnType === "date"
                ? dateOperators
                : selectedColumnType === "enum"
                  ? enumOperators
                  : [];

    const isFilterComplete = () => {
        if (!currentFilter.selectedColumn || !currentFilter.operator) return false;

        if (currentFilter.operator === "in") {
            return currentFilter.selectedEnumValues.length > 0;
        }
        if (currentFilter.operator === "between") {
            return currentFilter.value.trim() !== "" && currentFilter.value2.trim() !== "";
        }
        return currentFilter.value.trim() !== "";
    };

    const addFilter = () => {
        if (!isFilterComplete()) return;

        const columnType = columnTypes[currentFilter.selectedColumn]!;
        const columnLabel = columns.find((c) => c.id === currentFilter.selectedColumn)?.label ?? currentFilter.selectedColumn;

        let newFilter: ColumnFilter;

        if (currentFilter.operator === "in") {
            newFilter = {
                columnId: currentFilter.selectedColumn,
                columnLabel,
                columnType,
                operator: currentFilter.operator,
                value: currentFilter.selectedEnumValues.join(","),
                enumOptions: enumOptions[currentFilter.selectedColumn],
            };
        } else if (currentFilter.operator === "between") {
            newFilter = {
                columnId: currentFilter.selectedColumn,
                columnLabel,
                columnType,
                operator: currentFilter.operator,
                value: currentFilter.value.trim(),
                value2: currentFilter.value2.trim(),
            };
        } else {
            newFilter = {
                columnId: currentFilter.selectedColumn,
                columnLabel,
                columnType,
                operator: currentFilter.operator as FilterOperator,
                value: currentFilter.value.trim(),
                enumOptions: enumOptions[currentFilter.selectedColumn],
            };
        }

        const updatedFilters = [...filters, newFilter];
        setFilters(updatedFilters);
        onFilterChange(updatedFilters);

        // Reset current filter
        setCurrentFilter({
            selectedColumn: "",
            operator: "",
            value: "",
            value2: "",
            selectedEnumValues: [],
        });
    };

    const removeFilter = (index: number) => {
        const updatedFilters = filters.filter((_, i) => i !== index);
        setFilters(updatedFilters);
        onFilterChange(updatedFilters);
    };

    const formatFilterLabel = (filter: ColumnFilter): string => {
        let label = `${filter.columnLabel} ${operatorLabels[filter.operator]}`;
        
        if (filter.operator === "in") {
            const count = filter.value.split(",").length;
            label += ` (${count} value${count !== 1 ? "s" : ""})`;
        } else if (filter.operator === "between") {
            label += ` ${filter.value} and ${filter.value2}`;
        } else {
            label += ` ${filter.value}`;
        }
        
        return label;
    };

    return (
        <div className="space-y-2">
            {/* Inline filter builder */}
            <div className="flex items-center gap-2 flex-wrap">
                <Select
                    value={currentFilter.selectedColumn}
                    onValueChange={(val) => {
                        const columnType = columnTypes[val];
                        const operators =
                            columnType === "text"
                                ? textOperators
                                : columnType === "number"
                                  ? numberOperators
                                  : columnType === "date"
                                    ? dateOperators
                                    : columnType === "enum"
                                      ? enumOperators
                                      : [];
                        setCurrentFilter({
                            selectedColumn: val,
                            operator: operators.length > 0 ? operators[0]!.value : "",
                            value: "",
                            value2: "",
                            selectedEnumValues: [],
                        });
                    }}
                >
                    <SelectTrigger className="w-[140px] h-8">
                        <SelectValue placeholder="Add Filter" />
                    </SelectTrigger>
                    <SelectContent>
                        {columns.map((col) => (
                            <SelectItem key={col.id} value={col.id}>
                                {col.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {selectedColumnType && (
                    <Select
                        value={currentFilter.operator}
                        onValueChange={(val) =>
                            setCurrentFilter({
                                ...currentFilter,
                                operator: val as FilterOperator,
                                value: "",
                                value2: "",
                                selectedEnumValues: [],
                            })
                        }
                    >
                        <SelectTrigger className="w-[120px] h-8">
                            <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableOperators.map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                    {op.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {selectedColumnType === "text" && currentFilter.operator && (
                    <Input
                        type="text"
                        placeholder="Value"
                        value={currentFilter.value}
                        onChange={(e) =>
                            setCurrentFilter({ ...currentFilter, value: e.target.value })
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && isFilterComplete()) {
                                addFilter();
                            }
                        }}
                        className="w-[140px] h-8"
                    />
                )}

                {selectedColumnType === "number" && currentFilter.operator && (
                    <Input
                        type="number"
                        placeholder="Value"
                        value={currentFilter.value}
                        onChange={(e) =>
                            setCurrentFilter({ ...currentFilter, value: e.target.value })
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && isFilterComplete()) {
                                addFilter();
                            }
                        }}
                        className="w-[100px] h-8"
                    />
                )}

                {selectedColumnType === "date" && currentFilter.operator && (
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            value={currentFilter.value}
                            onChange={(e) =>
                                setCurrentFilter({ ...currentFilter, value: e.target.value })
                            }
                            className="w-[140px] h-8"
                        />
                        {currentFilter.operator === "between" && (
                            <Input
                                type="date"
                                placeholder="End date"
                                value={currentFilter.value2}
                                onChange={(e) =>
                                    setCurrentFilter({ ...currentFilter, value2: e.target.value })
                                }
                                className="w-[140px] h-8"
                            />
                        )}
                    </div>
                )}

                {selectedColumnType === "enum" && currentFilter.operator && enumOptions[currentFilter.selectedColumn] && (
                    <div className="flex gap-2 items-center">
                        {currentFilter.operator === "in" ? (
                            <>
                                <Select
                                    value=""
                                    onValueChange={(val) => {
                                        if (val && !currentFilter.selectedEnumValues.includes(val)) {
                                            setCurrentFilter({
                                                ...currentFilter,
                                                selectedEnumValues: [
                                                    ...currentFilter.selectedEnumValues,
                                                    val,
                                                ],
                                            });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-[140px] h-8">
                                        <SelectValue placeholder="Add value..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {enumOptions[currentFilter.selectedColumn]!
                                            .filter((opt) => !currentFilter.selectedEnumValues.includes(opt))
                                            .map((opt) => (
                                                <SelectItem key={opt} value={opt}>
                                                    {opt}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                {currentFilter.selectedEnumValues.length > 0 && (
                                    <div className="flex gap-1 flex-wrap items-center">
                                        {currentFilter.selectedEnumValues.map((val) => (
                                            <Badge key={val} variant="outline" className="gap-1 pr-1">
                                                {val}
                                                <button
                                                    onClick={() => {
                                                        setCurrentFilter({
                                                            ...currentFilter,
                                                            selectedEnumValues:
                                                                currentFilter.selectedEnumValues.filter(
                                                                    (v) => v !== val,
                                                                ),
                                                        });
                                                    }}
                                                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                                                    type="button"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <Select
                                value={currentFilter.value}
                                onValueChange={(val) =>
                                    setCurrentFilter({ ...currentFilter, value: val })
                                }
                            >
                                <SelectTrigger className="w-[140px] h-8">
                                    <SelectValue placeholder="Select value..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {enumOptions[currentFilter.selectedColumn]!.map((opt) => (
                                        <SelectItem key={opt} value={opt}>
                                            {opt}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                )}

                {isFilterComplete() && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={addFilter}
                        className="h-8"
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                    </Button>
                )}
            </div>

            {/* Active filters as badges */}
            {filters.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    {filters.map((filter, idx) => (
                        <Badge
                            key={idx}
                            variant="secondary"
                            className="gap-1 pr-1"
                        >
                            {formatFilterLabel(filter)}
                            <button
                                onClick={() => removeFilter(idx)}
                                className="ml-1 rounded-full hover:bg-muted p-0.5"
                                type="button"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
