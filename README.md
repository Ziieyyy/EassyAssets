# myEasyAssets - Asset Management System

A modern, professional asset management and tracking system built with React and Supabase.

## Project Info

**Repository**: https://github.com/Ziieyyy/EassyAssets.git

## Features

- 📊 Real-time asset tracking and monitoring
- 💰 Automated depreciation calculations
- 🔔 Maintenance scheduling and reminders
- 📈 Interactive dashboards and analytics
- 🌓 Dark mode support
- 🔐 Secure authentication with Supabase
- 🏢 Multi-company support

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- A Supabase account and project

### Installation

```sh
# Step 1: Clone the repository
git clone https://github.com/Ziieyyy/EassyAssets.git

# Step 2: Navigate to the project directory
cd EassyAssets

# Step 3: Install dependencies
npm install

# Step 4: Set up environment variables
# Create a .env file in the root directory with:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Step 5: Start the development server
npm run dev
```

## Tech Stack

This project is built with:

- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **React** - UI framework
- **Supabase** - Backend as a Service (Authentication & Database)
- **shadcn-ui** - Beautiful UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Charting library
- **React Query** - Data fetching and caching
- **AOS** - Animate on scroll library

## Database Setup

Refer to `DATABASE_SETUP.md` for detailed instructions on setting up your Supabase database schema.

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React context providers
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and configs
├── pages/           # Application pages
├── services/        # API service functions
└── types/           # TypeScript type definitions
```

## Contributing

Feel free to submit issues and pull requests!

## License

MIT License - feel free to use this project for your own purposes.
