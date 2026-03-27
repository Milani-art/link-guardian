import { Shield, AlertTriangle, Eye, Zap, Lock, Download, ChevronRight, ExternalLink } from "lucide-react";

const features = [
  { icon: Eye, title: "Real-Time Scanning", desc: "Automatically scans every link on the page as you browse. No action needed." },
  { icon: AlertTriangle, title: "Smart Detection", desc: "Detects fake domains, risky keywords, URL shorteners, and brand impersonation." },
  { icon: Zap, title: "Safety Scoring", desc: "Each link gets a 0–100 risk score. Warnings appear instantly on hover." },
  { icon: Lock, title: "Optional Blocking", desc: "Toggle high-risk link blocking. A modal confirms before you proceed to dangerous sites." },
];

const detections = [
  "IP address URLs",
  "Suspicious TLDs (.xyz, .top, .click, etc.)",
  "URL shorteners (bit.ly, tinyurl, etc.)",
  "Excessive subdomains",
  "Risky keywords (login, verify, password…)",
  "Brand spoofing (PayPal, Google, Apple…)",
  "Homograph attacks",
  "Dangerous file downloads",
  "Missing HTTPS",
  "@ symbol redirect tricks",
];

const handleDownload = () => {
  fetch("/phishara-extension.zip")
    .then((res) => {
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      return res.blob();
    })
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "phishara-extension.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch((err) => alert(err.message));
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Chrome Extension · Manifest V3</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tight mb-6">
            <span className="text-gradient-primary">Phishara</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Scans links in real-time and warns or blocks suspicious ones{" "}
            <span className="text-foreground font-medium">before</span> you click them.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleDownload}
              className="group flex items-center gap-3 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold text-lg glow-primary hover:brightness-110 transition-all"
            >
              <Download className="w-5 h-5" />
              Download Extension
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-sm text-muted-foreground">
              Works on Chrome, Edge, Brave & Arc
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div key={f.title} className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
              <f.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold font-heading mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Detection Grid */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold font-heading text-center mb-4">
            What It <span className="text-gradient-primary">Detects</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            12 built-in detection rules that catch the most common phishing and scam patterns.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {detections.map((d, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50 border border-border">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <span className="text-sm font-mono">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Install Steps */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-heading text-center mb-12">
            Install in <span className="text-gradient-primary">30 Seconds</span>
          </h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Download & Unzip", desc: "Click the download button above and extract the ZIP file." },
              { step: "2", title: "Open Extensions", desc: "Navigate to chrome://extensions in your browser." },
              { step: "3", title: "Enable Developer Mode", desc: "Toggle Developer mode in the top-right corner." },
              { step: "4", title: "Load Unpacked", desc: "Click 'Load unpacked' and select the extracted folder." },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-5 p-5 rounded-xl bg-card border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold font-mono flex items-center justify-center flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold font-heading mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-heading font-semibold">Phishara</span>
          </div>
          <p className="text-sm text-muted-foreground">Proactive protection against phishing & scam links.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
