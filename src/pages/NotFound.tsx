import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Type, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = "Page not found — Subbly";
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f3ee] text-[#1a1a1a]">
      <nav className="flex items-center justify-between border-b border-[#e8e4de] bg-white px-6 py-4 md:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff5c3a]">
            <Type className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span className="text-[15px] font-medium">Subbly</span>
        </Link>
      </nav>
      <main className="flex flex-1 items-center justify-center px-6 py-20 text-center">
        <div className="max-w-md">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ffd5cc] bg-[#fff5f3] px-3.5 py-1.5 text-xs text-[#ff5c3a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff5c3a]" />
            Error 404
          </div>
          <h1 className="mb-3 text-[54px] font-medium leading-none tracking-[-0.02em]">
            Page <span className="text-[#ff5c3a]">not found</span>
          </h1>
          <p className="mb-8 text-[15px] leading-[1.75] text-[#888]">
            The page you're looking for doesn't exist or has moved.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[#ff5c3a] px-7 py-3.5 text-sm font-medium text-white hover:bg-[#ee4f2e]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
