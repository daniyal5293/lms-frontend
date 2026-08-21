"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { registerUser } from "@/src/lib/api/auth.api";
import { ApiError } from "@/src/lib/api/client";

const initialValues = {
  fullName: "",
  email: "",
  password: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<typeof initialValues>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: Partial<typeof initialValues> = {};

    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = "Enter a valid email address.";
    if (!form.password) nextErrors.password = "Password is required.";
    else if (form.password.length < 6) nextErrors.password = "Password must be at least 6 characters.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      await registerUser(form.email, form.password, form.fullName);
      notify("success", "Registration submitted", "Your account has been created. Please sign in.");
      router.push("/login");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to create your account.";
      notify("error", "Registration failed", message);
      setErrors({ email: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#171717] p-6 shadow-xl shadow-black/20">
        <div className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#004E64] text-xl font-bold text-white">C</div>
          <h1 className="text-3xl font-semibold text-white">Create account</h1>
          <p className="mt-2 text-sm text-[#888888]">Register to access your college learning portal.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <Input
            label="Full name"
            name="fullName"
            value={form.fullName}
            onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            error={errors.fullName}
            placeholder="Jane Smith"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            error={errors.email}
            placeholder="jane@college.edu"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            error={errors.password}
            placeholder="Create a secure password"
          />

          <Button type="submit" className="w-full" loading={submitting}>
            {submitting ? "Creating account..." : "Register"}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-[#888888]">
          <span>Already registered?</span>
          <Link href="/login" className="font-medium text-[#FF6B35] hover:text-[#ff8b64]">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
