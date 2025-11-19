"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";

interface ContactListProps {
  onContactClick?: (contactId: string) => void;
  showActions?: boolean;
  limit?: number;
}

export function ContactList({
  onContactClick,
  showActions = true,
  limit,
}: ContactListProps) {
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = api.contact.getAll.useQuery({
    search: search || undefined,
    limit: limit,
  });

  const deleteContact = api.contact.delete.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const handleRowClick = (contactId: string) => {
    if (onContactClick) {
      onContactClick(contactId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div>
        <input
          type="text"
          placeholder="Search contacts by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading contacts...</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-300 bg-white shadow">
          <div className="overflow-x-auto">
            {data?.contacts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No contacts found.</p>
                {search && (
                  <p className="mt-2 text-sm">
                    Try adjusting your search terms.
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Results Header */}
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                  <p className="text-sm text-gray-600">
                    Showing {data?.contacts.length ?? 0} of {data?.total ?? 0}{" "}
                    contact(s)
                    {search && ` matching "${search}"`}
                  </p>
                </div>

                {/* Table */}
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Job Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Tags
                      </th>
                      {showActions && (
                        <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {data?.contacts.map((contact) => (
                      <tr
                        key={contact.id}
                        className={`transition-colors ${
                          onContactClick
                            ? "cursor-pointer hover:bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleRowClick(contact.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {contact.firstName || contact.lastName ? (
                              `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim()
                            ) : (
                              <span className="text-gray-400 italic">
                                (No name)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {contact.email ?? (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {contact.phone ?? (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {contact.company ?? (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {contact.jobTitle ?? (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {contact.tags && contact.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {contact.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        {showActions && (
                          <td
                            className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/contacts/${contact.id}`}
                                className="text-blue-600 hover:text-blue-900"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View
                              </Link>
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
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

