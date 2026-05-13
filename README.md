# smart-interiors-measurement

MeasureSync — Smart Interiors
What is MeasureSync?
MeasureSync is a mobile-first site measurement entry system built for Smart Interiors, a manufacturing and installation business in Andhra Pradesh. It replaces the old system of workers writing measurements on random paper, photographing them, and sending via WhatsApp — which caused remeasurements, wrong products, and lost data.
Workers open one link on their phone, fill measurements in a structured form, and save. The entry syncs to Google Sheets instantly and a formatted WhatsApp summary is ready to send to the group.

Problem It Solves
Before MeasureSync, the team was:

Writing measurements randomly in notebooks and loose paper
Sending unclear WhatsApp photos of handwritten notes
Losing customer location info
Causing remeasurements due to wrong or missing data
Having no central record of site visits


Features
Site Info

Team member selection (Raju, Vasu, Chinna, Srinu, Sai)
Date auto-filled
Location name (text)
GPS capture — saves exact coordinates as a Google Maps directions link so any team member can navigate to the site later without calling the customer

Smart Product Measurements

UPVC Window, Aluminium Window — W × H
UPVC Door, Aluminium Door, WPC Door, Wood Door — W × H
PVC Door — W × Middle × H + Door Direction (RI/RO/LI/LO) — only shown for PVC
Louver — W × H + Louver Type (Aluminium/UPVC)
Aluminium Partition, Other — W × H
Mix multiple products in one job entry

Smart Fraction Input

Auto-slash: type 47 1 then space → becomes 47 1/ automatically
Quick fraction buttons (⅛ ¼ ⅜ ½ ⅝ ¾ ⅞ ¹⁄₁₆) — tap box first, tap button to insert
Same format workers already use in their notebooks — no retraining needed

Customer Info

Customer name (optional, can update later)
Customer phone (optional)

Photo Upload

Optional reference photos — site photos, sketches, uneven walls
Shows thumbnail previews, removable

Notes

Free text for special instructions

Google Sheets Sync

Every entry auto-saves to Google Sheets
Columns: Date, Time, TeamMember, Location, Customer, Phone, GPSLink, Product, Direction, OpeningNo, MeasNo, Width, Middle, Height, Measurement, Notes, Photos

WhatsApp Summary

After saving, a formatted message is generated
Tap "Send to WhatsApp" → WhatsApp opens with message pre-filled
Select group → tap Send

Saved Entries View

All past entries viewable on the form itself with directions links


Technical Architecture
Mobile/Laptop Form (Netlify)
        ↓
/.netlify/functions/save (Netlify Serverless Function)
        ↓
Google Apps Script Web App
        ↓
Google Sheets
Why this architecture:
The form is a single HTML file hosted on Netlify (free, private repo supported, https, auto-deploy from GitHub). Direct fetch calls from the browser to Google Apps Script failed on mobile because Google redirects every request and mobile browsers block or lose data on those redirects. Every method tried (fetch no-cors, iframe POST, FormData, image pixel, JSONP) failed on Android or iOS.
The fix was a Netlify serverless function (save.js) acting as a proxy. The form sends a POST to the same Netlify domain — no CORS issues. Netlify's server then calls Google Apps Script server-side using Node's built-in https module which properly follows redirects. This resolved all mobile sync issues.
Why Google Sheets:
Zero cost, accessible from any device, familiar to the business owner, no database setup needed, shareable with accountant/family, filterable and sortable.
Why Netlify over GitHub Pages:
GitHub Pages only works on public repos (free tier). Netlify works with private repos, supports serverless functions, faster deploys, and more reliable.

Config (Top of HTML file)
javascriptconst SHEETS_URL   = 'your_apps_script_url';
const WHATSAPP_URL = 'your_whatsapp_group_invite_link';
Change these two lines only when URLs need updating.

Files
smart-interiors-measurement/
├── measurement-form.html      — Main form (entire app)
├── netlify.toml               — Netlify config
└── netlify/
    └── functions/
        └── save.js            — Proxy to Google Sheets

Next Version Planned

WhatsApp bot (whatsapp-web.js) — auto-sends group message when new row appears in sheet, running on local Mac
Quotation system — customer name, product, measurements → auto-generates PDF quote
Job sheet system — job number, fabricator assigned, status tracking
CRM tracker — lead source, follow-up dates, conversion status
Inventory log — material in/out per job
Production dashboard — windows produced vs ordered, on-time rate


Product Name
MeasureSync — because it measures at site and syncs to the system instantly.
