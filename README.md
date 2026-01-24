# Posjet Live Monitor - Cloud Dashboard

A real-time sales analytics dashboard for Posjet POS system, built with React + Vite + Tailwind CSS.

## Features

- **Real-time Dashboard**: Live sales monitoring with instant updates
- **Analytics Cards**: Total Sales, Discounts, Net Revenue, Profit tracking
- **Item Wise Profit Report**: Product-level profitability analysis with date filtering
- **Stock Overview**: Track items sold and inventory status
- **Multi-page Navigation**: Sidebar navigation for easy access to reports

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Routing**: React Router DOM
- **Icons**: Lucide React

## Setup for Vercel Deployment

### Prerequisites
- Supabase account with configured database
- PowerShell sync agents running on local PC (not deployed)

### Environment Variables (Not needed if using hardcoded values)

Create `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Deploy to Vercel

1. **Connect Repository**: Import this repository in Vercel
2. **Configure Build Settings**:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Deploy**: Vercel will automatically build and deploy

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Database Schema

The dashboard requires these Supabase tables:
- `sales` - Bill-level transaction data
- `sale_details` - Product-level transaction data

Run the SQL scripts in `../brain/` folder to create tables.

## Local Sync Agents (Windows PC)

Two PowerShell scripts run locally to sync data:
1. `sync_agent.ps1` - Syncs bill summaries
2. `sync_product_data.ps1` - Syncs product-level details

These are NOT deployed to Vercel - they run on the local PC with the POS system.
