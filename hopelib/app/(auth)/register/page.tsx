"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegisterForm, OtpVerificationForm } from "@/features/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"register" | "otp">("register");
  const [registeredEmail, setRegisteredEmail] = useState("");

  if (step === "otp") {
    return (
      <OtpVerificationForm
        email={registeredEmail}
        isModal={false}
        onSuccess={() => {
          router.push("/login");
        }}
      />
    );
  }

  return (
    <RegisterForm
      isModal={false}
      onSuccess={(email) => {
        setRegisteredEmail(email);
        setStep("otp");
      }}
    />
  );
}
