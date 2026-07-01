import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = "Page not found — Subbly";
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f3ee] text-[#1a1a1a]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <nav className="sticky top-0 z-[200] flex h-[62px] items-center justify-between border-b border-[#e8e4de] bg-white/95 px-6 backdrop-blur-xl md:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#ff5c3a]">
            <span className="font-serif-display text-[22px] font-bold text-white leading-none select-none">S</span>
          </div>
          <span className="font-serif-display text-[18px] tracking-[-0.2px]">Subbly</span>
        </Link>
      </nav>
      <main className="flex flex-1 items-center justify-center px-6 py-20 text-center">
        <div className="max-w-md">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[#ffd5cc] bg-[#fff5f3] px-4 py-1.5 text-xs font-medium text-[#ff5c3a]">
            <span className="h-[5px] w-[5px] rounded-full bg-[#ff5c3a]" />
            Error 404
          </div>
          <h1 className="font-serif-display mb-4 text-[62px] font-normal leading-none tracking-[-2px]">
            Page <em className="italic text-[#ff5c3a]">not found</em>
          </h1>
          <p className="mb-9 text-[16px] leading-[1.8] text-[#666]">
            The page you're looking for doesn't exist or has moved.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#ff5c3a] px-7 py-3.5 text-[14.5px] font-medium text-white transition hover:-translate-y-0.5 hover:bg-[#ff7558] hover:shadow-[0_6px_24px_rgba(255,92,58,0.32)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} /> Back to home
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
