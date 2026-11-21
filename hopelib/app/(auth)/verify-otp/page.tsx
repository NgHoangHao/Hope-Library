"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OtpVerificationForm } from "@/features/auth";

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return <OtpVerificationForm email={email} isModal={false} />;
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-neutral-500 py-10">Đang tải...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
