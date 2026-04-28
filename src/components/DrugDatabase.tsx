import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { isApiConfigured } from '../services/api';
import { searchMedicationInfo, checkDrugInteractions } from '../services/medgemma';
import { BackIcon, SearchIcon, HomeIcon, UsersIcon, CameraIcon, UserIcon, AlertIcon } from '../components/ui/Icons';

const DrugDatabase = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { drugDatabase } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [interactionCheck, setInteractionCheck] = useState<string | null>(null);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const apiReady = isApiConfigured();

  const filteredDrugs = drugDatabase.filter(drug =>
    drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    drug.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAiSearch = async () => {
    if (!searchQuery.trim() || !apiReady) return;
    setIsSearching(true);
    setAiResult(null);
    try {
      const result = await searchMedicationInfo(searchQuery, language);
      setAiResult(result);
    } catch {
      setAiResult('Failed to get AI response. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckAllInteractions = async () => {
    if (!apiReady) return;
    const allDrugs = filteredDrugs.map(d => d.name);
    setIsCheckingInteractions(true);
    setInteractionCheck(null);
    try {
      const result = await checkDrugInteractions(allDrugs, language);
      setInteractionCheck(result);
    } catch {
      setInteractionCheck('Failed to check interactions. Please try again.');
    } finally {
      setIsCheckingInteractions(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate('/app')} aria-label="Back" className="text-slate-600 p-1">
          <BackIcon />
        </button>
        <h1 className="text-xl font-bold text-cameroon-green">{t.drugs}</h1>
        {apiReady && (
          <span className="text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold ml-auto">MedGemma AI</span>
        )}
      </header>

      <main aria-labelledby="drugs-heading" className="p-5 space-y-6">
        <h2 id="drugs-heading" className="sr-only">{t.drugs}</h2>
        <div className="relative">
          <input
            type="text"
            placeholder={t.search}
            aria-label="Search medications"
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-20 shadow-sm focus:ring-2 focus:ring-medical-green outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
          />
          <SearchIcon className="absolute left-4 top-3.5 text-slate-400" />
          {apiReady && (
            <button
              onClick={handleAiSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-2 top-2 bg-medical-green text-white text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-40 transition-all"
            >
              {isSearching ? '...' : 'AI'}
            </button>
          )}
        </div>

        {aiResult && (
          <div className="bg-purple-50 border border-purple-200 p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black bg-purple-200 text-purple-800 px-2 py-0.5 rounded uppercase tracking-widest">AI Analysis</span>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{aiResult}</p>
            <button onClick={() => setAiResult(null)} className="text-xs text-purple-600 font-bold mt-2">Dismiss</button>
          </div>
        )}

        {apiReady && (
          <button
            onClick={handleCheckAllInteractions}
            disabled={isCheckingInteractions}
            className="w-full bg-red-50 border border-red-200 text-red-700 font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <AlertIcon className="h-4 w-4" />
            {isCheckingInteractions ? 'Checking...' : 'Check All Drug Interactions (AI)'}
          </button>
        )}

        {interactionCheck && (
          <div className="bg-red-50 border border-red-200 p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black bg-red-200 text-red-800 px-2 py-0.5 rounded uppercase tracking-widest">AI Interaction Report</span>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{interactionCheck}</p>
            <button onClick={() => setInteractionCheck(null)} className="text-xs text-red-600 font-bold mt-2">Dismiss</button>
          </div>
        )}

        <div className="space-y-4">
          {filteredDrugs.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
              <p className="text-sm text-slate-500 font-medium">No medications found. Try a different search term.</p>
            </div>
          )}
          {filteredDrugs.map((drug, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-800">{drug.name}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${drug.type === 'Natural' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {drug.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium italic">{drug.dosage} &bull; {t.cameroon_avail}: {drug.availability}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{drug.description}</p>
            </div>
          ))}
        </div>
      </main>

      <nav aria-label="Main navigation" className="glass-effect border-t border-slate-200 fixed bottom-0 left-0 right-0 px-6 py-3 flex justify-between safe-area-bottom z-20">
        <button onClick={() => navigate('/app')} className="flex flex-col items-center gap-1 text-slate-400">
          <HomeIcon /><span className="text-[10px] font-medium">{t.home}</span>
        </button>
        <button onClick={() => navigate('/patients')} className="flex flex-col items-center gap-1 text-slate-400">
          <UsersIcon /><span className="text-[10px] font-medium">{t.patients}</span>
        </button>
        <button onClick={() => navigate('/scanner')} className="flex flex-col items-center gap-1 text-slate-400">
          <div className="bg-slate-200 text-slate-600 p-1 rounded-lg"><CameraIcon /></div>
          <span className="text-[10px] font-medium">{t.scan}</span>
        </button>
        <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-1 text-slate-400">
          <UserIcon /><span className="text-[10px] font-medium">{t.profile}</span>
        </button>
      </nav>
    </div>
  );
};

export default DrugDatabase;