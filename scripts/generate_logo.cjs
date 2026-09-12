const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

function buildLogoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <clipPath id="squircle-clip">
      <rect x="24" y="24" width="976" height="976" rx="220" />
    </clipPath>

    <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#00f5ff"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>

    <linearGradient id="beak-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f5ff"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>

    <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.16" />
    </filter>
  </defs>

  <!-- Luxury White Squircle Container -->
  <rect x="24" y="24" width="976" height="976" rx="220" fill="#ffffff" stroke="#e2e8f0" stroke-width="6" />

  <g clip-path="url(#squircle-clip)">
    <g transform="translate(512, 512)" filter="url(#subtle-shadow)">

      <!-- Circular Viewfinder Optical Aperture Gateway -->
      <circle cx="0" cy="0" r="380" fill="none" stroke="#0f172a" stroke-width="36" />
      <circle cx="0" cy="0" r="344" fill="none" stroke="#00f5ff" stroke-width="4" opacity="0.55" stroke-dasharray="16, 12" />

      <!-- Viewfinder Tick Crosshairs -->
      <line x1="-380" y1="0" x2="-350" y2="0" stroke="#00f5ff" stroke-width="4" />
      <line x1="350" y1="0" x2="380" y2="0" stroke="#00f5ff" stroke-width="4" />
      <line x1="0" y1="-380" x2="0" y2="-350" stroke="#00f5ff" stroke-width="4" />
      <line x1="0" y1="350" x2="0" y2="380" stroke="#00f5ff" stroke-width="4" />

      <!-- 100% Watertight Solid Base Silhouette (Zero-Leak Rule) -->
      <path d="
        M 0,-210
        L 70,-260 L 135,-320 L 160,-220 L 235,-120 L 260,-20 L 235,110 L 165,240 L 0,335
        L -165,240 L -235,110 L -260,-20 L -235,-120 L -160,-220 L -135,-320 L -70,-260 Z
      " fill="#090d16" />

      <!-- Ear Tufts / Horned Crest (Alert, Symmetrical & Sharp) -->
      <polygon points="0,-210 70,-260 135,-320 100,-200 0,-180" fill="#334155" />
      <polygon points="0,-210 -70,-260 -135,-320 -100,-200 0,-180" fill="#1e293b" />
      <polygon points="135,-320 160,-220 100,-200" fill="#475569" />
      <polygon points="-135,-320 -160,-220 -100,-200" fill="#0f172a" />

      <!-- Upper Forehead & Cranium -->
      <polygon points="0,-180 100,-200 65,-120 0,-100" fill="#334155" />
      <polygon points="0,-180 -100,-200 -65,-120 0,-100" fill="#1e293b" />
      <polygon points="100,-200 160,-220 170,-110 65,-120" fill="#1e293b" />
      <polygon points="-100,-200 -160,-220 -170,-110 -65,-120" fill="#0f172a" />

      <!-- Lateral Cheeks & Outer Disc Wings -->
      <polygon points="160,-220 235,-120 190,-30 170,-110" fill="#334155" />
      <polygon points="-160,-220 -235,-120 -190,-30 -170,-110" fill="#0f172a" />
      <polygon points="235,-120 260,-20 190,60 190,-30" fill="#1e293b" />
      <polygon points="-235,-120 -260,-20 -190,60 -190,-30" fill="#090d16" />

      <!-- Nasal Bridge & Center Keel -->
      <polygon points="0,-100 30,-90 20,-10 0,0" fill="#475569" />
      <polygon points="0,-100 -30,-90 -20,-10 0,0" fill="#1e293b" />

      <!-- PREDATOR EYES (Slanted sharply UPWARDS toward ears: (30,-60) to (125,-105)) -->
      <!-- Right Eye Socket Base -->
      <polygon points="30,-70 125,-105 120,-65 35,-40" fill="#090d16" />
      <!-- Right Eye Glowing Iris -->
      <polygon points="36,-65 120,-98 115,-70 42,-46" fill="url(#cyan-glow)" />
      <!-- Right Eye Slit Pupil -->
      <polygon points="76,-90 84,-75 80,-55 72,-68" fill="#090d16" />
      <!-- Right Eye Catchlight -->
      <polygon points="65,-80 73,-83 71,-75 63,-74" fill="#ffffff" opacity="0.95" />

      <!-- Left Eye Socket Base -->
      <polygon points="-30,-70 -125,-105 -120,-65 -35,-40" fill="#090d16" />
      <!-- Left Eye Glowing Iris -->
      <polygon points="-36,-65 -120,-98 -115,-70 -42,-46" fill="url(#cyan-glow)" />
      <!-- Left Eye Slit Pupil -->
      <polygon points="-76,-90 -84,-75 -80,-55 -72,-68" fill="#090d16" />
      <!-- Left Eye Catchlight -->
      <polygon points="-65,-80 -73,-83 -71,-75 -63,-74" fill="#ffffff" opacity="0.95" />

      <!-- Sub-orbital Cheek Facets -->
      <polygon points="35,-40 120,-65 150,15 70,25 20,-10" fill="#334155" />
      <polygon points="-35,-40 -120,-65 -150,15 -70,25 -20,-10" fill="#1e293b" />
      <polygon points="120,-65 190,-30 190,60 150,15" fill="#475569" />
      <polygon points="-120,-65 -190,-30 -190,60 -150,15" fill="#0f172a" />

      <!-- Origami Cyan Geometric Beak -->
      <polygon points="0,0 25,-10 0,90" fill="url(#beak-cyan)" />
      <polygon points="0,0 -25,-10 0,90" fill="#0284c7" />
      <polygon points="0,90 18,10 0,0" fill="#38bdf8" />
      <polygon points="0,90 -18,10 0,0" fill="#0369a1" />

      <!-- Chin & Neck Armor Facets -->
      <polygon points="0,90 70,25 90,125 0,155" fill="#334155" />
      <polygon points="0,90 -70,25 -90,125 0,155" fill="#1e293b" />
      <polygon points="70,25 150,15 160,130 90,125" fill="#1e293b" />
      <polygon points="-70,25 -150,15 -160,130 -90,125" fill="#0f172a" />

      <!-- Chest & Breastplate Armor (Volumetric Facets) -->
      <polygon points="0,155 90,125 105,230 0,270" fill="#334155" />
      <polygon points="0,155 -90,125 -105,230 0,270" fill="#1e293b" />
      <polygon points="90,125 160,130 165,240 105,230" fill="#475569" />
      <polygon points="-90,125 -160,130 -165,240 -105,230" fill="#0f172a" />
      <polygon points="160,130 235,110 165,240" fill="#1e293b" />
      <polygon points="-160,130 -235,110 -165,240" fill="#090d16" />

      <!-- Tail Keel & Telemetry Core V -->
      <polygon points="0,270 105,230 0,335" fill="#1e293b" />
      <polygon points="0,270 -105,230 0,335" fill="#0f172a" />
      <polygon points="105,230 165,240 0,335" fill="#0f172a" />
      <polygon points="-105,230 -165,240 0,335" fill="#090d16" />

      <!-- Electric Cyan Telemetry Focus Chevron -->
      <polygon points="0,205 24,190 0,245" fill="#00f5ff" opacity="0.95" />
      <polygon points="0,205 -24,190 0,245" fill="#0284c7" opacity="0.95" />

    </g>
  </g>
</svg>`;
}

async function renderLogo(outputDir) {
  const svg = buildLogoSvg();
  const svgPath = path.join(outputDir, 'logo.svg');
  const pngPath = path.join(outputDir, 'logo.png');

  fs.writeFileSync(svgPath, svg);
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1024 } });
  const pngData = resvg.render().asPng();
  fs.writeFileSync(pngPath, pngData);
  console.log('Successfully rendered owl logo.svg and logo.png at 1024x1024');
}

const targetDir = path.resolve(__dirname, '../docs/images');
renderLogo(targetDir).catch(console.error);
