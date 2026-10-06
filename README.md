# CivicReport 🏙️

Citizens report civic issues like potholes, garbage, and broken streetlights with photo and live location data — and track them on a public map.

## 🚀 Live Demo
[CivicReport Live App](https://civic-issue-reporter-snowy-nine.vercel.app/)

## 📸 Screenshots
*[Screenshots of dashboard, map, and reporting flow coming soon]*

## ✨ Features

- **Secure Authentication**: Email/password signup with email confirmation, plus Google OAuth sign-in.
- **Protected Dashboard**: Personalized dashboard showing issue statistics and your submitted reports.
- **Issue Reporting**: Submit issues with a title, description, category, and photo.
- **Smart Location Picker**: Auto-captures your current location via GPS, or search for a location by name (OpenStreetMap-powered) with a draggable pin for fine-tuning.
- **Edit & Delete Reports**: Update or remove your own submitted reports anytime.
- **Public Map View**: All reported issues are plotted on a live, filterable map (by category and status) — visible to everyone, no login required.
- **Upvoting**: Logged-in users can upvote issues they also care about, helping surface the most pressing problems.
- **Role-Based Admin Dashboard**: Verified admins can view all reports and update their status (Reported → In Progress → Resolved).
- **Data Security**: Every table and storage bucket is protected with Supabase Row Level Security (RLS) — users can only modify their own data.

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS
- **Backend & Database**: Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- **Maps & Geolocation**: React-Leaflet, OpenStreetMap, Nominatim (geocoding)
- **Hosting**: Vercel

## 🗺️ Roadmap

- [ ] AI-powered photo classification to auto-suggest issue category
- [ ] Email/SMS notifications to relevant departments on new reports
- [ ] Request-and-approve flow for granting admin access (currently assigned manually by the project owner)
- [ ] Duplicate issue detection near the same location

## 💻 Local Setup

1. **Clone the repository**
```bash
   git clone https://github.com/sohamwadekar04/civic-issue-reporter.git
   cd civic-issue-reporter
```

2. **Install dependencies**
```bash
   npm install
```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory based on the `.env.example` file:
```bash
   cp .env.example .env.local
```
   Then populate the variables with your Supabase project credentials.

4. **Run the development server**
```bash
   npm run dev
```
   Open [http://localhost:3000](http://localhost:3000) in your browser.
