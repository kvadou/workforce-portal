"use client";

import { useState, useCallback } from "react";
import {
  DocumentTextIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/20/solid";

interface UserW9Data {
  id: string;
  name: string | null;
  w9BusinessName: string | null;
  w9BusinessType: string | null;
  w9TaxId: string | null;
  w9Address: string | null;
  w9City: string | null;
  w9State: string | null;
  w9Zip: string | null;
  w9SignedAt: Date | null;
}

interface W9FormProps {
  user: UserW9Data;
  progressId: string;
  isComplete: boolean;
}

const businessTypes = [
  { value: "individual", label: "Individual/Sole Proprietor" },
  { value: "llc_single", label: "Single-member LLC" },
  { value: "llc_c", label: "LLC (C Corporation)" },
  { value: "llc_s", label: "LLC (S Corporation)" },
  { value: "llc_partnership", label: "LLC (Partnership)" },
  { value: "c_corp", label: "C Corporation" },
  { value: "s_corp", label: "S Corporation" },
  { value: "partnership", label: "Partnership" },
  { value: "trust", label: "Trust/Estate" },
  { value: "other", label: "Other" },
];

const usStates = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
];

export function W9Form({
  user,
  progressId,
  isComplete: initialIsComplete,
}: W9FormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(initialIsComplete);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [formData, setFormData] = useState({
    businessName: user.w9BusinessName || user.name || "",
    businessType: user.w9BusinessType || "individual",
    taxId: "",
    taxIdType: "ssn" as "ssn" | "ein",
    address: user.w9Address || "",
    city: user.w9City || "",
    state: user.w9State || "",
    zip: user.w9Zip || "",
  });

  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const formatTaxId = (value: string, type: "ssn" | "ein"): string => {
    const numbers = value.replace(/\D/g, "");
    if (type === "ssn") {
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 9)}`;
    } else {
      if (numbers.length <= 2) return numbers;
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 9)}`;
    }
  };

  const handleTaxIdChange = (value: string) => {
    const formatted = formatTaxId(value, formData.taxIdType);
    setFormData((prev) => ({ ...prev, taxId: formatted }));
    setError(null);
  };

  const handleSubmit = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    if (!formData.businessName.trim()) {
      setError("Business name is required");
      setIsSaving(false);
      return;
    }

    const taxIdDigits = formData.taxId.replace(/\D/g, "");
    if (taxIdDigits.length !== 9) {
      setError(`${formData.taxIdType === "ssn" ? "SSN" : "EIN"} must be 9 digits`);
      setIsSaving(false);
      return;
    }

    if (!formData.address.trim() || !formData.city.trim() || !formData.state || !formData.zip.trim()) {
      setError("Complete address is required");
      setIsSaving(false);
      return;
    }

    if (!agreedToTerms) {
      setError("You must agree to the certification to submit");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/onboarding/w9", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          progressId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsComplete(true);
      } else {
        setError(data.error || "Failed to save W-9. Please try again.");
      }
    } catch (err) {
      console.error("Failed to save W-9:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [formData, progressId, agreedToTerms]);

  // Checklist items
  const checklistItems = [
    { label: "Legal name", done: !!formData.businessName.trim() },
    { label: `Tax ID (${formData.taxIdType.toUpperCase()})`, done: formData.taxId.replace(/\D/g, "").length === 9 },
    { label: "Complete address", done: !!(formData.address && formData.city && formData.state && formData.zip) },
    { label: "Certification", done: agreedToTerms },
  ];
  const completedCount = checklistItems.filter((i) => i.done).length;

  // Completed state
  if (isComplete) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#E8F8ED] flex items-center justify-center flex-shrink-0">
            <CheckCircleSolid className="h-5 w-5 text-[#34B256]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-body font-semibold text-neutral-900">W-9 Submitted</h2>
            <p className="text-body-sm text-neutral-500">Your tax information has been securely saved.</p>
          </div>
          <span className="text-caption font-medium text-[#2A9147] bg-[#E8F8ED] px-2.5 py-1 rounded-full flex-shrink-0">
            Done
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="px-4 py-3 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <DocumentTextIcon className="h-4 w-4 text-primary-500" />
            </div>
            <div>
              <h2 className="text-body font-semibold text-neutral-900">W-9 Tax Form</h2>
              <p className="text-body-sm text-neutral-500">Required for payment processing</p>
            </div>
          </div>

          {/* Progress */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-caption text-neutral-400 tabular-nums">{completedCount}/4</span>
            <div className="flex gap-1">
              {checklistItems.map((item, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                    item.done ? "bg-[#34B256]" : "bg-neutral-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mx-4 mt-4 bg-[#E8FBFF] border border-[#50C8DF]/20 rounded-[10px] p-3">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="h-5 w-5 text-[#3BA8BD] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-body-sm font-medium text-[#3BA8BD]">Your information is encrypted</p>
            <p className="text-body-sm text-[#3BA8BD]/80 mt-0.5">
              Tax ID is encrypted at rest and only used for IRS reporting.
            </p>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="p-4 space-y-4">
        {/* Business Name */}
        <div>
          <label className="block text-caption font-medium text-neutral-700 mb-1.5">
            Name (as shown on your income tax return) <span className="text-[#DA2E72]">*</span>
          </label>
          <input
            type="text"
            value={formData.businessName}
            onChange={(e) => handleChange("businessName", e.target.value)}
            className="w-full px-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-neutral-400 transition-colors"
            placeholder="Your legal name"
          />
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-caption font-medium text-neutral-700 mb-1.5">
            Federal Tax Classification <span className="text-[#DA2E72]">*</span>
          </label>
          <select
            value={formData.businessType}
            onChange={(e) => handleChange("businessType", e.target.value)}
            className="w-full px-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-colors"
          >
            {businessTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tax ID Type */}
        <div>
          <label className="block text-caption font-medium text-neutral-700 mb-2">
            Tax ID Type <span className="text-[#DA2E72]">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            {(["ssn", "ein"] as const).map((type) => (
              <label
                key={type}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-[10px] border cursor-pointer transition-all duration-200 ${
                  formData.taxIdType === type
                    ? "border-primary-300 bg-primary-50 ring-1 ring-primary-200"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <input
                  type="radio"
                  name="taxIdType"
                  value={type}
                  checked={formData.taxIdType === type}
                  onChange={() => {
                    setFormData((prev) => ({ ...prev, taxIdType: type, taxId: "" }));
                  }}
                  className="h-4 w-4 text-primary-500 border-neutral-300 focus:ring-primary-500"
                />
                <span className="text-body-sm text-neutral-700">
                  {type === "ssn" ? "Social Security Number (SSN)" : "Employer ID Number (EIN)"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Tax ID */}
        <div>
          <label className="block text-caption font-medium text-neutral-700 mb-1.5">
            {formData.taxIdType === "ssn" ? "Social Security Number" : "Employer Identification Number"}{" "}
            <span className="text-[#DA2E72]">*</span>
          </label>
          <div className="relative">
            <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={formData.taxId}
              onChange={(e) => handleTaxIdChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-neutral-400 transition-colors font-mono tracking-wider"
              placeholder={formData.taxIdType === "ssn" ? "XXX-XX-XXXX" : "XX-XXXXXXX"}
              maxLength={formData.taxIdType === "ssn" ? 11 : 10}
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-caption font-medium text-neutral-700 mb-1.5">
            Street Address <span className="text-[#DA2E72]">*</span>
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className="w-full px-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-neutral-400 transition-colors"
            placeholder="123 Main Street, Apt 4B"
          />
        </div>

        {/* City, State, Zip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-caption font-medium text-neutral-700 mb-1.5">
              City <span className="text-[#DA2E72]">*</span>
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              className="w-full px-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-neutral-400 transition-colors"
              placeholder="New York"
            />
          </div>
          <div>
            <label className="block text-caption font-medium text-neutral-700 mb-1.5">
              State <span className="text-[#DA2E72]">*</span>
            </label>
            <select
              value={formData.state}
              onChange={(e) => handleChange("state", e.target.value)}
              className="w-full px-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-colors"
            >
              <option value="">Select</option>
              {usStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-caption font-medium text-neutral-700 mb-1.5">
              ZIP Code <span className="text-[#DA2E72]">*</span>
            </label>
            <input
              type="text"
              value={formData.zip}
              onChange={(e) => handleChange("zip", e.target.value)}
              className="w-full px-4 py-2.5 text-body text-neutral-900 border border-neutral-300 rounded-[10px] hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-neutral-400 transition-colors"
              placeholder="10001"
              maxLength={10}
            />
          </div>
        </div>
      </div>

      {/* Certification */}
      <div className="mx-4 mb-4 bg-[#FEF4E8] border border-[#F79A30]/20 rounded-[10px] p-4">
        <div className="flex items-start gap-3 mb-4">
          <ExclamationTriangleIcon className="h-5 w-5 text-[#C77A26] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-body-sm font-semibold text-[#C77A26]">Certification</h3>
            <p className="text-body-sm text-[#C77A26]/80 mt-1.5">
              Under penalties of perjury, I certify that:
            </p>
            <ol className="text-body-sm text-[#C77A26]/80 mt-1.5 space-y-1 list-decimal pl-4">
              <li>The number shown is my correct taxpayer identification number</li>
              <li>I am not subject to backup withholding</li>
              <li>I am a U.S. citizen or other U.S. person</li>
            </ol>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="h-5 w-5 text-primary-500 border-neutral-300 rounded focus:ring-primary-500 mt-0.5 flex-shrink-0"
          />
          <span className="text-body-sm text-neutral-700 group-hover:text-neutral-900 transition-colors">
            I have read and agree to the certification above.
          </span>
        </label>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50/50">
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          {/* Error / Checklist */}
          <div className="w-full sm:w-auto">
            {error ? (
              <p className="text-body-sm font-medium text-[#DA2E72]">{error}</p>
            ) : (
              <div className="flex items-center gap-3">
                {checklistItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5" title={item.label}>
                    {item.done ? (
                      <CheckCircleSolid className="h-4 w-4 text-[#34B256]" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-neutral-300" />
                    )}
                    <span className="hidden md:inline text-caption text-neutral-500">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-[10px] font-medium text-body hover:bg-primary-600 active:bg-primary-700 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                Submit W-9
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
