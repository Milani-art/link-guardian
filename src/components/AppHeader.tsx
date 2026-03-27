import { Shield } from "lucide-react";

const AppHeader = ({ title }: { title?: string }) => (
  <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3 safe-area-top">
    <div className="flex items-center gap-3 max-w-lg mx-auto">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Shield className="w-5 h-5 text-primary" />
      </div>
      <h1 className="text-lg font-bold font-heading">
        {title || <span className="text-gradient-primary">LinkShield</span>}
      </h1>
    </div>
  </header>
);

export default AppHeader;
