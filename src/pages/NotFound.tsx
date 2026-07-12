import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { 
  Home, 
  LayoutGrid, 
  Upload, 
  Tag, 
  Headphones, 
  Twitter, 
  Youtube, 
  Instagram, 
  Mail,
  ArrowRight
} from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = "Page not found — Subbly";
  }, [location.pathname]);

  return (
    <div 
      className="flex min-h-screen flex-col bg-[#fffaf5] dark:bg-[#0c0b08] text-zinc-800 dark:text-[#f4f3ef] transition-colors duration-300" 
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <style>{`
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounceSlow 3s ease-in-out infinite;
        }
      `}</style>

      {/* Top Navbar */}
      <nav className="sticky top-0 z-[200] flex h-[72px] items-center justify-between border-b border-orange-100/40 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 px-6 backdrop-blur-xl md:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#ff5c3a]">
            <span className="font-serif-display text-[22px] font-bold text-white leading-none select-none">S</span>
          </div>
          <span className="font-serif-display text-[18px] tracking-[-0.2px] font-bold text-zinc-900 dark:text-white">Subbly</span>
        </Link>
        
        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8 text-[14.5px] font-semibold text-zinc-600 dark:text-zinc-400">
          <Link to="/" className="hover:text-[#ff5c3a] dark:hover:text-white transition-colors">Features</Link>
          <Link to="/" className="hover:text-[#ff5c3a] dark:hover:text-white transition-colors">Templates</Link>
          <Link to="/pricing" className="hover:text-[#ff5c3a] dark:hover:text-white transition-colors">Pricing</Link>
        </div>

        {/* Action Button */}
        <Link 
          to="/projects" 
          className="inline-flex items-center gap-2 rounded-xl bg-[#ff5c3a] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#ff7558] hover:shadow-orange-500/20 transition-all hover:-translate-y-0.5"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Dashboard
        </Link>
      </nav>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 md:py-16 text-center max-w-7xl mx-auto w-full">
        
        {/* Playful 404 Heading */}
        <div className="relative inline-block mb-4 mt-4">
          {/* Left dashes */}
          <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 items-end opacity-80">
            <span className="h-1 w-4 bg-[#ff5c3a] rounded-full rotate-45 origin-right" />
            <span className="h-1 w-5.5 bg-[#ff5c3a] rounded-full" />
            <span className="h-1 w-4 bg-[#ff5c3a] rounded-full -rotate-45 origin-right" />
          </div>
          
          <h1 className="text-[100px] md:text-[145px] font-extrabold tracking-tight text-[#ff5c3a] select-none leading-none">
            404
          </h1>
          
          {/* Right dashes */}
          <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 items-start opacity-80">
            <span className="h-1 w-4 bg-[#ff5c3a] rounded-full -rotate-45 origin-left" />
            <span className="h-1 w-5.5 bg-[#ff5c3a] rounded-full" />
            <span className="h-1 w-4 bg-[#ff5c3a] rounded-full rotate-45 origin-left" />
          </div>
        </div>

        {/* Heading Statement */}
        <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-850 dark:text-white tracking-tight mb-3">
          Oops! <span className="text-[#ff5c3a] dark:text-[#ff7558]">Page not found</span>
        </h2>

        {/* Subtext */}
        <p className="text-[14.5px] leading-relaxed text-zinc-550 dark:text-zinc-400 max-w-md font-medium mb-1">
          Looks like this page went on a coffee break ☕
        </p>
        <p className="text-[14.5px] leading-relaxed text-zinc-550 dark:text-zinc-400 max-w-md font-medium mb-6">
          Let's get you back on track!
        </p>

        {/* Mascot Container */}
        <div className="relative my-4 inline-block mx-auto select-none">
          {/* Soft background glow */}
          <div className="absolute inset-0 m-auto h-52 w-52 rounded-full bg-orange-100/40 dark:bg-orange-950/10 blur-2xl z-0" />
          
          {/* Mascot Image */}
          <img 
            src="/mascot-404.png" 
            alt="404 Mascot" 
            className="relative z-10 w-56 h-56 md:w-64 md:h-64 object-contain mx-auto animate-bounce-slow"
          />
          
          {/* Question mark bubble */}
          <div className="absolute top-4 left-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-900 shadow-lg border border-orange-100/50 dark:border-zinc-800/80 animate-pulse">
            <span className="text-lg font-bold text-[#ff5c3a] dark:text-[#ff7558] font-sans">?</span>
            <div className="absolute -bottom-1 right-2 h-3 w-3 rotate-45 bg-white dark:bg-zinc-900 border-r border-b border-orange-100/50 dark:border-zinc-800" />
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col items-center gap-3.5 mb-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#ff5c3a] px-8 py-4 text-[15px] font-bold text-white shadow-lg hover:bg-[#ff7558] hover:shadow-orange-500/20 transition-all hover:-translate-y-0.5"
          >
            <Home className="h-4 w-4" /> Back to Home
          </Link>
          <Link 
            to="/projects" 
            className="text-[13.5px] font-bold text-[#ff5c3a] dark:text-[#ff7558] hover:text-[#ff7558] dark:hover:text-[#ff8c73] transition-colors flex items-center gap-1 group"
          >
            Or go to Dashboard <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Suggestion Box */}
        <div className="w-full max-w-4xl rounded-3xl border border-orange-100/50 dark:border-zinc-900/60 bg-white/60 dark:bg-zinc-950/40 p-6 md:p-8 backdrop-blur-md shadow-[0_12px_40px_rgba(255,92,58,0.02)] mb-12">
          <div className="flex items-center justify-center gap-3 mb-6 select-none text-zinc-800 dark:text-zinc-200">
            {/* Left Accent */}
            <div className="flex gap-1 items-center">
              <span className="h-0.75 w-2 bg-[#ff5c3a] rounded-full rotate-45" />
              <span className="h-0.75 w-3.5 bg-[#ff5c3a] rounded-full" />
            </div>
            <h3 className="text-xs md:text-sm font-bold tracking-wider uppercase">
              Maybe you're looking for?
            </h3>
            {/* Right Accent */}
            <div className="flex gap-1 items-center">
              <span className="h-0.75 w-3.5 bg-[#ff5c3a] rounded-full" />
              <span className="h-0.75 w-2 bg-[#ff5c3a] rounded-full -rotate-45" />
            </div>
          </div>
          
          {/* Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Upload,
                title: "Upload Video",
                desc: "Generate captions for your videos",
                to: "/editor",
              },
              {
                icon: LayoutGrid,
                title: "Templates",
                desc: "Explore beautiful caption styles",
                to: "/editor",
              },
              {
                icon: Tag,
                title: "Pricing",
                desc: "View plans and choose yours",
                to: "/pricing",
              },
              {
                icon: Headphones,
                title: "Help Center",
                desc: "Get help and support",
                to: "/contact",
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <Link
                  key={idx}
                  to={card.to}
                  className="group flex flex-col items-center text-center p-5 rounded-2xl border border-zinc-100 dark:border-zinc-900/60 bg-white dark:bg-zinc-900/30 hover:border-orange-200 dark:hover:border-orange-950 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50/80 dark:bg-zinc-800/80 text-[#ff5c3a] dark:text-[#ff7558] group-hover:bg-[#ff5c3a] group-hover:text-white dark:group-hover:text-black transition-all duration-300">
                    <Icon className="h-5.5 w-5.5" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1 group-hover:text-[#ff5c3a] dark:group-hover:text-[#ff7558] transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-[11.5px] leading-relaxed text-zinc-400 dark:text-zinc-500 font-medium">
                    {card.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-orange-100/30 dark:border-zinc-900/60 pt-8 w-full">
          <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
            <div className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-[#ff5c3a]">
              <span className="font-serif-display text-[13px] font-bold text-white leading-none select-none">S</span>
            </div>
            <span className="font-bold text-zinc-700 dark:text-zinc-300">Subbly</span>
            <span>© 2026 Subbly. All rights reserved.</span>
          </div>
          
          <div className="flex items-center gap-4 text-zinc-450 dark:text-zinc-500">
            <a href="#" className="hover:text-[#ff5c3a] transition-colors"><Twitter className="h-4 w-4" /></a>
            <a href="#" className="hover:text-[#ff5c3a] transition-colors"><Youtube className="h-4 w-4" /></a>
            <a href="#" className="hover:text-[#ff5c3a] transition-colors"><Instagram className="h-4 w-4" /></a>
            <a href="#" className="hover:text-[#ff5c3a] transition-colors"><Mail className="h-4 w-4" /></a>
          </div>
        </div>

      </main>
    </div>
  );
};

export default NotFound;
