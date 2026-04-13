import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  Zap, 
  CheckCircle2, 
  Share2, 
  MessageSquare, 
  Facebook, 
  Twitter, 
  Menu,
  X,
  Play,
  Square,
  Quote,
  Star,
  Heart,
  Shield,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import ReactGA from 'react-ga4';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, runTransaction, doc, increment, getCountFromServer } from 'firebase/firestore';
import { playTTS } from '../services/ttsService';

// --- Iron Vault: Internal Security Entropy ---
const VAULT_SALT = "KSMA_SANCTUARY_2026_ALPHA";
const SUBMISSION_COOLDOWN_MS = 5 * 60 * 1000; // 5 Minutes

// --- Iron Vault: Production Logger ---
const VaultLogger = {
  log: (...args: any[]) => { if (import.meta.env.DEV) console.log(...args); },
  error: (...args: any[]) => { if (import.meta.env.DEV) console.error(...args); },
  info: (...args: any[]) => { if (import.meta.env.DEV) console.info(...args); }
};

// --- Iron Vault: Strict Whitelist Regex ---
const WHITE_LIST = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  LOCATION: /^[a-zA-Z0-9\s,.-]+$/,
  AGE: /^[0-9]{1,3}$/
};

const LogicBar = () => (
  <div className="sticky top-0 z-[60] bg-rose-900 text-white/90 py-1.5 px-6 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] border-b border-rose-800/50">
    <div className="flex items-center gap-4 sm:gap-6">
      <div className="flex items-center gap-2">
        <div className="w-1 h-1 bg-rose-400 rounded-full" />
        <span>The Sanctuary</span>
      </div>
      <span className="opacity-20">|</span>
      <span>Safety Cascade</span>
      <span className="opacity-20">|</span>
      <span>Pricing</span>
    </div>
    <div className="flex items-center gap-2 text-rose-300">
      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
      <span className="hidden sm:inline">System Active:</span> 2026_STABLE
    </div>
  </div>
);

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [honeyPot, setHoneyPot] = useState(''); // website field
  
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroParallax = useTransform(heroScroll, [0, 1], [0, -40]);

  const revealProps = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Capture referral code from URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferredBy(ref);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !age || !role) return;
    
    // 1. Extreme API Defense: Honey Pot Logic
    if (honeyPot) {
      VaultLogger.info("Honey pot triggered. Silently dropping request.");
      setIsSubmitted(true); // Fake success
      return;
    }

    // 2. Strict Whitelist Verification
    if (!WHITE_LIST.EMAIL.test(email)) {
      setError("Maling format ng email. Pakitingnan po ulit.");
      return;
    }
    if (!WHITE_LIST.LOCATION.test(location)) {
      setError("Pakigamit lamang ang mga harakter na (A-Z, 0-9, at bantas).");
      return;
    }
    if (!WHITE_LIST.AGE.test(age)) {
      setError("Pakilagay ang tamang edad.");
      return;
    }

    // 3. Security Timing: Cooldown Check
    const lastSub = localStorage.getItem('ksma_enrollment_lock');
    if (lastSub && Date.now() - Number(lastSub) < SUBMISSION_COOLDOWN_MS) {
      setError("Security Protocol: Masyadong mabilis ang pag-submit. Mangyaring maghintay ng 5 minuto.");
      return;
    }
    
    if (!turnstileToken) {
      setError("Pakisubukang muli. Kailangan naming masiguro na hindi po kayo bot.");
      return;
    }

    setError(null);

    try {
      if (!db) {
        throw new Error("Firestore is not initialized");
      }

      // 4. Request Signature (Obfuscation)
      const signature = btoa(`${email}:${Date.now()}:${VAULT_SALT}`);

      const waitlistRef = collection(db, 'waitlist');
      const myReferralCode = Math.random().toString(36).substring(7).toUpperCase();

      // 1. Get current total count for initial queue position (outside transaction)
      const countSnapshot = await getCountFromServer(waitlistRef);
      const totalCount = countSnapshot.data().count;

      // 2. Find referrer if exists (outside transaction)
      let referrerDocId = null;
      if (referredBy) {
        const referrerQuery = query(waitlistRef, where('referralCode', '==', referredBy));
        const referrerDocs = await getDocs(referrerQuery);
        if (!referrerDocs.empty) {
          referrerDocId = referrerDocs.docs[0].id;
        }
      }

      // 3. Use a transaction to handle referral attribution and document creation
      await runTransaction(db, async (transaction) => {
        if (referrerDocId) {
          transaction.update(doc(db, 'waitlist', referrerDocId), {
            referralCount: increment(1)
          });
        }

        const newDocRef = doc(waitlistRef);
        transaction.set(newDocRef, {
          email,
          age: Number(age),
          role,
          location,
          timestamp: serverTimestamp(),
          referralCode: myReferralCode,
          referredBy: referredBy || null,
          referralCount: 0,
          queuePosition: totalCount + 1,
          vaultSignature: signature,
          revenueReady: true
        });
      });

      // Update cooldown lock
      localStorage.setItem('ksma_enrollment_lock', Date.now().toString());

      setReferralCode(myReferralCode);
      setQueuePosition(totalCount + 1);
      setIsSubmitted(true);

      // Track conversion in GA4
      if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
        ReactGA.event('waitlist_signup', {
          role: role,
          age: Number(age),
          referral_source: referredBy || 'direct'
        });
      }
    } catch (err: any) {
      VaultLogger.error("Error adding to waitlist:", err);
      setError("Something went wrong. Please try again later.");
      try {
        handleFirestoreError(err, OperationType.WRITE, 'waitlist');
      } catch (e) {
        // Error handled
      }
    }
  };

  const shareUrl = `${window.location.origin}?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = "Join the waitlist for Kasama PH! The first Taglish AI for our Lolos and Lolas. 🇵🇭";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareOnViber = () => {
    const text = `Join the waitlist for Kasama PH! The first Taglish AI for our Lolos and Lolas. 🇵🇭 ${shareUrl}`;
    window.open(`viber://forward?text=${encodeURIComponent(text)}`, '_blank');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-rose-100 relative">
      <LogicBar />
      {/* Navigation */}
      <nav className={`fixed top-8 w-full z-50 px-6 py-4 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/kasama-logo.webp" alt="Kasama PH Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
            <span className="text-xl font-black tracking-tight">Kasama PH</span>
          </div>
          <div className="flex items-center gap-4 md:gap-8 font-medium text-stone-600">
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="hover:text-rose-800 transition-colors">Features</button>
              <button onClick={() => scrollToSection('audio-demo')} className="hover:text-rose-800 transition-colors">Meet Kasama</button>
              <button onClick={() => scrollToSection('story')} className="hover:text-rose-800 transition-colors">Our Story</button>
            </div>
            <button 
              onClick={() => scrollToSection('waitlist')} 
              className="hidden md:block px-5 py-2 bg-stone-900 text-white rounded-[12px] hover:bg-stone-800 transition-all text-sm md:text-base"
            >
              Join Waitlist
            </button>
            <button 
              className="md:hidden p-2 text-stone-900"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-6 flex flex-col gap-6 md:hidden">
          <button onClick={() => { scrollToSection('features'); setIsMobileMenuOpen(false); }} className="text-2xl font-bold text-left border-b border-stone-100 pb-4">Features</button>
          <button onClick={() => { scrollToSection('audio-demo'); setIsMobileMenuOpen(false); }} className="text-2xl font-bold text-left border-b border-stone-100 pb-4">Meet Kasama</button>
          <button onClick={() => { scrollToSection('story'); setIsMobileMenuOpen(false); }} className="text-2xl font-bold text-left border-b border-stone-100 pb-4">Our Story</button>
          <button onClick={() => { scrollToSection('waitlist'); setIsMobileMenuOpen(false); }} className="text-2xl font-bold text-left border-b border-stone-100 pb-4">Join Waitlist</button>
        </div>
      )}

      {/* Hero Section */}
      <section ref={heroRef} className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            {...revealProps}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-800 rounded-full text-sm font-bold border border-rose-100">
              <Zap className="w-4 h-4" />
              Now in Private Beta
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight">
              Building the Sanctuary <br />
              <span className="text-rose-800">Your Parents</span> Deserve.
            </h1>
            <p className="text-xl text-stone-600 leading-relaxed max-w-lg">
              The first clinical-grade safety net for Filipino seniors. Manage medications and coordinate care with a 120-second emergency fail-safe—from anywhere in the world.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => {
                  scrollToSection('waitlist');
                  ReactGA.event('hero_primary_click', { action: 'start_family_setup' });
                }}
                className="w-full sm:w-auto px-8 py-4 bg-rose-800 text-white rounded-[12px] font-bold text-lg hover:bg-rose-900 transition-all shadow-lg shadow-rose-900/20"
              >
                Start Family Setup
              </button>
              <button 
                onClick={() => {
                  setShowAccessModal(true);
                  ReactGA.event('hero_secondary_click', { action: 'download_app' });
                }}
                className="w-full sm:w-auto px-8 py-4 bg-white text-rose-800 border-2 border-rose-800 rounded-[12px] font-bold text-lg hover:bg-rose-50 transition-all"
              >
                Download App
              </button>
            </div>
            {error && <p className="text-rose-800 text-sm font-medium">{error}</p>}

          </motion.div>
          <motion.div 
            style={{ y: heroParallax }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[24px] overflow-hidden shadow-2xl border-8 border-white">
              <img 
                src="/kasama-grandparents-celebration.webp" 
                alt="Kasama Characters" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-stone-100 max-w-[240px] space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                Activity Logged
              </div>
              <p className="text-sm text-stone-500">"Lolo Boy just finished his morning exercise. Very active po!"</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-24">
          <motion.div 
            {...revealProps}
            className="text-center space-y-6 max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">Every Second Guarded.</h2>
            <p className="text-xl text-stone-600 leading-relaxed">
              Kasama PH isn't just an app—it's a 24/7 clinical protocol. We coordinate the care, so you can enjoy the conversation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              image="/family-video-checkin.webp"
              icon={<Zap className="w-8 h-8 text-white" />}
              title="Smart Reminders"
              description="Aura ensures Lolo never misses a dose with gentle, high-adherence clinical reminders."
            />
            <FeatureCard 
              image="/bantay-sos.webp"
              icon={<ShieldCheck className="w-8 h-8 text-white" />}
              title="The 120-Second Safety Cascade"
              description="If the alert isn't acknowledged by the Family or Village Guard within 2 minutes, the system triggers a direct escalation to the Barangay Hall responders."
              isSOS
            />
            <FeatureCard 
              image="/kasama-history.webp"
              icon={<Users className="w-8 h-8 text-white" />}
              title="Legacy Vault"
              description="Preserve Lola's stories and recipes through voice-recorded memories for the next generation."
            />
          </div>
        </div>
      </section>

      {/* Meet Your Kasama (Audio Demo) */}
      <section id="audio-demo" className="py-32 bg-stone-900 text-white px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-4xl font-black tracking-tight">Meet Leo & Annie</h2>
            <p className="text-lg text-stone-400">Listen to how our AI assistants sound. Designed with familiar, warm Filipino voices.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <AudioCard 
              name="Leo" 
              role="The Protector" 
              description="Clear, respectful, and reliable. Perfect for medication reminders and emergency check-ins." 
              quote="Magandang umaga po, Lolo. Oras na po para sa inyong gamot sa puso." 
              color="bg-blue-500" 
              voiceName="Fenrir"
            />
            <AudioCard 
              name="Annie" 
              role="The Companion" 
              description="Sweet, patient, and engaging. Great for daily kwentuhan and memory keeping." 
              quote="Lola, kamusta po ang mga tanim niyo sa garden ngayon? Gusto niyo po ba akong kwentuhan?" 
              color="bg-rose-800" 
              voiceName="Kore"
            />
          </div>
        </div>
      </section>

      {/* Role Showcase Section */}
      <motion.section 
        id="roles" 
        className="py-32 bg-rose-50 px-6 overflow-hidden"
        {...revealProps}
      >
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-4xl font-black tracking-tight text-rose-800 text-balance">The Sanctuary Ecosystem</h2>
            <p className="text-lg text-stone-600">Three roles. One clinical standard. Secured for the whole family.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <RoleCard 
              icon={<Heart className="w-6 h-6 text-rose-800" />}
              title="Senior Dashboard"
              tagline="Dignity & Clarity"
              protocols={[
                "One-Tap SOS",
                "Visual Medication Logic",
                "24/7 Status Sync"
              ]}
            />
            <RoleCard 
              icon={<Shield className="w-6 h-6 text-rose-800" />}
              title="Guardian Command"
              tagline="Control & Peace of Mind"
              protocols={[
                "Real-Time Health Feed",
                "Remote Emergency Oversight",
                "Cross-Border Synchronization"
              ]}
            />
            <RoleCard 
              icon={<Activity className="w-6 h-6 text-rose-800" />}
              title="Caregiver Pulse"
              tagline="Coordination & Duty"
              protocols={[
                "Shared Duty Task List",
                "Check-in Verification",
                "Treatment Adherence Logs"
              ]}
            />
          </div>
        </div>
      </motion.section>

      {/* Story Section */}
      <motion.section 
        id="story" 
        className="py-32 px-6 bg-stone-100"
        {...revealProps}
      >
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1">
            <img 
              src="/her-teaching-my-learning.webp" 
              alt="Teaching and Learning" 
              className="rounded-[24px] shadow-2xl border-8 border-white"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-8 order-1 md:order-2">
            <h2 className="text-4xl font-black tracking-tight leading-tight">
              Ang Pagtuturo Niya, <br />
              Ang Pagkatuto Ko.
            </h2>
            <p className="text-xl text-stone-600 leading-relaxed">
              We remember how our grandparents patiently taught us our first words. Now, it's our turn to bridge the gap. Kasama PH makes technology feel like a warm conversation, not a complicated puzzle.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-rose-800 rounded-lg mt-1">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Family Connected</h4>
                  <p className="text-stone-500">Real-time updates for the whole family, wherever they are.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-rose-800 rounded-lg mt-1">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Taglish Support</h4>
                  <p className="text-stone-500">Natural language processing that understands our unique way of speaking.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section 
        id="testimonials" 
        className="py-32 bg-rose-50 px-6"
        {...revealProps}
      >
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-4xl font-black tracking-tight text-stone-900">Trusted by Filipino Families</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="Leo gives me peace of mind while I'm at work abroad. I know Lolo is reminded of his meds daily." 
              author="Maria S." 
              role="OFW Nurse in Dubai" 
            />
            <TestimonialCard 
              quote="Annie is so patient. Lola loves talking to her about her garden. It keeps her mind sharp and happy." 
              author="Mark D." 
              role="Grandson, Manila" 
            />
            <TestimonialCard 
              quote="The Bantay SOS feature is a lifesaver. When my mom felt dizzy, we were all alerted immediately." 
              author="Elena R." 
              role="Daughter, Cebu" 
            />
          </div>
        </div>
      </motion.section>

      {/* Founding Families Waitlist Section */}
      <motion.section 
        id="waitlist" 
        className="py-32 px-6 bg-white overflow-hidden"
        {...revealProps}
      >
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto bg-rose-50 rounded-[24px] p-10 md:p-16 text-center space-y-10 border border-rose-200 shadow-sm relative"
        >
          {/* Founding 100 Badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-rose-800 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
            Founding 100 Priority
          </div>

          {!isSubmitted ? (
            <div className="space-y-8">
              <div className="space-y-3">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-rose-800">Founding Families</h2>
                <p className="text-lg text-stone-600 max-w-xl mx-auto">
                  Currently accepting the first 100 families for priority onboarding. Help us build the gold standard for senior protection.
                </p>
              </div>

              <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-4 max-w-lg mx-auto">
                {/* Iron Vault: Honey Pot Bait */}
                <input 
                  type="text" 
                  name="website" 
                  value={honeyPot} 
                  onChange={(e) => setHoneyPot(e.target.value)} 
                  className="hidden" 
                  tabIndex={-1} 
                  autoComplete="off" 
                />
                
                <div className="space-y-3">
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-6 py-4 bg-white border border-rose-200 rounded-[12px] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-800 transition-all shadow-sm"
                  />
                  <div className="flex gap-3">
                    <input 
                      type="number" 
                      placeholder="Age" 
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                      min="1"
                      max="120"
                      className="w-1/4 px-6 py-4 bg-white border border-rose-200 rounded-[12px] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-800 transition-all shadow-sm"
                    />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                      className="w-3/4 px-6 py-4 bg-white border border-rose-200 rounded-[12px] text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-800 transition-all appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%239f1239%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center]"
                    >
                      <option value="" disabled>Who is signing up?</option>
                      <option value="Senior Citizen">Senior Citizen (Lolo/Lola)</option>
                      <option value="Son/Daughter">Son / Daughter</option>
                      <option value="Grandchild">Grandchild (Apo)</option>
                      <option value="Caregiver">Caregiver / Nurse</option>
                      <option value="Other">Other Family Member</option>
                    </select>
                  </div>
                  <input 
                    type="text" 
                    placeholder="City / Barangay (e.g. San Pedro, Laguna)" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="w-full px-6 py-4 bg-white border border-rose-200 rounded-[12px] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-800 transition-all shadow-sm"
                  />
                </div>
                
                <div className="flex justify-center">
                  <Turnstile 
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} 
                    onSuccess={(token) => setTurnstileToken(token)}
                    onError={() => setError("Bot protection failed. Please refresh.")}
                    options={{ theme: 'light', size: 'invisible' }}
                  />
                </div>
                {error && <p className="text-rose-800 text-sm font-medium">{error}</p>}
                
                <button 
                  type="submit"
                  className="w-full px-8 py-4 bg-rose-800 text-white rounded-[12px] font-bold text-lg hover:bg-rose-900 transition-all shadow-lg shadow-rose-900/10"
                >
                  Confirm Protocol Enrollment
                </button>
              </form>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="w-20 h-20 bg-rose-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-rose-800">Enrollment Successful</h2>
                <p className="text-xl text-stone-600">Protocol is active. You are now being prioritized for our Founding 100.</p>
              </div>

              {queuePosition && (
                <div className="inline-block px-8 py-3 bg-white border border-rose-200 rounded-full shadow-sm">
                  <p className="text-rose-800 font-bold tracking-tight">Waitlist Position: #{queuePosition}</p>
                </div>
              )}

              <div className="bg-white p-8 rounded-[24px] border border-rose-200 space-y-6 max-w-md mx-auto">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Share the Sanctuary</p>
                  <div className="flex items-center gap-3 bg-rose-50 p-4 rounded-[12px] border border-rose-100">
                    <code className="text-sm font-medium text-rose-800 overflow-hidden text-ellipsis whitespace-nowrap flex-1">{shareUrl}</code>
                    <button 
                      onClick={handleCopyLink}
                      className={`p-2 transition-colors ${isCopied ? 'text-green-600' : 'text-stone-400 hover:text-rose-800'}`}
                    >
                      {isCopied ? <CheckCircle2 className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  {[
                    { icon: <Facebook />, bg: 'bg-blue-600', action: shareOnFacebook },
                    { icon: <Twitter />, bg: 'bg-sky-500', action: shareOnTwitter },
                    { icon: <MessageSquare />, bg: 'bg-purple-600', action: shareOnViber }
                  ].map((social, i) => (
                    <button 
                      key={i}
                      onClick={social.action}
                      className={`p-4 ${social.bg} text-white rounded-[12px] hover:scale-105 transition-all shadow-md`}
                    >
                      {social.icon}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.section>

      {/* Access Modal */}
      {showAccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setShowAccessModal(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-white rounded-[24px] p-10 shadow-2xl border border-stone-200 text-center space-y-6"
          >
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 text-rose-800" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tight text-stone-900 text-balance">Clinical Access Required</h3>
              <p className="text-stone-500 leading-relaxed">
                The Kasama app requires an Access Key for entry. Please join the Founding Families waitlist to receive your invitation and key.
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <button 
                onClick={() => { setShowAccessModal(false); scrollToSection('waitlist'); }}
                className="w-full py-4 bg-rose-800 text-white rounded-[12px] font-bold hover:bg-rose-900 transition-all"
              >
                Join Waitlist
              </button>
              <button 
                onClick={() => setShowAccessModal(false)}
                className="w-full py-4 text-stone-500 font-bold hover:text-stone-800 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Localized Hub Footer */}
      <footer className="py-16 px-6 bg-stone-50 border-t border-stone-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <div className="w-8 h-8 bg-rose-800 rounded-[8px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-stone-900">Kasama PH</span>
            </div>
            <p className="text-sm font-medium text-stone-500 max-w-sm">
              The first clinical-grade safety net for Filipino seniors. Standardizing care, one community at a time.
            </p>
            <div className="flex gap-6 text-[11px] font-bold text-stone-400 uppercase tracking-widest pt-4">
              <Link to="/privacy" className="hover:text-rose-800 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-rose-800 transition-colors">Terms of Service</Link>
            </div>
          </div>

          <div className="space-y-4 text-center md:text-right">
            <p className="text-xs font-bold text-rose-800 uppercase tracking-widest">Sanctuary Coverage</p>
            <p className="text-sm font-medium text-stone-600">
              Protecting families in San Pedro, Biñan, Muntinlupa,<br />and 1,000+ communities nationwide.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex gap-4">
              <button className="p-3 bg-white border border-stone-200 text-stone-400 rounded-[12px] hover:text-rose-800 transition-colors shadow-sm">
                <Facebook className="w-5 h-5" />
              </button>
              <button className="p-3 bg-white border border-stone-200 text-stone-400 rounded-[12px] hover:text-rose-800 transition-colors shadow-sm">
                <Twitter className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              © 2026 Kasama Technologies | Sanctuary Hardened
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RoleCard({ icon, title, tagline, protocols }: { icon: React.ReactNode, title: string, tagline: string, protocols: string[] }) {
  return (
    <motion.div 
      whileHover={{ 
        scale: 1.02, 
        boxShadow: '0 0 25px rgba(159, 18, 57, 0.1)',
        borderColor: 'rgba(159, 18, 57, 0.3)'
      }}
      className="bg-white p-8 rounded-[12px] border border-rose-200 shadow-sm transition-all flex flex-col items-start gap-6"
    >
      <div className="p-2 bg-rose-50 rounded-lg">
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-black tracking-tight text-stone-900">{title}</h3>
        <p className="text-rose-800 font-bold uppercase tracking-widest text-[10px]">{tagline}</p>
      </div>
      
      <div className="w-full pt-4 border-t border-stone-100 space-y-4">
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Core Protocols:</p>
        <ul className="space-y-3">
          {protocols.map((protocol, i) => (
            <li key={i} className="flex items-center gap-3 text-stone-600 font-medium">
              <div className="w-1.5 h-1.5 bg-rose-800 rounded-full" />
              {protocol}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function FeatureCard({ image, title, description, icon, isSOS }: { image: string, title: string, description: string, icon: React.ReactNode, isSOS?: boolean }) {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="bg-stone-50 rounded-[24px] p-8 space-y-6 transition-all border border-stone-100 shadow-sm relative overflow-hidden"
    >
      <div className="relative z-10 p-4 bg-rose-800 rounded-[12px] w-fit shadow-lg shadow-rose-900/20">
        {icon}
        {isSOS && (
          <motion.div 
            animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-rose-400 rounded-[12px] -z-10"
          />
        )}
      </div>
      <div className="space-y-3">
        <h3 className="text-2xl font-black tracking-tight text-stone-900">{title}</h3>
        <p className="text-stone-600 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

function BellIcon() {
  return (
    <svg className="w-6 h-6 text-rose-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AudioCard({ name, role, description, quote, color, voiceName }: { name: string, role: string, description: string, quote: string, color: string, voiceName: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  
  const togglePlay = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      if (!audioUrl) {
        const audio = await playTTS(quote, voiceName);
        setAudioUrl(audio.src);
        if (audioRef.current) {
          audioRef.current.src = audio.src;
          await audioRef.current.play();
        }
      } else if (audioRef.current) {
        await audioRef.current.play();
      }
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing audio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/10 border border-white/20 rounded-[24px] p-8 space-y-6 backdrop-blur-sm">
      <audio 
        ref={audioRef} 
        src={audioUrl || undefined}
        onEnded={() => setIsPlaying(false)} 
        className="hidden" 
      />
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-black">{name}</h3>
          <p className="text-stone-400 font-medium">{role}</p>
        </div>
        <button 
          onClick={togglePlay} 
          disabled={isLoading}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-white text-stone-900' : `${color} text-white hover:scale-105`} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Square className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-1" />
          )}
        </button>
      </div>
      <p className="text-stone-300">{description}</p>
      <div className="bg-black/20 rounded-[12px] p-6 relative overflow-hidden">
        <Quote className="absolute top-4 left-4 w-8 h-8 text-white/5" />
        <p className="text-lg font-medium italic relative z-10 pl-4">"{quote}"</p>
        {isPlaying && (
          <div className="flex items-center gap-1 mt-6 h-4 pl-4">
            {[...Array(12)].map((_, i) => (
              <motion.div 
                key={i} 
                animate={{ height: [4, 16, 4] }} 
                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }} 
                className={`w-1.5 rounded-full ${color}`} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string, author: string, role: string }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-rose-100 space-y-6">
      <div className="flex gap-1 text-amber-400">
        {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
      </div>
      <p className="text-stone-600 text-lg italic leading-relaxed">"{quote}"</p>
      <div>
        <p className="font-bold text-stone-900">{author}</p>
        <p className="text-sm text-stone-500">{role}</p>
      </div>
    </div>
  );
}
