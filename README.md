# Ganga Dham Tower Auction

A modern, real-time live auction website built with React, Vite, Tailwind CSS, and Firebase. Optimized for large LED screens.

## Features
- **Public Live Board**: Real-time updates, massive typography, confetti animations, and team grids.
- **Admin Dashboard**: Secure login, manage players, manage teams, and control the live auction state.
- **Firebase Integration**: Real-time database (Firestore), Authentication, and Cloud Storage for image uploads.

## Folder Structure
```
/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ components/       # Reusable UI components (if any)
â”‚   â”œâ”€â”€ pages/
â”‚   â”‚   â”œâ”€â”€ admin/        # Admin dashboard sub-pages (Players, Teams, Live Control)
â”‚   â”‚   â”œâ”€â”€ AdminDashboard.tsx
â”‚   â”‚   â”œâ”€â”€ Login.tsx
â”‚   â”‚   â””â”€â”€ PublicBoard.tsx # The main LED screen view
â”‚   â”œâ”€â”€ App.tsx           # Main routing
â”‚   â”œâ”€â”€ firebase.ts       # Firebase configuration and initialization
â”‚   â”œâ”€â”€ index.css         # Tailwind CSS entry
â”‚   â”œâ”€â”€ main.tsx          # React entry point
â”‚   â””â”€â”€ types.ts          # TypeScript interfaces
â”œâ”€â”€ firebase-applet-config.json # Firebase config values
â”œâ”€â”€ firestore.rules       # Firebase security rules
â”œâ”€â”€ package.json          # Dependencies and scripts
â”œâ”€â”€ vite.config.ts        # Vite configuration
â””â”€â”€ README.md             # This file
```

## Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Firebase**:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
   - Enable **Firestore Database**, **Authentication** (Google provider), and **Storage**.
   - Copy your Firebase config and place it in `firebase-applet-config.json` in the root directory.

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Deployment (Vercel / Netlify)

This project is a standard Vite React application.

1. Push your code to a GitHub repository.
2. Import the project into Vercel or Netlify.
3. The build command is `npm run build`.
4. The output directory is `dist`.
5. Make sure to add any necessary environment variables if you move the Firebase config to `.env`.

## Admin Access
Admin access is restricted to the email configured in `firestore.rules` and `App.tsx` (`rohansadiwala@gmail.com`). To change this, update the email in both files.
