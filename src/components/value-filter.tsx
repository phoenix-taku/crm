"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ValueFilterOperator = "gt" | "lt" | "gte" | "lte" | "eq";

export interface ValueFilter {
    operator: ValueFilterOperator;
    value: string;
}

interface ValueFilterProps {
    onFilterChange: (filter: ValueFilter | null) => void;
    label?: string;
}

const operatorLabels: Record<ValueFilterOperator, string> = {
    gt: ">",
    lt: "<",
    gte: "≥",
    lte: "≤",
    eq: "=",
};

export function ValueFilter({ onFilterChange, label = "Value" }: ValueFilterProps) {
    const [operator, setOperator] = useState<ValueFilterOperator | "">("");
    const [value, setValue] = useState("");

    const handleApply = () => {
        if (operator && value.trim()) {
            onFilterChange({ operator, value: value.trim() });
        }
    };

    const handleClear = () => {
        setOperator("");
        setValue("");
        onFilterChange(null);
    };

    const isFilterActive = operator && value.trim();

    return (
        <div className="flex items-center gap-2">
            <Select value={operator} onValueChange={(val) => setOperator(val as ValueFilterOperator)}>
                <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="gt">Greater than (&gt;)</SelectItem>
                    <SelectItem value="lt">Less than (&lt;)</SelectItem>
                    <SelectItem value="gte">Greater or equal (≥)</SelectItem>
                    <SelectItem value="lte">Less or equal (≤)</SelectItem>
                    <SelectItem value="eq">Equal (=)</SelectItem>
                </SelectContent>
            </Select>
            <Input
                type="number"
                placeholder={label}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-[120px]"
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleApply();
                    }
                }}
            />
            <Button
                variant="outline"
                size="sm"
                onClick={handleApply}
                disabled={!operator || !value.trim()}
            >
                Apply
            </Button>
            {isFilterActive && (
                <Badge variant="secondary" className="gap-1">
                    {label} {operatorLabels[operator]} {value}
                    <button
                        onClick={handleClear}
                        className="ml-1 rounded-full hover:bg-muted"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            )}
        </div>
    );
}

