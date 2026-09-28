# CivicReport 🏙️

Citizens report civic issues like potholes, garbage, and broken streetlights with photo and location data.

## 🚀 Live Demo
*[Link to live demo coming soon]*

## 📸 Screenshots
*[Screenshots of dashboard and reporting flow coming soon]*

## ✨ Features (Built So Far)
- **Secure Authentication**: Email/password signup and login with email confirmation (Google sign-in UI is in place; OAuth provider setup is on the roadmap).
- **Protected Dashboard**: Personalized dashboard showing issue statistics.
- **Issue Reporting Form**: Submit issues with a title, category, and description.
- **Photo Uploads**: Seamlessly attach photos to reports (stored securely).
- **Geolocation**: Auto-capture the exact location of the issue via browser APIs.
- **Data Security**: Fully protected database tables and storage buckets using Supabase Row Level Security (RLS).

## 🛠️ Tech Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS
- **Backend & Database**: Supabase (PostgreSQL, Auth, Storage)
- **Hosting**: Vercel

## 🗺️ Roadmap
- [ ] List view of "My Reports" on the dashboard
- [ ] Public map view to see all reported issues in the community
- [ ] Upvoting system for community issues
- [ ] Admin dashboard for city officials to update issue statuses
- [ ] AI photo classification and validation
- [ ] Enable Google OAuth provider

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
   Then, populate the variables with your Supabase project credentials.

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.
