---
description: Deploying HCDashboard to Cloudflare Pages
---

# Deploying to Cloudflare Pages

Since your app is a static site (HTML/JS/CSS) without a complex build step (npm/webpack/vite), hosting on Cloudflare Pages is **free, fast, and very easy**.

## Prerequisites
- A Cloudflare account (free).
- Your code pushed to a GitHub repository (which it appears to be).

## Step 1: Connect GitHub to Cloudflare Pages
1.  **Log in to Cloudflare Dashboard**.
2.  Go to **Compute (Workers & Pages)** -> **Pages**.
3.  Click **Connect to Git**.
4.  Select your GitHub repository (`HCDashboard`).
5.  **Configure Build Settings**:
    *   **Project Name**: `hcdashboard` (or whatever you prefer)
    *   **Production Branch**: `main` (or `master`)
    *   **Framework Preset**: `None` (Since this is a raw HTML app)
    *   **Build command**: *Leave empty*
    *   **Build output directory**: *Leave empty* (It will serve the root directory)
6.  Click **Save and Deploy**.

## Step 2: Connect Custom Domain
*This is the advantage of having your domain on Cloudflare!*

1.  After the deployment finishes, go to your new **Pages Project** dashboard.
2.  Click on the **Custom Domains** tab.
3.  Click **Set up a custom domain**.
4.  Type your domain name (e.g., `hcdashboard.com`).
5.  Cloudflare will automatically detect it's in your account and ask to update DNS records.
6.  Confirm/Activate. It usually takes less than a minute.

## Updating
Every time you `git push` to your main branch, Cloudflare will automatically rebuild and deploy the new version in seconds.
