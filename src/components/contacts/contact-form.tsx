"use client";

import { useState, useEffect } from "react";
import { z } from "zod";

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
          <label
            htmlFor="firstName"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={(e) => {
              setFormData({ ...formData, firstName: e.target.value });
              if (errors.firstName) {
                setErrors({ ...errors, firstName: undefined });
              }
            }}
            className={`w-full rounded-md border px-3 py-2 shadow-sm focus:ring-1 focus:outline-none ${
              errors.firstName
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label
            htmlFor="lastName"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={(e) => {
              setFormData({ ...formData, lastName: e.target.value });
              if (errors.lastName) {
                setErrors({ ...errors, lastName: undefined });
              }
            }}
            className={`w-full rounded-md border px-3 py-2 shadow-sm focus:ring-1 focus:outline-none ${
              errors.lastName
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) {
                setErrors({ ...errors, email: undefined });
              }
            }}
            className={`w-full rounded-md border px-3 py-2 shadow-sm focus:ring-1 focus:outline-none ${
              errors.email
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => {
              setFormData({ ...formData, phone: e.target.value });
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Company */}
        <div>
          <label
            htmlFor="company"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Company
          </label>
          <input
            type="text"
            id="company"
            value={formData.company}
            onChange={(e) => {
              setFormData({ ...formData, company: e.target.value });
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Job Title */}
        <div>
          <label
            htmlFor="jobTitle"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Job Title
          </label>
          <input
            type="text"
            id="jobTitle"
            value={formData.jobTitle}
            onChange={(e) => {
              setFormData({ ...formData, jobTitle: e.target.value });
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Tags */}
        <div className="sm:col-span-2">
          <label
            htmlFor="tags"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Tags
          </label>
          <div className="mb-2 flex flex-wrap gap-2">
            {formData.tags && formData.tags.length > 0 && (
              <>
                {formData.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Add a tag and press Enter"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="sm:col-span-2">
          <label
            htmlFor="notes"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Notes
          </label>
          <textarea
            id="notes"
            rows={4}
            value={formData.notes}
            onChange={(e) => {
              setFormData({ ...formData, notes: e.target.value });
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="Add any additional notes about this contact..."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading
            ? mode === "edit"
              ? "Updating..."
              : "Creating..."
            : (submitLabel ??
              (mode === "edit" ? "Update Contact" : "Create Contact"))}
        </button>
      </div>
    </form>
  );
}
