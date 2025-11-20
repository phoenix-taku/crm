"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DealForm } from "./deal-form";
import { useColumnConfig } from "@/hooks/use-column-config";
import { ColumnSettingsDialog } from "@/components/column-settings-dialog";
import { Settings2, ArrowUp, ArrowDown } from "lucide-react";
import { ColumnFilter, type ColumnFilter as ColumnFilterType } from "@/components/column-filter";

interface DealListProps {
    onDealClick?: (dealId: string) => void;
    showActions?: boolean;
    limit?: number;
}

const STAGE_COLORS: Record<string, string> = {
    lead: "bg-blue-100 text-blue-800",
    qualified: "bg-purple-100 text-purple-800",
    proposal: "bg-yellow-100 text-yellow-800",
    negotiation: "bg-orange-100 text-orange-800",
    "closed-won": "bg-green-100 text-green-800",
    "closed-lost": "bg-red-100 text-red-800",
};

export function DealList({
    onDealClick,
    showActions = true,
    limit,
}: DealListProps) {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [columnFilters, setColumnFilters] = useState<ColumnFilterType[]>([]);
    const [editingDeal, setEditingDeal] = useState<string | null>(null);
    const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);
    const utils = api.useUtils();
    const router = useRouter();

    // Note: TypeScript can't infer api.customField types due to tRPC's complex type inference.
    // The router is correctly defined in src/server/api/root.ts and works at runtime.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const { data: customFieldDefinitions } = api.customField.getByEntityType.useQuery({
        entityType: "deal",
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const createCustomField = api.customField.create.useMutation({
        onSuccess: () => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            void utils.customField.getByEntityType.invalidate({ entityType: "deal" });
        },
    });

    const defaultColumns = [
        { id: "name", label: "Deal Name", visible: true, order: 0 },
        { id: "stage", label: "Stage", visible: true, order: 1 },
        { id: "value", label: "Value", visible: true, order: 2 },
        { id: "contact", label: "Contact", visible: true, order: 3 },
        { id: "company", label: "Company", visible: true, order: 4 },
        { id: "expectedClose", label: "Expected Close", visible: true, order: 5 },
    ];

    const {
        columns,
        visibleColumns,
        sortedColumns,
        updateColumn,
        toggleColumnVisibility,
        renameColumn,
        reorderColumns,
        setSortDirection,
        resetToDefaults,
        addColumn,
        removeColumn,
    } = useColumnConfig({
        storageKey: "deal-list-columns",
        defaultColumns,
    });

    const defaultColumnIds = new Set(defaultColumns.map((col) => col.id));

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading } = api.deal.getAll.useQuery({
        search: debouncedSearch || undefined,
        columnFilters: columnFilters.length > 0 ? columnFilters.map((filter) => ({
            columnId: filter.columnId,
            columnType: filter.columnType,
            operator: filter.operator,
            value: filter.value,
            value2: filter.value2,
        })) : undefined,
        limit: limit,
        includeContacts: true,
    });

    // Define column types for filtering
    const columnTypes: Record<string, "text" | "number" | "date" | "enum"> = useMemo(() => {
        const baseTypes: Record<string, "text" | "number" | "date" | "enum"> = {
            name: "text",
            stage: "enum",
            value: "number",
            contact: "text",
            company: "text",
            expectedClose: "date",
            notes: "text",
            currency: "text",
            createdAt: "date",
            updatedAt: "date",
        };

        // Add custom field types
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        customFieldDefinitions?.forEach((field) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const fieldType = field.fieldType as string;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (fieldType === "number" || fieldType === "text" || fieldType === "date" || fieldType === "boolean") {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                baseTypes[field.fieldKey] = fieldType === "boolean" ? "enum" : fieldType as "text" | "number" | "date" | "enum";
            }
        });

        return baseTypes;
    }, [customFieldDefinitions]);

    const enumOptions: Record<string, string[]> = useMemo(() => {
        const options: Record<string, string[]> = {
            stage: ["lead", "qualified", "proposal", "negotiation", "closed-won", "closed-lost"],
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        customFieldDefinitions?.forEach((field) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (field.fieldType === "boolean") {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                options[field.fieldKey] = ["true", "false"];
            }
        });
        return options;
    }, [customFieldDefinitions]);

    type DealWithContacts = {
        id: string;
        name: string;
        notes: string | null;
        customFields: Record<string, unknown> | null;
        createdAt: Date;
        updatedAt: Date | null;
        createdById: string;
        stage: string;
        value: string | null;
        currency: string | null;
        expectedCloseDate: Date | null;
        dealContacts: Array<{
            id: string;
            dealId: string;
            contactId: string;
            createdAt: Date;
            contact: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                email: string | null;
                phone: string | null;
                company: string | null;
                jobTitle: string | null;
                notes: string | null;
                tags: string[] | null;
                createdById: string;
                createdAt: Date;
                updatedAt: Date | null;
            };
        }>;
    };
    const filteredDeals = useMemo(() => {
        return (data?.deals ?? []) as DealWithContacts[];
    }, [data?.deals]);

    // Sort deals based on column configuration (only one column can be sorted at a time)
    const sortedDeals = useMemo(() => {
        if (!filteredDeals || filteredDeals.length === 0) return [];
        if (sortedColumns.length === 0) return filteredDeals;

        const sortCol = sortedColumns[0]; // Only one column can be sorted at a time
        if (!sortCol) return filteredDeals;

        return [...filteredDeals].sort((a, b) => {
            let comparison = 0;

            switch (sortCol.id) {
                case "name":
                    comparison = a.name.localeCompare(b.name);
                    break;
                case "stage":
                    comparison = a.stage.localeCompare(b.stage);
                    break;
                case "value":
                    const aValue = parseFloat(a.value ?? "0") || 0;
                    const bValue = parseFloat(b.value ?? "0") || 0;
                    comparison = aValue - bValue;
                    break;
                case "contact":
                    const aContact = a.dealContacts?.[0]?.contact;
                    const bContact = b.dealContacts?.[0]?.contact;
                    const aNameStr = aContact ? `${aContact.firstName ?? ""} ${aContact.lastName ?? ""}`.trim() : "";
                    const aContactName = aContact ? (aNameStr || (aContact.email ?? "")) : "";
                    const bNameStr = bContact ? `${bContact.firstName ?? ""} ${bContact.lastName ?? ""}`.trim() : "";
                    const bContactName = bContact ? (bNameStr || (bContact.email ?? "")) : "";
                    comparison = aContactName.localeCompare(bContactName);
                    break;
                case "company":
                    const aCompany = a.dealContacts?.[0]?.contact?.company ?? "";
                    const bCompany = b.dealContacts?.[0]?.contact?.company ?? "";
                    comparison = aCompany.localeCompare(bCompany);
                    break;
                case "expectedClose":
                    const aDate = a.expectedCloseDate ? new Date(a.expectedCloseDate).getTime() : 0;
                    const bDate = b.expectedCloseDate ? new Date(b.expectedCloseDate).getTime() : 0;
                    comparison = aDate - bDate;
                    break;
                case "notes":
                    comparison = (a.notes ?? "").localeCompare(b.notes ?? "");
                    break;
                case "currency":
                    comparison = (a.currency ?? "").localeCompare(b.currency ?? "");
                    break;
                case "createdAt":
                    const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    comparison = aCreated - bCreated;
                    break;
                case "updatedAt":
                    const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                    const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                    comparison = aUpdated - bUpdated;
                    break;
            }

            return sortCol.sortDirection === "asc" ? comparison : -comparison;
        });
    }, [filteredDeals, sortedColumns]);

    const deleteDeal = api.deal.delete.useMutation({
        onSuccess: () => {
            void utils.deal.getAll.invalidate();
        },
    });

    const updateDeal = api.deal.update.useMutation({
        onSuccess: () => {
            setEditingDeal(null);
            void utils.deal.getAll.invalidate();
        },
    });

    const { data: dealToEdit } = api.deal.getById.useQuery(
        { id: editingDeal ?? "" },
        { enabled: !!editingDeal }
    );

    const handleRowClick = (dealId: string) => {
        if (onDealClick) {
            onDealClick(dealId);
        } else {
            router.push(`/deals/${dealId}`);
        }
    };

    const formatCurrency = (value: string | null) => {
        if (!value) return "—";
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return value;
        const currencySymbol = "$"
        return `${currencySymbol}${numValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const renderCell = (deal: DealWithContacts, columnId: string) => {
        switch (columnId) {
            case "name":
                return (
                    <TableCell className="font-medium">
                        {deal.name}
                    </TableCell>
                );
            case "stage":
                return (
                    <TableCell>
                        <Badge className={STAGE_COLORS[deal.stage] ?? ""}>
                            {deal.stage}
                        </Badge>
                    </TableCell>
                );
            case "value":
                return (
                    <TableCell>
                        {formatCurrency(deal.value,)}
                    </TableCell>
                );
            case "contact":
                return (
                    <TableCell>
                        {deal.dealContacts && deal.dealContacts.length > 0 ? (
                            <div className="flex flex-wrap gap-1 items-center">
                                {deal.dealContacts.slice(0, 2).map((dealContact, idx) => {
                                    const contact = dealContact.contact;
                                    const contactName = contact.firstName || contact.lastName
                                        ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim()
                                        : contact.email ?? "Unnamed";
                                    return (
                                        <div key={contact.id} className="flex items-center gap-1">
                                            <Badge variant="outline" className="text-xs font-normal">
                                                {contactName}
                                            </Badge>
                                            {idx < Math.min(deal.dealContacts.length, 2) - 1 && (
                                                <span className="text-muted-foreground text-xs">•</span>
                                            )}
                                        </div>
                                    );
                                })}
                                {deal.dealContacts.length > 2 && (
                                    <>
                                        <span className="text-muted-foreground text-xs">•</span>
                                        <Badge variant="secondary" className="text-xs font-normal">
                                            +{deal.dealContacts.length - 2} more
                                        </Badge>
                                    </>
                                )}
                            </div>
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </TableCell>
                );
            case "company":
                return (
                    <TableCell>
                        {deal.dealContacts && deal.dealContacts.length > 0 ? (
                            <div className="flex flex-wrap gap-1 items-center">
                                {Array.from(
                                    new Set(
                                        deal.dealContacts
                                            .map((dc) => dc.contact.company)
                                            .filter((c): c is string => !!c)
                                    )
                                )
                                    .slice(0, 2)
                                    .map((company, idx, companies) => (
                                        <div key={idx} className="flex items-center gap-1">
                                            <Badge variant="outline" className="text-xs font-normal">
                                                {company}
                                            </Badge>
                                            {idx < companies.length - 1 && (
                                                <span className="text-muted-foreground text-xs">•</span>
                                            )}
                                        </div>
                                    ))}
                                {Array.from(
                                    new Set(
                                        deal.dealContacts
                                            .map((dc) => dc.contact.company)
                                            .filter((c): c is string => !!c)
                                    )
                                ).length > 2 && (
                                        <>
                                            <span className="text-muted-foreground text-xs">•</span>
                                            <Badge variant="secondary" className="text-xs font-normal">
                                                +{Array.from(
                                                    new Set(
                                                        deal.dealContacts
                                                            .map((dc) => dc.contact.company)
                                                            .filter((c): c is string => !!c)
                                                    )
                                                ).length - 2} more
                                            </Badge>
                                        </>
                                    )}
                            </div>
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </TableCell>
                );
            case "expectedClose":
                return (
                    <TableCell>
                        {deal.expectedCloseDate ? (
                            new Date(deal.expectedCloseDate).toLocaleDateString()
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </TableCell>
                );
            case "notes":
                return (
                    <TableCell className="max-w-xs truncate">
                        {deal.notes ? (
                            <span title={deal.notes}>{deal.notes}</span>
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </TableCell>
                );
            case "currency":
                return (
                    <TableCell>
                        {deal.currency ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                );
            case "createdAt":
                return (
                    <TableCell>
                        {deal.createdAt ? (
                            new Date(deal.createdAt).toLocaleDateString()
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </TableCell>
                );
            case "updatedAt":
                return (
                    <TableCell>
                        {deal.updatedAt ? (
                            new Date(deal.updatedAt).toLocaleDateString()
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </TableCell>
                );
            default:
                // Check if this is a custom field
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                const customField = customFieldDefinitions?.find((f) => f.fieldKey === columnId);
                if (customField && deal.customFields) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    const value = deal.customFields[customField.fieldKey];
                    if (value === null || value === undefined) {
                        return <TableCell><span className="text-muted-foreground">—</span></TableCell>;
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    const fieldType = customField.fieldType as unknown as "text" | "number" | "date" | "boolean";
                    switch (fieldType) {
                        case "boolean":
                            return (
                                <TableCell>
                                    {value ? "Yes" : "No"}
                                </TableCell>
                            );
                        case "date":
                            return (
                                <TableCell>
                                    {new Date(value as string).toLocaleDateString()}
                                </TableCell>
                            );
                        case "number":
                            return (
                                <TableCell>
                                    {typeof value === "number" ? value.toLocaleString() : (typeof value === "string" ? value : JSON.stringify(value))}
                                </TableCell>
                            );
                        default:
                            return <TableCell>{typeof value === "string" ? value : JSON.stringify(value)}</TableCell>;
                    }
                }
                return <TableCell>—</TableCell>;
        }
    };

    return (
        <div className="space-y-4">
            {/* Search Bar, Filters, and Column Settings */}
            <div className="space-y-2">
                <div className="flex gap-2">
                    <Input
                        type="text"
                        placeholder="Search deals by name, stage, or contact..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1"
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setColumnSettingsOpen(true)}
                        title="Column Settings"
                    >
                        <Settings2 className="h-4 w-4" />
                    </Button>
                </div>
                <ColumnFilter
                    columns={useMemo(() => {
                        const visibleColumnIds = new Set(visibleColumns.map((col) => col.id));
                        return [
                            ...visibleColumns.map((col) => ({ id: col.id, label: col.label })),
                            // Add custom fields as filterable columns (only if not already in visible columns)
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                            ...(customFieldDefinitions
                                ?.filter((field) => !visibleColumnIds.has(field.fieldKey))
                                .map((field) => ({
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                    id: field.fieldKey,
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                    label: field.label,
                                })) ?? []),
                        ];
                    }, [visibleColumns, customFieldDefinitions])}
                    columnTypes={columnTypes}
                    enumOptions={enumOptions}
                    onFilterChange={setColumnFilters}
                    activeFilters={columnFilters}
                />
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Loading deals...</p>
                </div>
            ) : (
                <div className="rounded-lg border">
                    <div className="overflow-x-auto">
                        {!filteredDeals || filteredDeals.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <p>No deals found.</p>
                                {search && (
                                    <p className="mt-2 text-sm">
                                        Try adjusting your search terms.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Results Header */}
                                <div className="border-b bg-muted/50 px-6 py-3">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {filteredDeals.length} of {data?.total ?? 0} deal(s)
                                        {debouncedSearch && ` matching "${debouncedSearch}"`}
                                    </p>
                                </div>

                                {/* Table */}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {visibleColumns.map((column) => {
                                                const sortCol = sortedColumns.find((sc) => sc.id === column.id);
                                                return (
                                                    <TableHead
                                                        key={column.id}
                                                        className="cursor-pointer select-none"
                                                        onClick={() => {
                                                            if (sortCol?.sortDirection === "asc") {
                                                                setSortDirection(column.id, "desc");
                                                            } else if (sortCol?.sortDirection === "desc") {
                                                                setSortDirection(column.id, null);
                                                            } else {
                                                                setSortDirection(column.id, "asc");
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {column.label}
                                                            {sortCol?.sortDirection === "asc" && (
                                                                <ArrowUp className="h-3 w-3" />
                                                            )}
                                                            {sortCol?.sortDirection === "desc" && (
                                                                <ArrowDown className="h-3 w-3" />
                                                            )}
                                                        </div>
                                                    </TableHead>
                                                );
                                            })}
                                            {showActions && <TableHead className="text-right">Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedDeals.map((deal) => (
                                            <TableRow
                                                key={deal.id}
                                                className="cursor-pointer"
                                                onClick={() => handleRowClick(deal.id)}
                                            >
                                                {visibleColumns.map((column) => (
                                                    <Fragment key={column.id}>
                                                        {renderCell(deal, column.id)}
                                                    </Fragment>
                                                ))}
                                                {showActions && (
                                                    <TableCell
                                                        className="text-right"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="link"
                                                                className="h-auto p-0"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingDeal(deal.id);
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="link"
                                                                className="h-auto p-0 text-destructive hover:text-destructive"
                                                                onClick={() => {
                                                                    if (
                                                                        confirm(
                                                                            "Are you sure you want to delete this deal?",
                                                                        )
                                                                    ) {
                                                                        deleteDeal.mutate({ id: deal.id });
                                                                    }
                                                                }}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            <Dialog open={!!editingDeal} onOpenChange={(open) => !open && setEditingDeal(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Deal</DialogTitle>
                    </DialogHeader>
                    {dealToEdit && (
                        <DealForm
                            initialData={dealToEdit}
                            onSubmit={async (data) => {
                                if (editingDeal) {
                                    await updateDeal.mutateAsync({ id: editingDeal, ...data });
                                }
                            }}
                            onCancel={() => setEditingDeal(null)}
                            isLoading={updateDeal.isPending}
                            mode="edit"
                            submitLabel="Save Changes"
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Column Settings Dialog */}
            <ColumnSettingsDialog
                open={columnSettingsOpen}
                onOpenChange={setColumnSettingsOpen}
                columns={columns}
                onUpdateColumn={updateColumn}
                onToggleVisibility={toggleColumnVisibility}
                onRenameColumn={renameColumn}
                onReorderColumns={reorderColumns}
                onSetSortDirection={setSortDirection}
                onResetToDefaults={resetToDefaults}
                onAddColumn={addColumn}
                onRemoveColumn={(id: string) => {
                    if (!defaultColumnIds.has(id)) {
                        removeColumn(id);
                    }
                }}
                defaultColumnIds={defaultColumnIds}
                entityType="deal"
                onCreateCustomField={async (data) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    await createCustomField.mutateAsync({
                        entityType: "deal",
                        ...data,
                    });
                }}
            />
        </div>
    );
}

