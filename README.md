# Antigravity Chat

A full-stack real-time chat application featuring secure authentication, persistent user-based data storage, and comprehensive media support.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS (v4), Zustand, Framer Motion
- **Backend:** Node.js, Express, Socket.IO, Multer
- **Database:** MongoDB
- **Authentication:** JWT + bcrypt

## Features
- Secure JWT-based authentication
- Real-time global and private messaging using Socket.IO
- Drag & Drop media upload (images, videos, audio, documents)
- Live typing indicators and online user tracking
- Modern "Antigravity Theme" with dark, neon, and glassmorphism UI

## Prerequisites
- Node.js (v18+)
- MongoDB (running locally or via MongoDB Atlas)

## Setup Instructions

### 1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd chat
\`\`\`

### 2. Backend Setup
\`\`\`bash
cd backend
npm install

# Create a .env file based on the example
cp .env.example .env

# Start the backend server
npm run dev
\`\`\`
*(The backend runs on http://localhost:5000 by default)*

### 3. Frontend Setup
In a new terminal window:
\`\`\`bash
cd frontend
npm install

# Start the frontend dev server
npm run dev
\`\`\`
*(The frontend runs on http://localhost:5173 by default)*

## Usage
1. Open your browser and navigate to `http://localhost:5173`.
2. Register a new account.
3. Open a different browser or incognito window to register a second account.
4. Join the Global Nexus room or click on a user in the Direct Messages list to start a private chat.
5. Send text messages or drag & drop files into the chat interface to upload media.
