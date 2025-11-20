"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EditDialog } from "@/components/edit-dialog";
import { DealForm } from "./deal-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DealDetailProps {
    dealId: string;
}

const STAGE_COLORS: Record<string, string> = {
    lead: "bg-blue-100 text-blue-800",
    qualified: "bg-purple-100 text-purple-800",
    proposal: "bg-yellow-100 text-yellow-800",
    negotiation: "bg-orange-100 text-orange-800",
    "closed-won": "bg-green-100 text-green-800",
    "closed-lost": "bg-red-100 text-red-800",
};

export function DealDetail({ dealId }: DealDetailProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get("from");
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const utils = api.useUtils();

    const { data: deal, isLoading, error } = api.deal.getById.useQuery({
        id: dealId,
    });

    // Determine back navigation based on referrer
    const backUrl = from === "pipeline" ? "/pipeline" : "/deals";

    const deleteDeal = api.deal.delete.useMutation({
        onSuccess: () => {
            router.push(backUrl);
        },
    });

    const updateDeal = api.deal.update.useMutation({
        onSuccess: async () => {
            setIsEditing(false);
            await utils.deal.getById.invalidate({ id: dealId });
        },
    });

    const handleDelete = () => {
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        deleteDeal.mutate({ id: dealId });
        setShowDeleteDialog(false);
    };

    const formatCurrency = (value: string | null) => {
        if (!value) return "Not provided";
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return value;
        const currencySymbol = "$";
        return `${currencySymbol}${numValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-8">
                <div className="space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i}>
                                        <Skeleton className="h-4 w-24 mb-2" />
                                        <Skeleton className="h-5 w-full" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (error || !deal) {
        return (
            <div className="container mx-auto p-8">
                <Alert variant="destructive">
                    <AlertTitle>Deal Not Found</AlertTitle>
                    <AlertDescription>
                        The deal you&apos;re looking for doesn&apos;t exist or you don&apos;t have
                        permission to view it.
                    </AlertDescription>
                    <div className="mt-4">
                        <Button variant="outline" asChild>
                            <Link href={from === "pipeline" ? "/pipeline" : "/deals"}>
                                ← Back to {from === "pipeline" ? "Pipeline" : "Deals"}
                            </Link>
                        </Button>
                    </div>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Button variant="ghost" asChild className="mb-2">
                        <Link href={backUrl}>
                            ← Back to {from === "pipeline" ? "Pipeline" : "Deals"}
                        </Link>
                    </Button>
                    <h1 className="text-4xl font-bold">{deal.name}</h1>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsEditing(true)}>
                        Edit
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteDeal.isPending}
                    >
                        {deleteDeal.isPending ? "Deleting..." : "Delete"}
                    </Button>
                </div>
            </div>

            {/* Deal Information and Contacts - Side by Side */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Deal Information Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Deal Information</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3">
                        <dl className="grid grid-cols-1 gap-3">
                            <div>
                                <dt className="text-xs font-medium text-muted-foreground mb-0.5">Deal Name</dt>
                                <dd className="text-sm text-foreground">{deal.name}</dd>
                            </div>

                            <div>
                                <dt className="text-xs font-medium text-muted-foreground mb-0.5">Stage</dt>
                                <dd>
                                    <Badge
                                        variant="secondary"
                                        className={`${STAGE_COLORS[deal.stage] ?? ""} text-xs`}
                                    >
                                        {deal.stage.replace("-", " ")}
                                    </Badge>
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs font-medium text-muted-foreground mb-0.5">Deal Value</dt>
                                <dd className="text-sm text-foreground">
                                    {formatCurrency(deal.value)}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs font-medium text-muted-foreground mb-0.5">Currency</dt>
                                <dd className="text-sm text-foreground">
                                    {deal.currency ?? (
                                        <span className="text-muted-foreground">Not provided</span>
                                    )}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs font-medium text-muted-foreground mb-0.5">Close Date</dt>
                                <dd className="text-sm text-foreground">
                                    {deal.expectedCloseDate ? (
                                        new Date(deal.expectedCloseDate).toLocaleDateString()
                                    ) : (
                                        <span className="text-muted-foreground">Not provided</span>
                                    )}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs font-medium text-muted-foreground mb-0.5">Notes</dt>
                                <dd className="text-sm text-foreground">
                                    {deal.notes ? (
                                        <div className="whitespace-pre-wrap rounded-md bg-muted p-2 text-sm text-foreground max-h-32 overflow-y-auto">
                                            {deal.notes}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">No notes</span>
                                    )}
                                </dd>
                            </div>

                            {/* Created and Updated Date - Side by side */}
                            <div className="grid grid-cols-2 gap-3 pt-1 border-t">
                                <div>
                                    <dt className="text-xs font-medium text-muted-foreground mb-0.5">Created</dt>
                                    <dd className="text-xs text-foreground">
                                        {new Date(deal.createdAt).toLocaleDateString()}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-xs font-medium text-muted-foreground mb-0.5">Updated</dt>
                                    <dd className="text-xs text-foreground">
                                        {deal.updatedAt
                                            ? new Date(deal.updatedAt).toLocaleDateString()
                                            : <span className="text-muted-foreground">—</span>}
                                    </dd>
                                </div>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {/* Associated Contacts Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Associated Contacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {deal.dealContacts && deal.dealContacts.length > 0 ? (
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="h-8 text-xs">Name</TableHead>
                                            <TableHead className="h-8 text-xs">Email</TableHead>
                                            <TableHead className="h-8 text-xs">Company</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {deal.dealContacts.map((dealContact) => {
                                            const contact = dealContact.contact;
                                            return (
                                                <TableRow
                                                    key={contact.id}
                                                    className="cursor-pointer hover:bg-muted/50 h-10"
                                                    onClick={() => router.push(`/contacts/${contact.id}`)}
                                                >
                                                    <TableCell className="font-medium text-sm py-2">
                                                        {contact.firstName || contact.lastName
                                                            ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim()
                                                            : contact.email ?? (
                                                                <span className="text-muted-foreground italic">Unnamed</span>
                                                            )}
                                                    </TableCell>
                                                    <TableCell className="text-xs py-2">
                                                        {contact.email ? (
                                                            <a
                                                                href={`mailto:${contact.email}`}
                                                                className="text-primary hover:underline"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {contact.email}
                                                            </a>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs py-2">
                                                        {contact.company ?? (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                <p>No contacts associated with this deal.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit Modal */}
            <EditDialog
                open={isEditing}
                onOpenChange={setIsEditing}
                title="Edit Deal"
            >
                <DealForm
                    initialData={deal}
                    onSubmit={async (data) => {
                        await updateDeal.mutateAsync({ id: dealId, ...data });
                    }}
                    onCancel={() => setIsEditing(false)}
                    isLoading={updateDeal.isPending}
                    mode="edit"
                    submitLabel="Save Changes"
                />
            </EditDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deal?.name ?? ""}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

