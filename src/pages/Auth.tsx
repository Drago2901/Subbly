import { useState, useEffect, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Sun, Moon, Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Seo } from "@/components/Seo";

const Auth = () => {
  const { user, loading, isAdmin } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const redirectTo = location.state?.from || (isAdmin ? "/admin" : "/projects");

  const [tab, setTab] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
                setTimeout(() => {
                  const isStaff = activeRole === "super_admin" || activeRole === "admin";
                  window.location.href = isStaff ? "/admin" : "/projects";
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
        toast.success("Welcome back!");
      } else if (tab === "signup") {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/projects`,
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
          redirectTo: window.location.origin + "/projects",
        },
      });
      if (error) {
        toast.error(error.message || "Google sign-in failed");
        return;
      }
    } catch (err) {
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

  const inputCls =
    "w-full rounded-[9px] border border-[#e8e4de] bg-white px-3.5 py-2.5 text-[14px] text-[#1a1a1a] outline-none transition placeholder:text-[#b0aba4] focus:border-[#ff5c3a] focus:shadow-[0_0_0_3px_rgba(255,92,58,0.1)]";
  const labelCls = "mb-[7px] block text-[12.5px] font-medium text-[#333]";

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f3ee] text-[#1a1a1a]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Seo
        title="Sign in — Subbly"
        description="Sign in or create a free Subbly account to auto-caption your videos, style subtitles, and export captioned MP4s."
        path="/auth"
      />
      <nav className="sticky top-0 z-[200] flex h-[62px] items-center justify-between border-b border-[#e8e4de] bg-white/95 px-6 backdrop-blur-xl md:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Subbly Logo"
            className="h-9 w-9 object-contain rounded-[9px] shadow-[0_2px_8px_rgba(255,92,58,0.15)]"
          />
          <span className="font-serif-display text-[18px] tracking-[-0.2px]">Subbly</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e4de] bg-white text-[#666] transition hover:text-[#1a1a1a]"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/");
              }
            }}
            className="text-[13.5px] text-[#666] transition hover:text-[#1a1a1a] bg-transparent border-none cursor-pointer"
          >
            ← Back
          </button>
        </div>
      </nav>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px] rounded-[20px] border border-[#e8e4de] bg-white p-10 shadow-[0_4px_40px_rgba(26,26,26,0.07)] md:p-12">
          <div className="mb-6 flex flex-col items-center justify-center">
            <img
              src="/logo.png"
              alt="Subbly Logo"
              className="h-16 w-16 object-contain rounded-[14px] shadow-[0_4px_16px_rgba(255,92,58,0.12)]"
            />
          </div>

          <h1 className="font-serif-display mb-2 text-center text-[30px] font-normal tracking-[-0.5px]">
            {(tab === "signin" || tab === "signup") && (tab === "signin" ? "Welcome back" : "Create your account")}
            {tab === "forgot" && (
              forgotStep === "email" ? "Reset your password" :
              forgotStep === "otp" ? "Verify Code" : "Set new password"
            )}
          </h1>
          <p className="mb-8 text-center text-[13.5px] text-[#b0aba4]">
            {tab === "signin" && "Sign in to continue captioning"}
            {tab === "signup" && "Start captioning videos for free"}
            {tab === "forgot" && (
              forgotStep === "email" ? "We'll send you a password reset link to your email." :
              forgotStep === "otp" ? "Enter the 6-digit verification code sent to your email." :
              "Enter a new password for your account."
            )}
          </p>

          {(tab === "signin" || tab === "signup") && (
            <div className="mb-7 flex gap-[3px] rounded-[9px] bg-[#f5f3ee] p-[3px]">
              <button
                type="button"
                onClick={() => setTab("signin")}
                className={`flex-1 rounded-[7px] px-2 py-2 text-[13px] transition ${
                  tab === "signin"
                    ? "bg-white font-medium text-[#1a1a1a] shadow-[0_1px_4px_rgba(26,26,26,0.08)]"
                    : "text-[#666]"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setTab("signup")}
                className={`flex-1 rounded-[7px] px-2 py-2 text-[13px] transition ${
                  tab === "signup"
                    ? "bg-white font-medium text-[#1a1a1a] shadow-[0_1px_4px_rgba(26,26,26,0.08)]"
                    : "text-[#666]"
                }`}
              >
                Create account
              </button>
            </div>
          )}

          <form onSubmit={tab === "forgot" ? (forgotStep === "email" ? handleRequestOtp : forgotStep === "otp" ? handleVerifyOtp : handleSavePassword) : handleSubmit}>
            {(tab === "signin" || tab === "signup") && (
              <>
                {tab === "signup" && (
                  <div className="mb-[18px]">
                    <label htmlFor="name" className={labelCls}>Name</label>
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputCls}
                      placeholder="Your name"
                    />
                  </div>
                )}
                <div className="mb-[18px]">
                  <label htmlFor="email" className={labelCls}>Email address</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="mb-[18px]">
                  <div className="flex justify-between items-center mb-[7px]">
                    <label htmlFor="password" className={labelCls + " mb-0"}>Password</label>
                    {tab === "signin" && (
                      <button
                        type="button"
                        onClick={() => {
                          setTab("forgot");
                          setForgotStep("email");
                        }}
                        className="text-[12.5px] font-medium text-[#ff5c3a] hover:underline focus:outline-none bg-transparent border-none cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative w-full">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={tab === "signin" ? "current-password" : "new-password"}
                      minLength={tab === "signup" ? 6 : undefined}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputCls} pr-24`}
                      placeholder="••••••••"
                    />
                    <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-neutral-400 dark:text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors focus:outline-none flex items-center justify-center p-2 cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="text-neutral-400 dark:text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors focus:outline-none flex items-center justify-center p-2 cursor-pointer"
                        aria-label="Copy password"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#ff5c3a] px-4 py-3 text-[14px] font-medium text-white transition hover:-translate-y-px hover:bg-[#ff7558] hover:shadow-[0_4px_16px_rgba(255,92,58,0.3)] disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {tab === "signin" ? "Continue" : "Create account"}
                </button>
              </>
            )}

            {tab === "forgot" && (
              <div>
                {/* Progress Indicator */}
                <div className="mb-8 flex items-center justify-between">
                  {[
                    { id: "email", label: "Verify Email" },
                    { id: "otp", label: "Verify OTP" },
                    { id: "reset", label: "Reset Password" }
                  ].map((step, idx) => {
                    const isActive = forgotStep === step.id;
                    const isCompleted = 
                      (step.id === "email" && (forgotStep === "otp" || forgotStep === "reset")) ||
                      (step.id === "otp" && forgotStep === "reset");
                      
                    return (
                      <div key={step.id} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                            isActive 
                              ? "bg-[#ff5c3a] text-white shadow-[0_0_8px_rgba(255,92,58,0.4)]"
                              : isCompleted
                                ? "bg-green-500 text-white"
                                : "bg-[#e8e4de] dark:bg-[#2a2622] text-[#666] dark:text-[#a8a39c]"
                          }`}>
                            {idx + 1}
                          </div>
                          <span className={`mt-1.5 text-[10.5px] font-medium transition ${
                            isActive ? "text-[#ff5c3a]" : isCompleted ? "text-green-500" : "text-[#b0aba4]"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                        {idx < 2 && (
                          <div className={`h-[2px] w-full -mt-4 transition ${
                            isCompleted ? "bg-green-500" : "bg-[#e8e4de] dark:bg-[#2a2622]"
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {forgotStep === "email" && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="reset-email" className={labelCls}>Email address</label>
                      <input
                        id="reset-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputCls}
                        placeholder="you@example.com"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#ff5c3a] px-4 py-3 text-[14px] font-medium text-white transition hover:-translate-y-px hover:bg-[#ff7558] hover:shadow-[0_4px_16px_rgba(255,92,58,0.3)] disabled:opacity-60"
                    >
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      Send verification code
                    </button>
                  </div>
                )}

                {forgotStep === "otp" && (
                  <div className="space-y-4">
                    <p className="text-xs text-[#666] leading-relaxed">
                      We've sent a verification code to your email.
                    </p>
                    
                    <div className="flex justify-between gap-2.5 my-4">
                      {otpVal.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-${idx}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={idx === 0 ? handleOtpPaste : undefined}
                          className="w-12 h-12 rounded-[9px] border border-[#e8e4de] text-center text-lg font-bold bg-white text-[#1a1a1a] outline-none transition focus:border-[#ff5c3a] focus:shadow-[0_0_0_3px_rgba(255,92,58,0.1)]"
                          autoFocus={idx === 0}
                        />
                      ))}
                    </div>

                    {otpError && (
                      <p className="text-xs text-red-500 font-medium">{otpError}</p>
                    )}

                    <div className="flex justify-between items-center text-[12.5px] text-[#666]">
                      <span>Code expires in: <strong className="text-[#1a1a1a]">{formatTime(otpTimer)}</strong></span>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendTimer > 0 || resendCount >= 5}
                        className="text-[#ff5c3a] hover:underline disabled:text-[#b0aba4] disabled:hover:no-underline font-medium bg-transparent border-none cursor-pointer"
                      >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#ff5c3a] px-4 py-3 text-[14px] font-medium text-white transition hover:-translate-y-px hover:bg-[#ff7558] hover:shadow-[0_4px_16px_rgba(255,92,58,0.3)] disabled:opacity-60"
                    >
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      Verify code
                    </button>
                  </div>
                )}

                {forgotStep === "reset" && (
                  <div className="space-y-4">
                    <div className="relative w-full">
                      <label htmlFor="new-password" className={labelCls}>New Password</label>
                      <div className="relative">
                        <input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={`${inputCls} pr-24`}
                          placeholder="New password"
                        />
                        <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-neutral-400 dark:text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors focus:outline-none flex items-center justify-center p-2 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(newPassword);
                              toast.success("Password copied!");
                            }}
                            className="text-neutral-400 dark:text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors focus:outline-none flex items-center justify-center p-2 cursor-pointer"
                          >
                            <Copy className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="relative w-full mt-[18px]">
                      <label htmlFor="confirm-password" className={labelCls}>Confirm Password</label>
                      <div className="relative">
                        <input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`${inputCls} pr-24`}
                          placeholder="Confirm password"
                        />
                        <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="text-neutral-400 dark:text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors focus:outline-none flex items-center justify-center p-2 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(confirmPassword);
                              toast.success("Password copied!");
                            }}
                            className="text-neutral-400 dark:text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors focus:outline-none flex items-center justify-center p-2 cursor-pointer"
                          >
                            <Copy className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="mb-4 mt-2">
                        <div className="flex justify-between items-center mb-1 text-[11.5px] font-medium text-[#666]">
                          <span>Password strength:</span>
                          <span className={
                            getPasswordStrength().text === "Weak" ? "text-red-500" : 
                            getPasswordStrength().text === "Medium" ? "text-yellow-500" : "text-green-500"
                          }>{getPasswordStrength().text}</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#e8e4de] dark:bg-[#2a2622] rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${getPasswordStrength().color}`} style={{ width: `${getPasswordStrength().percent}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Password Requirements */}
                    <div className="mb-4 mt-2 space-y-1.5">
                      <label className={labelCls}>Password requirements:</label>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                        <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-green-500 font-medium" : "text-[#b0aba4]"}`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${hasMinLength ? "bg-green-500" : "bg-[#b0aba4]"}`} />
                          Min 8 characters
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-green-500 font-medium" : "text-[#b0aba4]"}`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${hasUppercase ? "bg-green-500" : "bg-[#b0aba4]"}`} />
                          One uppercase letter
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasLowercase ? "text-green-500 font-medium" : "text-[#b0aba4]"}`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${hasLowercase ? "bg-green-500" : "bg-[#b0aba4]"}`} />
                          One lowercase letter
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasNumber ? "text-green-500 font-medium" : "text-[#b0aba4]"}`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${hasNumber ? "bg-green-500" : "bg-[#b0aba4]"}`} />
                          One number
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasSpecial ? "text-green-500 font-medium" : "text-[#b0aba4]"}`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${hasSpecial ? "bg-green-500" : "bg-[#b0aba4]"}`} />
                          One special character
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !meetsAllRequirements || newPassword !== confirmPassword}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#ff5c3a] px-4 py-3 text-[14px] font-medium text-white transition hover:-translate-y-px hover:bg-[#ff7558] hover:shadow-[0_4px_16px_rgba(255,92,58,0.3)] disabled:opacity-60"
                    >
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save Password
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setTab("signin");
                    setForgotStep("email");
                  }}
                  className="mt-6 text-center text-xs text-[#ff5c3a] hover:underline block w-full focus:outline-none bg-transparent border-none cursor-pointer"
                >
                  Back to sign in
                </button>
              </div>
            )}
          </form>

          {(tab === "signin" || tab === "signup") && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-[#b0aba4]">
                <div className="h-px flex-1 bg-[#e8e4de]" />
                or
                <div className="h-px flex-1 bg-[#e8e4de]" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-2.5 rounded-[9px] border border-[#e8e4de] bg-white px-4 py-2.5 text-[13.5px] text-[#666] transition hover:border-[#b0aba4] hover:text-[#1a1a1a] disabled:opacity-60"
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
                Continue with Google
              </button>
            </>
          )}

          <p className="mt-5 text-center text-xs text-[#b0aba4]">
            By continuing you agree to our{" "}
            <Link to="/terms" className="text-[#ff5c3a] hover:underline">Terms</Link> and{" "}
            <Link to="/privacy" className="text-[#ff5c3a] hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M15.68 8.18c0-.57-.05-1.12-.14-1.64H8v3.1h4.31a3.68 3.68 0 0 1-1.6 2.41v2h2.6c1.52-1.4 2.4-3.47 2.4-5.87z" fill="#4285F4" />
      <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.6-2.02c-.72.48-1.63.77-2.7.77-2.08 0-3.84-1.4-4.47-3.29H.85v2.08A8 8 0 0 0 8 16z" fill="#34A853" />
      <path d="M3.53 9.52A4.8 4.8 0 0 1 3.28 8c0-.53.09-1.04.25-1.52V4.4H.85A8 8 0 0 0 0 8c0 1.29.31 2.51.85 3.6l2.68-2.08z" fill="#FBBC05" />
      <path d="M8 3.18c1.17 0 2.22.4 3.05 1.2l2.28-2.28C11.96.72 10.15 0 8 0A8 8 0 0 0 .85 4.4L3.53 6.48C4.16 4.59 5.92 3.18 8 3.18z" fill="#EA4335" />
    </svg>
  );
}

export default Auth;
