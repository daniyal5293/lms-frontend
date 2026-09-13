"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useNotifications } from "@/src/components/providers/NotificationProvider";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { ApiError } from "@/src/lib/api/client";
import { sendPasswordResetCode, verifyAndResetPassword } from "@/src/lib/api/auth.api";

type FormState = {
  email: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
};

const initialForm: FormState = {
  email: "",
  verificationCode: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [form, setForm] = useState(initialForm);
  const [codeSent, setCodeSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSendCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      notify("error", "Invalid email", "Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordResetCode(form.email);
      setCodeSent(true);
      notify("success", "Code sent", "Check your email for the password reset code.");
    } catch (error) {
      notify("error", "Unable to send code", error instanceof ApiError ? error.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.verificationCode.trim() || !form.newPassword || !form.confirmPassword) {
      notify("error", "Validation failed", "Code and all password fields are required.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      notify("error", "Validation failed", "New password and confirmation must match.");
      return;
    }

    setSubmitting(true);
    try {
      await verifyAndResetPassword(form.email, form.verificationCode, form.newPassword);
      notify("success", "Password reset", "Your password was updated. You can now sign in.");
      router.push("/login");
    } catch (error) {
      notify("error", "Unable to reset password", error instanceof ApiError ? error.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center theme-bg-page p-6">
      <div className="w-full max-w-md rounded-3xl border border-black/10 theme-bg-surface p-6 shadow-xl shadow-black/20">
        <div className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl theme-bg-primary text-xl font-bold theme-text">L</div>
          <h1 className="text-3xl font-semibold theme-text">Reset your password</h1>
          <p className="mt-2 text-sm theme-text-muted">
            {codeSent ? "Enter the code from your email and choose a new password." : "Enter your email and we will send you a verification code."}
          </p>
        </div>

        {!codeSent ? (
          <form onSubmit={handleSendCode} className="space-y-5" noValidate>
            <Input label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="name@college.edu" />
            <Button type="submit" className="w-full" loading={submitting}>{submitting ? "Sending..." : "Send reset code"}</Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
            <Input label="Verification code" name="verificationCode" inputMode="numeric" value={form.verificationCode} onChange={(event) => updateField("verificationCode", event.target.value)} placeholder="Enter the code from your email" />
            <Input label="New password" name="newPassword" type="password" autoComplete="new-password" value={form.newPassword} onChange={(event) => updateField("newPassword", event.target.value)} placeholder="Enter a new password" />
            <Input label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} placeholder="Re-enter your new password" />
            <Button type="submit" className="w-full" loading={submitting}>{submitting ? "Resetting..." : "Reset password"}</Button>
          </form>
        )}

        <Link href="/login" className="mt-5 block w-full text-center text-sm theme-text-primary transition hover:theme-text">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}





