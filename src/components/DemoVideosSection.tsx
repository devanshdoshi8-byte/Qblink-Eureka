import { motion } from "framer-motion";
import { useRef, useState, useId } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw, Captions, CaptionsOff } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import { Skeleton } from "./ui/skeleton";

type DemoVideo = {
  title: string;
  sub: string;
  src: string;
  captions?: { src: string; srcLang: string; label: string };
};

const videos: DemoVideo[] = [
  {
    title: "Customer Experience",
    sub: "Scan, join, and track your spot — no app, no waiting in line.",
    src: "/videos/qblink-customer-demo.mp4",
  },
  {
    title: "Business Dashboard",
    sub: "Manage your live queue, call the next customer, and watch flow in real time.",
    src: "/videos/qblink-business-demo.mp4",
  },
];

const DemoCard = ({ v, i }: { v: DemoVideo; i: number }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const captionsId = useId();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(false);

  const pause = () => {
    videoRef.current?.pause();
    setIsPlaying(false);
  };
  const play = () => {
    const el = videoRef.current;
    if (!el) return;
    el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };
  const toggle = () => (isPlaying ? pause() : play());
  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    const next = !isMuted;
    el.muted = next;
    setIsMuted(next);
  };
  const restart = () => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    play();
  };
  const toggleCaptions = () => {
    const el = videoRef.current;
    if (!el || !el.textTracks || el.textTracks.length === 0) return;
    const next = !captionsOn;
    for (let idx = 0; idx < el.textTracks.length; idx++) {
      el.textTracks[idx].mode = next ? "showing" : "hidden";
    }
    setCaptionsOn(next);
  };

  return (
    <AnimatedSection delay={i * 0.1}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onMouseEnter={pause}
        onMouseLeave={play}
        className="group relative rounded-3xl overflow-hidden bg-card border border-border elevated-shadow focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background"
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? `Pause ${v.title} demo` : `Play ${v.title} demo`}
          aria-pressed={isPlaying}
          aria-describedby={v.captions ? captionsId : undefined}
          className="relative block w-full aspect-video bg-muted focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-inset"
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover pointer-events-none"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`${v.title} demo video`}
            crossOrigin={v.captions ? "anonymous" : undefined}
            onCanPlay={() => setIsReady(true)}
            onLoadedData={() => setIsReady(true)}
            onWaiting={() => setIsReady(false)}
          >
            <source src={v.src} type="video/mp4" />
            {v.captions && (
              <track
                kind="captions"
                src={v.captions.src}
                srcLang={v.captions.srcLang}
                label={v.captions.label}
                default={false}
              />
            )}
          </video>
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Skeleton className="absolute inset-0 rounded-none" />
              <span
                className="relative w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
                aria-label="Loading video"
                role="status"
              />
            </div>
          )}
          <div
            className={`absolute inset-0 flex items-center justify-center bg-foreground/20 backdrop-blur-[2px] transition-opacity duration-300 ${
              !isReady ? "opacity-0" : isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
            }`}
            aria-hidden="true"
          >
            <span className="flex items-center justify-center w-16 h-16 rounded-full bg-background/95 shadow-lg">
              {isPlaying ? (
                <Pause className="w-7 h-7 text-foreground" />
              ) : (
                <Play className="w-7 h-7 text-foreground translate-x-0.5" />
              )}
            </span>
          </div>
        </button>
        <div
          role="toolbar"
          aria-label={`${v.title} video controls`}
          className="flex items-center gap-2 px-4 pt-4 md:px-6"
        >
          <button
            type="button"
            onClick={toggle}
            aria-label={isPlaying ? "Pause" : "Play"}
            aria-pressed={isPlaying}
            className="inline-flex items-center justify-center min-w-11 min-h-11 rounded-full bg-muted hover:bg-muted/70 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
          </button>
          <button
            type="button"
            onClick={restart}
            aria-label="Restart from beginning"
            className="inline-flex items-center justify-center min-w-11 min-h-11 rounded-full bg-muted hover:bg-muted/70 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
            aria-pressed={!isMuted}
            className="inline-flex items-center justify-center min-w-11 min-h-11 rounded-full bg-muted hover:bg-muted/70 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {v.captions && (
            <button
              type="button"
              onClick={toggleCaptions}
              aria-label={captionsOn ? "Turn captions off" : "Turn captions on"}
              aria-pressed={captionsOn}
              id={captionsId}
              className="inline-flex items-center justify-center min-w-11 min-h-11 rounded-full bg-muted hover:bg-muted/70 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
            >
              {captionsOn ? <Captions className="w-4 h-4" /> : <CaptionsOff className="w-4 h-4" />}
            </button>
          )}
          {!v.captions && (
            <span className="ml-auto text-xs text-muted-foreground" aria-live="polite">
              Captions unavailable
            </span>
          )}
        </div>
        <div className="p-6 md:p-7">
          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
            {v.title}
          </h3>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {v.sub}
          </p>
        </div>
      </motion.div>
    </AnimatedSection>
  );
};

const DemoVideosSection = () => (
  <section id="demo" className="relative w-full max-w-full overflow-hidden">
    <div className="absolute inset-0 soft-bg opacity-50" />
    <div className="section-container section-padding relative z-10">
      <div className="mb-12">
        <div className="font-mono-caps text-primary mb-4 text-xs tracking-[0.18em]">See it in action</div>
        <h2 className="font-display text-4xl sm:text-5xl text-foreground leading-[1.02] max-w-2xl">
          A walk-through of both sides.
        </h2>
        <p className="mt-5 text-muted-foreground max-w-lg">
          Two short product demos — one from the customer's phone, one from the business dashboard.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
        {videos.map((v, i) => (
          <DemoCard key={v.title} v={v} i={i} />
        ))}
      </div>
    </div>
  </section>
);

export default DemoVideosSection;