"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ForgotPasswordForm,
  OtpVerificationForm,
  ResetPasswordForm,
} from "@/features/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<"email" | "otp" | "reset-password">("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  if (step === "otp") {
    return (
      <OtpVerificationForm
        email={email}
        mode="reset-password"
        isModal={false}
        onSuccess={(token) => {
          if (token) {
            setResetToken(token);
          }
          setStep("reset-password");
        }}
        onBackToLogin={() => setStep("email")}
        onClose={() => router.push("/")}
      />
    );
  }

  if (step === "reset-password") {
    return (
      <ResetPasswordForm
        resetToken={resetToken}
        email={email}
        isModal={false}
        onSuccess={() => {
          router.push("/login");
        }}
        onBackToLogin={() => router.push("/login")}
        onClose={() => router.push("/")}
      />
    );
  }

  return (
    <ForgotPasswordForm
      isModal={false}
      onSuccess={(submittedEmail) => {
        setEmail(submittedEmail);
        setStep("otp");
      }}
      onBackToLogin={() => router.push("/login")}
      onClose={() => router.push("/")}
    />
  );
}
