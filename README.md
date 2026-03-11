# SemiAnalysis × SAIL — GTC 2026 Schedule

## Deploy to Vercel (5 min)

### Step 1: Create GitHub repo
1. Go to https://github.com/new
2. Name it `sail-schedule`
3. Click **Create repository**
4. On the next page click **"uploading an existing file"**
5. Unzip this zip file on your computer
6. Drag ALL files from inside the `sail-schedule` folder into the GitHub upload area
7. Click **Commit changes**

### Step 2: Deploy on Vercel
1. Go to https://vercel.com/new
2. Find `sail-schedule` in your repo list → click **Import**
3. Click **Deploy**
4. Wait ~60 seconds

### Step 3: Add Vercel KV (for shared storage)
1. In your Vercel dashboard, go to **Storage** tab
2. Click **Create Database** → choose **KV (Redis)**
3. Name it `sail-kv` → click **Create**
4. Click **Connect to Project** → select `sail-schedule`
5. Click **Redeploy** (in Deployments tab)

Done! Share the URL with Michelle. Both of you can edit and changes sync live.

## Features
- Drag & drop team members into time slots
- Click circle badge to toggle HOSTING (grey) ↔ INTERVIEWED (red)  
- Hover × to remove assignments
- Add notes per slot
- Live sync between all editors (polls every 5s)
- Tracks who made the last edit
