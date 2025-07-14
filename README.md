# Slotsify 🎰

Slotsify is a simple online slot machine game built with React and Vite. Users can sign up, log in, and play a slot machine to win coins. The app uses Supabase for authentication and profile storage, and Netlify Functions for secure backend logic.

## Features

- User authentication (sign up, log in, log out) via Supabase
- Each user has a profile with a username and coin balance
- Play a slot machine with animated reels and real-time coin updates
- Winner table showing all possible winning combinations and payouts
- Secure backend logic for spins and payouts using Netlify Functions
- Responsive and modern UI

## Tech Stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/) for the frontend
- [Supabase](https://supabase.com/) for authentication and database
- [Netlify Functions](https://docs.netlify.com/functions/overview/) for backend logic
- [Docker](https://www.docker.com/) for local development

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your Supabase keys.

3. **Run the development server:**
   ```sh
   npm run dev
   ```

4. **Build for production:**
   ```sh
   npm run build
   ```

## Project Structure

- `src/` – React components and styles
- `netlify/functions/` – Serverless backend functions (auth, spin, profile)
- `public/images/` – Slot machine symbols and assets

## License

MIT
