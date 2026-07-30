import { useState, useEffect, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";

import { Loader2, Sun, Moon, Eye, EyeOff, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Seo } from "@/components/Seo";
import { LampLayout } from "@/components/auth/LampLayout";

const Auth = () => {
  const { user, loading, isAdmin } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const redirectTo = location.state?.from || (isAdmin ? "/admin" : "/");

  const [tab, setTab] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Lamp specific states
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginError, setLoginError] = useState(false);

  // OTP/Forgot password wizard states
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "reset">("email");
  const [otpVal, setOtpVal] = useState<string[]>(Array(6).fill(""));
  const [otpError, setOtpError] = useState("");
  const [otpTimer, setOtpTimer] = useState(600); // 10 minutes (600s)
  const [resendTimer, setResendTimer] = useState(0); // 60s countdown for resend
  const [resendCount, setResendCount] = useState(0);
  const [attemptsCount, setAttemptsCount] = useState(0);

  // New password reset states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password requirements checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const meetsAllRequirements = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const getPasswordStrength = () => {
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (hasMinLength) score += 1;
    if (hasUppercase) score += 1;
    if (hasLowercase) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;

    if (score <= 2) return { text: "Weak", color: "bg-red-500", percent: 33 };
    if (score <= 4) return { text: "Medium", color: "bg-yellow-500", percent: 66 };
    return { text: "Strong", color: "bg-green-500", percent: 100 };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isRecovering = tab === "forgot" && forgotStep === "reset";

  useEffect(() => {
    // If user clicked email recovery link, set tab and step to reset
    if (window.location.hash && window.location.hash.includes("type=recovery")) {
      setTab("forgot");
      setForgotStep("reset");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setTab("forgot");
        setForgotStep("reset");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (tab === "forgot" && forgotStep === "otp") {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });

        setResendTimer((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [tab, forgotStep]);

  if (!loading && user && !isRecovering) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setLoginError(false);

    // Normalize input to handle case-sensitivity and leading/trailing spaces
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      if (tab === "signin") {
        // Superadmin bypass
        if (cleanEmail === "superadmin@gmail.com" && cleanPassword === "SuperAdm@123") {
          localStorage.setItem(
            "mock_session",
            JSON.stringify({
              email: "superadmin@gmail.com",
              role: "super_admin",
              name: "Super Admin",
            })
          );

          // Seed default users if empty/blank on login
          const existingUsers = localStorage.getItem("rbac_users");
          let needsSeed = false;
          if (!existingUsers) {
            needsSeed = true;
          } else {
            try {
              const parsed = JSON.parse(existingUsers);
              if (!Array.isArray(parsed) || parsed.length === 0) {
                needsSeed = true;
              }
            } catch (e) {
              needsSeed = true;
            }
          }

          if (needsSeed) {
            const defaultUsers = [
              {
                name: "Super Admin",
                email: "superadmin@gmail.com",
                role: "super_admin",
                password: "SuperAdm@123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Admin Operator",
                email: "admin@gmail.com",
                role: "admin",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Manager User",
                email: "manager@gmail.com",
                role: "manager",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Content Editor",
                email: "editor@gmail.com",
                role: "editor",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Moderator User",
                email: "moderator@gmail.com",
                role: "moderator",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Support Executive",
                email: "support@gmail.com",
                role: "support_agent",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Content Creator",
                email: "creator@gmail.com",
                role: "content_creator",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Viewer User",
                email: "viewer@gmail.com",
                role: "viewer",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Accountant User",
                email: "accountant@gmail.com",
                role: "accountant",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Marketing Manager",
                email: "marketing@gmail.com",
                role: "marketing_manager",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "HR Manager",
                email: "hr@gmail.com",
                role: "hr_manager",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Regular Customer",
                email: "customer@gmail.com",
                role: "customer",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
            ];
            localStorage.setItem("rbac_users", JSON.stringify(defaultUsers));
          }

          toast.success("Welcome back, Super Admin!");
          setLoginSuccess(true);
          setTimeout(() => {
            window.location.href = "/admin";
          }, 800);
          return;
        }

        // Custom local RBAC users bypass
        try {
          interface LocalUser {
            email: string;
            password?: string;
            role: string;
            name: string;
          }
          let localUsersStr = localStorage.getItem("rbac_users");
          if (!localUsersStr) {
            // Seed on the fly if somehow missing in local storage
            const defaultUsers = [
              {
                name: "Super Admin",
                email: "superadmin@gmail.com",
                role: "super_admin",
                password: "SuperAdm@123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Admin Operator",
                email: "admin@gmail.com",
                role: "admin",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Manager User",
                email: "manager@gmail.com",
                role: "manager",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Content Editor",
                email: "editor@gmail.com",
                role: "editor",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Moderator User",
                email: "moderator@gmail.com",
                role: "moderator",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Support Executive",
                email: "support@gmail.com",
                role: "support_agent",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Content Creator",
                email: "creator@gmail.com",
                role: "content_creator",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Viewer User",
                email: "viewer@gmail.com",
                role: "viewer",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Accountant User",
                email: "accountant@gmail.com",
                role: "accountant",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Marketing Manager",
                email: "marketing@gmail.com",
                role: "marketing_manager",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "HR Manager",
                email: "hr@gmail.com",
                role: "hr_manager",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
              {
                name: "Regular Customer",
                email: "customer@gmail.com",
                role: "customer",
                password: "password123",
                created_at: new Date().toLocaleDateString(),
              },
            ];
            localStorage.setItem("rbac_users", JSON.stringify(defaultUsers));
            localUsersStr = JSON.stringify(defaultUsers);
          }

          if (localUsersStr) {
            const localUsers = JSON.parse(localUsersStr);
            if (Array.isArray(localUsers)) {
              const matchedUser = localUsers.find(
                (u: LocalUser) =>
                  u.email.trim().toLowerCase() === cleanEmail &&
                  u.password?.trim() === cleanPassword
              ) as LocalUser | undefined;

              if (matchedUser) {
                const isSuper = matchedUser.email.trim().toLowerCase() === "superadmin@gmail.com" || matchedUser.role === "super_admin";
                const isAdminRole = matchedUser.role === "admin";
                const activeRole = isSuper ? "super_admin" : (isAdminRole ? "admin" : "customer");

                localStorage.setItem(
                  "mock_session",
                  JSON.stringify({
                    email: matchedUser.email.trim().toLowerCase(),
                    role: activeRole,
                    name: matchedUser.name,
                  })
                );
                toast.success(`Welcome back, ${matchedUser.name}!`);
                setLoginSuccess(true);
                setTimeout(() => {
                  const isStaff = activeRole === "super_admin" || activeRole === "admin";
                  window.location.href = isStaff ? "/admin" : "/";
                }, 800);
                return;
              }
            }
          }
        } catch (err) {
          console.error("Local RBAC login check failed:", err);
        }

        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
        if (error) throw error;
        setLoginSuccess(true);
        toast.success("Welcome back!");
      } else if (tab === "signup") {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: name || undefined },
          },
        });

        const userExistsByLink = signUpData?.user && (!signUpData.user.identities || signUpData.user.identities.length === 0);

        if (signUpError || userExistsByLink) {
          const isRegisteredError = signUpError && (
            signUpError.message.toLowerCase().includes("already") ||
            signUpError.message.toLowerCase().includes("registered") ||
            signUpError.message.toLowerCase().includes("exists")
          );

          if (isRegisteredError || userExistsByLink) {
            try {
              const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
              if (signInError) {
                throw new Error("This email is already registered, and auto-login failed (incorrect password).");
              }
              setLoginSuccess(true);
              toast.success("Welcome back! Logged in automatically.");
              return;
            } catch (loginErr) {
              throw loginErr instanceof Error ? loginErr : (signUpError || new Error("Auto-login failed"));
            }
          }
          if (signUpError) throw signUpError;
        }

        try {
          const existingUsers = JSON.parse(localStorage.getItem("rbac_users") || "[]") as { email: string }[];
          if (!existingUsers.some((u) => u.email === email)) {
            const newUser = {
              name: name || email.split("@")[0],
              email: email,
              role: "customer",
              password: password,
              created_at: new Date().toLocaleDateString(),
            };
            localStorage.setItem("rbac_users", JSON.stringify([...existingUsers, newUser]));
          }
        } catch (e) {
          console.error("Failed to sync user locally:", e);
        }

        toast.success("Check your inbox to confirm your email.");
      }
    } catch (err) {
      setLoginError(true);
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/",
        },
      });
      if (error) {
        setLoginError(true);
        toast.error(error.message || "Google sign-in failed");
        return;
      }
      setLoginSuccess(true);
    } catch (err) {
      setLoginError(true);
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (!password) {
      toast.error("Password is empty");
      return;
    }
    navigator.clipboard.writeText(password);
    toast.success("Password copied to clipboard!");
  };

  // OTP Flow Handlers
  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      // Check database/localStorage for user existence
      const localUsersStr = localStorage.getItem("rbac_users");
      const localUsers = localUsersStr ? JSON.parse(localUsersStr) as { email: string }[] : [];
      const userExists = Array.isArray(localUsers) && localUsers.some((u) => u.email.toLowerCase() === email.toLowerCase());

      if (!userExists) {
        // Expose no account found message as requested by user specs
        toast.error("No account found with this email.");
        return;
      }

      // Generate secure 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = btoa(generatedOtp); // btoa as simple secure hash simulation

      // Store OTP data in database / localStorage simulation
      const otpData = {
        email: email.toLowerCase(),
        otpHash: otpHash,
        created_at: new Date().getTime(),
        expires_at: new Date().getTime() + 10 * 60 * 1000, // 10 minutes expiry
        verified: false,
        attempts: 0,
        resend_count: 0
      };
      localStorage.setItem("password_reset_otp", JSON.stringify(otpData));

      setAttemptsCount(0);
      setResendCount(0);
      setForgotStep("otp");
      setOtpTimer(600); // 10 minutes
      setResendTimer(60); // 60 seconds resend cooldown
      setOtpVal(Array(6).fill(""));
      setOtpError("");

      console.log(`[Forgot Password] OTP for ${email}: ${generatedOtp}`);
      toast.success(`Verification code sent! (Dev Mode: OTP is ${generatedOtp})`, {
        duration: 8000
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to initiate recovery");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = () => {
    if (resendCount >= 5) {
      toast.error("Maximum resend attempts reached.");
      return;
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = btoa(generatedOtp);

    const otpDataStr = localStorage.getItem("password_reset_otp");
    if (otpDataStr) {
      const otpData = JSON.parse(otpDataStr);
      otpData.otpHash = otpHash;
      otpData.created_at = new Date().getTime();
      otpData.expires_at = new Date().getTime() + 10 * 60 * 1000;
      otpData.resend_count += 1;
      localStorage.setItem("password_reset_otp", JSON.stringify(otpData));
    }

    setResendCount((prev) => prev + 1);
    setOtpTimer(600);
    setResendTimer(60);
    setOtpVal(Array(6).fill(""));
    setOtpError("");

    console.log(`[Forgot Password] Resent OTP for ${email}: ${generatedOtp}`);
    toast.success(`We've sent a verification code to your email. (Dev Mode: OTP is ${generatedOtp})`, {
      duration: 8000
    });
  };

  const handleVerifyOtp = (e: FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpVal.join("");
    if (enteredOtp.length < 6) {
      setOtpError("Please enter all 6 digits.");
      return;
    }

    if (attemptsCount >= 5) {
      setOtpError("Maximum verification attempts reached.");
      return;
    }

    const otpDataStr = localStorage.getItem("password_reset_otp");
    if (!otpDataStr) {
      setOtpError("No verification session found. Please request a new code.");
      return;
    }

    const otpData = JSON.parse(otpDataStr);
    const now = new Date().getTime();

    if (now > otpData.expires_at || otpTimer === 0) {
      setOtpError("OTP has expired. Please request a new code.");
      return;
    }

    const hashedEntered = btoa(enteredOtp);
    if (hashedEntered !== otpData.otpHash) {
      setAttemptsCount((prev) => prev + 1);
      setOtpError("Invalid verification code.");
      return;
    }

    // Mark verified
    otpData.verified = true;
    localStorage.setItem("password_reset_otp", JSON.stringify(otpData));
    setForgotStep("reset");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSavePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!meetsAllRequirements) {
      toast.error("Password does not meet requirements.");
      return;
    }

    const otpDataStr = localStorage.getItem("password_reset_otp");
    if (!otpDataStr) {
      toast.error("Invalid session. Please restart Forgot Password flow.");
      return;
    }

    const otpData = JSON.parse(otpDataStr);
    if (!otpData.verified) {
      toast.error("OTP verification is required first.");
      return;
    }

    setSubmitting(true);
    try {
      // Check old password
      const localUsersStr = localStorage.getItem("rbac_users");
      const localUsers = localUsersStr ? JSON.parse(localUsersStr) as { email: string; password?: string }[] : [];
      const userIndex = Array.isArray(localUsers)
        ? localUsers.findIndex((u) => u.email.toLowerCase() === otpData.email.toLowerCase())
        : -1;

      if (userIndex !== -1) {
        const oldPass = localUsers[userIndex].password;
        if (oldPass === newPassword) {
          toast.error("New password cannot be the same as the previous password.");
          setSubmitting(false);
          return;
        }

        // Update locally
        localUsers[userIndex].password = newPassword;
        localStorage.setItem("rbac_users", JSON.stringify(localUsers));
      }

      // Also call Supabase auth.updateUser if it's a real Supabase user session
      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch (err) {
        console.warn("Could not update Supabase user password (may not be signed in yet):", err);
      }

      // Delete active reset token/OTP
      localStorage.removeItem("password_reset_otp");

      toast.success("Your password has been reset successfully.");

      setTimeout(() => {
        setTab("signin");
        setForgotStep("email");
        setEmail("");
        setPassword("");
      }, 3000);

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (isNaN(Number(val))) return;
    const newOtp = [...otpVal];
    newOtp[index] = val.slice(-1);
    setOtpVal(newOtp);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpVal[index] && index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        if (prevInput) {
          (prevInput as HTMLInputElement).focus();
          const newOtp = [...otpVal];
          newOtp[index - 1] = "";
          setOtpVal(newOtp);
        }
      } else {
        const newOtp = [...otpVal];
        newOtp[index] = "";
        setOtpVal(newOtp);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (pastedData.length === 6 && !isNaN(Number(pastedData))) {
      setOtpVal(pastedData.split(""));
      const lastInput = document.getElementById("otp-5");
      if (lastInput) (lastInput as HTMLInputElement).focus();
    }
  };

  return (
    <LampLayout isSuccess={loginSuccess}>
      <Seo
        title="Sign in — Subbly"
        description="Sign in or create a free Subbly account to auto-caption your videos, style subtitles, and export captioned MP4s."
        path="/auth"
      />
      <form onSubmit={tab === "forgot" ? (forgotStep === "email" ? handleRequestOtp : forgotStep === "otp" ? handleVerifyOtp : handleSavePassword) : handleSubmit} autoComplete="off">
        <h1>
          {(tab === "signin" || tab === "signup") && (tab === "signin" ? "Welcome back 👋" : "Create your account")}
          {tab === "forgot" && (
            forgotStep === "email" ? "Reset your password" :
            forgotStep === "otp" ? "Verify Code" : "Set new password"
          )}
        </h1>
        <p className="sub">
          {tab === "signin" && "Sign in to continue to Subbly"}
          {tab === "signup" && "Start captioning videos for free"}
          {tab === "forgot" && (
            forgotStep === "email" ? "We'll send you a password reset link to your email." :
            forgotStep === "otp" ? "Enter the 6-digit verification code sent to your email." :
            "Enter a new password for your account."
          )}
        </p>

        {(tab === "signin" || tab === "signup") && (
          <div className="lamp-tab-switcher">
            <button
              type="button"
              onClick={() => setTab("signin")}
              className={`lamp-tab-btn ${tab === "signin" ? "active" : ""}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`lamp-tab-btn ${tab === "signup" ? "active" : ""}`}
            >
              Create account
            </button>
          </div>
        )}

        {(tab === "signin" || tab === "signup") && (
          <>
            {tab === "signup" && (
              <div className="lamp-field">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
            )}
            <div className="lamp-field">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
              />
            </div>
            <div className="lamp-field">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={tab === "signin" ? "current-password" : "new-password"}
                minLength={tab === "signup" ? 6 : undefined}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
              <button
                type="button"
                className="eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            
            {tab === "signin" && (
              <div className="lamp-row-between">
                <button
                  type="button"
                  onClick={() => {
                    setTab("forgot");
                    setForgotStep("email");
                  }}
                  className="lamp-forgot bg-transparent border-none cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="lamp-btn-primary"
            >
              {tab === "signin" ? "Sign In" : "Create account"}
            </button>
          </>
        )}

        {tab === "forgot" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              {[
                { id: "email", label: "Email" },
                { id: "otp", label: "OTP" },
                { id: "reset", label: "Reset" }
              ].map((step, idx) => {
                const isActive = forgotStep === step.id;
                const isCompleted =
                  (step.id === "email" && (forgotStep === "otp" || forgotStep === "reset")) ||
                  (step.id === "otp" && forgotStep === "reset");

                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${isActive
                        ? "bg-[#FF7A00] text-[#161005]"
                        : isCompleted
                          ? "bg-[#FFC857] text-[#161005]"
                          : "bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)]"
                      }`}>
                      {idx + 1}
                    </div>
                  </div>
                );
              })}
            </div>

            {forgotStep === "email" && (
              <>
                <div className="lamp-field">
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <button type="submit" disabled={submitting} className="lamp-btn-primary">
                  Send Reset Link
                </button>
              </>
            )}

            {forgotStep === "otp" && (
              <>
                <div className="flex justify-between gap-2 mb-4" onPaste={handleOtpPaste}>
                  {otpVal.map((v, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      maxLength={1}
                      value={v}
                      onChange={(e) => {
                        const newOtp = [...otpVal];
                        newOtp[i] = e.target.value;
                        setOtpVal(newOtp);
                        if (e.target.value && i < 5) {
                          const next = document.getElementById(`otp-${i + 1}`);
                          if (next) next.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otpVal[i] && i > 0) {
                          const prev = document.getElementById(`otp-${i - 1}`);
                          if (prev) {
                            prev.focus();
                            const newOtp = [...otpVal];
                            newOtp[i - 1] = "";
                            setOtpVal(newOtp);
                          }
                        }
                      }}
                      className="w-10 h-10 text-center rounded-[8px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] text-white text-[16px] focus:border-[#FF7A00] outline-none"
                    />
                  ))}
                </div>
                <button type="submit" disabled={submitting || otpVal.join("").length !== 6} className="lamp-btn-primary">
                  Verify Code
                </button>
              </>
            )}

            {forgotStep === "reset" && (
              <>
                <div className="lamp-field">
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                  />
                  <button
                    type="button"
                    className="eye"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
                <div className="lamp-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <button type="submit" disabled={submitting} className="lamp-btn-primary">
                  Save Password
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setTab("signin");
                setForgotStep("email");
              }}
              className="mt-6 text-center text-[12px] text-[#FF7A00] hover:underline block w-full focus:outline-none bg-transparent border-none cursor-pointer"
            >
              Back to sign in
            </button>
          </div>
        )}

        {(tab === "signin" || tab === "signup") && (
          <>
            <div className="lamp-divider">or</div>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="lamp-btn-google"
            >
              {googleLoading ? "Loading..." : (
                <svg width="17" height="17" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l6-6C34.5 5.5 29.5 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13.5 24 13.5c3.1 0 5.8 1.1 8 2.9l6-6C34.5 5.5 29.5 3.5 24 3.5c-7.7 0-14.4 4.4-17.7 11.2z"/><path fill="#4CAF50" d="M24 44.5c5.4 0 10.3-1.8 14.1-5l-6.5-5.3c-2 1.4-4.6 2.3-7.6 2.3-5.3 0-9.7-3.3-11.3-7.9l-6.6 5C9.5 40 16.2 44.5 24 44.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.7l6.5 5.3c-.5.4 6.9-5 6.9-15.5 0-1.2-.1-2.4-.3-3.5z"/></svg>
              )}
              Continue with Google
            </button>
          </>
        )}

        <div className={`lamp-success ${loginSuccess ? 'show' : ''}`}>
          <div className="check"><svg viewBox="0 0 24 24" fill="none" stroke="#FFC857" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg></div>
          <h3>Welcome back!</h3>
          <span>Redirecting to your dashboard…</span>
        </div>
      </form>
    </LampLayout>
  );
};

export default Auth;
