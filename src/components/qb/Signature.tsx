import { Link } from "react-router-dom";
import { Monogram } from "./Monogram";

const marqueeItems = [
  "No app",
  "No hardware",
  "Live position",
  "Peak-hour insight",
  "Unified walk-in flow",
  "Under 2 min setup",
  "Browser-native",
  "Free during pilot",
];

export const Signature = () => (
  <footer className="relative ink-surface overflow-hidden">
    {/* marquee */}
    <div className="border-y border-glow/20 overflow-hidden">
      <div className="flex gap-16 animate-marquee font-display text-4xl sm:text-6xl text-cream/20 py-6 whitespace-nowrap" style={{ animationDuration: '55s' }}>
        {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((t, i) => (
          <span key={i} className="flex items-center gap-16">
            {t}
            <span className="text-glow/60">✦</span>
          </span>
        ))}
      </div>
    </div>

    {/* CTA + signature */}
    <div className="max-w-5xl mx-auto px-6 lg:px-24 py-24 text-center relative">
      <div className="absolute inset-0 relief-glow" />
      <div className="relative">
        <div className="font-mono-caps text-glow/80 mb-6">Ch. 10 · The invitation</div>
        <h2 className="font-display text-5xl sm:text-7xl text-cream leading-[0.95]">
          Give an hour
          <br />
          <span className="text-glow italic font-normal">back.</span>
        </h2>
        <p className="mt-8 text-cream/60 max-w-lg mx-auto">
          The pilot is free. Setup is two minutes. If it doesn't earn its place at your counter, take it off.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            to="/auth"
            className="bg-glow text-ink font-mono-caps px-6 py-4 hover:bg-cream transition-colors"
          >
            Start the pilot →
          </Link>
          <Link
            to="/onboarding"
            className="border border-glow/40 text-cream font-mono-caps px-6 py-4 hover:border-glow hover:text-glow transition-colors"
          >
            Walk through it first
          </Link>
        </div>
      </div>
    </div>

    <div className="border-t border-glow/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-24 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
        <div>
          <div className="font-mono-caps text-cream/30 mb-3 text-xs">Product</div>
          <div className="space-y-2">
            <a href="#product" className="block text-cream/60 hover:text-glow transition-colors">How it works</a>
            <a href="#demo" className="block text-cream/60 hover:text-glow transition-colors">Demo</a>
            <a href="#pricing" className="block text-cream/60 hover:text-glow transition-colors">Pricing</a>
          </div>
        </div>
        <div>
          <div className="font-mono-caps text-cream/30 mb-3 text-xs">Industries</div>
          <div className="space-y-2">
            <a href="#industries" className="block text-cream/60 hover:text-glow transition-colors">Clinics</a>
            <a href="#industries" className="block text-cream/60 hover:text-glow transition-colors">Salons</a>
            <a href="#industries" className="block text-cream/60 hover:text-glow transition-colors">Restaurants</a>
          </div>
        </div>
        <div>
          <div className="font-mono-caps text-cream/30 mb-3 text-xs">Company</div>
          <div className="space-y-2">
            <a href="#faq" className="block text-cream/60 hover:text-glow transition-colors">FAQ</a>
            <Link to="/affiliate" className="block text-cream/60 hover:text-glow transition-colors">Affiliate</Link>
            <a href="mailto:teamqblink@gmail.com" className="block text-cream/60 hover:text-glow transition-colors">Contact</a>
          </div>
        </div>
        <div>
          <div className="font-mono-caps text-cream/30 mb-3 text-xs">Get started</div>
          <div className="space-y-2">
            <Link to="/auth" className="block text-cream/60 hover:text-glow transition-colors">Sign up free</Link>
            <Link to="/auth/signin" className="block text-cream/60 hover:text-glow transition-colors">Sign in</Link>
            <Link to="/onboarding" className="block text-cream/60 hover:text-glow transition-colors">See demo</Link>
          </div>
        </div>
      </div>
    </div>

    {/* signature block */}
    <div className="border-t border-glow/15">
      <div className="max-w-7xl mx-auto px-6 lg:px-24 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-cream/50 font-mono-caps">
        <div className="flex items-center gap-3">
          <Monogram className="w-6 h-6 text-glow" />
          <span>Qblink · est. 2025 · India</span>
        </div>
        <div className="flex gap-6">
          <Link to="/affiliate" className="hover:text-glow">Affiliate</Link>
          <a href="mailto:teamqblink@gmail.com" className="hover:text-glow">Contact</a>
          <Link to="/auth" className="hover:text-glow">Sign in</Link>
        </div>
        <span className="text-cream/30">Hardware-free by conviction.</span>
      </div>
    </div>
  </footer>
);