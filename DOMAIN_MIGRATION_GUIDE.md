# Kasama PH Domain Migration Guide

When you are ready to move from the Vercel default domain (`kasama-ph.vercel.app`) to a custom domain (e.g., `kasama.ph`), follow these steps:

### 1. DNS Configuration
- Purchase your domain from a registrar (e.g., Namecheap, GoDaddy, Google Domains).
- In your Vercel Dashboard, go to **Settings > Domains**.
- Add your custom domain and follow the instructions to update your DNS records (A record or CNAME).

### 2. Firebase Configuration
- Go to the [Firebase Console](https://console.firebase.google.com/).
- Navigate to **Authentication > Settings > Authorized Domains**.
- Add your new custom domain to the list. This is essential for Google Login and other auth features to work.

### 3. Update Code & Environment
- Update the `APP_URL` in your AI Studio Secrets (or `.env` file) to your new domain.
- Update the `og:url` and `twitter:url` meta tags in `index.html`.
- Re-deploy your application.

### 4. Redirect Strategy
- Vercel automatically handles redirects from the `.vercel.app` domain to your custom domain once configured.
- Ensure your referral links are still working by testing with the new domain.

### 5. Google Analytics
- Update your GA4 property settings to include the new domain in the "Data Stream" configuration.
- You don't need to change the Measurement ID.

---
**Note:** All internal links in the current codebase use relative paths (e.g., `/privacy`), so they will continue to work perfectly on any domain you choose.
