import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
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
              <Shield className="w-4 h-4" />
              Privacy Policy
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Privacy Policy</h1>
            <p className="text-stone-500 italic">Last Updated: March 25, 2026</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="prose prose-stone max-w-none space-y-8 text-stone-700 leading-relaxed"
          >
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-stone-900">1. Introduction</h2>
              <p>
                Welcome to Kasama PH. We are committed to protecting your personal data and your privacy in accordance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> of the Philippines. This Privacy Policy explains how we collect, use, and safeguard your information when you join our waitlist.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-stone-900">2. Information We Collect</h2>
              <p>
                When you sign up for our waitlist, we collect the following information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Email Address:</strong> To send you updates about our beta launch and your waitlist position.</li>
                <li><strong>Age:</strong> To understand the demographic of our users and ensure our AI assistant is tailored correctly.</li>
                <li><strong>Role:</strong> To identify if you are a senior citizen, a family member, or a caregiver.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-stone-900">3. Purpose of Collection</h2>
              <p>
                Your data is collected solely for the purpose of managing the Kasama PH waitlist, providing you with early access updates, and improving our service based on user demographics. We do not sell your personal data to third parties.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-stone-900">4. Data Storage and Security</h2>
              <p>
                We use <strong>Google Firebase</strong> for secure data storage. Firebase maintains industry-standard security protocols to protect your information. Your data may be stored on servers located outside of the Philippines, but we ensure that your rights under the Data Privacy Act are respected.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-stone-900">5. Your Rights</h2>
              <p>
                As a data subject in the Philippines, you have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Be informed that your personal data is being collected.</li>
                <li>Access your personal data held by us.</li>
                <li>Request correction of any inaccurate data.</li>
                <li>Object to the processing of your data.</li>
                <li>Request the deletion or removal of your data from our waitlist.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-stone-900">6. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or wish to exercise your rights, please contact our Data Protection Officer at:
              </p>
              <p className="font-bold text-rose-800">
                privacy@kasama-ph.vercel.app
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
