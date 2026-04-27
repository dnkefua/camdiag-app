import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { BackIcon } from '../components/ui/Icons';

const Blog = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('stories');

  const categories: Record<string, { label: string; items: Array<{ title: string; excerpt: string; date: string; readTime: string }> }> = {
    stories: { label: t.blog_stories, items: [
      { title: 'Surviving Malaria: A Farmer\'s Tale', excerpt: 'How early detection saved a village leader.', date: 'Mar 10, 2026', readTime: '5 min' },
      { title: 'Overcoming Dermatitis Locally', excerpt: 'Using both prescribed and traditional remedies effectively.', date: 'Feb 28, 2026', readTime: '4 min' },
    ]},
    developments: { label: t.blog_developments, items: [
      { title: 'New Rapid Tests for Typhoid', excerpt: 'Accuracy improved by 30% in latest clinical trials.', date: 'Mar 12, 2026', readTime: '3 min' },
      { title: 'AI in African Healthcare', excerpt: 'How machine learning is bridging the doctor shortage gap.', date: 'Jan 15, 2026', readTime: '6 min' },
    ]},
    innovations: { label: t.blog_innovations, items: [
      { title: 'Solar-Powered Smart Clinics', excerpt: 'Off-grid healthcare solutions rolling out in rural areas.', date: 'Mar 05, 2026', readTime: '4 min' },
      { title: 'CamDiag Vision Integration', excerpt: 'Next-gen camera sensors for better skin analysis.', date: 'Feb 10, 2026', readTime: '2 min' },
    ]},
    reviews: { label: t.blog_reviews, items: [
      { title: 'Yaound\u00e9 Central Hospital Review', excerpt: 'Patient experiences and wait times analyzed.', date: 'Mar 01, 2026', readTime: '5 min' },
      { title: 'Top 5 Pharmacies in Douala', excerpt: 'Where to find the most reliable drug availability.', date: 'Jan 22, 2026', readTime: '7 min' },
    ]},
    classifieds: { label: t.blog_classifieds, items: [
      { title: 'Hiring: General Practitioner in Bamenda', excerpt: 'New clinic seeking full-time staff. Competitive salary.', date: 'Mar 13, 2026', readTime: '1 min' },
      { title: 'For Sale: Portable Ultrasound Machine', excerpt: 'Gently used Sonosite Edge II. Contact Dr. Ndi.', date: 'Mar 11, 2026', readTime: '2 min' },
      { title: 'New Service: Mobile Lab Testing', excerpt: 'Rapid diagnostics now available at your doorstep in Buea.', date: 'Mar 08, 2026', readTime: '3 min' },
    ]},
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate('/')} className="text-slate-600 p-1 active:scale-95 transition-transform">
          <BackIcon />
        </button>
        <h1 className="text-xl font-bold text-cameroon-green">{t.blog_title}</h1>
      </header>

      <section className="bg-white border-b border-slate-200">
        <div className="flex overflow-x-auto no-scrollbar px-4 py-3 gap-2">
          {Object.entries(categories).map(([key, data]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                activeTab === key ? 'bg-medical-green text-white shadow-md' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {data.label}
            </button>
          ))}
        </div>
      </section>

      <main className="flex-grow p-4 space-y-4 max-w-lg mx-auto w-full">
        <div className="space-y-4">
          {categories[activeTab]?.items.map((item, idx) => (
            <article key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
              <h3 className="font-bold text-lg text-slate-800 leading-tight">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.excerpt}</p>
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-50">
                <span className="text-xs text-slate-400 font-medium">{item.date}</span>
                <span className="text-xs font-bold text-medical-blue uppercase tracking-wider">{item.readTime} read</span>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Blog;