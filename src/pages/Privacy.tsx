import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";
import { NavBar } from "@/components/NavBar";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#1a1a1a] transition-colors duration-300" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Seo
        title="Privacy Policy — Subbly"
        description="Learn how Subbly handles and protects your data, videos, and privacy."
        path="/privacy"
      />

      <NavBar isPublic />

      {/* Content Container */}
      <main className="mx-auto w-full max-w-[800px] px-6 py-12 md:py-20">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-[#666] transition hover:text-[#1a1a1a]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="font-serif text-[42px] font-normal leading-tight tracking-[-1.5px] mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-[#b0aba4] mb-10">Last Updated: July 10, 2026</p>

        <div className="prose prose-neutral max-w-none text-[15px] leading-[1.8] text-[#333] space-y-6">
          <section>
            <h2 className="text-[20px] font-semibold text-[#1a1a1a] mt-8 mb-3">1. Information We Collect</h2>
            <p>
              We collect information to provide a better service to our users. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Account Information:</strong> When you sign up, we collect your email address, name, and profile settings (handled securely via Supabase Auth).</li>
              <li><strong>Usage Data:</strong> We collect metrics on how you use our editor, features used, and project count.</li>
              <li><strong>Uploaded Media:</strong> We temporarily process video and audio files you upload to transcribe or render them.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#1a1a1a] mt-8 mb-3">2. How We Process Your Media</h2>
            <p>
              Your privacy is extremely important to us. When you upload media for caption generation:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Media files are processed transiently to extract audio and perform AI-based voice transcription.</li>
              <li>We use highly secure third-party AI services (like ElevenLabs) to perform transcribing. Your audio is sent securely via SSL and is not used by those engines to train public models.</li>
              <li>Your uploaded videos and exported outputs are stored in private Supabase Storage buckets, protected by Row Level Security (RLS) so only you can access them.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#1a1a1a] mt-8 mb-3">3. Cookies and Storage</h2>
            <p>
              We use local storage and standard authentication cookies to keep you securely signed in to your account. You can disable cookies or clear local storage through your browser settings, but some features of the service may not function correctly.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#1a1a1a] mt-8 mb-3">4. Information Sharing & Third Parties</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We share data only with trusted service providers necessary to run our service:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Supabase:</strong> For database storage, user authentication, and media storage.</li>
              <li><strong>ElevenLabs:</strong> For audio speech-to-text processing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#1a1a1a] mt-8 mb-3">5. Data Retention</h2>
            <p>
              We store your account and profile details as long as your account is active. You can delete your projects or delete your entire account at any time, which permanently removes all associated videos, transcription logs, and profiles from our database and storage buckets.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#1a1a1a] mt-8 mb-3">6. Security</h2>
            <p>
              We implement industry-standard security measures (such as SSL encryption, encrypted databases, and private storage policies) to protect your personal information and media files. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#1a1a1a] mt-8 mb-3">7. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or how we handle your data, please contact us.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
