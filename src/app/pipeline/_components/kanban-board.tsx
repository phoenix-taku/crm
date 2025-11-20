"use client";

import { useState, useMemo } from "react";
import {
    DndContext,
    type DragEndEvent,
    DragOverlay,
    type DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";

import { api } from "~/trpc/react";
import { KanbanColumn } from "./kanban-column";
import { DealCard } from "./deal-card";


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

export function KanbanBoard() {
    const [activeId, setActiveId] = useState<string | null>(null);
    const utils = api.useUtils();
    const queryClient = useQueryClient();

    // Reduced activation distance for snappier feel
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3, // Reduced from 8px for faster activation
            },
        }),
    );

    // Fetch all deals grouped by stage (using pipeline-specific endpoint)
    const { data, isLoading, error } = api.deal.getAllForPipeline.useQuery();

    const updateStage = api.deal.updateStage.useMutation({
        onMutate: async ({ id, stage }) => {
            // Cancel outgoing refetches
            await utils.deal.getAllForPipeline.cancel();
            await utils.deal.getAll.cancel();

            // Snapshot previous values - we need to snapshot all deal-related queries
            const previousPipelineDeals = utils.deal.getAllForPipeline.getData();

            // Get all cached queries and snapshot them
            const queryCache = queryClient.getQueryCache();
            const previousQueries = new Map<string, unknown>();

            queryCache.getAll().forEach((query) => {
                const queryKey = query.queryKey;
                const keyStr = JSON.stringify(queryKey);

                // Snapshot deal.getAll queries
                if (
                    Array.isArray(queryKey) &&
                    queryKey.length > 0 &&
                    Array.isArray(queryKey[0]) &&
                    queryKey[0]?.[0] === "deal" &&
                    queryKey[0]?.[1] === "getAll" &&
                    query.state.data
                ) {
                    previousQueries.set(keyStr, query.state.data);
                }

                // Snapshot deal.getById queries for this specific deal
                if (
                    Array.isArray(queryKey) &&
                    queryKey.length > 0 &&
                    Array.isArray(queryKey[0]) &&
                    queryKey[0]?.[0] === "deal" &&
                    queryKey[0]?.[1] === "getById" &&
                    query.state.data
                ) {
                    const dealData = query.state.data as { id: string };
                    if (dealData.id === id) {
                        previousQueries.set(keyStr, query.state.data);
                    }
                }

                // Snapshot contact.getDeals queries (they contain arrays of deals)
                if (
                    Array.isArray(queryKey) &&
                    queryKey.length > 0 &&
                    Array.isArray(queryKey[0]) &&
                    queryKey[0]?.[0] === "contact" &&
                    queryKey[0]?.[1] === "getDeals" &&
                    query.state.data
                ) {
                    const dealsData = query.state.data as Array<{ id: string }>;
                    if (dealsData.some((deal) => deal.id === id)) {
                        previousQueries.set(keyStr, query.state.data);
                    }
                }
            });

            // Optimistically update getAllForPipeline
            if (previousPipelineDeals) {
                const updatedDeals = previousPipelineDeals.deals.map((deal) =>
                    deal.id === id ? { ...deal, stage } : deal,
                );
                utils.deal.getAllForPipeline.setData(undefined, {
                    deals: updatedDeals,
                    total: updatedDeals.length,
                });
            }

            // Optimistically update all deal-related queries
            queryCache.getAll().forEach((query) => {
                const queryKey = query.queryKey;

                // Update deal.getAll queries
                if (
                    Array.isArray(queryKey) &&
                    queryKey.length > 0 &&
                    Array.isArray(queryKey[0]) &&
                    queryKey[0]?.[0] === "deal" &&
                    queryKey[0]?.[1] === "getAll" &&
                    query.state.data
                ) {
                    const oldData = query.state.data as { deals: Array<{ id: string; stage: string }>; total: number };
                    const updatedDeals = oldData.deals.map((deal) =>
                        deal.id === id ? { ...deal, stage } : deal,
                    );
                    queryClient.setQueryData(queryKey, {
                        deals: updatedDeals,
                        total: oldData.total,
                    });
                }

                // Update deal.getById queries for this specific deal
                if (
                    Array.isArray(queryKey) &&
                    queryKey.length > 0 &&
                    Array.isArray(queryKey[0]) &&
                    queryKey[0]?.[0] === "deal" &&
                    queryKey[0]?.[1] === "getById" &&
                    query.state.data
                ) {
                    const dealData = query.state.data as { id: string; stage: string };
                    if (dealData.id === id) {
                        queryClient.setQueryData(queryKey, {
                            ...dealData,
                            stage,
                        });
                    }
                }

                // Update contact.getDeals queries
                if (
                    Array.isArray(queryKey) &&
                    queryKey.length > 0 &&
                    Array.isArray(queryKey[0]) &&
                    queryKey[0]?.[0] === "contact" &&
                    queryKey[0]?.[1] === "getDeals" &&
                    query.state.data
                ) {
                    const dealsData = query.state.data as Array<{ id: string; stage: string }>;
                    const updatedDeals = dealsData.map((deal) =>
                        deal.id === id ? { ...deal, stage } : deal,
                    );
                    queryClient.setQueryData(queryKey, updatedDeals);
                }
            });

            return { previousPipelineDeals, previousQueries };
        },
        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousPipelineDeals) {
                utils.deal.getAllForPipeline.setData(undefined, context.previousPipelineDeals);
            }
            if (context?.previousQueries) {
                const queryCache = queryClient.getQueryCache();
                queryCache.getAll().forEach((query) => {
                    const queryKey = query.queryKey;
                    const keyStr = JSON.stringify(queryKey);
                    const previousData = context.previousQueries.get(keyStr);
                    if (previousData) {
                        queryClient.setQueryData(queryKey, previousData);
                    }
                });
            }
        },
        onSuccess: () => {
            void utils.deal.getAll.invalidate();
            void utils.deal.getAllForPipeline.invalidate();

            // Invalidate all getById and getDeals queries using query client
            const queryCache = queryClient.getQueryCache();
            queryCache.getAll().forEach((query) => {
                const queryKey = query.queryKey;
                if (
                    Array.isArray(queryKey) &&
                    queryKey.length > 0 &&
                    Array.isArray(queryKey[0])
                ) {
                    const [procedure, method] = queryKey[0] as [string, string];
                    if (
                        (procedure === "deal" && method === "getById") ||
                        (procedure === "contact" && method === "getDeals")
                    ) {
                        void queryClient.invalidateQueries({ queryKey });
                    }
                }
            });
        },
    });

    // Use optimistic data if available, otherwise use server data
    const deals = useMemo(() => {
        return data?.deals ?? [];
    }, [data?.deals]);

    const dealsByStage = useMemo(
        () =>
            DEAL_STAGES.reduce(
                (acc, stage) => {
                    acc[stage] = deals.filter((deal) => deal.stage === stage);
                    return acc;
                },
                {} as Record<(typeof DEAL_STAGES)[number], typeof deals>,
            ),
        [deals],
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const dealId = active.id as string;
        const newStage = over.id as string;

        // Find the deal to check its current stage
        const deal = deals.find((d) => d.id === dealId);
        if (!deal || deal.stage === newStage) return;

        // Optimistically update immediately (mutation will handle rollback on error)
        updateStage.mutate({
            id: dealId,
            stage: newStage as (typeof DEAL_STAGES)[number],
        });
    };

    const activeDeal = activeId
        ? deals.find((deal) => deal.id === activeId)
        : null;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading pipeline...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-destructive">Error loading pipeline: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex h-full gap-4 overflow-x-auto p-4">
                    {DEAL_STAGES.map((stage) => {
                        const stageDeals = dealsByStage[stage] ?? [];
                        return (
                            <KanbanColumn
                                key={stage}
                                id={stage}
                                title={STAGE_LABELS[stage]}
                                deals={stageDeals}
                                dealCount={stageDeals.length}
                            />
                        );
                    })}
                </div>
                <DragOverlay
                    dropAnimation={{
                        duration: 200,
                        easing: "cubic-bezier(0.18, 0.67, 0.6, 1)",
                    }}
                >
                    {activeDeal ? (
                        <div className="rotate-3 opacity-90 shadow-xl">
                            <DealCard deal={activeDeal} isDragging />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

