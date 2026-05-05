import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  animated?: boolean;
  showWordmark?: boolean;
  className?: string;
}

const LOGO_IMAGE_SRC = '/brand/camdiag-logo.png';
const LOGO_VIDEO_SRC = '/brand/camdiag-logo-animation.mp4';

/**
 * Shared CamDiag brand lockup.
 *
 * The component keeps the original prop API used across the app while
 * rendering the supplied brand artwork from public/brand.
 */
export const CamDiagLogo = ({
  size = 48,
  animated = false,
  showWordmark = false,
  className = '',
}: LogoProps) => {
  const showFullArtwork = animated && !showWordmark && size >= 96;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.div
        className={`logo-3d-wrap camdiag-logo-media relative ${
          showFullArtwork ? 'camdiag-logo-media-full' : 'camdiag-logo-media-mark'
        }`}
        style={{ width: size, height: size }}
        role="img"
        aria-label="CamDiag logo"
        whileHover={{ scale: 1.04 }}
        transition={{ type: 'spring', stiffness: 360, damping: 26 }}
      >
        {animated ? (
          <video
            className="camdiag-logo-asset"
            src={LOGO_VIDEO_SRC}
            poster={LOGO_IMAGE_SRC}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        ) : (
          <img
            className="camdiag-logo-asset"
            src={LOGO_IMAGE_SRC}
            alt=""
            loading="eager"
            decoding="async"
            aria-hidden="true"
          />
        )}
      </motion.div>

      {showWordmark && (
        <div className="flex min-w-0 flex-col leading-none">
          <span className="font-display text-2xl font-black">
            <span className="text-cameroon-green">Cam</span>
            <span className="text-gradient-gold">Diag</span>
          </span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.25em] text-cameroon-green/60">
            AI Clinical Support for Africa
          </span>
        </div>
      )}
    </div>
  );
};

export default CamDiagLogo;
