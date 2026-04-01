import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type EmailTemplate = {
  id: string;
  templateKey: string;
  name: string;
  subject: string;
  roleTitle: string | null;
  description: string;
  nextSteps: string[];
  nextStepsIntro: string | null;
  requiresOnboarding: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateEmailTemplateInput = {
  name?: string;
  subject?: string;
  roleTitle?: string | null;
  description?: string;
  nextSteps?: string[];
  nextStepsIntro?: string | null;
  requiresOnboarding?: boolean;
  isActive?: boolean;
};

// Fetch all email templates
async function fetchEmailTemplates(): Promise<EmailTemplate[]> {
  const response = await fetch("/api/admin/email-templates");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch email templates");
  }
  const data = await response.json();
  return data.templates;
}

// Fetch single template
async function fetchEmailTemplate(id: string): Promise<EmailTemplate> {
  const response = await fetch(`/api/admin/email-templates/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch email template");
  }
  const data = await response.json();
  return data.template;
}

// Update template
async function updateEmailTemplate(
  id: string,
  data: UpdateEmailTemplateInput
): Promise<EmailTemplate> {
  const response = await fetch(`/api/admin/email-templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update email template");
  }
  const result = await response.json();
  return result.template;
}

// Hooks
export function useEmailTemplates() {
  return useQuery({
    queryKey: ["email-templates"],
    queryFn: fetchEmailTemplates,
  });
}

export function useEmailTemplate(id: string) {
  return useQuery({
    queryKey: ["email-templates", id],
    queryFn: () => fetchEmailTemplate(id),
    enabled: !!id,
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmailTemplateInput }) =>
      updateEmailTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
  });
}
