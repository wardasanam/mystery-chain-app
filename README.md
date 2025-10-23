# **Mystery Chain**

A real-time, multiplayer story-building game where suspense and creativity collide.

Mystery Chain is a web app where players join a story room and take turns writing one line of a story. The catch? You can only see the *single last line* submitted. The full story remains a secret until the host ends the game, revealing the hilarious, bizarre, or epic tale you've all written together.

This project is built with React, Firebase for real-time data, and the Google Gemini API for an "Ask AI" feature.

## **Live Demo**

**Play the live version here: [https://wardasanam.github.io/mystery-chain-app](https://www.google.com/url?sa=E&source=gmail&q=https://wardasanam.github.io/mystery-chain-app)**

*(You can add a screenshot or GIF of the app in action here\!)*

## **Features**

* **Real-time Multiplayer:** Uses Firebase Firestore to sync the lobby and game state instantly across all clients.  
* **Anonymous Auth:** Quick and easy login—just pick a username and play.  
* **Create & Join Rooms:** Create new story rooms (open or password-protected) or join existing ones.  
* **Short Room IDs:** Generates a 4-character, easy-to-share room ID for joining.  
* **Mystery Story Logic:** Players can only see the *last* line written, ensuring maximum suspense.  
* **Turn-Based System:** The app manages whose turn it is to write.  
* **AI Story Writer:** Stuck? Click "Ask AI" to have Google's Gemini API write a line for you.  
* **Host Controls:** The room's host can start the game, end the story, and delete their own room.  
* **Full Story Reveal:** When the game ends, the full story is revealed with a fun, animated scroll.  
* **Automatic Cleanup:** Rooms are automatically deleted when the last player leaves.  
* **Developer Tools:** Includes a "Clear All Rooms" button for easy cleanup during testing.

## **Technologies Used**

* **Frontend:** React (functional components, hooks)  
* **Database & Auth:** Firebase (Firestore for real-time DB, Anonymous Auth for users)  
* **Styling:** TailwindCSS  
* **Animations:** Framer Motion  
* **Icons:** Lucide React  
* **AI:** Google Gemini API (gemini-2.5-flash-preview-09-2025)  
* **Deployment:** GitHub Pages

## **Local Setup**

To run this project on your local machine, follow these steps:

1. **Clone the repository:**  
   git clone \[https://github.com/wardasanam/mystery-chain-app.git\](https://github.com/wardasanam/mystery-chain-app.git)  
   cd mystery-chain-app

2. Install dependencies:  
   This project uses npm.  
   npm install

3. **Set up Firebase (CRITICAL):**  
   * Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.  
   * Click the Gear icon \> **Project settings**. Under the "General" tab, find your **"Web API Key"** and other project details.  
   * Open src/App.js (or mystery\_chain\_app.jsx) and replace the firebaseConfig object with your own. (You have already done this).  
   * Go to **Build \> Authentication** \> **Settings** \> **Authorized domains** and **add localhost**.  
   * Go to **Build \> Authentication** \> **Sign-in method** and enable **Anonymous** sign-in.  
   * Go to your **Google Cloud Console** (from the link in the Firebase error, or by searching) and ensure the **"Identity Toolkit API"** is enabled.  
   * Go to **Build \> Firestore Database** \> **Rules** and set them to allow reads/writes:  
     rules\_version \= '2';  
     service cloud.firestore {  
       match /databases/{database}/documents {  
         match /rooms/{roomId=\*\*} {  
           allow read, write: if request.auth \!= null;  
         }  
       }  
     }

4. **Set up Google AI Key:**  
   * Go to [Google AI Studio](https://aistudio.google.com/app) and get a free API key.  
   * The app is designed to ask you for this key in a modal and save it to your browser's localStorage. No file edits are needed.  
5. **Run the app:**  
   npm start

   The app will open on http://localhost:3000.

## **Deployment**

This project is set up for easy deployment to GitHub Pages.

1. **Install gh-pages:**  
   npm install gh-pages \--save-dev

2. **Update package.json:**  
   * Add a homepage property at the top (replace with your username):  
     "homepage": "https://wardasanam.github.io/mystery-chain-app",  
   * Add these scripts to your scripts object:  
     "predeploy": "npm run build",  
     "deploy": "gh-pages \-d build"

3. **Deploy:**  
   npm run deploy

4. **Update GitHub Settings:**  
   * Go to your repo's **Settings \> Pages**.  
   * Set the "Source" branch to **gh-pages** and save.  
5. **Authorize Domain in Firebase:**  
   * Go to your **Firebase Console \> Authentication \> Settings \> Authorized domains**.  
   * Add your new domain: wardasanam.github.io