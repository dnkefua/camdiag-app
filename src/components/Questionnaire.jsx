import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Questionnaire = ({ onBack, t }) => {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    med: '',
    source: '',
    worked: 'yes',
    audioCaptured: false,
    imageCaptured: false
  });

  const handleSumbit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="w-24 h-24 bg-medical-green rounded-full flex items-center justify-center text-white shadow-2xl"
        >
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path></svg>
        </motion.div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">{t.quest_reward}</h2>
          <p className="text-slate-500 font-medium mt-2">Thank you for helping the medical community in Cameroon.</p>
        </div>
        <button 
          onClick={onBack}
          className="bg-slate-900 text-white font-bold py-4 px-8 rounded-2xl shadow-lg active:scale-95 transition-all w-full max-w-xs"
        >
          {t.back}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="text-slate-600 p-1">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
        </button>
        <h1 className="text-xl font-bold text-cameroon-green">{t.questionnaire_title}</h1>
      </header>

      <main className="p-6 space-y-8 max-w-lg mx-auto w-full">
        <section className="bg-cameroon-green/10 p-5 rounded-3xl border border-cameroon-green/20">
          <p className="text-cameroon-green font-bold text-sm text-center italic">{t.quest_intro}</p>
        </section>

        <form onSubmit={handleSumbit} className="space-y-6">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t.quest_q1}</span>
              <input 
                type="text" 
                placeholder="Ex: Coartem, Paracetamol..."
                className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 focus:border-medical-green outline-none transition-all"
                value={formData.med}
                onChange={(e) => setFormData({...formData, med: e.target.value})}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t.quest_q2}</span>
              <input 
                type="text" 
                placeholder="Pharmacy name or market location..."
                className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 focus:border-medical-green outline-none transition-all"
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
                required
              />
            </label>

            <div>
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 block">{t.quest_q3}</span>
              <div className="grid grid-cols-3 gap-3">
                {['yes', 'no', 'maybe'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({...formData, worked: opt})}
                    className={`py-3 rounded-2xl font-bold capitalize transition-all border-2 ${formData.worked === opt ? 'bg-medical-green border-medical-green text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Data Collection</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Audio Input Button */}
              <button 
                type="button"
                onClick={() => setFormData({...formData, audioCaptured: !formData.audioCaptured})}
                className={`p-4 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.audioCaptured ? 'border-medical-green bg-medical-green/5' : 'border-slate-100 bg-white'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.audioCaptured ? 'bg-medical-green text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-3 3 3 3 0 01-3-3V5a3 3 0 013-3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                </div>
                <span className={`text-[10px] font-bold uppercase ${formData.audioCaptured ? 'text-medical-green' : 'text-slate-400'}`}>{t.quest_audio}</span>
              </button>

              {/* Photo Input Button */}
              <button 
                type="button"
                onClick={() => setFormData({...formData, imageCaptured: !formData.imageCaptured})}
                className={`p-4 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.imageCaptured ? 'border-medical-green bg-medical-green/5' : 'border-slate-100 bg-white'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.imageCaptured ? 'bg-medical-green text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                </div>
                <span className={`text-[10px] font-bold uppercase ${formData.imageCaptured ? 'text-medical-green' : 'text-slate-400'}`}>{t.quest_image}</span>
              </button>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group mt-4"
          >
            <span>{t.quest_submit}</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </button>
        </form>
      </main>
    </div>
  );
};

export default Questionnaire;
