import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

const passwordRules: PasswordRule[] = [
  {
    label: "At least 8 characters",
    test: (pwd) => pwd.length >= 8,
  },
  {
    label: "One uppercase letter",
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    label: "One lowercase letter",
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    label: "One number",
    test: (pwd) => /\d/.test(pwd),
  },
  {
    label: "One special character",
    test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  },
];

interface PasswordStrengthIndicatorProps {
  password: string;
  show: boolean;
}

export function PasswordStrengthIndicator({ password, show }: PasswordStrengthIndicatorProps) {
  if (!show) return null;

  const allValid = passwordRules.every((rule) => rule.test(password));

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-200 ease-out",
        show ? "opacity-100 max-h-48" : "opacity-0 max-h-0"
      )}
    >
      <div className="space-y-2 pt-2">
        {passwordRules.map((rule, index) => {
          const isValid = rule.test(password);
          return (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 text-xs transition-all duration-150 ease-out",
                isValid ? "text-green-500" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-4 h-4 rounded-full transition-all duration-150 ease-out",
                  isValid ? "bg-green-500/20" : "bg-muted/20"
                )}
              >
                {isValid ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3 opacity-40" />
                )}
              </div>
              <span className={cn("transition-opacity duration-150", isValid && "font-medium")}>
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function validatePassword(password: string): boolean {
  return passwordRules.every((rule) => rule.test(password));
}

export function getPasswordErrors(password: string): string[] {
  return passwordRules
    .filter((rule) => !rule.test(password))
    .map((rule) => rule.label);
}
