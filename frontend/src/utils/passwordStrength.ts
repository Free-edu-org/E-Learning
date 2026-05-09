export interface PasswordStrength {
  score: number;
  label: "Słabe" | "Średnie" | "Mocne" | "Bardzo mocne";
  color: string;
}

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length > 6) score += 25;
  if (password.length > 10) score += 25;
  if (/[A-Z]/.test(password)) score += 25;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 25;

  if (score <= 25) {
    return { score, label: "Słabe", color: "#ef4444" };
  }

  if (score <= 50) {
    return { score, label: "Średnie", color: "#f59e0b" };
  }

  if (score <= 75) {
    return { score, label: "Mocne", color: "#3b82f6" };
  }

  return { score, label: "Bardzo mocne", color: "#10b981" };
}
