/**
 * Custom, Duolingo-style icon set.
 *
 * House style (see the research in the project notes): *filled, rounded and
 * colour-coded by skill*. Every glyph is a solid silhouette on a 24×24 grid
 * with generous corner radii, drawn with `currentColor` so a single CSS colour
 * drives it. No dependency, no CDN, no network — the paths are inlined, which
 * keeps the site working fully offline on the Pi.
 *
 * The shapes are hand-tuned to read at 18–30 px. Add new icons by dropping the
 * inner markup into ICON_PATHS below; <Icon name="…" /> picks them up.
 */

export const ICON_PATHS: Record<string, string> = {
  // --- mascot --------------------------------------------------------------
  owl: '<path fill-rule="evenodd" d="M12 2.6c-1.05 0-2.02.38-2.77 1.02L7.6 2a1.1 1.1 0 0 0-1.55 1.55l1.5 1.5A8.3 8.3 0 0 0 4.6 10.6v5.6a4.6 4.6 0 0 0 4.6 4.6h5.6a4.6 4.6 0 0 0 4.6-4.6v-5.6a8.3 8.3 0 0 0-2.95-5.55l1.5-1.5A1.1 1.1 0 0 0 16.4 2l-1.63 1.62A4.9 4.9 0 0 0 12 2.6Zm-2.6 6.4a2.05 2.05 0 1 1 0 4.1 2.05 2.05 0 0 1 0-4.1Zm5.2 0a2.05 2.05 0 1 1 0 4.1 2.05 2.05 0 0 1 0-4.1Z"/><circle cx="9.4" cy="11.05" r="1"/><circle cx="14.6" cy="11.05" r="1"/><path d="M12 14.1c.5 0 .95.28 1.18.72l1.02 1.95a.8.8 0 0 1-.71 1.17h-2.98a.8.8 0 0 1-.71-1.17l1.02-1.95A1.32 1.32 0 0 1 12 14.1Z"/>',

  // --- navigation ----------------------------------------------------------
  search:
    '<path fill-rule="evenodd" d="M10.5 2.5a8 8 0 1 0 4.9 14.32l4.4 4.4a1.6 1.6 0 0 0 2.26-2.26l-4.4-4.4A8 8 0 0 0 10.5 2.5Zm0 3.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Z"/>',
  book: '<path d="M11.15 5.55C9.8 4.85 8 4.45 5.9 4.45H4.5A1.5 1.5 0 0 0 3 5.95v11.6a1.5 1.5 0 0 0 1.5 1.5h1.4c2.1 0 3.9.4 5.25 1.1V5.55Z"/><path d="M12.85 5.55c1.35-.7 3.15-1.1 5.25-1.1h1.4A1.5 1.5 0 0 1 21 5.95v11.6a1.5 1.5 0 0 1-1.5 1.5h-1.4c-2.1 0-3.9.4-5.25 1.1V5.55Z"/>',
  chart:
    '<path d="M5 11.2a1.6 1.6 0 0 0-1.6 1.6V20a1.2 1.2 0 0 0 1.2 1.2h.8a1.2 1.2 0 0 0 1.2-1.2v-7.2A1.6 1.6 0 0 0 5 11.2Z"/><path d="M12 4.8a1.6 1.6 0 0 0-1.6 1.6V20a1.2 1.2 0 0 0 1.2 1.2h.8A1.2 1.2 0 0 0 13.6 20V6.4A1.6 1.6 0 0 0 12 4.8Z"/><path d="M19 9a1.6 1.6 0 0 0-1.6 1.6V20a1.2 1.2 0 0 0 1.2 1.2h.8A1.2 1.2 0 0 0 20.6 20v-9.4A1.6 1.6 0 0 0 19 9Z"/>',
  info: '<path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4a1.9 1.9 0 1 1 0 3.8A1.9 1.9 0 0 1 12 6Zm0 5.7c.9 0 1.6.7 1.6 1.6v3.9a1.6 1.6 0 0 1-3.2 0v-3.9c0-.9.7-1.6 1.6-1.6Z"/>',

  // --- theme ---------------------------------------------------------------
  moon: '<path d="M20.9 14.6a8.9 8.9 0 0 1-11.5-11.5 1.1 1.1 0 0 0-1.4-1.4A10.8 10.8 0 1 0 22.3 16a1.1 1.1 0 0 0-1.4-1.4Z"/>',
  sun: '<circle cx="12" cy="12" r="5"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"><path d="M12 2.2v2.4M12 19.4v2.4M2.2 12h2.4M19.4 12h2.4M5.1 5.1l1.7 1.7M17.2 17.2l1.7 1.7M18.9 5.1l-1.7 1.7M6.8 17.2l-1.7 1.7"/></g>',

  // --- states --------------------------------------------------------------
  lock: '<path fill-rule="evenodd" d="M12 2a5.2 5.2 0 0 0-5.2 5.2v1.1H6A2.2 2.2 0 0 0 3.8 10.5v8.3A2.2 2.2 0 0 0 6 21h12a2.2 2.2 0 0 0 2.2-2.2v-8.3A2.2 2.2 0 0 0 18 8.3h-.8V7.2A5.2 5.2 0 0 0 12 2Zm0 2.6a2.6 2.6 0 0 1 2.6 2.6v1.1H9.4V7.2A2.6 2.6 0 0 1 12 4.6Z"/><path d="M12 11.6a2.05 2.05 0 0 0-1.05 3.8v1.5a1.05 1.05 0 0 0 2.1 0v-1.5A2.05 2.05 0 0 0 12 11.6Z"/>',
  check:
    '<path d="M20.8 5.4a1.2 1.2 0 0 1 0 1.7l-10.3 10.3a1.2 1.2 0 0 1-1.7 0L3.2 11.8a1.2 1.2 0 1 1 1.7-1.7L10 15.2l9.4-9.8a1.2 1.2 0 0 1 1.4 0Z"/>',
  'check-circle':
    '<path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.85 7.62a1.2 1.2 0 0 0-1.7-1.7L11 12.06l-2.15-2.14a1.2 1.2 0 1 0-1.7 1.7l3 3a1.2 1.2 0 0 0 1.7 0Z"/>',

  // --- CEFR levels (colour-coded by skill) ---------------------------------
  sprout:
    '<rect x="11" y="10.5" width="2" height="11.5" rx="1"/><ellipse cx="7.2" cy="7.6" rx="4.6" ry="3.4" transform="rotate(-32 7.2 7.6)"/><ellipse cx="16.8" cy="7.6" rx="4.6" ry="3.4" transform="rotate(32 16.8 7.6)"/>',
  leaf: '<ellipse cx="12" cy="9.5" rx="6" ry="7.4" transform="rotate(45 12 9.5)"/><path d="M7.2 20.2 16 11.4" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" fill="none"/>',
  tree: '<circle cx="12" cy="7" r="5.4"/><circle cx="7.4" cy="10.4" r="3.9"/><circle cx="16.6" cy="10.4" r="3.9"/><rect x="10.4" y="12.5" width="3.2" height="9.5" rx="1.6"/>',
  mountain:
    '<path d="M14.6 5.4 23.2 20.6a1.4 1.4 0 0 1-1.2 2.1H14.4a1.4 1.4 0 0 1-1.2-2.1l3.6-6.2a1.4 1.4 0 0 1 2.4 0l1.2 2Z"/><path d="M8.2 10.4 1.9 21.3A1.3 1.3 0 0 0 3 23.3h7.6a1.3 1.3 0 0 0 1.1-2L8.2 10.4Z"/>',
  rocket:
    '<path fill-rule="evenodd" d="M12 2c3.9 0 6.9 3.4 6.9 8.3 0 2.9-1.3 5.5-2.7 7.1l-.3.4H8.1l-.3-.4C6.4 15.8 5.1 13.2 5.1 10.3 5.1 5.4 8.1 2 12 2Zm0 5.3a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Z"/><path d="M8.3 16.6 5.6 21.4a1 1 0 0 0 1.36 1.32l3.4-1.6Z"/><path d="M15.7 16.6l2.7 4.8a1 1 0 0 1-1.36 1.32l-3.4-1.6Z"/><path d="M10.2 19.4h3.6l-1.8 2.9Z"/>',

  // --- reference -----------------------------------------------------------
  letters:
    '<path d="M8.6 3.4a1 1 0 0 1 .94.66l3.8 9.8a1 1 0 0 1-1.88.72l-.83-2.14H5.57l-.83 2.14a1 1 0 0 1-1.88-.72l3.8-9.8a1 1 0 0 1 .94-.66Zm0 3.3L7.35 10.5h2.5L8.6 6.7Z"/><circle cx="17.6" cy="14.4" r="2.6"/><rect x="16.7" y="9.6" width="1.9" height="5.6" rx="0.95"/>',
  bolt: '<path d="M13.3 2.3a1 1 0 0 1 .82 1.42l-2.7 6.28h5.16a1 1 0 0 1 .78 1.62l-9 11.4a1 1 0 0 1-1.76-.94l2.28-6.38H4.06a1 1 0 0 1-.78-1.62l9-11.4a1 1 0 0 1 1.02-.38Z"/>',
  chat: '<path d="M12 3C6.6 3 2.2 6.5 2.2 10.9c0 2.5 1.4 4.7 3.6 6.2l-.9 3.8a1 1 0 0 0 1.42 1.1l4.1-2.1c.5.06 1 .09 1.58.09 5.4 0 9.8-3.5 9.8-7.9S17.4 3 12 3Z"/>',
  books:
    '<rect x="3.6" y="3.4" width="4.5" height="17.2" rx="1.3"/><rect x="9.75" y="3.4" width="4.5" height="17.2" rx="1.3"/><rect x="15.9" y="3.4" width="4.5" height="17.2" rx="1.3"/>',

  // --- gamification --------------------------------------------------------
  fire: '<path d="M13.1 1.9a1 1 0 0 0-1.68.3C9.4 6.2 6.6 9.6 6.6 13.4a5.4 5.4 0 0 0 10.8.2c.05-3.9-2.1-7.9-4.3-11.7Z"/>',
  star: '<path d="M12 2.4a1 1 0 0 1 .9.56l2.62 5.3 5.85.86a1 1 0 0 1 .56 1.7l-4.24 4.13 1 5.83a1 1 0 0 1-1.45 1.05L12 19.05l-5.24 2.75a1 1 0 0 1-1.45-1.05l1-5.83-4.24-4.13a1 1 0 0 1 .56-1.7l5.85-.86 2.62-5.3a1 1 0 0 1 .9-.56Z"/>',

  // --- lesson meta / empty states -----------------------------------------
  clock:
    '<path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1.1 4.6v5.06l3.02 1.75a1.1 1.1 0 1 1-1.1 1.9l-3.5-2.02a1.1 1.1 0 0 1-.55-.95V6.6a1.1 1.1 0 0 1 2.2 0Z"/>',
  notebook:
    '<path fill-rule="evenodd" d="M6.5 3A2.5 2.5 0 0 0 4 5.5v13A2.5 2.5 0 0 0 6.5 21h11A2.5 2.5 0 0 0 20 18.5v-13A2.5 2.5 0 0 0 17.5 3Zm1.8 4.6h7.4a1 1 0 1 1 0 2H8.3a1 1 0 1 1 0-2Zm0 4.2h7.4a1 1 0 1 1 0 2H8.3a1 1 0 1 1 0-2Z"/>',
  file: '<path fill-rule="evenodd" d="M6 2.4A2.2 2.2 0 0 0 3.8 4.6v14.8A2.2 2.2 0 0 0 6 21.6h12a2.2 2.2 0 0 0 2.2-2.2V9.6a2.2 2.2 0 0 0-.64-1.55l-5-5a2.2 2.2 0 0 0-1.56-.65Zm7.2 2.5 4.3 4.3h-3.3a1 1 0 0 1-1-1Z"/><path d="M8.6 13.2h6.8a1 1 0 1 1 0 2H8.6a1 1 0 1 1 0-2Zm0 3.4h6.8a1 1 0 1 1 0 2H8.6a1 1 0 1 1 0-2Z"/>',
  question:
    '<path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm.15 3.6A4.65 4.65 0 0 0 7.5 10.25a1.1 1.1 0 0 0 2.2 0A2.45 2.45 0 1 1 12.15 12.7c-1 .2-1.75 1.05-1.75 2.1v.5a1.1 1.1 0 0 0 2.2 0v-.4a4.65 4.65 0 0 0-.45-9.3ZM12 17.4a1.35 1.35 0 1 1 0 2.7 1.35 1.35 0 0 1 0-2.7Z"/>',
  bulb: '<path d="M12 2.4a7.1 7.1 0 0 0-4.1 12.9c.5.4.8.9.8 1.5v.1h6.6v-.1c0-.6.3-1.1.8-1.5A7.1 7.1 0 0 0 12 2.4Z"/><rect x="9" y="17.8" width="6" height="2.1" rx="1.05"/><rect x="10" y="20.7" width="4" height="1.6" rx="0.8"/>',
};

/**
 * Full <svg> markup for use inside inline <script> (where an Astro component
 * cannot be rendered). Colours follow `currentColor` like the component.
 */
export function iconSvg(name: string, size = 24): string {
  const body = ICON_PATHS[name] ?? "";
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">${body}</svg>`;
}
