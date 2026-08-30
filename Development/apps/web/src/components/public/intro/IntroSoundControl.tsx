import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { SoundControlProps } from "./types";

export const IntroSoundControl: React.FC<SoundControlProps> = ({
  isMuted,
  onToggleMute,
  autoplayBlocked,
}) => {
  return (
    <button
      type="button"
      onClick={onToggleMute}
      aria-label={isMuted ? "Unmute intro audio" : "Mute intro audio"}
      className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2/80 hover:bg-surface-3 border border-border-subtle hover:border-brand-orange/40 backdrop-blur-md text-xs font-mono text-text-secondary hover:text-text-primary transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange select-none"
    >
      {isMuted ? (
        <VolumeX className="w-3.5 h-3.5 text-text-muted group-hover:text-brand-orange transition-colors" />
      ) : (
        <Volume2 className="w-3.5 h-3.5 text-brand-orange animate-pulse" />
      )}
      <span className="text-[11px] tracking-wider uppercase">
        {autoplayBlocked && isMuted ? "Enable Audio" : isMuted ? "Sound Off" : "Sound On"}
      </span>
    </button>
  );
};

