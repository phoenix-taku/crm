"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { api } from "~/trpc/react";

const DEAL_STAGES = [
    "lead",
    "qualified",
    "proposal",
    "negotiation",
    "closed-won",
    "closed-lost",
] as const;

// Validation schema matching the tRPC router
const dealFormSchema = z.object({
    name: z.string().min(1, "Deal name is required"),
    stage: z.enum(DEAL_STAGES).optional(),
    value: z.string().optional(),
    currency: z.string().optional(),
    contactIds: z.array(z.string()).optional(),
    expectedCloseDate: z.string().optional(),
    notes: z.string().optional(),
});

type DealFormData = z.infer<typeof dealFormSchema>;

interface DealFormProps {
    initialData?: {
        id?: string;
        name?: string | null;
        stage?: string | null;
        value?: string | null;
        currency?: string | null;
        dealContacts?: Array<{ contact: { id: string } }>;
        expectedCloseDate?: Date | null;
        notes?: string | null;
    };
    onSubmit: (data: Omit<DealFormData, "expectedCloseDate"> & { expectedCloseDate?: Date | null; contactIds?: string[] }) => Promise<void> | void;
    onCancel?: () => void;
    isLoading?: boolean;
    submitLabel?: string;
    mode?: "create" | "edit";
}

export function DealForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    submitLabel,
    mode = "create",
}: DealFormProps) {
    const { data: contacts } = api.contact.getAll.useQuery({});

    const [formData, setFormData] = useState<DealFormData>({
        name: initialData?.name ?? "",
        stage: (initialData?.stage as typeof DEAL_STAGES[number]) ?? "lead",
        value: initialData?.value ?? "",
        currency: initialData?.currency ?? "USD",
        contactIds: initialData?.dealContacts?.map((dc) => dc.contact.id) ?? [],
        expectedCloseDate: initialData?.expectedCloseDate
            ? new Date(initialData.expectedCloseDate).toISOString().split("T")[0]
            : "",
        notes: initialData?.notes ?? "",
    });

    const [errors, setErrors] = useState<
        Partial<Record<keyof DealFormData, string>>
    >({});

    // Update form data when initialData changes (for edit mode)
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name ?? "",
                stage: (initialData.stage as typeof DEAL_STAGES[number]) ?? "lead",
                value: initialData.value ?? "",
                currency: initialData.currency ?? "USD",
                contactIds: initialData.dealContacts?.map((dc) => dc.contact.id) ?? [],
                expectedCloseDate: initialData.expectedCloseDate
                    ? new Date(initialData.expectedCloseDate).toISOString().split("T")[0]
                    : "",
                notes: initialData.notes ?? "",
            });
        }
    }, [initialData]);

    const validate = (): boolean => {
        try {
            dealFormSchema.parse(formData);
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Partial<Record<keyof DealFormData, string>> = {};
                error.errors.forEach((err) => {
                    const field = err.path[0] as keyof DealFormData;
                    if (field) {
                        fieldErrors[field] = err.message;
                    }
                });
                setErrors(fieldErrors);
            }
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        // Prepare data for submission
        const submitData = {
            name: formData.name,
            stage: formData.stage,
            value: formData.value ?? undefined,
            currency: formData.currency ?? undefined,
            contactIds: formData.contactIds && formData.contactIds.length > 0 ? formData.contactIds : undefined,
            expectedCloseDate: formData.expectedCloseDate
                ? new Date(formData.expectedCloseDate)
                : undefined,
            notes: formData.notes ?? undefined,
        };

        await onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Deal Name */}
                <div className="sm:col-span-2">
                    <Label htmlFor="name">
                        Deal Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (errors.name) {
                                setErrors({ ...errors, name: undefined });
                            }
                        }}
                        className={errors.name ? "border-destructive" : ""}
                        aria-invalid={!!errors.name}
                        placeholder="Enter deal name"
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-destructive">{errors.name}</p>
                    )}
                </div>

                {/* Stage */}
                <div>
                    <Label htmlFor="stage">Stage</Label>
                    <Select
                        value={formData.stage}
                        onValueChange={(value) => {
                            setFormData({
                                ...formData,
                                stage: value as typeof DEAL_STAGES[number],
                            });
                        }}
                    >
                        <SelectTrigger id="stage">
                            <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                            {DEAL_STAGES.map((stage) => (
                                <SelectItem key={stage} value={stage}>
                                    {stage.charAt(0).toUpperCase() + stage.slice(1).replace("-", " ")}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Contacts */}
                <div className="sm:col-span-2">
                    <Label>Contacts</Label>
                    <div className="mt-2 max-h-60 overflow-y-auto rounded-md border p-3">
                        {contacts?.contacts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No contacts available</p>
                        ) : (
                            <div className="space-y-2">
                                {contacts?.contacts.map((contact) => {
                                    const isSelected = formData.contactIds?.includes(contact.id) ?? false;
                                    return (
                                        <label
                                            key={contact.id}
                                            className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    const currentIds = formData.contactIds ?? [];
                                                    if (e.target.checked) {
                                                        setFormData({
                                                            ...formData,
                                                            contactIds: [...currentIds, contact.id],
                                                        });
                                                    } else {
                                                        setFormData({
                                                            ...formData,
                                                            contactIds: currentIds.filter((id) => id !== contact.id),
                                                        });
                                                    }
                                                }}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm">
                                                {contact.firstName || contact.lastName
                                                    ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim()
                                                    : contact.email ?? "Unnamed Contact"}
                                                {contact.company && (
                                                    <span className="text-muted-foreground"> - {contact.company}</span>
                                                )}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    {formData.contactIds && formData.contactIds.length > 0 && (
                        <p className="mt-2 text-sm text-muted-foreground">
                            {formData.contactIds.length} contact(s) selected
                        </p>
                    )}
                </div>

                {/* Value */}
                <div>
                    <Label htmlFor="value">Deal Value</Label>
                    <Input
                        type="text"
                        id="value"
                        value={formData.value}
                        onChange={(e) => {
                            setFormData({ ...formData, value: e.target.value });
                        }}
                        placeholder="0.00"
                    />
                </div>

                {/* Currency */}
                <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                        value={formData.currency ?? "USD"}
                        onValueChange={(value) => {
                            setFormData({ ...formData, currency: value });
                        }}
                    >
                        <SelectTrigger id="currency">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="JPY">JPY (¥)</SelectItem>
                            <SelectItem value="CAD">CAD (C$)</SelectItem>
                            <SelectItem value="AUD">AUD (A$)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Expected Close Date */}
                <div>
                    <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                    <Input
                        type="date"
                        id="expectedCloseDate"
                        value={formData.expectedCloseDate}
                        onChange={(e) => {
                            setFormData({ ...formData, expectedCloseDate: e.target.value });
                        }}
                    />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                        id="notes"
                        rows={4}
                        value={formData.notes}
                        onChange={(e) => {
                            setFormData({ ...formData, notes: e.target.value });
                        }}
                        placeholder="Add any additional notes about this deal..."
                    />
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 border-t pt-4">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                    {isLoading
                        ? mode === "edit"
                            ? "Updating..."
                            : "Creating..."
                        : (submitLabel ??
                            (mode === "edit" ? "Update Deal" : "Create Deal"))}
                </Button>
            </div>
        </form>
    );
}

