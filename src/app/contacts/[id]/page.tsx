"use client";

import { useParams } from "next/navigation";
import { ContactDetail } from "../_components/contact-detail";

export default function ContactDetailPage() {
    const params = useParams();
    const contactId = params?.id as string;

    return <ContactDetail contactId={contactId} />;
}

