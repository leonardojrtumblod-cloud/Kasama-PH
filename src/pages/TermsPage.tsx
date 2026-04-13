import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-rose-100">
      <nav className="fixed top-0 w-full z-50 px-6 py-4 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 hover:text-rose-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/kasama-logo.webp" alt="Kasama PH Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-black tracking-tight">Kasama PH</span>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-800 rounded-full text-sm font-bold border border-rose-100">
              <FileText className="w-4 h-4" />
              Terms of Service
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Terms of Service</h1>
            <p className="text-stone-500 italic">Last Updated: March 25, 2026</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="prose prose-stone max-w-none space-y-8 text-stone-700 leading-relaxed"
          >
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-stone-900">1. Acceptance of Terms</h2>
              <p>
                By joining the Kasama PH waitlist, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not join the waitlist.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-stone-900">2. Waitlist Participation</h2>
              <p>
                Joining the waitlist does not guarantee early access to Kasama PH. Access will be granted at our sole discretion based on availability and other factors. We reserve the right to modify or terminate the waitlist program at any time.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-stone-900">3. User Responsibilities</h2>
              <p>
                You agree to provide accurate and complete information when signing up. You are responsible for maintaining the confidentiality of any referral links or codes provided to you.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-stone-900">4. Referral Program</h2>
              <p>
                Our referral program is designed to reward users who share Kasama PH with their friends and family. Any attempt to manipulate the referral system through fraudulent means (e.g., creating fake accounts) will result in immediate disqualification from the waitlist.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-stone-900">5. Limitation of Liability</h2>
              <p>
                Kasama PH is provided "as is" without any warranties. We are not liable for any damages arising from your participation in the waitlist or your use of our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-stone-900">6. Governing Law</h2>
              <p>
                These terms are governed by and construed in accordance with the laws of the <strong>Republic of the Philippines</strong>.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-stone-900">7. Changes to Terms</h2>
              <p>
                We may update these Terms of Service from time to time. We will notify you of any changes by posting the new Terms of Service on this page.
              </p>
            </section>
          </motion.div>
        </div>
      </main>

      <footer className="py-12 px-6 border-t border-stone-200 bg-white text-center">
        <p className="text-stone-500 text-sm">© 2026 Kasama AI. Built with love for Filipino families.</p>
      </footer>
    </div>
  );
}
