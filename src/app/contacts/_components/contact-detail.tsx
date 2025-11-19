"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface ContactDetailProps {
    contactId: string;
}

export function ContactDetail({ contactId }: ContactDetailProps) {
    const router = useRouter();

    const { data: contact, isLoading, error } = api.contact.getById.useQuery({
        id: contactId,
    });

    const deleteContact = api.contact.delete.useMutation({
        onSuccess: () => {
            router.push("/dashboard");
        },
    });

    const handleDelete = () => {
        if (
            confirm(
                `Are you sure you want to delete ${contact?.firstName ?? ""} ${contact?.lastName ?? ""}? This action cannot be undone.`,
            )
        ) {
            deleteContact.mutate({ id: contactId });
        }
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

    if (error || !contact) {
        return (
            <div className="container mx-auto p-8">
                <Alert variant="destructive">
                    <AlertTitle>Contact Not Found</AlertTitle>
                    <AlertDescription>
                        The contact you&apos;re looking for doesn&apos;t exist or you don&apos;t have
                        permission to view it.
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
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Button variant="ghost" asChild className="mb-2">
                        <Link href="/contacts">← Back to Contacts</Link>
                    </Button>
                    <h1 className="text-4xl font-bold">
                        {contact.firstName || contact.lastName
                            ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim()
                            : "Contact Details"}
                    </h1>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href={`/contacts/${contact.id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteContact.isPending}
                    >
                        {deleteContact.isPending ? "Deleting..." : "Delete"}
                    </Button>
                </div>
            </div>

            {/* Contact Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                </CardHeader>

                <CardContent>
                    <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* Name */}
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {contact.firstName || contact.lastName
                                    ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim()
                                    : (
                                        <span className="text-muted-foreground italic">Not provided</span>
                                    )}
                            </dd>
                        </div>

                        {/* Email */}
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {contact.email ? (
                                    <a
                                        href={`mailto:${contact.email}`}
                                        className="text-primary hover:underline"
                                    >
                                        {contact.email}
                                    </a>
                                ) : (
                                    <span className="text-muted-foreground">Not provided</span>
                                )}
                            </dd>
                        </div>

                        {/* Phone */}
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Phone</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {contact.phone ? (
                                    <a
                                        href={`tel:${contact.phone}`}
                                        className="text-primary hover:underline"
                                    >
                                        {contact.phone}
                                    </a>
                                ) : (
                                    <span className="text-muted-foreground">Not provided</span>
                                )}
                            </dd>
                        </div>

                        {/* Company */}
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Company</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {contact.company ?? (
                                    <span className="text-muted-foreground">Not provided</span>
                                )}
                            </dd>
                        </div>

                        {/* Job Title */}
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Job Title</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {contact.jobTitle ?? (
                                    <span className="text-muted-foreground">Not provided</span>
                                )}
                            </dd>
                        </div>

                        {/* Tags */}
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Tags</dt>
                            <dd className="mt-1">
                                {contact.tags && contact.tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {contact.tags.map((tag, idx) => (
                                            <Badge key={idx} variant="secondary">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">No tags</span>
                                )}
                            </dd>
                        </div>

                        {/* Notes */}
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Notes</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {contact.notes ? (
                                    <div className="whitespace-pre-wrap rounded-md bg-muted p-3">
                                        {contact.notes}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">No notes</span>
                                )}
                            </dd>
                        </div>

                        {/* Created Date */}
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Created</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {new Date(contact.createdAt).toLocaleString()}
                            </dd>
                        </div>

                        {/* Updated Date */}
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {contact.updatedAt
                                    ? new Date(contact.updatedAt).toLocaleString()
                                    : <span className="text-muted-foreground">Not available</span>}
                            </dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>
        </div>
    );
}

