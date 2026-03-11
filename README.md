# SemiAnalysis × SAIL — GTC 2026 Schedule

## Deploy to Vercel

### Step 1: Get code on GitHub
1. Go to **github.com/new** → name it `sail-schedule` → Create
2. Click **"uploading an existing file"**
3. Unzip this zip, drag ALL files from inside the `sail-schedule` folder into GitHub
4. Click **Commit changes**

### Step 2: Deploy
1. Go to **vercel.com/new**
2. Import `sail-schedule` → click **Deploy**
3. Wait ~60 sec

### Step 3: Add Blob storage (this is what makes it sync)
1. In your Vercel project dashboard → **Storage** tab
2. Click **Create** → select **Blob**
3. Name it anything (e.g. `sail-blob`) → pick a region → Create
4. It auto-connects to your project and adds the env var
5. Go to **Deployments** tab → click **⋮** on latest → **Redeploy**

Done. Share the URL with Michelle. Changes sync live between you.

## How it works
- Vercel Blob stores a single JSON file with the schedule state
- Every edit saves to Blob via API route
- Every 5 seconds the app polls for changes from other editors
- No database needed, no Redis, just a JSON blob
