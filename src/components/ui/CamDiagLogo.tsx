import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  animated?: boolean;
  showWordmark?: boolean;
  className?: string;
}

/**
 * CamDiag premium 3D logo.
 * Composition: a faceted shield (medical trust) carrying a stylized "CD"
 * monogram, layered over a Cameroon flag accent ribbon. The shield's
 * facets render via gradient lighting to read as 3D without raster assets.
 *
 * Static usage: <CamDiagLogo size={48} /> — pure SVG, scales infinitely.
 * Hero usage: <CamDiagLogo size={160} animated showWordmark /> — adds
 * scroll-free idle rotation, gold star twinkle, and orbiting rings.
 */
export const CamDiagLogo = ({
  size = 48,
  animated = false,
  showWordmark = false,
  className = '',
}: LogoProps) => {
  const Wrap = animated ? motion.div : 'div';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Wrap
        className="logo-3d-wrap relative"
        style={{ width: size, height: size }}
        {...(animated && {
          animate: {
            rotateY: [0, 360],
          },
          transition: {
            duration: 18,
            repeat: Infinity,
            ease: 'linear',
          },
          style: {
            width: size,
            height: size,
            perspective: 1000,
          },
        })}
      >
        <div className="logo-3d-inner">
          <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="CamDiag logo"
          >
            <defs>
              {/* Shield body — emerald jungle gradient */}
              <linearGradient id="cd-shield-body" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1FA47A" />
                <stop offset="45%" stopColor="#007A5E" />
                <stop offset="100%" stopColor="#00563F" />
              </linearGradient>
              {/* Shield face highlight */}
              <linearGradient id="cd-shield-light" x1="20%" y1="0%" x2="60%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.0" />
              </linearGradient>
              {/* Shield bevel rim */}
              <linearGradient id="cd-shield-rim" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFE066" />
                <stop offset="50%" stopColor="#FCD116" />
                <stop offset="100%" stopColor="#D4A800" />
              </linearGradient>
              {/* Red ribbon */}
              <linearGradient id="cd-ribbon" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9A0D1D" />
                <stop offset="50%" stopColor="#CE1126" />
                <stop offset="100%" stopColor="#E94B5C" />
              </linearGradient>
              {/* Cross glow */}
              <radialGradient id="cd-cross-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="60%" stopColor="#FFE066" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#FCD116" stopOpacity="0.0" />
              </radialGradient>
              {/* Star */}
              <radialGradient id="cd-star" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#FFE066" />
                <stop offset="100%" stopColor="#FCD116" />
              </radialGradient>

              <filter id="cd-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                <feOffset dx="0" dy="3" />
                <feComponentTransfer><feFuncA type="linear" slope="0.6" /></feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Outer bevel rim (gold) — base shield silhouette */}
            <path
              d="M50 4 L88 18 L88 50 C88 72 72 88 50 96 C28 88 12 72 12 50 L12 18 Z"
              fill="url(#cd-shield-rim)"
            />
            {/* Shield body (inset) */}
            <path
              d="M50 9 L83 21 L83 50 C83 69 69 83 50 90 C31 83 17 69 17 50 L17 21 Z"
              fill="url(#cd-shield-body)"
              filter="url(#cd-shadow)"
            />
            {/* Highlight pass for 3D facet */}
            <path
              d="M50 9 L83 21 L83 50 C83 69 69 83 50 90 C31 83 17 69 17 50 L17 21 Z"
              fill="url(#cd-shield-light)"
            />

            {/* Red ribbon banner across mid-shield */}
            <path
              d="M14 51 Q50 60 86 51 L86 60 Q50 69 14 60 Z"
              fill="url(#cd-ribbon)"
              opacity="0.95"
            />
            {/* Ribbon highlight */}
            <path
              d="M14 51 Q50 56 86 51 L86 53 Q50 58 14 53 Z"
              fill="#FFFFFF"
              opacity="0.22"
            />

            {/* Medical cross — central glyph */}
            <g transform="translate(50 38)">
              <circle r="14" fill="url(#cd-cross-glow)" opacity="0.55" />
              {/* cross arms */}
              <rect x="-4" y="-12" width="8" height="24" rx="2" fill="#FFF7E6" />
              <rect x="-12" y="-4" width="24" height="8" rx="2" fill="#FFF7E6" />
              {/* cross inner accent */}
              <rect x="-2" y="-10" width="4" height="20" rx="1" fill="#FCD116" opacity="0.9" />
              <rect x="-10" y="-2" width="20" height="4" rx="1" fill="#FCD116" opacity="0.9" />
            </g>

            {/* Gold star — Cameroon flag echo, lower shield */}
            {animated ? (
              <motion.g
                animate={{ scale: [1, 1.18, 1], opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: '50px 76px' }}
              >
                <Star />
              </motion.g>
            ) : (
              <g>
                <Star />
              </g>
            )}

            {/* Specular streak — adds glassy 3D feel */}
            <path
              d="M22 18 Q34 14 46 22"
              stroke="#FFFFFF"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
              opacity="0.55"
            />
          </svg>
        </div>

        {animated && (
          <>
            {/* Orbiting accent ring — appears on hover hint */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: '1px dashed rgba(252, 209, 22, 0.3)',
                borderRadius: '50%',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0, 0.15] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                background: 'radial-gradient(circle, rgba(252,209,22,0.25), transparent 60%)',
              }}
            />
          </>
        )}
      </Wrap>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span
            className="font-display font-black text-2xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            <span className="text-cameroon-green">Cam</span>
            <span className="text-gradient-gold">Diag</span>
          </span>
          <span className="text-[9px] uppercase tracking-[0.25em] text-cameroon-green/60 font-bold mt-0.5">
            Medical AI · Cameroon
          </span>
        </div>
      )}
    </div>
  );
};

const Star = () => (
  <path
    d="M50 70 L52.4 75.8 L58.6 76.4 L53.9 80.5 L55.4 86.5 L50 83.4 L44.6 86.5 L46.1 80.5 L41.4 76.4 L47.6 75.8 Z"
    fill="url(#cd-star)"
    stroke="#D4A800"
    strokeWidth="0.5"
  />
);

export default CamDiagLogo;
