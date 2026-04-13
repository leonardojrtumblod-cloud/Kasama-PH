# Kasama PH Welcome Email Template (Taglish)

**Subject:** Tuloy po kayo sa Kasama PH! 🏠

**Body:**

Kumusta!

Salamat sa pag-join sa aming waitlist. Kasama ka na sa mga unang makakasubok ng aming AI assistant para sa ating mga Lolo at Lola.

Dito sa Kasama PH, layunin naming gawing mas madali at mas masaya ang pag-aalaga sa ating mga mahal sa buhay gamit ang teknolohiyang nakakaintindi sa ating kultura at wika.

---

### 📋 Ang Iyong Waitlist Details:

- **Waitlist Position:** #{{queuePosition}}
- **Your Referral Link:** [{{referralLink}}]

---

### 🚀 Gusto mo bang mauna?

I-share ang iyong referral link sa **3 friends or family members**. Kapag may nag-sign up gamit ang iyong link, aangat ang iyong position sa waitlist!

Sabay-sabay nating alagaan ang ating pamilya.

Maraming salamat,

**Team Kasama PH**
*Alaga ni Kasama, Kampante ang Pamilya.*

---

### Setup Instructions for Developer:

1. **SendGrid Setup:**
   - Create a free account at [SendGrid](https://sendgrid.com/).
   - Generate an API Key.
   - Verify your sender identity.

2. **Firebase Extension:**
   - Go to Firebase Console > Extensions.
   - Install **"Trigger Email from Cloud Firestore"**.
   - Configure it to watch the `waitlist` collection.
   - Use the SendGrid SMTP settings:
     - SMTP Connection URI: `smtps://apikey@smtp.sendgrid.net:465`
     - SMTP Password: `[YOUR_SENDGRID_API_KEY]`
   - Set the "Email documents collection" to `waitlist`.

3. **Email Template:**
   - You can use Handlebars syntax (like `{{queuePosition}}`) if you configure the extension to use templates.
