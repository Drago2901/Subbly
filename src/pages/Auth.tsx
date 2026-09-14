import { useState, useEffect, useRef, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Bookmark,
  Layers,
  Zap,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Users,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Seo } from "@/components/Seo";
import { HangingPendantLamp } from "@/components/auth/HangingPendantLamp";
import { CozyWorkspaceEnvironment } from "@/components/auth/CozyWorkspaceEnvironment";
import { SubblyLogoIcon } from "@/components/BrandLogo";
import "./Auth.css";

// Synthesize pleasant analog click audio when turning on the lamp
const playLampClickSound = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(850, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Graceful fallback if user gesture is required
  }
};

const Auth = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const redirectTo = location.state?.from || (isAdmin ? "/admin" : "/");

  // Lamp & Environment State
  const [isLit, setIsLit] = useState(() => {
    // Keep lit if already turned on in this browser session
    return sessionStorage.getItem("subbly_lamp_lit") === "true";
  });
  const [isFlickering, setIsFlickering] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Tabs & Forms State
  const [tab, setTab] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP / Forgot Password Flow
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "reset">("email");
  const [otpVal, setOtpVal] = useState<string[]>(Array(6).fill(""));
  const [otpError, setOtpError] = useState("");
  const [otpTimer, setOtpTimer] = useState(600);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [attemptsCount, setAttemptsCount] = useState(0);

  // Reset Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password Requirements
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const meetsAllRequirements =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const getPasswordStrength = () => {
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (hasMinLength) score += 1;
    if (hasUppercase) score += 1;
    if (hasLowercase) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;

    if (score <= 2) return { text: "Weak", color: "bg-red-500", percent: 33 };
    if (score <= 4) return { text: "Medium", color: "bg-amber-500", percent: 66 };
    return { text: "Strong", color: "bg-emerald-500", percent: 100 };
  };

  const isRecovering = tab === "forgot" && forgotStep === "reset";

  // Check URL hash for recovery link
  useEffect(() => {
    if (window.location.hash && window.location.hash.includes("type=recovery")) {
      setIsLit(true);
      setTab("forgot");
      setForgotStep("reset");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsLit(true);
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
        setOtpTimer((prev) => (prev <= 1 ? 0 : prev - 1));
        setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [tab, forgotStep]);

  // If already authenticated and not resetting password, redirect
  if (!loading && user && !isRecovering) {
    return <Navigate to={redirectTo} replace />;
  }

  // Turn on the lamp sequence
  const handleTurnOnLamp = () => {
    if (isLit) return;
    playLampClickSound();
    setIsFlickering(true);

    // Warm flicker duration (~500ms) before solid illumination
    setTimeout(() => {
      setIsLit(true);
      sessionStorage.setItem("subbly_lamp_lit", "true");
    }, 220);

    setTimeout(() => {
      setIsFlickering(false);
    }, 650);
  };

  // Skip intro immediately for accessibility
  const handleSkipIntro = () => {
    setIsFlickering(false);
    setIsLit(true);
    sessionStorage.setItem("subbly_lamp_lit", "true");
  };

  // Form Submission (Sign in & Sign up)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      if (tab === "signin") {
        // Mock / Local Demo Sign-in (DEV ONLY)
        if (import.meta.env.DEV) {
          // 1. Superadmin Mock Bypass
          if (cleanEmail === "superadmin@gmail.com" && cleanPassword === "SuperAdm@123") {
            localStorage.setItem(
              "mock_session",
              JSON.stringify({
                email: "superadmin@gmail.com",
                role: "super_admin",
                name: "Super Admin",
              })
            );

            toast.success("Welcome back, Super Admin!");
            triggerSuccessRedirect("/admin");
            return;
          }

          // 2. Custom Local RBAC Users Check
          try {
            const localUsersStr = localStorage.getItem("rbac_users");
            if (localUsersStr) {
              const localUsers = JSON.parse(localUsersStr);
              if (Array.isArray(localUsers)) {
                const matched = localUsers.find(
                  (u) =>
                    u.email?.trim().toLowerCase() === cleanEmail &&
                    u.password?.trim() === cleanPassword
                );
                if (matched) {
                  const isSuper =
                    matched.email?.trim().toLowerCase() === "superadmin@gmail.com" ||
                    matched.role === "super_admin";
                  const isAdminRole = matched.role === "admin";
                  const role = isSuper ? "super_admin" : isAdminRole ? "admin" : "customer";

                  localStorage.setItem(
                    "mock_session",
                    JSON.stringify({
                      email: matched.email.trim().toLowerCase(),
                      role,
                      name: matched.name,
                    })
                  );
                  toast.success(`Welcome back, ${matched.name}!`);
                  triggerSuccessRedirect(role === "super_admin" || role === "admin" ? "/admin" : "/");
                  return;
                }
              }
            }
          } catch (err) {
            console.error("Local RBAC check error:", err);
          }
        }

        // 3. Supabase Real Auth
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (error) throw error;

        toast.success("Welcome back!");
        triggerSuccessRedirect(redirectTo);
      } else if (tab === "signup") {
        if (confirmPassword && cleanPassword !== confirmPassword.trim()) {
          toast.error("Passwords do not match.");
          setSubmitting(false);
          return;
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: name || undefined },
          },
        });

        const userExists =
          signUpData?.user &&
          (!signUpData.user.identities || signUpData.user.identities.length === 0);

        if (signUpError || userExists) {
          const isRegistered =
            signUpError &&
            (signUpError.message.toLowerCase().includes("already") ||
              signUpError.message.toLowerCase().includes("registered") ||
              signUpError.message.toLowerCase().includes("exists"));

          if (isRegistered || userExists) {
            try {
              const { error: signInError } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: cleanPassword,
              });
              if (signInError) {
                throw new Error("Email already registered. Please sign in with your password.");
              }
              toast.success("Welcome back! Logged in automatically.");
              triggerSuccessRedirect(redirectTo);
              return;
            } catch (err) {
              throw err instanceof Error ? err : (signUpError || new Error("Sign in failed"));
            }
          }
          if (signUpError) throw signUpError;
        }

        // Add to local demo users (DEV only)
        if (import.meta.env.DEV) {
          try {
            const existing = JSON.parse(localStorage.getItem("rbac_users") || "[]");
            if (!existing.some((u: { email: string }) => u.email === cleanEmail)) {
              existing.push({
                name: name || cleanEmail.split("@")[0],
                email: cleanEmail,
                role: "customer",
                password: cleanPassword,
                created_at: new Date().toLocaleDateString(),
              });
              localStorage.setItem("rbac_users", JSON.stringify(existing));
            }
          } catch (e) {
            console.error("Failed to sync user locally:", e);
          }
        }

        toast.success("Account created! Check your inbox to confirm your email.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Google OAuth
  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast.error(error.message || "Google sign-in failed");
        return;
      }
      triggerSuccessRedirect("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Success Animation Sequence
  const triggerSuccessRedirect = (targetPath: string) => {
    setLoginSuccess(true);
    setTimeout(() => {
      navigate(targetPath);
    }, 1300);
  };

  // OTP Handlers
  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }
    setSubmitting(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (!profile) {
        toast.error("No account found with this email address.");
        setSubmitting(false);
        return;
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      localStorage.setItem(
        "password_reset_otp",
        JSON.stringify({
          email: cleanEmail,
          otp: generatedOtp,
          expiresAt,
        })
      );

      const { error: fnError } = await supabase.functions.invoke("send-auth-email", {
        body: {
          email: cleanEmail,
          type: "recovery",
          otp: generatedOtp,
        },
      });

      if (fnError) {
        console.error("Failed to send OTP via Edge Function, falling back to client reset:", fnError);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/auth#type=recovery`,
        });
        if (resetError) throw resetError;
        toast.success("Password reset link sent to your email!");
      } else {
        toast.success("Verification code sent! Please check your inbox.");
      }

      setForgotStep("otp");
      setOtpVal(Array(6).fill(""));
      setOtpTimer(600);
      setResendTimer(60);
      setAttemptsCount(0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to initiate recovery");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = (e: FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpVal.join("");
    if (enteredOtp.length !== 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }

    const storedData = localStorage.getItem("password_reset_otp");
    if (!storedData) {
      setOtpError("Session expired. Please request a new code.");
      return;
    }

    const { otp, expiresAt, email: storedEmail } = JSON.parse(storedData);
    if (Date.now() > expiresAt) {
      setOtpError("Code has expired. Please request a new code.");
      return;
    }

    if (enteredOtp !== otp) {
      const nextAttempts = attemptsCount + 1;
      setAttemptsCount(nextAttempts);
      if (nextAttempts >= 5) {
        setOtpError("Too many failed attempts. Please request a new code.");
        localStorage.removeItem("password_reset_otp");
        setTimeout(() => setForgotStep("email"), 2000);
      } else {
        setOtpError(`Invalid code. ${5 - nextAttempts} attempts remaining.`);
      }
      return;
    }

    setOtpError("");
    toast.success("Code verified successfully!");
    setForgotStep("reset");
  };

  const handleSavePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!meetsAllRequirements) {
      toast.error("Password does not meet all security requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      localStorage.removeItem("password_reset_otp");
      toast.success("Password reset successfully! You can now sign in.");
      setTimeout(() => {
        setTab("signin");
        setForgotStep("email");
        setPassword("");
      }, 1200);
    } catch (err) {
      toast.error("Failed to update password");
    } finally {
      setSubmitting(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div
      className={`auth-experience-root ${isLit ? "room-illuminated" : ""} ${
        loginSuccess ? "room-success" : ""
      }`}
    >
      <Seo
        title="Sign In — Subbly"
        description="Turn on the light and create viral videos in seconds with Subbly AI caption editor."
        path="/auth"
      />

      {/* Top Navigation Bar matching Panel 1-5 */}
      <nav className="auth-top-nav">
        <Link to="/" className="auth-brand-logo-wrap" aria-label="Subbly home">
          <div className="auth-logo-badge">
            <SubblyLogoIcon />
          </div>
          <span className="auth-logo-text">Subbly</span>
        </Link>
        {!isLit ? (
          <button
            type="button"
            onClick={handleSkipIntro}
            className="auth-skip-intro-nav-btn"
            aria-label="Skip lamp introduction and open login form"
          >
            <span>Skip intro</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Link to="/" className="auth-back-link">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Subbly</span>
          </Link>
        )}
      </nav>

      {/* Hanging Centerpiece Lamp */}
      <HangingPendantLamp
        isLit={isLit}
        isFlickering={isFlickering}
        onActivate={handleTurnOnLamp}
      />

      {/* Cozy Creative Workspace Environment (3D Photorealistic Backdrop) */}
      <CozyWorkspaceEnvironment isLit={isLit} isSuccess={loginSuccess} />

      {/* Main Dual-Column Content (Revealed after Lamp turns on) */}
      {isLit && (
        <main className="auth-main-layout">
          {/* Left Column: Brand Story & Creative Features */}
          <section className="auth-brand-column">
            <h1 className="auth-hero-title">
              Ideas
              <span className="accent-orange">Feel at Home.</span>
            </h1>

            <p className="auth-hero-sub">
              Save. Organize. Express.
              <br />
              All in one place with Subbly.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <Bookmark className="h-4.5 w-4.5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="auth-feature-title">Save Anything</h3>
                  <p className="auth-feature-desc">Links, notes, memes & more</p>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <Layers className="h-4.5 w-4.5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="auth-feature-title">Stay Organized</h3>
                  <p className="auth-feature-desc">Everything in one place</p>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <Zap className="h-4.5 w-4.5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="auth-feature-title">Built for Creators</h3>
                  <p className="auth-feature-desc">Simple. Fast. Powerful.</p>
                </div>
              </div>
            </div>

            {/* Handwritten Signature matching Panel 4 & 5 */}
            <div className="auth-hero-handwritten-signature">
              Small things. Bigger ideas.
            </div>
          </section>

          {/* Right Column: Glassmorphic Authentication Card */}
          <section className="auth-card-column">
            <div className="auth-glass-card">
              <div className="auth-card-header">
                <h2>
                  {tab === "signin" && "Welcome back 👋"}
                  {tab === "signup" && "Welcome to Subbly 👋"}
                  {tab === "forgot" && "Reset your password 🔒"}
                </h2>
                <p>
                  {tab === "signin" && "Sign in to continue to Subbly"}
                  {tab === "signup" && "Create your account and start saving."}
                  {tab === "forgot" &&
                    (forgotStep === "email"
                      ? "Enter your email to receive a recovery code"
                      : forgotStep === "otp"
                      ? "Enter the 6-digit code sent to your inbox"
                      : "Create a strong new password")}
                </p>
              </div>

              {/* Segmented Tab Switcher (Sign In vs Create Account) */}
              {tab !== "forgot" && (
                <div className="auth-segmented-tabs">
                  <button
                    type="button"
                    onClick={() => setTab("signin")}
                    className={`auth-tab-btn ${tab === "signin" ? "tab-active" : ""}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("signup")}
                    className={`auth-tab-btn ${tab === "signup" ? "tab-active" : ""}`}
                  >
                    Create account
                  </button>
                </div>
              )}

              {/* Forms */}
              {tab === "forgot" ? (
                /* Forgot Password Wizard */
                <form
                  onSubmit={
                    forgotStep === "email"
                      ? handleRequestOtp
                      : forgotStep === "otp"
                      ? handleVerifyOtp
                      : handleSavePassword
                  }
                  className="auth-form"
                >
                  <div className="auth-stepper-header">
                    <div className={`auth-step-pill ${forgotStep === "email" ? "active" : "completed"}`}>
                      <span className="auth-step-num">1</span>
                      <span>Email</span>
                    </div>
                    <div className={`auth-step-pill ${forgotStep === "otp" ? "active" : forgotStep === "reset" ? "completed" : ""}`}>
                      <span className="auth-step-num">2</span>
                      <span>Code</span>
                    </div>
                    <div className={`auth-step-pill ${forgotStep === "reset" ? "active" : ""}`}>
                      <span className="auth-step-num">3</span>
                      <span>Password</span>
                    </div>
                  </div>

                  {forgotStep === "email" && (
                    <>
                      <div className="auth-input-group">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email address"
                          className="auth-input"
                        />
                        <Mail className="auth-input-icon" />
                      </div>
                      <button type="submit" disabled={submitting} className="auth-submit-btn">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Send Reset Code →</span>}
                      </button>
                    </>
                  )}

                  {forgotStep === "otp" && (
                    <>
                      <div className="auth-otp-row">
                        {otpVal.map((v, i) => (
                          <input
                            key={i}
                            id={`otp-box-${i}`}
                            type="text"
                            maxLength={1}
                            value={v}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              const next = [...otpVal];
                              next[i] = val.slice(-1);
                              setOtpVal(next);
                              if (val && i < 5) {
                                document.getElementById(`otp-box-${i + 1}`)?.focus();
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace" && !otpVal[i] && i > 0) {
                                document.getElementById(`otp-box-${i - 1}`)?.focus();
                              }
                            }}
                            className="auth-otp-box"
                          />
                        ))}
                      </div>
                      {otpError && <p className="text-xs text-red-400 text-center">{otpError}</p>}
                      <button
                        type="submit"
                        disabled={submitting || otpVal.join("").length !== 6}
                        className="auth-submit-btn"
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Verify Code →</span>}
                      </button>
                    </>
                  )}

                  {forgotStep === "reset" && (
                    <>
                      <div className="auth-input-group">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password (min 8 characters)"
                          className="auth-input"
                        />
                        <Lock className="auth-input-icon" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="auth-eye-btn"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {newPassword && (
                        <div className="auth-strength-meter">
                          <div className="auth-strength-bar-bg">
                            <div
                              className={`auth-strength-bar-fill ${strength.color}`}
                              style={{ width: `${strength.percent}%` }}
                            />
                          </div>
                          <span className="auth-strength-label">Strength: {strength.text}</span>
                        </div>
                      )}

                      <div className="auth-input-group">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="auth-input"
                        />
                        <Lock className="auth-input-icon" />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="auth-eye-btn"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || !meetsAllRequirements || newPassword !== confirmPassword}
                        className="auth-submit-btn"
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Save Password →</span>}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setTab("signin");
                      setForgotStep("email");
                    }}
                    className="mt-4 text-center text-xs text-primary hover:underline block w-full bg-transparent border-none cursor-pointer"
                  >
                    ← Back to sign in
                  </button>
                </form>
              ) : (
                /* Sign In / Sign Up Form */
                <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
                  {tab === "signup" && (
                    <div className="auth-input-group">
                      <input
                        id="name"
                        type="text"
                        autoComplete="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name"
                        className="auth-input"
                      />
                      <UserIcon className="auth-input-icon" />
                    </div>
                  )}

                  <div className="auth-input-group">
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="auth-input"
                    />
                    <Mail className="auth-input-icon" />
                  </div>

                  <div className="auth-input-group">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={tab === "signin" ? "current-password" : "new-password"}
                      required
                      minLength={tab === "signup" ? 6 : undefined}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="auth-input"
                    />
                    <Lock className="auth-input-icon" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="auth-eye-btn"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {tab === "signup" && (
                    <div className="auth-input-group">
                      <input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="auth-input"
                      />
                      <Lock className="auth-input-icon" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="auth-eye-btn"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  )}

                  {tab === "signin" && (
                    <div className="auth-forgot-row">
                      <button
                        type="button"
                        onClick={() => {
                          setTab("forgot");
                          setForgotStep("email");
                        }}
                        className="auth-forgot-btn"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  <button type="submit" disabled={submitting} className="auth-submit-btn">
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>{tab === "signin" ? "Sign In →" : "Create Account →"}</span>
                    )}
                  </button>

                  <div className="auth-divider">or</div>

                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={googleLoading}
                    className="auth-google-btn"
                  >
                    {googleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 48 48">
                        <path
                          fill="#FFC107"
                          d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l6-6C34.5 5.5 29.5 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z"
                        />
                        <path
                          fill="#FF3D00"
                          d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13.5 24 13.5c3.1 0 5.8 1.1 8 2.9l6-6C34.5 5.5 29.5 3.5 24 3.5c-7.7 0-14.4 4.4-17.7 11.2z"
                        />
                        <path
                          fill="#4CAF50"
                          d="M24 44.5c5.4 0 10.3-1.8 14.1-5l-6.5-5.3c-2 1.4-4.6 2.3-7.6 2.3-5.3 0-9.7-3.3-11.3-7.9l-6.6 5C9.5 40 16.2 44.5 24 44.5z"
                        />
                        <path
                          fill="#1976D2"
                          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.7l6.5 5.3c-.5.4 6.9-5 6.9-15.5 0-1.2-.1-2.4-.3-3.5z"
                        />
                      </svg>
                    )}
                    <span>Continue with Google</span>
                  </button>

                  {/* Trust Badges matching Panel 4 & 5 */}
                  <div className="auth-trust-badges">
                    <div className="auth-trust-badge">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <span>AI Powered</span>
                    </div>
                    <div className="auth-trust-badge">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      <span>Secure</span>
                    </div>
                    <div className="auth-trust-badge">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span>Fast & Reliable</span>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </section>
        </main>
      )}

      {/* Accessible "Skip intro" button (visible when lamp is off) */}
      {!isLit && (
        <button
          type="button"
          onClick={handleSkipIntro}
          className="auth-skip-intro-btn"
          aria-label="Skip lamp introduction and open login form"
        >
          Skip intro
        </button>
      )}

      {/* Login Success Ambient Overlay & Message (Panel 6) */}
      {loginSuccess && (
        <div className="auth-success-screen" aria-live="polite">
          <div className="auth-success-ambient" />
          <div className="auth-success-content">
            <div className="auth-success-icon-wrap">
              <Sparkles className="h-7 w-7 text-primary animate-bounce" />
            </div>
            <h2 className="auth-success-title">Welcome to Subbly!</h2>
            <p className="auth-success-sub">Bringing your ideas to life...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
