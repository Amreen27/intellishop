/**
 * lib/isAdmin.ts
 *
 * Exposes a helper to check if a user email is in the NEXT_PUBLIC_ADMIN_EMAILS
 * environment variable list (comma-separated).
 */

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
  
  // Split by comma, trim whitespace, and convert to lower case for comparison
  const adminEmails = adminEmailsEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.trim().toLowerCase());
}
