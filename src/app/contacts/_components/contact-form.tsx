"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Validation schema matching the tRPC router
const contactFormSchema = z.object({
  firstName: z.string().min(1).optional().or(z.literal("")),
  lastName: z.string().min(1).optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  initialData?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    jobTitle?: string | null;
    notes?: string | null;
    tags?: string[] | null;
  };
  onSubmit: (data: ContactFormData) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  mode?: "create" | "edit";
}

export function ContactForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel,
  mode = "create",
}: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: initialData?.firstName ?? "",
    lastName: initialData?.lastName ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    company: initialData?.company ?? "",
    jobTitle: initialData?.jobTitle ?? "",
    notes: initialData?.notes ?? "",
    tags: initialData?.tags ?? [],
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactFormData, string>>
  >({});
  const [tagInput, setTagInput] = useState("");

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName ?? "",
        lastName: initialData.lastName ?? "",
        email: initialData.email ?? "",
        phone: initialData.phone ?? "",
        company: initialData.company ?? "",
        jobTitle: initialData.jobTitle ?? "",
        notes: initialData.notes ?? "",
        tags: initialData.tags ?? [],
      });
    }
  }, [initialData]);

  const validate = (): boolean => {
    try {
      contactFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof ContactFormData;
          if (field) {
            fieldErrors[field] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Prepare data for submission (convert empty strings to undefined)
    const submitData: ContactFormData = {
      firstName: formData.firstName ?? undefined,
      lastName: formData.lastName ?? undefined,
      email: formData.email ?? undefined,
      phone: formData.phone ?? undefined,
      company: formData.company ?? undefined,
      jobTitle: formData.jobTitle ?? undefined,
      notes: formData.notes ?? undefined,
      tags:
        formData.tags && formData.tags.length > 0 ? formData.tags : undefined,
    };

    await onSubmit(submitData);
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags?.includes(trimmedTag)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags ?? []), trimmedTag],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove) ?? [],
    });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* First Name */}
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={(e) => {
              setFormData({ ...formData, firstName: e.target.value });
              if (errors.firstName) {
                setErrors({ ...errors, firstName: undefined });
              }
            }}
            className={errors.firstName ? "border-destructive" : ""}
            aria-invalid={!!errors.firstName}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-destructive">{errors.firstName}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={(e) => {
              setFormData({ ...formData, lastName: e.target.value });
              if (errors.lastName) {
                setErrors({ ...errors, lastName: undefined });
              }
            }}
            className={errors.lastName ? "border-destructive" : ""}
            aria-invalid={!!errors.lastName}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-destructive">{errors.lastName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) {
                setErrors({ ...errors, email: undefined });
              }
            }}
            className={errors.email ? "border-destructive" : ""}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => {
              setFormData({ ...formData, phone: e.target.value });
            }}
          />
        </div>

        {/* Company */}
        <div>
          <Label htmlFor="company">Company</Label>
          <Input
            type="text"
            id="company"
            value={formData.company}
            onChange={(e) => {
              setFormData({ ...formData, company: e.target.value });
            }}
          />
        </div>

        {/* Job Title */}
        <div>
          <Label htmlFor="jobTitle">Job Title</Label>
          <Input
            type="text"
            id="jobTitle"
            value={formData.jobTitle}
            onChange={(e) => {
              setFormData({ ...formData, jobTitle: e.target.value });
            }}
          />
        </div>

        {/* Tags */}
        <div className="sm:col-span-2">
          <Label htmlFor="tags">Tags</Label>
          <div className="mb-2 flex flex-wrap gap-2">
            {formData.tags && formData.tags.length > 0 && (
              <>
                {formData.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:opacity-70"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Add a tag and press Enter"
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={handleAddTag}>
              Add
            </Button>
          </div>
        </div>

        {/* Notes */}
        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            rows={4}
            value={formData.notes}
            onChange={(e) => {
              setFormData({ ...formData, notes: e.target.value });
            }}
            placeholder="Add any additional notes about this contact..."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 border-t pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? mode === "edit"
              ? "Updating..."
              : "Creating..."
            : (submitLabel ??
              (mode === "edit" ? "Update Contact" : "Create Contact"))}
        </Button>
      </div>
    </form>
  );
}
