import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("subbly_cookie_consent");
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("subbly_cookie_consent", "true");
    setIsVisible(false);
  };

  const declineCookies = () => {
    // Basic decline (still hides it)
    localStorage.setItem("subbly_cookie_consent", "false");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-sm z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-white dark:bg-[#0c0b08] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xl dark:shadow-orange-glow/10 flex flex-col gap-3 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff5c3a]/10 dark:bg-[#ff5c3a]/5 rounded-full blur-[40px] pointer-events-none" />
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm">
            <Cookie className="h-4 w-4 text-[#ff5c3a]" />
            We value your privacy
          </div>
          <button 
            onClick={declineCookies}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
          We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
          By clicking "Accept", you consent to our use of cookies.
          <Link to="/privacy" className="text-[#ff5c3a] hover:underline ml-1">
            Read Privacy Policy
          </Link>
        </p>
        
        <div className="flex items-center gap-2 mt-1 relative z-10">
          <button
            onClick={declineCookies}
            className="flex-1 py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Decline
          </button>
          <button
            onClick={acceptCookies}
            className="flex-1 py-2 px-3 rounded-lg bg-[#ff5c3a] text-white text-xs font-bold hover:bg-[#ff7558] transition-colors shadow-md shadow-orange-500/20 cursor-pointer"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};
