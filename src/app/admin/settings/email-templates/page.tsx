"use client";

import {
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  EyeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useEmailTemplates,
  useUpdateEmailTemplate,
  type EmailTemplate,
} from "@/hooks/useEmailTemplates";

export default function EmailTemplatesPage() {
  const { data: templates, isLoading, error } = useEmailTemplates();
  const updateTemplate = useUpdateEmailTemplate();

  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editForm, setEditForm] = useState<Partial<EmailTemplate>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      subject: template.subject,
      roleTitle: template.roleTitle || "",
      description: template.description,
      nextSteps: template.nextSteps,
      nextStepsIntro: template.nextStepsIntro || "",
      requiresOnboarding: template.requiresOnboarding,
      isActive: template.isActive,
    });
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    try {
      await updateTemplate.mutateAsync({
        id: selectedTemplate.id,
        data: {
          name: editForm.name,
          subject: editForm.subject,
          roleTitle: editForm.roleTitle || null,
          description: editForm.description,
          nextSteps: editForm.nextSteps,
          nextStepsIntro: editForm.nextStepsIntro || null,
          requiresOnboarding: editForm.requiresOnboarding,
          isActive: editForm.isActive,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save template:", err);
    }
  };

  const handleNextStepsChange = (value: string) => {
    const steps = value.split("\n").filter((s) => s.trim());
    setEditForm({ ...editForm, nextSteps: steps });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
          <div className="h-64 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-error-light text-error p-4 rounded-lg flex items-center gap-2">
          <ExclamationCircleIcon className="h-5 w-5" />
          Failed to load email templates
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Email Templates</h1>
          <p className="text-neutral-600 mt-1">
            Customize the welcome emails sent to new users
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div className="p-4 border-b border-neutral-200">
              <h2 className="font-semibold text-neutral-900">Templates</h2>
            </div>
            <div className="divide-y divide-neutral-100">
              {templates?.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`w-full p-4 text-left hover:bg-neutral-50 transition-colors ${
                    selectedTemplate?.id === template.id
                      ? "bg-primary-50 border-l-4 border-primary-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        selectedTemplate?.id === template.id
                          ? "bg-primary-100 text-primary-600"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      <EnvelopeIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">
                        {template.name}
                      </p>
                      <p className="text-sm text-neutral-500 truncate">
                        {template.templateKey}
                      </p>
                    </div>
                    {!template.isActive && (
                      <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-500 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {templates?.length === 0 && (
                <div className="p-8 text-center text-neutral-500">
                  <EnvelopeIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No templates found</p>
                  <p className="text-sm mt-1">
                    Run the seed script to create default templates
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <h2 className="font-semibold text-neutral-900">
                  Edit: {selectedTemplate.name}
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={updateTemplate.isPending}
                  >
                    {updateTemplate.isPending ? (
                      "Saving..."
                    ) : saveSuccess ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        CheckIcon Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Subject Line */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={editForm.subject || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, subject: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Role Title */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Role Title
                    <span className="text-neutral-400 font-normal ml-2">
                      (displayed in email)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={editForm.roleTitle || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, roleTitle: e.target.value })
                    }
                    placeholder="e.g., Tutor, Lead Tutor, Administrator"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Welcome Message
                  </label>
                  <textarea
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Next Steps Intro */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Next Steps Intro
                    <span className="text-neutral-400 font-normal ml-2">
                      (text before the bullet list)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={editForm.nextStepsIntro || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, nextStepsIntro: e.target.value })
                    }
                    placeholder="e.g., you'll have access to, you'll complete our onboarding which includes"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Next Steps */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Next Steps
                    <span className="text-neutral-400 font-normal ml-2">
                      (one per line)
                    </span>
                  </label>
                  <textarea
                    value={(editForm.nextSteps || []).join("\n")}
                    onChange={(e) => handleNextStepsChange(e.target.value)}
                    rows={4}
                    placeholder="Watch orientation videos&#10;Complete your profile&#10;Access the curriculum"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                  />
                </div>

                {/* Options */}
                <div className="flex flex-wrap gap-6 pt-4 border-t border-neutral-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.requiresOnboarding || false}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          requiresOnboarding: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700">
                      Requires onboarding after signup
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isActive !== false}
                      onChange={(e) =>
                        setEditForm({ ...editForm, isActive: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700">Template active</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
              <EnvelopeIcon className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Select a Template
              </h3>
              <p className="text-neutral-500">
                Choose a template from the list to edit its content
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-modal max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900">Email Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Email Preview */}
              <div className="bg-neutral-100 p-4 rounded-lg mb-4">
                <p className="text-sm text-neutral-600">
                  <strong>Subject:</strong> {editForm.subject}
                </p>
                <p className="text-sm text-neutral-600">
                  <strong>From:</strong> Acme Workforce &lt;support@acmeworkforce.com&gt;
                </p>
              </div>

              <div
                className="border border-neutral-200 rounded-lg p-6"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                {/* Logo placeholder */}
                <div className="text-center mb-6">
                  <div className="inline-block bg-primary-100 text-primary-600 px-4 py-2 rounded-lg font-bold">
                    Acme Workforce
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                  Welcome to Acme Workforce, {"{{name}}"}!
                </h1>

                <p className="text-neutral-700 mb-1">
                  <strong>Role: {editForm.roleTitle || "Tutor"}</strong>
                </p>

                <p className="text-neutral-600 mb-6">{editForm.description}</p>

                <div className="text-center mb-6">
                  <span className="inline-block bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold">
                    Set Up Your Password
                  </span>
                </div>

                <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                  <p className="font-semibold text-neutral-900 mb-2">
                    What&apos;s Next?
                  </p>
                  <p className="text-neutral-600 mb-3">
                    After setting up your password
                    {editForm.nextStepsIntro
                      ? `, ${editForm.nextStepsIntro}`
                      : ", you'll have access to"}
                    :
                  </p>
                  <ul className="list-disc list-inside text-neutral-600 space-y-1">
                    {(editForm.nextSteps || []).map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>

                <p className="text-neutral-500 text-sm mb-4">
                  This link will expire in 7 days. If you need a new link, please
                  contact your administrator.
                </p>

                <p className="text-neutral-500 text-sm">
                  If you didn&apos;t expect this email, please disregard it.
                </p>

                <div className="border-t border-neutral-200 mt-6 pt-6 text-center text-neutral-400 text-sm">
                  <p>Acme Workforce • Making Chess Fun for Kids</p>
                  <p>Questions? Contact us at support@acmeworkforce.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
