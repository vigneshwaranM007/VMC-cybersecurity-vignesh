export interface StrengthResult {
  score: number;
  strength: "Weak" | "Medium" | "Strong";
  feedback: string[];
  metadata: {
    length: number;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

export const checkPasswordStrength = (password: string): StrengthResult => {
  let score = 0;
  const feedback: string[] = [];
  
  const metadata = {
    length: password.length,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };

  // Length checks
  if (metadata.length >= 8) score += 2;
  else feedback.push("Password is too short (min 8 chars)");

  if (metadata.length >= 12) score += 1;

  // Complexity checks
  if (metadata.hasUpper) score += 2;
  else feedback.push("Add uppercase letters");

  if (metadata.hasLower) score += 1;
  else feedback.push("Add lowercase letters");

  if (metadata.hasNumber) score += 2;
  else feedback.push("Add numbers");

  if (metadata.hasSymbol) score += 2;
  else feedback.push("Add special characters");

  // Common patterns (simplified)
  if (/123456|password|qwerty/i.test(password)) {
    score = Math.max(0, score - 5);
    feedback.push("Avoid common passwords");
  }

  let strength: "Weak" | "Medium" | "Strong" = "Weak";
  if (score >= 8) strength = "Strong";
  else if (score >= 5) strength = "Medium";

  return { score, strength, feedback, metadata };
};
