import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Download, Copy, Check, Sparkles, Layout, X, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { getPublicQueueUrl, getTemplateCopy, QRKitTemplate } from "@/lib/qrKitGenerator";
import logo from "@/assets/qblink-logo.png";
import { hapticCopy, hapticSuccess } from "@/lib/haptics";

interface Props {
  queueId: string;
  queueName: string;
  businessName: string;
  businessCategory?: string;
  onClose: () => void;
}

export const PrintReadyQRKit = ({
  queueId,
  queueName,
  businessName,
  businessCategory,
  onClose,
}: Props) => {
  const [template, setTemplate] = useState<QRKitTemplate>("a4_poster");
  const [copied, setCopied] = useState(false);
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  const publicUrl = getPublicQueueUrl(queueId);
  const copy = getTemplateCopy(template, businessName, queueName);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    hapticCopy();
    toast.success("Public queue link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    hapticSuccess();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto card-shadow flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">One-Click Print-Ready QR Kit</h2>
              <p className="text-xs text-muted-foreground">
                Instant professional signage for {businessName} • Ready in under 1 minute
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="px-6 py-4 bg-muted/20 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Format:</span>
            <div className="flex bg-muted/60 p-1 rounded-xl gap-1">
              <button
                onClick={() => setTemplate("a4_poster")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  template === "a4_poster" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                A4 Entrance Poster
              </button>
              <button
                onClick={() => setTemplate("a5_standee")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  template === "a5_standee" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                A5 Counter Standee
              </button>
              <button
                onClick={() => setTemplate("square_sticker")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  template === "square_sticker" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Square Table Sticker
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Live Link"}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 shadow-md transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Collateral
            </button>
          </div>
        </div>

        {/* Live Vector Preview */}
        <div className="p-8 bg-muted/40 flex items-center justify-center overflow-x-auto">
          <div
            ref={printAreaRef}
            id="qblink-printable-kit"
            className={`bg-card border-2 border-primary/20 rounded-3xl p-8 card-shadow text-center flex flex-col items-center justify-between transition-all print:border-none print:shadow-none print:m-0 print:p-6 ${
              template === "a4_poster"
                ? "w-[440px] min-h-[600px]"
                : template === "a5_standee"
                ? "w-[380px] min-h-[500px]"
                : "w-[340px] min-h-[380px]"
            }`}
          >
            {/* Top Brand Header */}
            <div className="w-full flex items-center justify-between border-b border-border/50 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <img src={logo} alt="Qblink" className="w-7 h-7 rounded-lg object-contain" />
                <span className="font-extrabold text-foreground tracking-tight text-sm">Qblink</span>
              </div>
              <span className="text-[10px] font-bold tracking-widest text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-full">
                {copy.badge}
              </span>
            </div>

            {/* Venue & Headline */}
            <div className="my-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                {businessName}
              </p>
              <h1 className="text-2xl font-black text-foreground tracking-tight leading-tight">
                {copy.headline}
              </h1>
              <p className="text-xs text-muted-foreground max-w-[320px] mx-auto mt-2 leading-relaxed">
                {copy.subhead}
              </p>
            </div>

            {/* High-Contrast Crisp QR Code */}
            <div className="my-5 p-4 bg-white rounded-3xl border border-border/80 shadow-inner flex flex-col items-center">
              <QRCodeSVG
                value={publicUrl}
                size={template === "a4_poster" ? 210 : template === "a5_standee" ? 170 : 150}
                level="H"
                includeMargin={false}
                fgColor="#090d16"
              />
              <span className="text-[10px] font-mono text-slate-500 mt-2 font-medium">
                {queueName} • Scan with Camera
              </span>
            </div>

            {/* 3 Step Instruction Guide */}
            {template !== "square_sticker" && (
              <div className="w-full bg-muted/40 rounded-2xl p-3 grid grid-cols-3 gap-2 my-2 text-left">
                <div className="text-[10px] font-medium text-foreground">
                  <span className="font-bold text-primary block text-xs">01</span>
                  Scan QR
                </div>
                <div className="text-[10px] font-medium text-foreground">
                  <span className="font-bold text-primary block text-xs">02</span>
                  Track Live Wait
                </div>
                <div className="text-[10px] font-medium text-foreground">
                  <span className="font-bold text-primary block text-xs">03</span>
                  Walk in on Turn
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="w-full border-t border-border/50 pt-3 mt-3 flex items-center justify-between text-[9px] text-muted-foreground">
              <span>{copy.footer}</span>
              <span className="font-semibold text-primary">qblink.com</span>
            </div>
          </div>
        </div>

        {/* Print Stylesheet */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #qblink-printable-kit, #qblink-printable-kit * {
              visibility: visible !important;
            }
            #qblink-printable-kit {
              position: fixed !important;
              left: 50% !important;
              top: 50% !important;
              transform: translate(-50%, -50%) !important;
              width: 90vw !important;
              max-width: 580px !important;
              border: 1px solid #ddd !important;
              box-shadow: none !important;
              background: white !important;
              color: black !important;
            }
          }
        `}} />
      </div>
    </div>
  );
};
