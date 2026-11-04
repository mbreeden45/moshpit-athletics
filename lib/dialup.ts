/**
 * "1999": an easter-egg Angelfire skin over the whole site.
 * /?1999 (or the older /?dialup) turns it on for the rest of the browser
 * session only, so every new visit starts on the normal site; /?2026 turns it off.
 * The <html data-era="dialup"> attribute drives everything: the skin is CSS
 * (app/dialup.css) plus a few decorations that only render in that era.
 */

export const ERA_ATTR = "era";
export const DIALUP = "dialup";
export const DIALUP_HREF = "/?1999";
export const EXIT_HREF = "/?2026";

export const ERA_KEY = "mpa-era";

/** True when this browser session is in 1999 mode (after ERA_SCRIPT has run). */
export function eraIsOn(): boolean {
  try {
    return window.sessionStorage.getItem(ERA_KEY) === DIALUP;
  } catch {
    return /[?&](1999|dialup)\b/.test(window.location.search);
  }
}

/**
 * Runs in <head> before paint, so the page never flashes the wrong era.
 * Session storage, not local: closing the tab ends 1999. Also clears the
 * old permanent localStorage flag from before it was session-only.
 */
export const ERA_SCRIPT = `(function(){var d=document.documentElement,k="${ERA_KEY}";try{localStorage.removeItem(k)}catch(e){}try{var q=new URLSearchParams(location.search);if(q.has("1999")||q.has("dialup"))sessionStorage.setItem(k,"dialup");if(q.has("2026"))sessionStorage.removeItem(k);if(sessionStorage.getItem(k)==="dialup")d.dataset.${ERA_ATTR}="dialup"}catch(e){if(/[?&](1999|dialup)/.test(location.search))d.dataset.${ERA_ATTR}="dialup"}})();`;

/** Always 420. There is no database. */
export const HIT_COUNT = "000420";

/**
 * Mosh Pit Radio: official music videos, each embedded from the artist's or
 * label's own YouTube channel (checked embeddable via YouTube oEmbed).
 */
export const PLAYLIST: { id: string; artist: string; title: string }[] = [
  { id: "dhZTNgAs4Fc", artist: "My Chemical Romance", title: "I'm Not Okay (I Promise)" },
  { id: "oKsxPW6i3pM", artist: "Jimmy Eat World", title: "The Middle" },
  { id: "uhG-vLZrb-g", artist: "Fall Out Boy", title: "Sugar, We're Goin Down" },
  { id: "aCyGvGEtOwc", artist: "Paramore", title: "Misery Business" },
  { id: "UCCyoocDxBA", artist: "My Chemical Romance", title: "Helena" },
  { id: "X9fLbfzCqWw", artist: "Yellowcard", title: "Ocean Avenue" },
  { id: "RRKJiM9Njr8", artist: "My Chemical Romance", title: "Welcome to the Black Parade" },
];

/** Photo in the banner's frame. Swap for a photo you own or have licensed. */
export const BANNER_PHOTO: string | null = null;
