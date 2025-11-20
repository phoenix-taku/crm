"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const DEAL_STAGES = [
    "lead",
    "qualified",
    "proposal",
    "negotiation",
    "closed-won",
    "closed-lost",
] as const;

const STAGE_LABELS: Record<(typeof DEAL_STAGES)[number], string> = {
    lead: "Lead",
    qualified: "Qualified",
    proposal: "Proposal",
    negotiation: "Negotiation",
    "closed-won": "Closed Won",
    "closed-lost": "Closed Lost",
};

interface DealFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    dealId?: string;
}

export function DealForm({ onSuccess, onCancel }: DealFormProps) {
    const utils = api.useUtils();
    const [name, setName] = useState("");
    const [stage, setStage] = useState<(typeof DEAL_STAGES)[number]>("lead");
    const [value, setValue] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [contactId, setContactId] = useState<string>("");
    const [notes, setNotes] = useState("");

    const { data: contacts } = api.contact.getAll.useQuery({ limit: 100 });

    const createDeal = api.deal.create.useMutation({
        onSuccess: () => {
            void utils.deal.getAll.invalidate();
            void utils.deal.getAllForPipeline.invalidate();
            onSuccess?.();
            setName("");
            setValue("");
            setNotes("");
            setContactId("");
            setStage("lead");
            setCurrency("USD");
        },
        onError: (error) => {
            console.error("Error creating deal:", error);
            alert(`Failed to create deal: ${error.message}`);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            alert("Deal name is required");
            return;
        }

        createDeal.mutate({
            name: name.trim(),
            stage,
            value: value?.trim() || undefined,
            currency,
            contactIds: contactId?.trim() ? [contactId.trim()] : undefined,
            notes: notes?.trim() || undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">Deal Name *</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g., Q4 Enterprise Contract"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="stage">Stage</Label>
                    <Select value={stage} onValueChange={(v) => setStage(v as typeof stage)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DEAL_STAGES.map((s) => (
                                <SelectItem key={s} value={s}>
                                    {STAGE_LABELS[s]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="value">Deal Value</Label>
                    <Input
                        id="value"
                        type="number"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="0"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div>
                <Label htmlFor="contact">Contact (Optional)</Label>
                <Select
                    value={contactId || undefined}
                    onValueChange={(value) => setContactId(value || "")}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                        {contacts?.contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                                {contact.firstName || contact.lastName
                                    ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim()
                                    : contact.email ?? "Unknown"}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {contactId && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setContactId("")}
                    >
                        Clear selection
                    </Button>
                )}
            </div>

            <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional information about this deal..."
                    rows={3}
                />
            </div>

            <div className="flex justify-end gap-2">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={createDeal.isPending}>
                    {createDeal.isPending ? "Creating..." : "Create Deal"}
                </Button>
            </div>
        </form>
    );
}

