/**
 * Email: must have letters (not only numbers) and a valid domain (e.g. @yahoo.com)
 */
export function validateEmail(value) {
  if (!value || !value.trim()) return "Email address is required.";
  const trimmed = value.trim();
  const hasValidDomain = /^[^@]+@[^@]+\.[^@]+$/.test(trimmed);
  if (!hasValidDomain) return "Please enter a valid email address including a domain (e.g. name@yahoo.com).";
  const localPart = trimmed.split("@")[0] || "";
  if (/^\d+$/.test(localPart)) return "Email address must contain letters and a valid domain (e.g. name@yahoo.com).";
  if (!/[A-Za-z]/.test(localPart)) return "Email address must contain at least one letter before the domain.";
  return null;
}

/**
 * Strong password: min 8 chars, uppercase, lowercase, number, symbol
 */
export function validateStrongPassword(value) {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters in length.";
  if (!/[A-Z]/.test(value)) return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(value)) return "Password must include at least one lowercase letter.";
  if (!/\d/.test(value)) return "Password must include at least one number.";
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return "Password must include at least one symbol (e.g. ! @ # $ %).";
  return null;
}

/** Facebook-style one-line hints (small gray text below field) */
export const EMAIL_HINT = "Enter the email address for your account.";
export const PASSWORD_HINT = "Use 8 or more characters with a mix of letters, numbers and symbols.";
