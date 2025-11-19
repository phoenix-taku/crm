"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { ContactList } from "./_components/contact-list";
import { ContactForm } from "./_components/contact-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactsPage() {
    const [showForm, setShowForm] = useState(false);

    const createContact = api.contact.create.useMutation({
        onSuccess: () => {
            setShowForm(false);
        },
    });

    const handleCreate = async (
        data: Parameters<typeof createContact.mutate>[0],
    ) => {
        createContact.mutate(data);
    };

    return (
        <div className="container mx-auto p-8">
            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-4xl font-bold">Contacts</h1>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    variant={showForm ? "outline" : "default"}
                >
                    {showForm ? "Cancel" : "+ Add Contact"}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Create New Contact</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ContactForm
                            onSubmit={handleCreate}
                            onCancel={() => setShowForm(false)}
                            isLoading={createContact.isPending}
                            mode="create"
                        />
                    </CardContent>
                </Card>
            )}

            <ContactList />
        </div>
    );
}
