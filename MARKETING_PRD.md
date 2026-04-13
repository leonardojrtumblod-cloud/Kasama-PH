# Product Requirements Document (PRD): Kasama PH Marketing & Landing Website

**Project Name:** Kasama PH Landing Page  
**Status:** Draft  
**Owner:** Kasama AI Team  

---

## 1. Project Overview & Goals
The goal of this website is to serve as the primary marketing funnel for the **Kasama PH Web App**. It aims to build trust with Filipino families, educate them on the benefits of AI-driven senior care, and capture early interest through a waitlist and referral program.

### Primary Objectives:
- **Conversion:** Convert visitors into waitlist sign-ups.
- **Virality:** Encourage users to share the app with other families.
- **Authority:** Establish Kasama PH as the leader in culturally-sensitive senior tech in the Philippines.
- **Visibility:** Optimize for both traditional search (SEO) and AI-driven answer engines (AEO).

---

## 2. Target Audience
1.  **Primary: Family Caregivers (The "Sandwich Generation")**
    - Age: 30–55.
    - Busy professionals caring for both children and aging parents (Lola/Lolo).
    - Tech-savvy, uses Facebook/Viber, values peace of mind.
2.  **Secondary: Independent Seniors**
    - Age: 65+.
    - Comfortable with basic smartphone use, values independence and connection to family.

---

## 3. Key Features

### A. High-Conversion Landing Page
- **Hero Section:** Emotional hook ("Alaga ni Kasama, Kampante ang Pamilya") with a clear CTA to "Join the Waitlist."
- **Problem/Solution:** Highlight the stress of medication management and emergency response.
- **Character Showcases:** Introduce Lola Zeny, Lolo Boy, Leo, and Annie with voice samples.
- **Trust Signals:** Security badges (Data Privacy Act compliance), testimonials (mock for now), and "How it Works" steps.

### B. Waitlist System
- Simple email/phone number capture.
- Integration with a backend (Firestore) to store leads.
- Automatic "Welcome" email/SMS confirmation.

### C. Share & Referral Program ("Bayanihan Rewards")
- **Mechanism:** After joining the waitlist, users get a unique referral link.
- **Incentive:** "Refer 3 friends to jump the queue" or "Get early access to the Legacy Vault feature."
- **Social Sharing:** One-tap sharing to Facebook, Viber, and WhatsApp.

---

## 4. SEO & AEO Strategy

### SEO (Search Engine Optimization)
- **Keywords:** "Senior care Philippines," "Medication reminder app Tagalog," "Elderly monitoring PH," "Filipino AI assistant."
- **Technical SEO:** Fast loading times (Lighthouse score 90+), mobile-first design, schema.org markup (SoftwareApplication & Organization).
- **Content:** A blog section focusing on "Tips for Caring for Lolo/Lola" and "Filipino Senior Health Guide."

### AEO (Answer Engine Optimization)
- **Structured Data:** Use JSON-LD to define the app's purpose, features, and FAQ.
- **Conversational Content:** Create an FAQ section that answers direct questions like "How can AI help my Lola?" or "What is the best app for Filipino seniors?"
- **Entity Linking:** Link to reputable PH health organizations and news sites to build authority in the AI knowledge graph.

---

## 5. Marketing & Content Strategy
- **Social Media:** Short-form video (TikTok/Reels) showing "A day with Kasama" (e.g., Lolo Boy leading a morning exercise).
- **Community:** Partner with local "Barangay Health Workers" or senior citizen groups for grassroots awareness.
- **Viber/WhatsApp Marketing:** Direct-to-consumer updates for waitlist members.

---

## 6. Technical Requirements
- **Analytics:** Google Analytics 4 (GA4) + Hotjar for heatmaps.
- **Metadata:** OpenGraph (OG) tags for rich previews on Facebook/Viber.
- **Performance:** Hosted on high-speed CDN (Cloud Run/Firebase Hosting).
- **Compliance:** Explicit consent checkboxes for PH Data Privacy Act (NPC) compliance.

---

## 7. Success Metrics (KPIs)
- **Waitlist Growth:** 1,000+ sign-ups in the first month.
- **Referral Rate:** 20% of users sharing their unique link.
- **SEO Ranking:** Top 10 for "Senior care app Philippines" within 3 months.
- **AEO Presence:** Featured in "Best apps for Filipino seniors" queries on Gemini/Perplexity.
