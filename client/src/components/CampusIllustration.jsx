// SVG illustration of a college campus with students in minimal line art
const CampusIllustration = () => {
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="campus-line-art"
      aria-hidden="true"
    >
      {/* College main hall with clock tower and pediment */}
      <path
        d="M160 30 L110 65 L210 65 Z"
        stroke="rgba(255, 255, 255, 0.75)"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      {/* Flag atop tower */}
      <path
        d="M160 30 L160 18 M160 18 L172 23 L160 28"
        stroke="rgba(255, 255, 255, 0.85)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Clock in tower */}
      <circle
        cx="160"
        cy="52"
        r="6"
        stroke="rgba(255, 255, 255, 0.75)"
        strokeWidth="1.5"
      />
      <path
        d="M160 49 L160 52 L163 52"
        stroke="rgba(255, 255, 255, 0.75)"
        strokeWidth="1.25"
        strokeLinecap="round"
      />

      {/* Main building facade */}
      <rect
        x="115"
        y="65"
        width="90"
        height="85"
        stroke="rgba(255, 255, 255, 0.65)"
        strokeWidth="1.75"
      />
      {/* Entrance archway */}
      <path
        d="M148 150 L148 122 C148 115 172 115 172 122 L172 150"
        stroke="rgba(255, 255, 255, 0.8)"
        strokeWidth="1.75"
      />

      {/* Building windows */}
      <rect x="125" y="78" width="14" height="20" rx="2" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1.5" />
      <rect x="181" y="78" width="14" height="20" rx="2" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1.5" />

      {/* Left building wing */}
      <path
        d="M70 95 L115 95 L115 150 L70 150 Z"
        stroke="rgba(255, 255, 255, 0.55)"
        strokeWidth="1.5"
      />
      <rect x="82" y="108" width="16" height="18" rx="2" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="1.25" />

      {/* Right building wing */}
      <path
        d="M205 95 L250 95 L250 150 L205 150 Z"
        stroke="rgba(255, 255, 255, 0.55)"
        strokeWidth="1.5"
      />
      <rect x="222" y="108" width="16" height="18" rx="2" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="1.25" />

      {/* Background trees */}
      <path
        d="M45 130 C45 118 62 118 62 130 C62 142 45 142 45 130 Z M53 140 L53 152"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="1.25"
      />
      <path
        d="M260 128 C260 116 278 116 278 128 C278 140 260 140 260 128 Z M269 138 L269 152"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="1.25"
      />

      {/* Ground horizon line */}
      <path
        d="M20 152 L300 152"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Student 1 (walking with bag) */}
      <circle cx="78" cy="168" r="6" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.5" />
      <path
        d="M78 174 L78 195 M72 182 L84 182 M78 195 L72 214 M78 195 L84 214"
        stroke="rgba(255, 255, 255, 0.85)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Backpack */}
      <rect x="82" y="177" width="6" height="12" rx="2" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.25" />

      {/* Student 2 (center, holding books) */}
      <circle cx="155" cy="165" r="6" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.5" />
      <path
        d="M155 171 L155 192 M150 179 L162 179 M155 192 L149 214 M155 192 L161 214"
        stroke="rgba(255, 255, 255, 0.85)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Book folder */}
      <path d="M149 181 L153 189" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.25" />

      {/* Student 3 (conversing on right) */}
      <circle cx="235" cy="167" r="6" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.5" />
      <path
        d="M235 173 L235 194 M229 181 L241 181 M235 194 L229 214 M235 194 L240 214"
        stroke="rgba(255, 255, 255, 0.85)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Subtle clouds in sky */}
      <path
        d="M60 48 Q70 42 80 48 Q90 48 94 54 L60 54 Z"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="1"
      />
      <path
        d="M230 42 Q240 36 250 42 Q260 42 264 48 L230 48 Z"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="1"
      />
    </svg>
  )
}

export default CampusIllustration
