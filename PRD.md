# Product Requirements Document: Kasama PH
**"Ang Kaibigan ng Lola at Lolo"**

## 1. Technical Architecture
The application follows a serverless, voice-first architecture optimized for low-latency interactions and high reliability.

### Diagram
- **Frontend:** React (Vite) PWA with GSAP animations and Lucide icons.
- **AI Layer:** Google AI Studio (Gemini 2.5 Flash) for NLU, Sentiment Analysis, and TTS/STT.
- **Backend:** Firebase Suite
    - **Auth:** Phone + OTP (Seniors), Email/Password (Family).
    - **Firestore:** Real-time data sync for health logs and conversation state.
    - **Storage:** Encrypted buckets for voice recordings and "Legacy Vault" media.
    - **Messaging:** FCM for character-voiced push notifications.

---

## 2. Character Voice Interaction Scripts

### Lola Zeny (The Nurturer) - Medicine Reminders
- **Trigger:** Scheduled time in Firestore.
- **Script:** "Lola Zeny po ito... [Pause] Kumain na po ba kayo, Lo? Oras na po para sa gamot niyo para lumakas ang katawan. Inom na po tayo?"
- **Adaptive Logic:** If senior says "Mamaya na", Zeny responds: "O sige po, balik ako after 5 minutes ha? Huwag kalimutan po."

### Lolo Boy (The Hype Man) - Exercises & Kanta
- **Trigger:** Exercise time or user request.
- **Script:** "Uy, Lolo Boy 'to! Tara, galaw-galaw tayo nang konti para hindi mangalawang ang mga tuhod! [Pause] Game na po ba?"
- **Kanta Mode:** "Aba, ang ganda ng boses! Sabayan kita sa chorus, Lo!"

### Leo (The Protector) - Emergency
- **Trigger:** SOS Button or distress detection.
- **Script:** "Leo po ito. Huwag po kayong matatakot, Lo. Naka-alerto na po ang pamilya niyo. [Pause] Naririnig niyo po ba ako? Sabihin niyo lang po kung anong nararamdaman niyo."

---

## 3. Firestore Security Rules Specification
- **Default:** `allow read, write: if false;`
- **Seniors:** Can read/write their own profile and logs.
- **Family:** Can read linked senior data; cannot modify medication schedules (read-only for safety).
- **Caregivers:** Scoped access based on `assigned_seniors` array.

---

## 4. AI Studio Prompt Library (NLU)

### Task: Intent Classification
**System Instruction:**
"You are Kasama AI. Classify the senior's Taglish response into: `reminder_ack`, `emergency`, `story_response`, `exercise_pause`, `repeat_request`. Detect sentiment: `confused`, `distressed`, `happy`, `neutral`."

### Task: Kwentuhan Time Generation
**System Instruction:**
"Based on the senior's Legacy Vault (previous stories about 'Baguio' and 'Wedding'), generate a gentle follow-up question in Taglish. Example: 'Lola, nabanggit niyo po yung kasal niyo sa Baguio... Ano po ang pinaka-paborito niyong ulam doon?'"

---

## 5. PWA & Accessibility Checklist
- [ ] **Large Touch Targets:** All buttons minimum 60px height.
- [ ] **High Contrast:** AAA compliance for text on background.
- [ ] **Voice Feedback:** Every button press triggers a haptic + character voice confirmation.
- [ ] **A2HS:** Custom "Add to Home Screen" modal featuring Lola Zeny.
- [ ] **Offline SOS:** Local storage of emergency contacts for immediate SMS fallback if data fails.

---

## 6. Emergency Escalation Flowchart
1. **Trigger:** SOS Button Pressed.
2. **AI Action:** Leo voice activates: "Nandito lang ako, Lo."
3. **Data Action:** Fetch `navigator.geolocation`, start 30s audio recording.
4. **Notification:** FCM High Priority to all `family_accounts`.
5. **Escalation:** If no family "Acknowledge" within 60s -> Trigger automated call to primary caregiver.
