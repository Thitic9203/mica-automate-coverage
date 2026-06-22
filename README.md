# Mica Automate Testing Coverage Dashboard

Internal dashboard showing Qase NDLP Plan 5 automation status coverage.

## Setup

1. Get a Qase API token from https://app.qase.io/user/api → **API tokens**
2. Open the dashboard URL
3. Paste your token → click **Connect to Qase**

Token is stored in `localStorage` (this browser only). Click **Disconnect** to clear it.

## Deploy

Push to GitHub → connect repo to Netlify → publish directory: `public`

Or manual: `netlify deploy --prod --dir public`
