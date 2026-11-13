import {
  SELLA_WORDMARK_BOX,
  SELLA_WORDMARK_GRAD,
  SELLA_WORDMARK_SIG,
} from "@/lib/blueGlass/wordmark";

/** Official Sella blue-glass wordmark path + gradient (from design SVG). */
export const SELLA_WORDMARK = {
  sig: SELLA_WORDMARK_SIG,
  box: SELLA_WORDMARK_BOX,
  grad: SELLA_WORDMARK_GRAD,
} as const;

/** Page chrome matching Sella-Blue-Glass.html (558×678 artboard). */
export const BLUE_GLASS_BACK = `<defs>
<linearGradient id="edge" x2="1" y2="1"><stop stop-color="#e4eaff"/><stop offset=".39" stop-color="#5685d5"/><stop offset=".58" stop-color="#9b8bfd"/><stop offset="1" stop-color="#719cca"/></linearGradient>
<linearGradient id="sheet" x1="0" x2=".86" y2="1"><stop stop-color="#dfe7fc"/><stop offset=".28" stop-color="#e8edfa"/><stop offset=".54" stop-color="#f4f2fa"/><stop offset=".78" stop-color="#e8ebf9"/><stop offset="1" stop-color="#c4e1fa"/></linearGradient>
<radialGradient id="white"><stop stop-color="#ffffff" stop-opacity=".96"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="violet"><stop stop-color="#aa9bf1" stop-opacity=".67"/><stop offset="1" stop-color="#b7b4f6" stop-opacity="0"/></radialGradient>
<radialGradient id="sky"><stop stop-color="#5c92ec" stop-opacity=".57"/><stop offset="1" stop-color="#8dbcf5" stop-opacity="0"/></radialGradient>
<linearGradient id="topFold" x1="1" y1="0" x2=".12" y2=".85"><stop stop-color="#2454e0"/><stop offset=".21" stop-color="#80b4f5"/><stop offset=".55" stop-color="#add0f8"/><stop offset="1" stop-color="#94a9f1" stop-opacity=".22"/></linearGradient>
<linearGradient id="lowFold" x1="0" y1="1" x2="1" y2=".1"><stop stop-color="#673ce5"/><stop offset=".21" stop-color="#ae94f5"/><stop offset=".49" stop-color="#f3eefa"/><stop offset=".76" stop-color="#a3c7f9"/><stop offset="1" stop-color="#c5e9ff"/></linearGradient>
<linearGradient id="water" x1=".05" y1="1" x2="1" y2=".1"><stop stop-color="#c3cafa"/><stop offset=".53" stop-color="#a8d4fa"/><stop offset=".83" stop-color="#9bc6f7"/><stop offset="1" stop-color="#d3edff"/></linearGradient>
<linearGradient id="pill" x2="1" y2=".34"><stop stop-color="#d8d8fa"/><stop offset=".72" stop-color="#b4caf8"/><stop offset="1" stop-color="#a9d2f9"/></linearGradient>
<linearGradient id="status" x2="1" y2="1"><stop stop-color="#d5e5fc"/><stop offset=".55" stop-color="#e8eef8"/><stop offset="1" stop-color="#cce1f7"/></linearGradient>
<linearGradient id="green" x2=".3" y2="1"><stop stop-color="#80d873"/><stop offset="1" stop-color="#278e33"/></linearGradient>
<linearGradient id="info" x2="1" y2="1"><stop stop-color="#74d0ff"/><stop offset=".51" stop-color="#3c6df8"/><stop offset="1" stop-color="#2c53ef"/></linearGradient>
<clipPath id="pageClip"><rect x="0" y="5" width="553" height="667" rx="22"/></clipPath>
</defs>
<rect width="558" height="678" fill="url(#edge)"/>
<g clip-path="url(#pageClip)"><rect x="0" y="4" width="554" height="669" fill="url(#sheet)"/>
<ellipse cx="322" cy="301" rx="301" ry="276" fill="url(#white)"/><ellipse cx="179" cy="29" rx="184" ry="119" fill="url(#sky)" opacity=".38"/>
<ellipse cx="30" cy="548" rx="174" ry="176" fill="url(#violet)"/><ellipse cx="552" cy="70" rx="134" ry="149" fill="url(#sky)"/>
<path d="M409 0H558V171Q503 156 478 107Q456 59 409 0Z" fill="#a6bdf4" opacity=".32"/>
<path d="M410 0H558V100Q539 70 511 64Q468 58 449 42Q431 27 410 0Z" fill="url(#topFold)"/>
<path d="M0 439Q124 470 164 549Q188 592 205 678H0Z" fill="url(#sky)" opacity=".49"/><path d="M0 440Q129 472 165 549" stroke="white" stroke-opacity=".52" fill="none"/>
<path d="M275 678Q483 608 558 521V678Z" fill="url(#water)"/><path d="M0 623Q69 677 163 649Q135 681 0 682Z" fill="url(#lowFold)"/>
</g><rect x="0.8" y="5" width="552" height="667" rx="22" fill="none" stroke="white" stroke-width="2.3" opacity=".75"/>`;

export const BLUE_GLASS_PAGE = {
  widthPx: 558,
  heightPx: 678,
  /** Matches @page in the design HTML */
  widthMm: 210,
  heightMm: 255.1613,
} as const;

export const BLUE_GLASS_TAGLINE = "Smarter. Faster. Together.";
