// A small hand-picked icon set, drawn inline so there is no icon-font request
// and every glyph inherits the current text colour.

const PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5',
  ledger: 'M4 4h13a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3zM4 4v13M8 8h8M8 12h8M8 16h5',
  tag: 'M3 12V4h8l9 9-8 8-9-9zM7.5 7.5h.01',
  target: 'M12 3v4M12 17v4M3 12h4M17 12h4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  spark: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.3.3.5.7.5 1.1h6c0-.4.2-.8.5-1.1A6 6 0 0 0 12 3z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  shield: 'M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6zM9.5 12l2 2 3.5-4',
  bell: 'M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6M10.5 20a2 2 0 0 0 3 0',
  sun: 'M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 13.2A9 9 0 1 1 10.8 3a7 7 0 0 0 10.2 10.2z',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  download: 'M12 3v12M7 11l5 5 5-5M4 21h16',
  upload: 'M12 16V4M7 8l5-5 5 5M4 21h16',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6',
  edit: 'M4 20h4L19 9a2.8 2.8 0 1 0-4-4L4 16z',
  check: 'M4 12.5 9 18 20 6',
  x: 'M6 6l12 12M18 6L6 18',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  down: 'M6 9l6 6 6-6',
  alert: 'M12 3l9 17H3zM12 9v5M12 17.5h.01',
  repeat: 'M4 9V7a3 3 0 0 1 3-3h10l-3-3M20 15v2a3 3 0 0 1-3 3H7l3 3',
  pin: 'M12 3l2.5 5.5L20 10l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5z',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  logout: 'M15 5V3H5v18h10v-2M10 12h11M18 9l3 3-3 3',
  key: 'M14 4a6 6 0 1 1-4.2 10.2L3 21v-4h3v-3h3l.8-.8A6 6 0 0 1 14 4zM16.5 7.5h.01',
  map: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15',
  wallet: 'M3 7a2 2 0 0 1 2-2h12v4M3 7v10a2 2 0 0 0 2 2h14V9H5a2 2 0 0 1-2-2zM16 13h.01',
  briefcase: 'M4 8h16v12H4zM9 8V5h6v3M4 13h16',
  award: 'M12 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM8.5 12.5 7 21l5-2.5L17 21l-1.5-8.5',
  gift: 'M3 11h18v10H3zM3 7h18v4H3zM12 7v14M12 7S10.5 3 8 3a2 2 0 0 0 0 4M12 7s1.5-4 4-4a2 2 0 0 1 0 4',
  'plus-circle': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v8M8 12h8',
  utensils: 'M6 3v7a2 2 0 0 0 4 0V3M8 10v11M17 3c-1.5 1-2 3-2 5s.5 3 2 3v10',
  bus: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9H4zM4 15h16v3H4zM7 18v2M17 18v2M4 9h16',
  book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
  film: 'M3 4h18v16H3zM7 4v16M17 4v16M3 10h4M17 10h4M3 15h4M17 15h4',
  coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v10M14.5 9.3C14 8.5 13.1 8 12 8c-1.4 0-2.5.8-2.5 2s1.1 2 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2-.5-2.5-1.3',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  chat: 'M4 5h16v11H9l-5 4zM8 9.5h8M8 12.5h5',
  receipt: 'M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21zM9 8h6M9 12h6M9 16h3',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 10.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  eye:'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  'eye-off': 'M3 3l18 18M10.6 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.6-.6 5-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2',
  'arrow-ne':'M7 17 17 7M8.5 7H17v8.5',
  send: 'M4 12 20 4l-6 16-3-7zM11 13l9-9',
  sliders:'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h10M18 18h2M14 6a2 2 0 1 0 4 0 2 2 0 0 0-4 0M8 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0M14 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
};

export default function Icon({ name, size = 18, strokeWidth = 1.75, className = '', ...rest }) {
  const path = PATHS[name] || PATHS.tag;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={path} />
    </svg>
  );
}

/** The logo lives in Brand.jsx; re-exported so existing imports keep working. */
export { BrandMark, Wordmark } from './Brand.jsx';
