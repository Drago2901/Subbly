import { SEO } from "@/components/seo/SEO";

export default function AICaptionGenerator() {
  return (
    <>
      <SEO 
        title="AI Caption Generator | Auto Subtitle Generator | Subbly"
        description="Subbly is an advanced AI caption generator that automatically creates, edits, and translates subtitles for your YouTube, Instagram, and TikTok videos."
        canonicalUrl="https://subbly.in/ai-caption-generator"
      />
      <div className="min-h-screen bg-background text-foreground pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-bold font-serif-display mb-6">
            AI Caption Generator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Automatically generate high-quality captions and subtitles for your videos. Boost engagement on YouTube Shorts, Instagram Reels, and TikTok with Subbly's AI-powered video caption generator.
          </p>
        </header>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Features of our Auto Subtitle Generator</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Generate AI captions in one click.</li>
            <li>Translate subtitles into over 50 languages automatically.</li>
            <li>Easily edit and customize captions for maximum impact.</li>
            <li>Export videos with burned-in subtitles, ready for upload.</li>
          </ul>
        </section>

        <section className="mb-16 bg-muted p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">Benefits of Using AI for Captions</h2>
          <p className="text-muted-foreground mb-4">
            Creating captions manually takes hours. With Subbly, you can instantly <strong>add captions to video</strong> content and focus more on creating. Captions improve watch time, engagement, and accessibility across all platforms.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="p-4 border rounded-lg bg-card">
              <summary className="font-semibold cursor-pointer">Is this AI caption generator free?</summary>
              <p className="mt-2 text-muted-foreground">We offer a free tier to get you started generating captions instantly.</p>
            </details>
            <details className="p-4 border rounded-lg bg-card">
              <summary className="font-semibold cursor-pointer">What platforms do you support?</summary>
              <p className="mt-2 text-muted-foreground">Our caption maker supports videos for YouTube, Instagram Reels, TikTok, Podcasts, and more.</p>
            </details>
          </div>
        </section>

        <section className="text-center py-12">
          <h2 className="text-3xl font-bold mb-6">Ready to generate captions?</h2>
          <a href="/auth" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            Get Started Now
          </a>
        </section>
      </div>
    </>
  );
}
