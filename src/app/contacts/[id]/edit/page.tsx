"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { ContactForm } from "../../_components/contact-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditContactPage() {
    const router = useRouter();
    const params = useParams();
    const contactId = params?.id as string;
    const utils = api.useUtils();

    const {
        data: contact,
        isLoading,
        error,
    } = api.contact.getById.useQuery({
        id: contactId,
    });

    const updateContact = api.contact.update.useMutation({
        onSuccess: async () => {
            await utils.contact.getById.invalidate({ id: contactId });
            router.push(`/contacts/${contactId}`);
        },
    });

    const handleUpdate = async (
        data: Parameters<typeof updateContact.mutate>[0],
    ) => {
        updateContact.mutate({
            ...data,
            id: contactId,
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

    if (error || !contact) {
        return (
            <div className="container mx-auto p-8">
                <Alert variant="destructive">
                    <AlertTitle>Contact Not Found</AlertTitle>
                    <AlertDescription>
                        The contact you&apos;re trying to edit doesn&apos;t exist or you
                        don&apos;t have permission to edit it.
                    </AlertDescription>
                    <div className="mt-4">
                        <Button variant="outline" asChild>
                            <Link href="/contacts">← Back to Contacts</Link>
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
                    <Link href={`/contacts/${contactId}`}>← Back to Contacts</Link>
                </Button>
                <h1 className="text-4xl font-bold">Edit Contact</h1>
                <p className="mt-2 text-muted-foreground">
                    Update contact information below. All fields are optional.
                </p>
            </div>

            {/* Edit Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Edit Contact</CardTitle>
                </CardHeader>
                <CardContent>
                    <ContactForm
                        initialData={contact}
                        onSubmit={(data) => handleUpdate({ id: contactId, ...data })}
                        onCancel={() => router.push(`/contacts/${contactId}`)}
                        isLoading={updateContact.isPending}
                        mode="edit"
                        submitLabel="Save Changes"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
