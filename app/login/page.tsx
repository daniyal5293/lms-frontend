"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/src/components/providers/AuthProvider";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { loginUser } from "@/src/lib/api/auth.api";
import { ApiError } from "@/src/lib/api/client";

const initialValues = { email: "", password: "" };

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<typeof initialValues>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: Partial<typeof initialValues> = {};

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      const response = await loginUser(form.email, form.password);
      login(response.User, response.AccessToken);
      notify("success", "Welcome back", `Signed in as ${response.User.FullName}.`);
      router.push("/dashboard");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to sign in. Please check your credentials and try again.";
      notify("error", "Sign in failed", message);
      setErrors({ password: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#171717] p-6 shadow-xl shadow-black/20">
        <div className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF6B35] text-xl font-bold text-white">L</div>
          <h1 className="text-3xl font-semibold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-[#888888]">Sign in to continue to your college LMS dashboard.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            error={errors.email}
            placeholder="name@college.edu"
          />

          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            error={errors.password}
            placeholder="Enter your password"
          />

          <Button type="submit" className="w-full" loading={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-[#888888]">
          <span>Need an account?</span>
          <Link href="/register" className="font-medium text-[#FF6B35] hover:text-[#ff8b64]">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
