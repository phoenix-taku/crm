"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    notes: "",
    tags: [] as string[],
  });

  const { data, refetch, isLoading } = api.contact.getAll.useQuery({
    search: search || undefined,
  });

  const createContact = api.contact.create.useMutation({
    onSuccess: () => {
      void refetch();
      setShowForm(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        jobTitle: "",
        notes: "",
        tags: [],
      });
    },
  });

  const deleteContact = api.contact.delete.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createContact.mutate({
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      company: formData.company || undefined,
      jobTitle: formData.jobTitle || undefined,
      notes: formData.notes || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
    });
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">Contacts</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ Add Contact"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-lg border border-gray-300 bg-white p-6 shadow"
        >
          <h2 className="mb-4 text-2xl font-semibold">Create New Contact</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Job Title
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) =>
                  setFormData({ ...formData, jobTitle: e.target.value })
                }
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={createContact.isPending}
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {createContact.isPending ? "Creating..." : "Create Contact"}
            </button>
          </div>
        </form>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border border-gray-300 px-4 py-2"
        />
      </div>

      {isLoading ? (
        <p>Loading contacts...</p>
      ) : (
        <div className="space-y-4">
          {data?.contacts.length === 0 ? (
            <p className="text-gray-500">No contacts found.</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Total: {data?.total ?? 0} contact(s)
              </p>
              {data?.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="rounded-lg border border-gray-300 bg-white p-6 shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">
                        {contact.firstName || ""} {contact.lastName || ""}
                        {!contact.firstName && !contact.lastName && (
                          <span className="text-gray-400">(No name)</span>
                        )}
                      </h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {contact.email && (
                          <p>
                            <strong>Email:</strong> {contact.email}
                          </p>
                        )}
                        {contact.phone && (
                          <p>
                            <strong>Phone:</strong> {contact.phone}
                          </p>
                        )}
                        {contact.company && (
                          <p>
                            <strong>Company:</strong> {contact.company}
                          </p>
                        )}
                        {contact.jobTitle && (
                          <p>
                            <strong>Job Title:</strong> {contact.jobTitle}
                          </p>
                        )}
                        {contact.notes && (
                          <p>
                            <strong>Notes:</strong> {contact.notes}
                          </p>
                        )}
                        {contact.tags && contact.tags.length > 0 && (
                          <p>
                            <strong>Tags:</strong> {contact.tags.join(", ")}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          Created: {new Date(contact.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to delete this contact?",
                          )
                        ) {
                          deleteContact.mutate({ id: contact.id });
                        }
                      }}
                      className="ml-4 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

