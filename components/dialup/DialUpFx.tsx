"use client";

import { useEffect, useRef, useState } from "react";
import { DIALUP, ERA_ATTR, PLAYLIST } from "@/lib/dialup";

/** Winamp-style player and sparkle cursor; mounts only in the Dial-Up Edition. */
export function DialUpFx() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(document.documentElement.dataset[ERA_ATTR] === DIALUP);
  }, []);
  if (!on) return null;
  return (
    <>
      <Winamp />
      <Sparkles />
    </>
  );
}

/**
 * Nothing loads until ▶ is pressed: the YouTube player (privacy-enhanced
 * youtube-nocookie domain) is only mounted after that click, then plays the
 * rest of the list in order.
 */
function Winamp() {
  const [track, setTrack] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showList, setShowList] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const current = PLAYLIST[track];

  // Phones start with the player tucked away so it doesn't cover the page.
  useEffect(() => {
    if (window.matchMedia("(max-width: 760px)").matches) setMinimized(true);
  }, []);

  const queue = [...PLAYLIST.slice(track + 1), ...PLAYLIST.slice(0, track)].map((t) => t.id).join(",");
  const src = `https://www.youtube-nocookie.com/embed/${current.id}?autoplay=1&playlist=${queue}&rel=0&modestbranding=1`;

  const step = (delta: number) => setTrack((t) => (t + delta + PLAYLIST.length) % PLAYLIST.length);

  if (minimized) {
    return (
      <button type="button" className="winamp-mini" onClick={() => setMinimized(false)}>
        ♫ Mosh Pit Radio
      </button>
    );
  }

  return (
    <section className="winamp" aria-label="Mosh Pit Radio player">
      <div className="winamp-title">
        <span>MOSH PIT RADIO</span>
        <button type="button" aria-label="Minimize player" onClick={() => setMinimized(true)}>
          _
        </button>
      </div>
      <div className="winamp-lcd" aria-live="polite">
        <span className="winamp-lcd-scroll">
          {track + 1}. {current.artist} - {current.title} {playing ? "*** PLAYING ***" : "*** STOPPED ***"}
        </span>
      </div>
      {playing && (
        <div className="winamp-video">
          <iframe
            key={current.id}
            src={src}
            title={`${current.artist} - ${current.title}`}
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
      <div className="winamp-controls">
        <button type="button" aria-label="Previous track" onClick={() => step(-1)}>
          |◀
        </button>
        <button type="button" aria-label="Play" onClick={() => setPlaying(true)}>
          ▶
        </button>
        <button type="button" aria-label="Stop" onClick={() => setPlaying(false)}>
          ■
        </button>
        <button type="button" aria-label="Next track" onClick={() => step(1)}>
          ▶|
        </button>
        <button type="button" aria-expanded={showList} onClick={() => setShowList((s) => !s)}>
          PL
        </button>
      </div>
      {showList && (
        <ol className="winamp-list">
          {PLAYLIST.map((t, i) => (
            <li key={t.id}>
              <button
                type="button"
                aria-current={i === track}
                onClick={() => {
                  setTrack(i);
                  setPlaying(true);
                }}
              >
                {i + 1}. {t.artist} - {t.title}
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

const SPARKS = ["✦", "✧", "★", "✩", "*"];

/** Glitter that trails the mouse. Off for touch screens and reduced motion. */
function Sparkles() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let last = 0;
    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - last < 40 || !layer.current) return;
      last = now;
      const s = document.createElement("span");
      s.className = "sparkle";
      s.textContent = SPARKS[Math.floor(Math.random() * SPARKS.length)];
      s.style.left = `${e.clientX + (Math.random() * 16 - 8)}px`;
      s.style.top = `${e.clientY + (Math.random() * 16 - 8)}px`;
      s.style.color = `hsl(${Math.floor(Math.random() * 360)} 100% 60%)`;
      layer.current.appendChild(s);
      window.setTimeout(() => s.remove(), 800);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return <div ref={layer} className="sparkle-layer" aria-hidden="true" />;
}
