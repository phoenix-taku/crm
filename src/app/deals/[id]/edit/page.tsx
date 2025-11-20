"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { DealForm } from "../../_components/deal-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditDealPage() {
    const router = useRouter();
    const params = useParams();
    const dealId = params?.id as string;
    const utils = api.useUtils();

    const {
        data: deal,
        isLoading,
        error,
    } = api.deal.getById.useQuery({
        id: dealId,
    });

    const updateDeal = api.deal.update.useMutation({
        onSuccess: async () => {
            await utils.deal.getById.invalidate({ id: dealId });
            router.push(`/deals/${dealId}`);
        },
    });

    const handleUpdate = async (
        data: Parameters<typeof updateDeal.mutate>[0],
    ) => {
        updateDeal.mutate({
            ...data,
            id: dealId,
        });
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-8">
                <div className="space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i}>
                                        <Skeleton className="h-4 w-24 mb-2" />
                                        <Skeleton className="h-9 w-full" />
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
                        The deal you&apos;re trying to edit doesn&apos;t exist or you
                        don&apos;t have permission to edit it.
                    </AlertDescription>
                    <div className="mt-4">
                        <Button variant="outline" asChild>
                            <Link href="/deals">← Back to Deals</Link>
                        </Button>
                    </div>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8">
            {/* Header */}
            <div className="mb-6">
                <Button variant="ghost" asChild className="mb-2">
                    <Link href={`/deals/${dealId}`}>← Back to Deals</Link>
                </Button>
                <h1 className="text-4xl font-bold">Edit Deal</h1>
                <p className="mt-2 text-muted-foreground">
                    Update deal information below. Deal name is required.
                </p>
            </div>

            {/* Edit Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Edit Deal</CardTitle>
                </CardHeader>
                <CardContent>
                    <DealForm
                        initialData={deal}
                        onSubmit={(data) => handleUpdate({ id: dealId, ...data })}
                        onCancel={() => router.push(`/deals/${dealId}`)}
                        isLoading={updateDeal.isPending}
                        mode="edit"
                        submitLabel="Save Changes"
                    />
                </CardContent>
            </Card>
        </div>
    );
}

