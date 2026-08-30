export interface IntelligenceIntroProps {
  onComplete: () => void;
  onSkip?: () => void;
  isReplay?: boolean;
}

export interface SoundControlProps {
  isMuted: boolean;
  onToggleMute: () => void;
  autoplayBlocked?: boolean;
}

