"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const utils = api.useUtils();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300); 

    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = api.contact.getAll.useQuery({
    search: debouncedSearch || undefined,
    limit: limit,
  });

  const deleteContact = api.contact.delete.useMutation({
    onSuccess: () => {
      void utils.contact.getAll.invalidate();
    },
  });

  const handleRowClick = (contactId: string) => {
    if (onContactClick) {
      onContactClick(contactId);
    } else {
      router.push(`/contacts/${contactId}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div>
        <Input
          type="text"
          placeholder="Search contacts by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading contacts...</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            {data?.contacts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
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
                <div className="border-b bg-muted/50 px-6 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {data?.contacts.length ?? 0} of {data?.total ?? 0}{" "}
                    contact(s)
                    {search && ` matching "${search}"`}
                  </p>
                </div>

                {/* Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Tags</TableHead>
                      {showActions && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.contacts.map((contact) => (
                      <TableRow
                        key={contact.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(contact.id)}
                      >
                        <TableCell className="font-medium">
                          {contact.firstName || contact.lastName ? (
                            `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim()
                          ) : (
                            <span className="text-muted-foreground italic">
                              (No name)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.email ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.phone ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.company ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.jobTitle ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.tags && contact.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {contact.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        {showActions && (
                          <TableCell
                            className="text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="link"
                                asChild
                                className="h-auto p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link href={`/contacts/${contact.id}/edit`}>
                                  Edit
                                </Link>
                              </Button>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to delete this contact?",
                                    )
                                  ) {
                                    deleteContact.mutate({ id: contact.id });
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

