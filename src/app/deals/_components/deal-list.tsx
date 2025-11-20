"use client";

import { useState, useEffect } from "react";
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
    const [editingDeal, setEditingDeal] = useState<string | null>(null);
    const utils = api.useUtils();
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading } = api.deal.getAll.useQuery({
        limit: limit,
    });

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

    const filteredDeals = data?.deals.filter((deal) => {
        if (!debouncedSearch) return true;
        const searchLower = debouncedSearch.toLowerCase();
        return (
            deal.name.toLowerCase().includes(searchLower) ||
            deal.stage.toLowerCase().includes(searchLower) ||
            (deal.dealContacts?.some((dc) =>
                dc.contact.firstName?.toLowerCase().includes(searchLower) ??
                dc.contact.lastName?.toLowerCase().includes(searchLower) ??
                dc.contact.company?.toLowerCase().includes(searchLower) ??
                dc.contact.email?.toLowerCase().includes(searchLower)
            ) ?? false)
        );
    }) ?? [];

    const formatCurrency = (value: string | null, currency: string | null) => {
        if (!value) return "—";
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return value;
        const currencySymbol = currency === "USD" ? "$" : currency ?? "$";
        return `${currencySymbol}${numValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div>
                <Input
                    type="text"
                    placeholder="Search deals by name, stage, or contact..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full"
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
                                        {search && ` matching "${search}"`}
                                    </p>
                                </div>

                                {/* Table */}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Deal Name</TableHead>
                                            <TableHead>Stage</TableHead>
                                            <TableHead>Value</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Company</TableHead>
                                            <TableHead>Expected Close</TableHead>
                                            {showActions && <TableHead className="text-right">Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredDeals.map((deal) => (
                                            <TableRow
                                                key={deal.id}
                                                className="cursor-pointer"
                                                onClick={() => handleRowClick(deal.id)}
                                            >
                                                <TableCell className="font-medium">
                                                    {deal.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={STAGE_COLORS[deal.stage] ?? ""}
                                                    >
                                                        {deal.stage}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(deal.value, deal.currency)}
                                                </TableCell>
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
                                                <TableCell>
                                                    {deal.expectedCloseDate ? (
                                                        new Date(deal.expectedCloseDate).toLocaleDateString()
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
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
        </div>
    );
}

