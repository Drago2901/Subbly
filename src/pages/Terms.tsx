import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#1a1a1a] transition-colors duration-300" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Seo
        title="Terms of Service — Subbly"
        description="Review the terms and conditions for using Subbly's AI video caption editor."
        path="/terms"
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
      <main className="mx-auto w-full max-w-[800px] px-6 py-12 md:py-20">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-[#666] transition hover:text-[#1a1a1a]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="font-serif text-[42px] font-normal leading-tight tracking-[-1.5px] mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-[#b0aba4] mb-10">Last Updated: July 10, 2026</p>

        <div className="prose prose-neutral max-w-none text-[15px] leading-[1.8] text-[#333] space-y-6">
          <section>
            <h2 className="text-[20px] font-semibold text-[#1a1a1a] mt-8 mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using Subbly ("Service"), a service provided to you, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#1a1a1a] mt-8 mb-3">2. Description of Service</h2>
            <p>
              Subbly is an AI-powered video caption editor. We provide tools to upload video/audio files, transcribe the media using AI, customize subtitles, and export captioned media. We reserve the right to modify, suspend, or terminate the Service at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#1a1a1a] mt-8 mb-3">3. User Accounts</h2>
            <p>
              To use certain features, such as saving projects or upgrading plans, you must create a Subbly account. You are responsible for maintaining the confidentiality of your account credentials and are fully responsible for all activities that occur under your account. You must notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#1a1a1a] mt-8 mb-3">4. Content & Intellectual Property</h2>
            <p>
              You retain all ownership rights to the media files (video, audio, text) that you upload to Subbly. By uploading content, you grant Subbly a limited, worldwide license to process your media solely for the purpose of delivering the requested services (transcribing, rendering, and exporting). We do not use your media to train AI models unless explicitly agreed upon.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#1a1a1a] mt-8 mb-3">5. Subscription Plans & Billing</h2>
            <p>
              Certain features and limits (such as removing watermarks or increasing transcription quotas) require a paid subscription. All fees are billed in advance and are non-refundable unless required by law. Recurring plans will automatically renew unless cancelled prior to the renewal date.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#1a1a1a] mt-8 mb-3">6. Accuracy of Transcriptions & Disclaimer</h2>
            <p>
              AI-generated transcriptions and translations are provided "as is" and "as available". While we strive for high accuracy, Subbly does not guarantee that transcriptions or translations will be error-free, and we are not liable for any mistakes, typos, or inaccuracies in the processed captions.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#1a1a1a] mt-8 mb-3">7. Limitation of Liability</h2>
            <p>
              In no event shall Subbly, its directors, employees, or partners, be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, use, or goodwill, arising out of your access to or use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#1a1a1a] mt-8 mb-3">8. Changes to Terms</h2>
            <p>
              We may revise these Terms of Service from time to time. The most current version will always be posted on this page. By continuing to access or use the Service after revisions become effective, you agree to be bound by the updated terms.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
