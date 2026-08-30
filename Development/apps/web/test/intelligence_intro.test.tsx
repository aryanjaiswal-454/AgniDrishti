import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { IntelligenceIntro } from "../src/components/public/intro";

describe("IntelligenceIntro Component", () => {
  let playMock: ReturnType<typeof vi.fn>;
  let pauseMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();

    playMock = vi.fn().mockResolvedValue(undefined);
    pauseMock = vi.fn();

    // Mock HTMLAudioElement
    window.HTMLMediaElement.prototype.play = playMock;
    window.HTMLMediaElement.prototype.pause = pauseMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render cinematic intro overlay with brand wordmark and controls", () => {
    const onComplete = vi.fn();
    render(<IntelligenceIntro onComplete={onComplete} />);

    expect(screen.getByText(/AGNIDRISHTI/i)).toBeInTheDocument();
    expect(screen.getByText(/AI-POWERED THERMAL INTELLIGENCE/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Skip cinematic introduction/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mute intro audio|Unmute intro audio/i })).toBeInTheDocument();
    expect(screen.getByText(/DEMO SIGNAL/i)).toBeInTheDocument();
  });

  it("should trigger onComplete and pause audio when Skip button is clicked", () => {
    const onComplete = vi.fn();
    render(<IntelligenceIntro onComplete={onComplete} />);

    const skipBtn = screen.getByRole("button", { name: /Skip cinematic introduction/i });
    fireEvent.click(skipBtn);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(pauseMock).toHaveBeenCalled();
  });

  it("should trigger onComplete when Escape key is pressed", () => {
    const onComplete = vi.fn();
    render(<IntelligenceIntro onComplete={onComplete} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("should toggle sound on/off and persist preference in localStorage", () => {
    const onComplete = vi.fn();
    render(<IntelligenceIntro onComplete={onComplete} />);

    const soundBtn = screen.getByRole("button", { name: /Mute intro audio|Unmute intro audio/i });
    
    // Toggle mute
    fireEvent.click(soundBtn);
    expect(localStorage.getItem("agnidrishti_sound_muted")).toBe("true");

    // Toggle back
    fireEvent.click(soundBtn);
    expect(localStorage.getItem("agnidrishti_sound_muted")).toBe("false");
  });
});
