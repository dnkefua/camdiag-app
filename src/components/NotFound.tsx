import { useNavigate } from 'react-router-dom';
import { CamDiagLogo } from './ui/CamDiagLogo';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cameroon-night text-white flex flex-col items-center justify-center p-6 text-center">
      <CamDiagLogo size={80} animated showWordmark />
      <h1 className="text-8xl font-black text-gradient-cameroon mt-8 mb-4 font-display">404</h1>
      <p className="text-xl text-white/70 mb-2">Page not found</p>
       <p className="text-sm text-white/40 mb-10 max-w-md">
         The page you&#39;re looking for doesn&#39;t exist or has been moved.
       </p>
      <button
        onClick={() => navigate('/')}
        className="bg-cameroon-yellow text-cameroon-night font-black px-8 py-4 rounded-full shadow-sunset-glow hover:scale-105 active:scale-95 transition-all"
      >
        Go Home
      </button>
    </div>
  );
};

export default NotFound;
