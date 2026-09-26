"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Icon from "@/components/Icon";
import { Button } from "@/components/Button";

type Mode = "login" | "signup";

type FieldErrors = Record<string, string>;

export default function AuthForm({
  initialMode = "signup",
  notice,
}: {
  initialMode?: Mode;
  notice?: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  function switchMode(next: Mode) {
    setMode(next);
    setFormError(null);
    setErrors({});
    // Keep the URL shareable without a full navigation.
    window.history.replaceState(null, "", `/auth?mode=${next}`);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setFormError(null);
    setErrors({});

    const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
    const body =
      mode === "signup"
        ? { name, email, password, acceptedTerms }
        : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      let data: { error?: string; fields?: FieldErrors } = {};
      try {
        data = await response.json();
      } catch {
        /* non-JSON error body */
      }

      if (!response.ok) {
        setErrors(data.fields ?? {});
        setFormError(
          data.error ??
            "We couldn't complete that request. Please check your details and try again.",
        );
        return;
      }

      // Sign-ups continue to the accessibility questionnaire; returning users go
      // straight to their dashboard. A redirect from a protected route wins.
      const requested = new URLSearchParams(window.location.search).get("next");
      const destination =
        requested && requested.startsWith("/")
          ? requested
          : mode === "signup"
            ? "/accessibility"
            : "/dashboard";

      router.replace(destination);
      router.refresh();
    } catch {
      setFormError(
        "We couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full">
      <div
        role="tablist"
        aria-label="Choose login or sign up"
        className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-ink-100 p-1"
      >
        {(["signup", "login"] as Mode[]).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => switchMode(value)}
            className={
              mode === value
                ? "rounded-full bg-surface px-4 py-2.5 text-sm font-semibold text-ink-900 shadow-soft"
                : "rounded-full px-4 py-2.5 text-sm font-medium text-ink-500 hover:text-ink-800"
            }
          >
            {value === "signup" ? "Create account" : "Log in"}
          </button>
        ))}
      </div>

      <h1 className="text-2xl font-semibold sm:text-3xl">
        {mode === "signup"
          ? "Create your travel profile"
          : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        {mode === "signup"
          ? "A few details now, then a short conversation about how you like to travel."
          : "Log in to continue building your personalized travel profile."}
      </p>

      {notice && (
        <p
          role="status"
          className="mt-5 flex items-start gap-2.5 rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm text-sand-700"
        >
          <Icon name="alert" className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          {notice}
        </p>
      )}

      {formError && (
        <p
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <Icon name="alert" className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          {formError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        {mode === "signup" && (
          <Field
            id="name"
            label="Full name"
            icon="user"
            error={errors.name}
            autoComplete="name"
          >
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Aisha Khan"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={`field ${errors.name ? "field-error" : ""}`}
            />
          </Field>
        )}

        <Field
          id="email"
          label="Email address"
          icon="mail"
          error={errors.email}
          autoComplete="email"
        >
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`field ${errors.email ? "field-error" : ""}`}
          />
        </Field>

        <Field
          id="password"
          label="Password"
          icon="lock"
          error={errors.password}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          hint={mode === "signup" ? "At least 8 characters, with a letter and a number." : undefined}
        >
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={`field pr-24 ${errors.password ? "field-error" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-2 my-auto h-9 rounded-full px-3 text-xs font-semibold text-ink-500 hover:bg-ink-100 hover:text-ink-800"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </Field>

        {mode === "signup" ? (
          <div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink-200 bg-surface p-4 transition-colors hover:border-brand-300">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                aria-invalid={Boolean(errors.acceptedTerms)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
              />
              <span className="text-sm leading-relaxed text-ink-600">
                I agree to the{" "}
                <span className="font-medium text-ink-800">Terms of Service</span>{" "}
                and{" "}
                <span className="font-medium text-ink-800">Privacy Policy</span>,
                and understand my accessibility data is stored to personalize my
                experience.
              </span>
            </label>
            {errors.acceptedTerms && (
              <p id="terms-error" role="alert" className="mt-2 text-sm text-red-600">
                {errors.acceptedTerms}
              </p>
            )}
          </div>
        ) : (
          <div className="flex justify-end">
            <span className="text-sm font-medium text-ink-400">
              Forgot password?{" "}
              <span className="text-ink-400">(coming soon)</span>
            </span>
          </div>
        )}

        <Button type="submit" size="lg" fullWidth disabled={pending}>
          {pending
            ? "Please wait…"
            : mode === "signup"
              ? "Create Account"
              : "Log In"}
          {!pending && <Icon name="arrowRight" className="h-4.5 w-4.5" />}
        </Button>

        <p className="text-center text-sm text-ink-500">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-semibold text-brand-700 hover:underline"
              >
                Log in
              </button>
            </>
          ) : (
            <>
              New to Travello?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="font-semibold text-brand-700 hover:underline"
              >
                Create an account
              </button>
            </>
          )}
        </p>

        <p className="text-center text-xs text-ink-400">
          <Link href="/" className="hover:text-ink-600">
            ← Back to home
          </Link>
        </p>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  icon,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  error?: string;
  hint?: string;
  autoComplete?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-2 text-sm font-medium text-ink-700"
      >
        <Icon name={icon} className="h-4.5 w-4.5 text-ink-400" />
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-2 text-xs text-ink-400">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
