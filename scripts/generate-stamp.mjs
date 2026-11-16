import fs from "fs";
import { spawn } from "child_process";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARTIFACT_DIR = "/Users/friendkh/.gemini/antigravity/brain/60d49a68-b551-4d38-ba5b-302ad87381a0";

// SVG with authentic rubber stamp styling:
// - Circular double border
// - Top textPath: SELLA TECHNOLOGIES LTD
// - Bottom textPath: KIGALI • RWANDA
// - Center Sella Emblem / Crown star
// - TIN & Management lines
// - Date & Signature line
// - Authentic SVG grunge filter (feTurbulence + feDisplacementMap) to simulate real rubber ink stamp on paper!
const stampSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <!-- Realistic rubber stamp ink filter -->
    <filter id="stamp-ink" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="displaced" />
      <!-- Subtle ink porosity / grit -->
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" result="grit" />
      <feColorMatrix in="grit" type="matrix" 
        values="0 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 1.8 -0.4" result="gritAlpha" />
      <feComposite in="displaced" in2="gritAlpha" operator="out" />
    </filter>

    <!-- Paths for circular text -->
    <!-- Top Arc (Clockwise) -->
    <path id="topArc" d="M 65,250 A 185,185 0 1,1 435,250" fill="none" />
    <!-- Bottom Arc (Clockwise along bottom from left to right) -->
    <path id="bottomArc" d="M 75,250 A 175,175 0 0,0 425,250" fill="none" />
  </defs>

  <style>
    .stamp-ink {
      fill: #14358a;
      stroke: #14358a;
      color: #14358a;
      font-family: 'Arial Black', 'Impact', 'Montserrat', 'Helvetica Neue', sans-serif;
    }
    .top-text {
      font-size: 31px;
      font-weight: 900;
      letter-spacing: 5px;
      fill: #14358a;
      stroke: none;
    }
    .bottom-text {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 6px;
      fill: #14358a;
      stroke: none;
    }
    .center-title {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 2.5px;
      fill: #14358a;
      stroke: none;
      text-anchor: middle;
    }
    .center-sub {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 1.5px;
      fill: #14358a;
      stroke: none;
      text-anchor: middle;
    }
    .center-label {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 2px;
      fill: #14358a;
      stroke: none;
      text-anchor: middle;
    }
  </style>

  <g filter="url(#stamp-ink)" class="stamp-ink">
    <!-- Outer Heavy Ring -->
    <circle cx="250" cy="250" r="236" fill="none" stroke-width="7" />
    
    <!-- Outer Thin Ring -->
    <circle cx="250" cy="250" r="226" fill="none" stroke-width="2" />
    
    <!-- Outer Dotted/Beaded Ring -->
    <circle cx="250" cy="250" r="218" fill="none" stroke-width="1.5" stroke-dasharray="3,4" />

    <!-- Inner Core Ring -->
    <circle cx="250" cy="250" r="142" fill="none" stroke-width="3.5" />
    <circle cx="250" cy="250" r="136" fill="none" stroke-width="1.5" />

    <!-- Top Text along Path -->
    <text class="top-text">
      <textPath href="#topArc" startOffset="50%" text-anchor="middle">
        ★ SELLA RWANDA LTD ★
      </textPath>
    </text>

    <!-- Bottom Text along Path -->
    <text class="bottom-text">
      <textPath href="#bottomArc" startOffset="50%" text-anchor="middle">
        ★ KIGALI - RWANDA ★
      </textPath>
    </text>

    <!-- Decorative Stars at Ring Separators -->
    <g transform="translate(68, 250) scale(0.9)">
      <polygon points="0,-9 2.5,-3 8.5,-3 4,1 5.5,7 0,3.5 -5.5,7 -4,1 -8.5,-3 -2.5,-3" fill="#14358a" stroke="none" />
    </g>
    <g transform="translate(432, 250) scale(0.9)">
      <polygon points="0,-9 2.5,-3 8.5,-3 4,1 5.5,7 0,3.5 -5.5,7 -4,1 -8.5,-3 -2.5,-3" fill="#14358a" stroke="none" />
    </g>

    <!-- Center Content -->
    <!-- Top Emblem: Sella Mark & Stars -->
    <g transform="translate(250, 162)">
      <text class="center-title" y="0">✦ SELLA ✦</text>
    </g>

    <!-- Center Divider Line -->
    <line x1="160" y1="180" x2="340" y2="180" stroke-width="2" />
    <line x1="180" y1="184" x2="320" y2="184" stroke-width="1" />

    <!-- Center Details -->
    <text class="center-sub" x="250" y="206">TIN: 109876543</text>
    <text class="center-sub" x="250" y="230">TEL: +250 788 123 456</text>
    
    <!-- Divider Line 2 -->
    <line x1="170" y1="244" x2="330" y2="244" stroke-width="1.5" />

    <!-- Management & Signature Box -->
    <text class="center-label" x="250" y="268">MANAGING DIRECTOR</text>
    <text class="center-sub" x="250" y="294">DATE: ....................</text>
    <text class="center-sub" x="250" y="322">SIGN: ....................</text>
  </g>
</svg>
`;

fs.writeFileSync("/tmp/stamp-test.svg", stampSvg);
console.log("SVG written to /tmp/stamp-test.svg");
