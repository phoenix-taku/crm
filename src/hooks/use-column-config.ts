"use client";

import { useState, useEffect, useCallback } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  sortDirection: SortDirection;
}

export interface UseColumnConfigOptions {
  storageKey: string;
  defaultColumns: Omit<ColumnConfig, "sortDirection" | "sortPriority">[];
}

export function useColumnConfig({
  storageKey,
  defaultColumns,
}: UseColumnConfigOptions) {
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window === "undefined") {
      return defaultColumns.map((col) => ({
        ...col,
        sortDirection: null as SortDirection,
        sortPriority: 0,
      }));
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ColumnConfig[];
        const defaultMap = new Map(defaultColumns.map((col) => [col.id, col]));
        const storedMap = new Map(parsed.map((col) => [col.id, col]));

        const merged = defaultColumns.map((defaultCol, index) => {
          const storedCol = storedMap.get(defaultCol.id);
          if (storedCol) {
            return {
              ...defaultCol,
              visible: storedCol.visible,
              order: storedCol.order,
              label: storedCol.label,
              sortDirection: storedCol.sortDirection ?? null,
            };
          }
          return {
            ...defaultCol,
            order: index,
            sortDirection: null as SortDirection,
            sortPriority: 0,
          };
        });

        parsed.forEach((storedCol) => {
          if (!defaultMap.has(storedCol.id)) {
            merged.push(storedCol);
          }
        });

        return merged.sort((a, b) => a.order - b.order);
      }
    } catch (error) {
      console.error("Error loading column config:", error);
    }

    return defaultColumns.map((col) => ({
      ...col,
      sortDirection: null as SortDirection,
      sortPriority: 0,
    }));
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(columns));
      } catch (error) {
        console.error("Error saving column config:", error);
      }
    }
  }, [columns, storageKey]);

  const updateColumn = useCallback(
    (id: string, updates: Partial<ColumnConfig>) => {
      setColumns((prev) =>
        prev.map((col) => (col.id === id ? { ...col, ...updates } : col)),
      );
    },
    [],
  );

  const toggleColumnVisibility = useCallback((id: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === id ? { ...col, visible: !col.visible } : col,
      ),
    );
  }, []);

  const renameColumn = useCallback((id: string, newLabel: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, label: newLabel } : col)),
    );
  }, []);

  const reorderColumns = useCallback(
    (newOrder: { id: string; order: number }[]) => {
      setColumns((prev) => {
        const orderMap = new Map(newOrder.map((item) => [item.id, item.order]));
        return prev
          .map((col) => ({
            ...col,
            order: orderMap.get(col.id) ?? col.order,
          }))
          .sort((a, b) => a.order - b.order);
      });
    },
    [],
  );

  const setSortDirection = useCallback(
    (id: string, direction: SortDirection) => {
      setColumns((prev) => {
        return prev.map((col) => {
          if (col.id === id) {
            return {
              ...col,
              sortDirection: direction,
              sortPriority: direction !== null ? 1 : 0,
            };
          }
          if (direction !== null && col.sortDirection !== null) {
            return {
              ...col,
              sortDirection: null,
              sortPriority: 0,
            };
          }
          return col;
        });
      });
    },
    [],
  );

  const clearSort = useCallback(() => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        sortDirection: null,
        sortPriority: 0,
      })),
    );
  }, []);

  const resetToDefaults = useCallback(() => {
    setColumns(
      defaultColumns.map((col, index) => ({
        ...col,
        order: index,
        sortDirection: null as SortDirection,
        sortPriority: 0,
      })),
    );
  }, [defaultColumns]);

  const addColumn = useCallback(
    (column: Omit<ColumnConfig, "sortDirection" | "sortPriority">) => {
      setColumns((prev) => {
        // Check if column already exists
        if (prev.some((col) => col.id === column.id)) {
          return prev;
        }
        // Add new column at the end
        const maxOrder = Math.max(...prev.map((col) => col.order), -1);
        return [
          ...prev,
          {
            ...column,
            order: maxOrder + 1,
            sortDirection: null as SortDirection,
            sortPriority: 0,
          },
        ];
      });
    },
    [],
  );

  const removeColumn = useCallback((id: string) => {
    setColumns((prev) => prev.filter((col) => col.id !== id));
  }, []);

  const visibleColumns = columns
    .filter((col) => col.visible)
    .sort((a, b) => a.order - b.order);
  const sortedColumns = columns.filter((col) => col.sortDirection !== null);

  return {
    columns,
    visibleColumns,
    sortedColumns,
    updateColumn,
    toggleColumnVisibility,
    renameColumn,
    reorderColumns,
    setSortDirection,
    clearSort,
    resetToDefaults,
    addColumn,
    removeColumn,
  };
}
