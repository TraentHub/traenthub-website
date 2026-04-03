export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="relative w-9 h-9 flex items-center justify-center">
        {/* Using the user's provided logo file directly */}
        <img 
          src="/logo.png" 
          alt="Traent Hub Logo" 
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
      <span className="font-sans font-semibold text-xl tracking-tight text-ink lowercase">
        traent<span className="text-pop">.</span>hub
      </span>
    </div>
  );
}
