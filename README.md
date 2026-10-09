SkillSwap Campus — Frontend

A peer-to-peer skill exchange and micro-mentoring platform designed for college students. Students can share their skills, discover peers who can teach them, and exchange knowledge within their campus community.

Features

- Student registration and login
- Add and manage skills to teach or learn
- Find matching students based on learning interests
- Send, receive, accept, and reject skill exchange requests
- Session management
- Planned features: reviews, skill credits, and skill chains

Tech Stack

- Frontend: React.js
- Build Tool: Vite
- Languages: JavaScript, HTML, CSS
- Backend Integration: Spring Boot REST APIs
- Database: MySQL (through the backend)

Project Structure

skillswap-frontend/
├── public/
├── src/
│   ├── assets/
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md

Requirements

- Node.js and npm
- Visual Studio Code
- SkillSwap Campus backend
- MySQL database configured for the backend

Installation and Setup

1. Clone this repository:
   
   git clone https://github.com/ruthvikreddymvs122-cell/skillswap-frontend.git

2. Open the project folder:
   
   cd skillswap-frontend

3. Install dependencies:
   
   npm install

4. Start the development server:
   
   npm run dev

5. Open the local URL shown in the terminal. It is usually:
   
   "https://24eg107e32.netlify.app/"

Backend Connection

The frontend communicates with the Spring Boot backend, which normally runs at:

"http://localhost:8080"

Ensure the backend and MySQL database are running before using features that require server data.

Project Objective

To encourage collaborative learning by allowing students to teach skills they already know and learn new skills from fellow students.

Future Enhancements

- Reviews and ratings
- Skill-credit system
- Skill-chain recommendations
- Improved authentication and authorization
- Deployment for campus-wide access

Author

Ruthvik Reddy