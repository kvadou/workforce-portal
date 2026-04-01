/**
 * Onboarding Email Templates and Sending Functions
 *
 * Uses Postmark for transactional email delivery
 * API Docs: https://postmarkapp.com/developer
 *
 * Templates are stored in the database and can be edited via admin UI
 */

import { prisma } from "@/lib/prisma";

const POSTMARK_API_TOKEN = process.env.POSTMARK_API_TOKEN || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@acmeworkforce.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://workforceportal.com";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tag?: string; // For Postmark tracking
}

/**
 * Send an email using Postmark
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!POSTMARK_API_TOKEN) {
    console.log("Email would be sent:", {
      to: options.to,
      subject: options.subject,
    });
    console.log("Set POSTMARK_API_TOKEN to enable email sending");
    return true; // Return true in development
  }

  try {
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": POSTMARK_API_TOKEN,
      },
      body: JSON.stringify({
        From: `Acme Workforce <${EMAIL_FROM}>`,
        To: options.to,
        Subject: options.subject,
        HtmlBody: options.html,
        TextBody: options.text || stripHtml(options.html),
        Tag: options.tag || "onboarding",
        MessageStream: "outbound",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Postmark error:", error);
      return false;
    }

    const result = await response.json();
    console.log("Email sent via Postmark:", result.MessageID);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate the base email template wrapper
 */
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acme Workforce</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo {
      height: 60px;
      width: auto;
    }
    h1 {
      color: #1a1a1a;
      font-size: 24px;
      margin: 0 0 16px;
    }
    p {
      color: #666;
      margin: 0 0 16px;
    }
    .button {
      display: inline-block;
      background: #6366f1;
      color: white !important;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 16px 0;
    }
    .button:hover {
      background: #5558d3;
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #eee;
      color: #999;
      font-size: 14px;
    }
    .highlight {
      background: #f0f0ff;
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <img src="${APP_URL}/logo.png" alt="Acme Workforce" class="logo">
      </div>
      ${content}
      <div class="footer">
        <p>Acme Workforce &bull; Workforce Training Portal</p>
        <p>Questions? Contact us at support@acmeworkforce.com</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Role type for welcome emails
 */
type UserRole = "SUPER_ADMIN" | "ADMIN" | "FRANCHISEE_OWNER" | "LEAD_TUTOR" | "TUTOR" | "ONBOARDING_TUTOR";

/**
 * Fallback config if database template not found
 */
const fallbackConfigs: Record<UserRole, { title: string; description: string; nextSteps: string[]; nextStepsIntro: string; subject: string }> = {
  SUPER_ADMIN: {
    title: "System Administrator",
    description: "You've been granted full administrative access to Acme Workforce.",
    nextSteps: ["Review system settings", "Manage user accounts", "Access all organizational data"],
    nextStepsIntro: "you'll have access to",
    subject: "Welcome to Acme Workforce - Admin Access Granted",
  },
  ADMIN: {
    title: "Administrator",
    description: "You've been added as an administrator for Acme Workforce.",
    nextSteps: ["Explore the admin dashboard", "Review and manage content", "Manage team members"],
    nextStepsIntro: "you'll have access to",
    subject: "Welcome to Acme Workforce - Admin Access Granted",
  },
  FRANCHISEE_OWNER: {
    title: "Franchise Owner",
    description: "Welcome to the Acme Workforce franchise family!",
    nextSteps: ["Set up your franchise profile", "Invite and manage your tutors", "Access franchise resources"],
    nextStepsIntro: "you'll have access to",
    subject: "Welcome to Acme Workforce - Franchise Owner Access",
  },
  LEAD_TUTOR: {
    title: "Lead Tutor",
    description: "Congratulations on your leadership role!",
    nextSteps: ["Complete your tutor onboarding", "Review team management tools", "Access the full curriculum"],
    nextStepsIntro: "you'll complete our onboarding process which includes",
    subject: "Welcome to Acme Workforce - Lead Tutor Position",
  },
  TUTOR: {
    title: "Tutor",
    description: "Welcome to the new Acme Workforce portal! As an existing tutor, you now have access to all your familiar teaching materials in our upgraded system.",
    nextSteps: ["Access the full curriculum library", "Browse teaching resources", "View business resources"],
    nextStepsIntro: "you'll have access to",
    subject: "Welcome to Acme Workforce - Access Your New Portal",
  },
  ONBOARDING_TUTOR: {
    title: "New Tutor",
    description: "Welcome to Acme Workforce! We're thrilled to have you join our team.",
    nextSteps: ["Watch orientation videos", "Take a short quiz", "Complete your profile", "Attend an orientation session"],
    nextStepsIntro: "you'll complete our onboarding process which includes",
    subject: "Welcome to Acme Workforce - Start Your Journey",
  },
};

/**
 * Send role-specific welcome email with password setup link
 * Fetches template from database if available, falls back to defaults
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  resetToken: string,
  role: UserRole = "TUTOR"
): Promise<boolean> {
  const setupUrl = `${APP_URL}/setup-password?token=${resetToken}`;

  // Try to fetch template from database
  let template = null;
  try {
    template = await prisma.emailTemplate.findUnique({
      where: { templateKey: `welcome_${role}` },
    });
  } catch (err) {
    console.error("Error fetching email template:", err);
  }

  // Use database template or fallback
  const config = template
    ? {
        title: template.roleTitle || fallbackConfigs[role].title,
        description: template.description,
        nextSteps: template.nextSteps,
        nextStepsIntro: template.nextStepsIntro || fallbackConfigs[role].nextStepsIntro,
        subject: template.subject,
      }
    : fallbackConfigs[role];

  const nextStepsList = config.nextSteps
    .map((step) => `<li>${step}</li>`)
    .join("\n        ");

  const content = `
    <h1>Welcome to Acme Workforce, ${name}!</h1>
    <p><strong>Role: ${config.title}</strong></p>
    <p>${config.description}</p>

    <div style="text-align: center;">
      <a href="${setupUrl}" class="button">Set Up Your Password</a>
    </div>

    <div class="highlight">
      <p><strong>What's Next?</strong></p>
      <p>After setting up your password, ${config.nextStepsIntro}:</p>
      <ul style="color: #666;">
        ${nextStepsList}
      </ul>
    </div>

    <p>This link will expire in 7 days. If you need a new link, please contact your administrator.</p>

    <p>If you didn't expect this email, please disregard it.</p>
  `;

  return sendEmail({
    to: email,
    subject: config.subject,
    html: emailWrapper(content),
    tag: `welcome-${role.toLowerCase()}`,
  });
}

/**
 * Send onboarding completion email when tutor is activated
 */
export async function sendActivationEmail(
  email: string,
  name: string
): Promise<boolean> {
  const loginUrl = `${APP_URL}/login`;

  const content = `
    <h1>Congratulations, ${name}!</h1>
    <p>You've successfully completed your onboarding and are now an official Acme Workforce team member!</p>

    <div style="text-align: center;">
      <a href="${loginUrl}" class="button">Access Your Dashboard</a>
    </div>

    <div class="highlight">
      <p><strong>You Now Have Access To:</strong></p>
      <ul style="color: #666;">
        <li>Complete curriculum with lesson plans</li>
        <li>Teaching resources and materials</li>
        <li>Business resources and templates</li>
        <li>Team announcements and updates</li>
      </ul>
    </div>

    <p>Your supervisor will be in touch soon about scheduling your first lessons.</p>

    <p>Welcome to the team!</p>
  `;

  return sendEmail({
    to: email,
    subject: "You're Now a Acme Workforce Team Member - Account Activated!",
    html: emailWrapper(content),
  });
}

/**
 * Send reminder email for incomplete onboarding
 */
export async function sendOnboardingReminderEmail(
  email: string,
  name: string,
  currentStep: string
): Promise<boolean> {
  const onboardingUrl = `${APP_URL}/onboarding`;

  const content = `
    <h1>Hi ${name},</h1>
    <p>We noticed you haven't completed your Acme Workforce onboarding yet. You're currently on: <strong>${currentStep}</strong></p>

    <div style="text-align: center;">
      <a href="${onboardingUrl}" class="button">Continue Onboarding</a>
    </div>

    <p>If you're having any trouble or have questions, please reach out to your administrator.</p>

    <p>We're looking forward to having you on the team!</p>
  `;

  return sendEmail({
    to: email,
    subject: "Complete Your Acme Workforce Onboarding",
    html: emailWrapper(content),
  });
}

/**
 * Send notification to admin when new hire is created
 */
export async function sendNewHireNotification(
  adminEmail: string,
  newHireName: string,
  newHireEmail: string
): Promise<boolean> {
  const adminUrl = `${APP_URL}/admin/onboarding`;

  const content = `
    <h1>New Hire Alert</h1>
    <p>A new tutor has been added to the onboarding system:</p>

    <div class="highlight">
      <p><strong>Name:</strong> ${newHireName}</p>
      <p><strong>Email:</strong> ${newHireEmail}</p>
    </div>

    <div style="text-align: center;">
      <a href="${adminUrl}" class="button">View in Admin Panel</a>
    </div>

    <p>The new hire will receive a welcome email with instructions to set up their password and begin onboarding.</p>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `New Hire: ${newHireName} Added to Onboarding`,
    html: emailWrapper(content),
  });
}
