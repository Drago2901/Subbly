import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";
import { Seo } from "@/components/Seo";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast.error("Please fill in all fields.");
      return;
    }
    
    setSending(true);
    // Simulate sending email
    setTimeout(() => {
      setSending(false);
      toast.success("Message sent successfully! We will get back to you soon.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#1a1a1a] transition-colors duration-300" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Seo
        title="Contact Us — Subbly"
        description="Get in touch with the Subbly support team at Subbly.info@gmail.com."
        path="/contact"
      />
      
      {/* Header / Nav */}
      <nav className="sticky top-0 z-[100] flex h-[64px] items-center justify-between border-b border-[#e8e4de] bg-white/90 px-6 backdrop-blur-xl md:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#ff5c3a]">
            <span className="font-serif text-[22px] font-bold text-white leading-none select-none">S</span>
          </div>
          <span className="font-serif text-[18px] font-semibold tracking-[-0.2px]">Subbly</span>
        </Link>
        <Link
          to="/auth"
          className="text-[13.5px] text-[#666] transition hover:text-[#1a1a1a]"
        >
          Sign In
        </Link>
      </nav>

      {/* Content Container */}
      <main className="mx-auto w-full max-w-[900px] px-6 py-12 md:py-20">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-[#666] transition hover:text-[#1a1a1a]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="grid gap-10 md:grid-cols-5 md:gap-16">
          {/* Main Form */}
          <div className="md:col-span-3">
            <h1 className="font-serif text-[42px] font-normal leading-tight tracking-[-1.5px] mb-3">
              Get in touch
            </h1>
            <p className="text-[14.5px] leading-relaxed text-[#666] mb-8">
              Have a question about Subbly? Need help with your captioning subscription, or want to suggest a new style template? Send us a message and we'll help you out.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[#666] mb-1.5">
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-[9px] border border-[#e8e4de] bg-white px-4 py-2.5 text-sm text-[#1a1a1a] focus:border-[#ff5c3a] focus:outline-none transition-colors"
                  placeholder="Vishal Gupta"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#666] mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[9px] border border-[#e8e4de] bg-white px-4 py-2.5 text-sm text-[#1a1a1a] focus:border-[#ff5c3a] focus:outline-none transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-xs font-semibold uppercase tracking-wider text-[#666] mb-1.5">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-[9px] border border-[#e8e4de] bg-white px-4 py-2.5 text-sm text-[#1a1a1a] focus:border-[#ff5c3a] focus:outline-none transition-colors"
                  placeholder="How can we help?"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wider text-[#666] mb-1.5">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full rounded-[9px] border border-[#e8e4de] bg-white px-4 py-2.5 text-sm text-[#1a1a1a] focus:border-[#ff5c3a] focus:outline-none transition-colors resize-none"
                  placeholder="Type your message details here..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="inline-flex w-full items-center justify-center rounded-[10px] bg-[#ff5c3a] px-7 py-3 text-[14px] font-medium text-white transition hover:-translate-y-0.5 hover:bg-[#ff7558] hover:shadow-[0_6px_24px_rgba(255,92,58,0.32)] disabled:opacity-60 cursor-pointer"
              >
                {sending ? "Sending message..." : "Send Message"}
              </button>
            </form>
          </div>

          {/* Sidebar / Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-[16px] border border-[#e8e4de] bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#ff5c3a] mb-4">Direct Contact</h3>
              
              <ul className="space-y-5">
                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff5f3] text-[#ff5c3a]">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-widest text-[#b0aba4]">Email Us</h4>
                    <a
                      href="mailto:Subbly.info@gmail.com"
                      className="mt-0.5 block text-sm font-medium text-[#1a1a1a] hover:text-[#ff5c3a] transition-colors"
                    >
                      Subbly.info@gmail.com
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff5f3] text-[#ff5c3a]">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-widest text-[#b0aba4]">Response Time</h4>
                    <p className="mt-0.5 text-sm text-[#1a1a1a] font-medium">
                      Typically within 24 hours
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff5f3] text-[#ff5c3a]">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-widest text-[#b0aba4]">Feedback & Bugs</h4>
                    <p className="mt-0.5 text-sm text-[#666] leading-relaxed">
                      We're actively adding features. Feel free to report any bug or request styles!
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
