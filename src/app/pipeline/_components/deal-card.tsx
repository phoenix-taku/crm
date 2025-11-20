"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "~/lib/utils";
import Link from "next/link";
import { Building2, DollarSign, User } from "lucide-react";

interface DealCardProps {
    deal: {
        id: string;
        name: string;
        stage: string;
        value: string | null;
        currency: string | null;
        dealContacts?: Array<{
            contact: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                email: string | null;
                company: string | null;
            };
        }>;
        expectedCloseDate: Date | null;
    };
    isDragging?: boolean;
}

export const DealCard = memo(function DealCard({
    deal,
    isDragging,
}: DealCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({
        id: deal.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isSortableDragging ? "none" : transition, // Remove transition during drag for snappier feel
        opacity: isSortableDragging ? 0.5 : 1,
    };

    const formatCurrency = (value: string | null, currency: string | null) => {
        if (!value) return "—";
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return value;
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency ?? "NZD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numValue);
    };

    // Get contacts for display
    const contacts = deal.dealContacts && deal.dealContacts.length > 0
        ? deal.dealContacts.map((dc) => dc.contact).filter((c) => c !== null && c !== undefined)
        : [];

    // Get unique companies
    const companies = Array.from(
        new Set(
            contacts
                .map((c) => c.company)
                .filter((c): c is string => !!c)
        )
    );

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "cursor-grab active:cursor-grabbing",
                isDragging && "rotate-3 shadow-lg",
                isSortableDragging && "opacity-50",
            )}
        >
            <CardContent className="p-4">
                <Link
                    href={`/deals/${deal.id}?from=pipeline`}
                    onClick={(e) => e.stopPropagation()}
                    className="block space-y-3"
                >
                    <div>
                        <h4 className="font-semibold text-sm leading-tight">{deal.name}</h4>
                    </div>

                    {deal.value && (
                        <div className="space-y-1.5">
                            <div className="flex justify-center">
                                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="flex justify-center">
                                <span className="font-medium text-foreground text-sm">
                                    {formatCurrency(deal.value, deal.currency)}
                                </span>
                            </div>
                        </div>
                    )}

                    {contacts.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex justify-center">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="flex flex-wrap gap-1 items-center justify-center">
                                {contacts.slice(0, 2).map((contact, idx) => {
                                    const contactName = contact.firstName || contact.lastName
                                        ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim()
                                        : contact.email ?? "Unnamed";
                                    return (
                                        <div key={contact.id} className="flex items-center gap-1">
                                            <Badge variant="outline" className="text-xs font-normal">
                                                {contactName}
                                            </Badge>
                                            {idx < Math.min(contacts.length, 2) - 1 && (
                                                <span className="text-muted-foreground text-xs">•</span>
                                            )}
                                        </div>
                                    );
                                })}
                                {contacts.length > 2 && (
                                    <>
                                        <span className="text-muted-foreground text-xs">•</span>
                                        <Badge variant="secondary" className="text-xs font-normal">
                                            +{contacts.length - 2} more
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {companies.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex justify-center">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="flex flex-wrap gap-1 items-center justify-center">
                                {companies.slice(0, 2).map((company, idx) => (
                                    <div key={idx} className="flex items-center gap-1">
                                        <Badge variant="outline" className="text-xs font-normal">
                                            {company}
                                        </Badge>
                                        {idx < Math.min(companies.length, 2) - 1 && (
                                            <span className="text-muted-foreground text-xs">•</span>
                                        )}
                                    </div>
                                ))}
                                {companies.length > 2 && (
                                    <>
                                        <span className="text-muted-foreground text-xs">•</span>
                                        <Badge variant="secondary" className="text-xs font-normal">
                                            +{companies.length - 2} more
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </Link>
            </CardContent>
        </Card>
    );
});

