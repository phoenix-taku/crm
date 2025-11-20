"use client";

import { KanbanBoard } from "./_components/kanban-board";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { DealForm } from "../deals/_components/deal-form";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { api } from "~/trpc/react";

export default function PipelinePage() {
    const [showForm, setShowForm] = useState(false);
    const utils = api.useUtils();

    const createDeal = api.deal.create.useMutation({
        onSuccess: () => {
            setShowForm(false);
            void utils.deal.getAllForPipeline.invalidate();
        },
    });

    const handleCreate = async (
        data: Omit<{ name: string; notes?: string; stage?: "lead" | "qualified" | "proposal" | "negotiation" | "closed-won" | "closed-lost"; value?: string; currency?: string; expectedCloseDate?: string; contactIds?: string[] }, "expectedCloseDate"> & { expectedCloseDate?: Date | null; contactIds?: string[] },
    ) => {
        await createDeal.mutateAsync({
            name: data.name,
            stage: data.stage,
            value: data.value,
            currency: data.currency,
            contactIds: data.contactIds,
            expectedCloseDate: data.expectedCloseDate ?? undefined,
            notes: data.notes,
        });
    };

    return (
        <div className="container mx-auto h-[calc(100vh-8rem)] flex flex-col p-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold">Sales Pipeline</h1>
                    <p className="mt-2 text-muted-foreground">
                        Manage your deals and track them through the sales process
                    </p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Deal
                </Button>
            </div>

            <div className="flex-1 overflow-hidden">
                <KanbanBoard />
            </div>

            {/* Create Modal */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Deal</DialogTitle>
                    </DialogHeader>
                    <DealForm
                        onSubmit={handleCreate}
                        onCancel={() => setShowForm(false)}
                        isLoading={createDeal.isPending}
                        mode="create"
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

