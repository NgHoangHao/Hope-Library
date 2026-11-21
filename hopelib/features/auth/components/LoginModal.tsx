"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLayerDismissal, useFocusTrap } from "@/hooks";
import { useAuthModal } from "../context/AuthModalContext";
import { LoginForm } from "./LoginForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { RegisterForm } from "./RegisterForm";
import { OtpVerificationForm } from "./OtpVerificationForm";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { hasDashboardRole, getPostLoginRedirectUrl } from "../utils/auth.helper";

type AuthModalView =
  | "login"
  | "forgot-password"
  | "register"
  | "otp"
  | "reset-password";

export function LoginModal() {
  const { isLoginOpen, closeLogin, setUser } = useAuthModal();
  const [currentView, setCurrentView] = useState<AuthModalView>("login");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpMode, setOtpMode] = useState<"register" | "reset-password">("register");
  const [resetToken, setResetToken] = useState("");

  const handleClose = useCallback(() => {
    closeLogin();
    setCurrentView("login");
    setRegisteredEmail("");
    setResetToken("");
    setOtpMode("register");
  }, [closeLogin]);

  // Shared top-most Escape dismissal (với IME guard) + Focus trap
  useLayerDismissal({
    isOpen: isLoginOpen,
    onDismiss: handleClose,
  });
  const dialogRef = useFocusTrap<HTMLDivElement>({
    isActive: isLoginOpen,
  });

  // Khóa cuộn trang khi modal mở
  useEffect(() => {
    if (isLoginOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isLoginOpen]);

  if (!isLoginOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs ui-backdrop-enter"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-[460px] ui-dialog-enter"
      >
        <div key={currentView} className="ui-view-switch">
        {currentView === "login" && (
          <LoginForm
            isModal={true}
            onClose={handleClose}
            onForgotPassword={() => setCurrentView("forgot-password")}
            onNavigateRegister={() => setCurrentView("register")}
            onSuccess={(user, token) => {
              if (user) setUser(user);
              const redirectUrl = getPostLoginRedirectUrl(user, token);
              setTimeout(() => {
                handleClose();
                window.location.href = redirectUrl;
              }, 500);
            }}
          />
        )}

        {currentView === "forgot-password" && (
          <ForgotPasswordForm
            isModal={true}
            onClose={handleClose}
            onBackToLogin={() => setCurrentView("login")}
            onSuccess={(email) => {
              setRegisteredEmail(email);
              setOtpMode("reset-password");
              setCurrentView("otp");
            }}
          />
        )}

        {currentView === "register" && (
          <RegisterForm
            isModal={true}
            onClose={handleClose}
            onNavigateLogin={() => setCurrentView("login")}
            onSuccess={(email) => {
              setRegisteredEmail(email);
              setOtpMode("register");
              setCurrentView("otp");
            }}
          />
        )}

        {currentView === "otp" && (
          <OtpVerificationForm
            email={registeredEmail}
            mode={otpMode}
            isModal={true}
            onClose={handleClose}
            onBackToLogin={() =>
              setCurrentView(
                otpMode === "reset-password" ? "forgot-password" : "register"
              )
            }
            onSuccess={(token) => {
              if (otpMode === "reset-password") {
                if (token) setResetToken(token);
                setCurrentView("reset-password");
              } else {
                setTimeout(() => {
                  setCurrentView("login");
                }, 1200);
              }
            }}
          />
        )}

        {currentView === "reset-password" && (
          <ResetPasswordForm
            resetToken={resetToken}
            email={registeredEmail}
            isModal={true}
            onClose={handleClose}
            onBackToLogin={() => setCurrentView("login")}
            onSuccess={() => {
              setTimeout(() => {
                setCurrentView("login");
              }, 1200);
            }}
          />
        )}
        </div>
      </div>
    </div>
  );
}
