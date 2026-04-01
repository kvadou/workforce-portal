"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
function SetupPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [userName, setUserName] = useState("");
  const [success, setSuccess] = useState(false);

  // Password requirements
  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Passwords match", met: password === confirmPassword && password.length > 0 },
  ];

  const allRequirementsMet = requirements.every((r) => r.met);

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/setup-password?token=${token}`);
        const data = await res.json();

        if (data.valid) {
          setIsTokenValid(true);
          setUserName(data.user.name || data.user.email);
        } else {
          setError(data.error || "Invalid or expired token");
        }
      } catch {
        setError("Failed to validate token");
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!allRequirementsMet) {
      setError("Please meet all password requirements");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to set password");
        return;
      }

      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-accent-light flex items-center justify-center p-4">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!token || !isTokenValid) {
    return (
      <div className="min-h-screen bg-accent-light flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <XCircleIcon className="w-16 h-16 mx-auto mb-4 text-error" />
            <h1 className="text-heading-lg text-neutral-900 mb-2">
              Invalid Link
            </h1>
            <p className="text-body text-neutral-500 mb-6">
              {error || "This password setup link is invalid or has expired."}
            </p>
            <Button onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-accent-light flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-success" />
            <h1 className="text-heading-lg text-neutral-900 mb-2">
              Password Set Successfully
            </h1>
            <p className="text-body text-neutral-500">
              Redirecting you to login...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-light flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Acme Workforce"
                className="rounded-lg h-16 w-auto"
              />
            </div>
            <h1 className="text-heading-lg text-neutral-900">
              Welcome, {userName}!
            </h1>
            <p className="text-body text-neutral-500 mt-1">
              Set up your password to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-[var(--radius-md)] bg-error-light text-error text-body-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-body-sm font-medium text-neutral-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-[var(--radius-input)] border border-border bg-card text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-body-sm font-medium text-neutral-700"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className="w-full px-4 py-3 rounded-[var(--radius-input)] border border-border bg-card text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Password requirements */}
            <div className="p-3 rounded-[var(--radius-md)] bg-neutral-50 border border-border">
              <p className="text-body-sm font-medium text-neutral-700 mb-2">
                Password Requirements
              </p>
              <ul className="space-y-1">
                {requirements.map((req, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-2 text-body-sm ${
                      req.met ? "text-success" : "text-neutral-500"
                    }`}
                  >
                    {req.met ? (
                      <CheckCircleIcon className="w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-neutral-300" />
                    )}
                    {req.label}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || !allRequirementsMet}
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Setting password...
                </>
              ) : (
                "Set Password & Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-accent-light flex items-center justify-center p-4">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      }
    >
      <SetupPasswordForm />
    </Suspense>
  );
}
