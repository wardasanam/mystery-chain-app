import { setLogLevel } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { 
  AnimatePresence, 
  motion 
} from 'framer-motion';
import { 
  Check, 
  ChevronRight, 
  Copy, 
  Crown, 
  Loader2, 
  Lock, 
  LogOut, 
  Plus, 
  Send, 
  Sparkles, 
  Trash2, 
  Unlock, 
  Users, 
  X 
} from 'lucide-react';
import React, { 
  useState, 
  useEffect, 
  useRef, 
  useMemo, 
  useCallback 
} from 'react';
import { initializeApp } from 'firebase/app';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBQXoc6mwYHAtkwsNqjQQXnSKsj_ho0fDE",
  authDomain: "mystoryapp-34a8a.firebaseapp.com",
  projectId: "mystoryapp-34a8a",
  storageBucket: "mystoryapp-34a8a.firebasestorage.app",
  messagingSenderId: "522606511091",
  appId: "1:522606511091:web:374f1641189fe43b7ac886",
  measurementId: "G-C1L912KLD0"
};

// For local development, we'll use your Firebase project ID.
const appId = 'mystoryapp-34a8a';

// Initialize Firebase
let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  setLogLevel('Debug');
} catch (e) {
  console.error("Error initializing Firebase", e);
}

// --- Utility Components ---

/**
 * A reusable button component
 */
const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  isLoading = false, 
  disabled = false, 
  ...props 
}) => {
  const baseStyle = 'px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900';
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 disabled:bg-indigo-400',
    secondary: 'bg-gray-700 text-gray-200 hover:bg-gray-600 focus:ring-gray-500 disabled:bg-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400',
  };
  
  const isDisabled = isLoading || disabled;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseStyle} ${variants[variant]} ${className} ${isDisabled ? 'cursor-not-allowed' : 'hover:scale-105'}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        children
      )}
    </button>
  );
};

/**
 * An input field
 */
const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${className}`}
    {...props}
  />
);

/**
 * An alert box for errors
 */
const Alert = ({ message, type = 'error', className = '' }) => {
  const colors = {
    error: 'bg-red-900 border-red-700 text-red-200',
    success: 'bg-green-900 border-green-700 text-green-200',
  };
  return (
    <div className={`p-4 border rounded-lg ${colors[type]} ${className}`}>
      {message}
    </div>
  );
};

/**
 * A modal component
 */
const Modal = ({ children, title, onClose }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md m-4 border border-gray-700"
        onClick={(e) => e.stopPropagation()} // Prevent closing on modal click
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <Button onClick={onClose} variant="secondary" className="!p-2">
            <X size={20} />
          </Button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

// --- A modal for the Gemini API Key ---
const GeminiApiKeyModal = ({ onSave, onClose }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <Modal title="Enter Google AI Key" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p className="text-gray-300 mb-4">
          To use the AI feature, please provide your free Google AI API key. You can get one from <a href="https://aistudio.google.com/app" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Google AI Studio</a>.
        </p>
        <Input
          type="password"
          placeholder="Enter your Google AI API key..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoFocus
          autoComplete="current-password"
        />
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!key.trim()}>
            Save & Submit
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// --- Main App Screens ---

/**
 * Screen 1: Set Username
 */
const UsernameScreen = ({ onUsernameSet }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim().length > 2) {
      setIsLoading(true);
      // Simulate a quick save
      setTimeout(() => {
        onUsernameSet(username.trim());
        setIsLoading(false);
      }, 300);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700"
      >
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          Choose a username
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="text"
            placeholder="Enter your name..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            maxLength={25}
          />
          <Button 
            type="submit" 
            isLoading={isLoading} 
            disabled={username.trim().length <= 2}
          >
            Enter Lobby <ChevronRight size={20} />
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

/**
 * Screen 2: Room List / Lobby
 */
const RoomListScreen = ({ username, userId, onJoinRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinError, setJoinError] = useState(null);

  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [roomToDelete, setRoomToDelete] = useState(null); 
  
  // --- NEW: State for the "Clear All" modal ---
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  // --- End of New State ---
  
  const roomsRef = useMemo(() => collection(db, `/rooms`), []);

  // --- NEW: Helper function to generate short ID ---
  const generateShortId = (length = 4) => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // O and 0 removed
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  // --- End of new function ---

  // Listen for room changes
  useEffect(() => {
    const q = query(roomsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(roomList);
      setIsLoading(false);
    }, (err) => {
      console.error('Error listening to rooms:', err);
      setError(`Failed to load rooms: ${err.message}`);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [roomsRef]);

  // Handle creating a new room
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    setIsCreating(true);
    setError('');

    // --- UPDATED: Logic to create a unique short ID ---
    let newRoomId = '';
    let roomExists = true;
    let attempts = 0;
    let newRoomRef;

    try {
      while (roomExists && attempts < 10) {
        newRoomId = generateShortId(4);
        newRoomRef = doc(db, '/rooms', newRoomId); // Define ref here
        const docSnap = await getDoc(newRoomRef);
        if (!docSnap.exists()) {
          roomExists = false;
        }
        attempts++;
      }

      if (roomExists) {
        throw new Error("Failed to find a unique room ID. Please try again.");
      }
      // --- End of update ---

      const newRoom = {
        name: roomName.trim(),
        host: { id: userId, name: username },
        players: [{ id: userId, name: username, crown: true }],
        status: 'waiting', // 'waiting', 'playing', 'finished'
        lines: [],
        currentTurn: userId,
        createdAt: serverTimestamp(),
        hasPassword: roomPassword.trim().length > 0,
        password: roomPassword.trim() || null,
      };
      
      // --- UPDATED: Use setDoc with the new short ID ---
      await setDoc(newRoomRef, newRoom);
      // --- End of update ---
      
      // Automatically join the room you created
      onJoinRoom(newRoomId); // Pass the short ID
      
    } catch (err) {
      console.error('Error creating room:', err);
      setError(`Failed to create room: ${err.message}`);
    } finally {
      setIsCreating(false);
      setRoomName('');
      setRoomPassword('');
    }
  };
  
  // Handle joining a room
  const handleJoinRoom = async (room) => {
    setJoinError(null);
    
    // Check for password
    if (room.hasPassword) {
      const pw = prompt('This room is private. Please enter the password:');
      if (pw !== room.password) {
        setJoinError({ roomId: room.id, message: 'Incorrect password.' });
        return;
      }
    }
    
    // Check if room is full (e.g., max 10 players)
    if (room.players.length >= 10) {
      setJoinError({ roomId: room.id, message: 'This room is full.' });
      return;
    }
    
    // Check if game is already in progress
    if (room.status === 'playing') {
      setJoinError({ roomId: room.id, message: 'This game is already in progress.' });
      return;
    }

    try {
      const roomRef = doc(db, `/rooms`, room.id);
      await updateDoc(roomRef, {
        players: arrayUnion({ id: userId, name: username, crown: false })
      });
      onJoinRoom(room.id);
    } catch (err) {
      console.error('Error joining room:', err);
      setJoinError({ roomId: room.id, message: `Failed to join: ${err.message}` });
    }
  };

  // Step 1: Set the room to be deleted
  const handleDeleteRoom = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      setRoomToDelete(room);
    }
  };

  // Step 2: Actual delete logic, called by modal
  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    
    try {
      const roomRef = doc(db, `/rooms`, roomToDelete.id);
      await deleteDoc(roomRef);
      setRoomToDelete(null); // Close modal
    } catch (err) {
      console.error('Error deleting room:', err);
      setError(`Failed to delete room: ${err.message}`);
      setRoomToDelete(null); // Close modal
    }
  };

  // --- NEW: Function to delete all rooms ---
  const handleDeleteAllRooms = async () => {
    setIsDeletingAll(true);
    setError('');
    
    try {
      const allRoomsQuery = query(roomsRef);
      const snapshot = await getDocs(allRoomsQuery);
      
      if (snapshot.empty) {
        setIsDeletingAll(false);
        setShowDeleteAllModal(false);
        return;
      }
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
    } catch (err) {
      console.error('Error deleting all rooms:', err);
      setError(`Failed to delete all rooms: ${err.message}`);
    } finally {
      setIsDeletingAll(false);
      setShowDeleteAllModal(false);
    }
  };
  // --- End of New Function ---

  return (
    <>
      {/* Modal for deleting a single room */}
      {roomToDelete && (
        <Modal title={`Delete Room: ${roomToDelete.name}`} onClose={() => setRoomToDelete(null)}>
          <p className="text-gray-300 mb-6">Are you sure you want to permanently delete this room? This cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setRoomToDelete(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={handleConfirmDelete} isLoading={isCreating}>
              Yes, Delete
            </Button>
          </div>
        </Modal>
      )}
      
      {/* --- NEW: Modal for deleting all rooms --- */}
      {showDeleteAllModal && (
        <Modal title="Clear All Test Rooms" onClose={() => setShowDeleteAllModal(false)}>
          <p className="text-gray-300 mb-6">Are you sure you want to delete <span className="font-bold text-white">{rooms.length}</span> rooms? This will remove all rooms for everyone and cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowDeleteAllModal(false)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={handleDeleteAllRooms} isLoading={isDeletingAll}>
              Delete All
            </Button>
          </div>
        </Modal>
      )}
      {/* --- End of New Modal --- */}

      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-4xl font-bold text-white mb-2">Welcome, {username}!</h2>
          <p className="text-xl text-gray-400 mb-8">Join a room or create a new one.</p>

          {error && <Alert message={error} className="mb-4" />}

          {/* Create Room Form */}
          <form onSubmit={handleCreateRoom} className="mb-8 flex flex-col md:flex-row gap-4">
            <Input
              type="text"
              placeholder="New room name..."
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="flex-grow"
              autoComplete="off"
            />
            <Input
              type="password"
              placeholder="Optional password..."
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
              className="md:w-1D3"
              autoComplete="new-password"
            />
            <Button type="submit" isLoading={isCreating} disabled={!roomName.trim()} className="md:w-auto">
              <Plus size={20} /> Create Room
            </Button>
          </form>
          
          {/* --- NEW: Clear All Rooms Button --- */}
          {rooms.length > 0 && (
            <div className="mb-8 text-center">
              <Button onClick={() => setShowDeleteAllModal(true)} variant="danger" className="mx-auto">
                <Trash2 size={18} /> Clear All Test Rooms ({rooms.length})
              </Button>
            </div>
          )}
          {/* --- End of New Button --- */}

          {/* Room List */}
          <div className="flex flex-col gap-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 size={40} className="animate-spin text-indigo-400" />
              </div>
            ) : rooms.length === 0 ? (
              <p className="text-center text-gray-400 text-lg py-8">No active rooms. Be the first to create one!</p>
            ) : (
              rooms.map(room => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4"
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    {room.hasPassword ? <Lock size={20} className="text-yellow-400" /> : <Unlock size={20} className="text-green-400" />}
                    <div>
                      <h3 className="text-xl font-semibold text-white">{room.name}</h3>
                      <p className="text-sm text-gray-400">Host: {room.host?.name || 'Unknown Host'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2 text-gray-300">
                      <Users size={18} /> {room.players.length}
                    </span>
                    <span className={`px-3 py-1 text-sm rounded-full ${room.status === 'waiting' ? 'bg-green-800 text-green-200' : 'bg-yellow-800 text-yellow-200'}`}>
                      {room.status}
                    </span>
                    <Button onClick={() => handleJoinRoom(room)} variant="secondary">
                      Join <ChevronRight size={18} />
                    </Button>
                    {room.host?.id === userId && (
                      <Button onClick={() => handleDeleteRoom(room.id)} variant="danger">
                        Delete
                      </Button>
                    )}
                  </div>
                  {joinError && joinError.roomId === room.id && (
                    <div className="w-full mt-2 md:mt-0 md:w-auto md:text-right">
                      <Alert message={joinError.message} />
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};


/**
 * Screen 3: Story Room
 */
const StoryRoomScreen = ({ username, userId, roomId, onLeaveRoom, onEndStory }) => {
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newLine, setNewLine] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('gemini_api_key'));
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  
  const [isCopied, setIsCopied] = useState(false);
  const roomRef = useMemo(() => doc(db, `/rooms/${roomId}`), [db, roomId]);
  const storyEndRef = useRef(null);
  
  const isHost = room?.host?.id === userId;

  // Get room data in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const roomData = doc.data();
        setRoom(roomData);
        
        if (roomData.status === 'finished') {
          onEndStory(roomData);
        }
      } else {
        setError("This room no longer exists.");
        // Automatically send user back to lobby
        setTimeout(onLeaveRoom, 2000);
      }
      setIsLoading(false);
    }, (err) => {
      console.error('Error listening to room:', err);
      setError(`Failed to load room: ${err.message}`);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [roomRef, onLeaveRoom, onEndStory]);
  
  // Scroll to bottom of story
  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.lines?.length]);
  
  // Submit line logic
  const submitLine = async (lineData) => {
    if (!room) return;

    try {
      const currentPlayers = room.players || [];
      const currentPlayerIndex = currentPlayers.findIndex(p => p.id === (lineData.userId || userId)); // Use lineData.userId, fallback to component's userId
      
      // Determine next turn
      const nextPlayerIndex = (currentPlayerIndex + 1) % currentPlayers.length;
      const nextPlayer = currentPlayers[nextPlayerIndex];

      if (!nextPlayer) {
        throw new Error("Could not determine next player.");
      }

      await updateDoc(roomRef, {
        lines: arrayUnion(lineData),
        currentTurn: nextPlayer.id,
        lastLineAt: serverTimestamp()
      });
      
    } catch (err) {
      console.error("Error submitting line:", err);
      // Re-throw the error to be caught by the calling function
      throw new Error(`Failed to submit line: ${err.message}`); 
    }
  };
  
  // Handle form submission for player
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!newLine.trim() || isSubmitting || isAiLoading) return;

    setIsSubmitting(true);
    setAiError(null);

    const line = {
      id: crypto.randomUUID(),
      userId: userId,
      username: username,
      text: newLine.trim(),
      isAI: false,
    };

    try {
      await submitLine(line);
      setNewLine('');
    } catch (err) {
      // The error is already logged by submitLine, just show it
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle starting the game
  const handleStartGame = async () => {
    if (!isHost || !roomRef || !room || !room.players || room.players.length === 0) return;
    
    try {
      await updateDoc(roomRef, {
        status: 'playing',
        currentTurn: room.players[0].id // Start with the host (or first player)
      });
    } catch (err) {
      console.error("Error starting game:", err);
      setError(`Failed to start game: ${err.message}`);
    }
  };

  // Handle AI line submission
  const handleAiSubmit = async (tokenOverride = null) => {
    if (!isMyTurn || isAiLoading) return;
    
    setAiError(null);
    
    const tokenToUse = tokenOverride || geminiKey;
    if (!tokenToUse) {
      setShowGeminiModal(true);
      return;
    }

    setIsAiLoading(true);
    
    const lastLine = room.lines.length > 0 ? room.lines[room.lines.length - 1].text : "Once upon a time";

    // 1. Set up the prompt for Gemini
    const fullPrompt = `You are a creative writer for a 'mystery chain' story game. You will be given the single last line of the story. Your job is to write the *next* single, creative, and unexpected line to continue the story.
    
    Do not repeat the last line. Only output the new line of the story. Keep it to one or two sentences.
    
    Last line: "${lastLine}"
    
    Next line:`;

    // 2. Set up the API call
    const apiKey = tokenToUse; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: fullPrompt }] }],
      // Removed generationConfig for simplicity and reliability
    };

    try {
      // 3. Make the API call
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        // Check for specific API key error
        if (errData.error?.message.includes("API Key or other form")) {
           throw new Error("Invalid Google AI Key. Please get a new key from Google AI Studio.");
        }
        if (errData.error?.message) {
          throw new Error(errData.error.message);
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // 4. Parse the response
      const result = await response.json();
      
      // Check for safety blocks
      if (result.candidates?.[0]?.finishReason === "SAFETY") {
        console.warn("AI safety block:", result.candidates[0]);
        throw new Error("AI blocked the prompt or response due to safety settings.");
      }

      const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiText) {
        console.error("AI returned an unexpected response:", result);
        throw new Error("AI returned an empty response. Please try again.");
      }
      
      // 5. Submit the new line
      const newLineData = {
        id: crypto.randomUUID(),
        userId: userId, // Attributed to the player who clicked
        username: `${username} (via AI)`,
        text: aiText.trim().replace(/\"/g, ''), // Remove quotes
        isAI: true,
      };

      await submitLine(newLineData);

    } catch (err) {
      console.error('Error with AI submission:', err);
      setAiError(`AI Error: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handler for saving the key and re-running submit
  const handleSaveKeyAndSubmit = (key) => {
    localStorage.setItem('gemini_api_key', key);
    setGeminiKey(key);
    setShowGeminiModal(false);
    // Re-run submit immediately with the new key
    handleAiSubmit(key);
  };

  // Copy room ID to clipboard
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      // Fallback for insecure contexts or iFrames
      try {
        const textArea = document.createElement('textarea');
        textArea.value = roomId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (e) {
        console.error('Failed to copy room ID:', e);
      }
    });
  };

  // Handle leaving a room (with auto-delete)
  const handleLeaveRoom = async () => {
    if (!roomRef) return; // Safety check

    try {
      // Get a fresh snapshot of the room to avoid race conditions
      const roomSnapshot = await getDoc(roomRef);
      if (!roomSnapshot.exists()) {
        onLeaveRoom(); // Room already deleted, just leave
        return;
      }

      const currentRoomData = roomSnapshot.data();
      const currentPlayers = currentRoomData.players || [];
      
      // Create the new list of players
      const updatedPlayers = currentPlayers.filter(p => p.id !== userId);

      if (updatedPlayers.length === 0) {
        // This is the last player, delete the room
        await deleteDoc(roomRef);
      } else {
        // Not the last player, update the room
        let newHost = currentRoomData.host;
        let newTurn = currentRoomData.currentTurn;

        // Check if the host is leaving
        if (currentRoomData.host?.id === userId) {
          // Re-assign host to the next player in the list
          newHost = updatedPlayers[0];
          // Also give them the crown
          if(updatedPlayers[0]) {
            updatedPlayers[0].crown = true;
          }
        }

        // Check if it was the leaving player's turn
        if (currentRoomData.currentTurn === userId) {
          // Find the index of the leaving player in the *original* list
          const leavingPlayerIndex = currentPlayers.findIndex(p => p.id === userId);
          
          if (updatedPlayers.length > 0) {
             // Get the next player's index, wrapping around if necessary
            const nextPlayerIndex = (leavingPlayerIndex) % updatedPlayers.length;
            newTurn = updatedPlayers[nextPlayerIndex]?.id || updatedPlayers[0]?.id; // Fallback to new host
          } else {
            newTurn = null; // No players left
          }
        }

        await updateDoc(roomRef, {
          players: updatedPlayers,
          host: newHost,
          currentTurn: newTurn
        });
      }
      
      // Go back to lobby
      onLeaveRoom();

    } catch (err) {
      console.error("Error leaving room:", err);
      // Failsafe: even if update fails, get the user out of the room view
      onLeaveRoom();
    }
  };

  // Handle ending the story (host only)
  const handleEndStory = async () => {
    if (!isHost) return;
    
    try {
      await updateDoc(roomRef, {
        status: 'finished'
      });
      // The useEffect listener will catch this change and trigger onEndStory
    } catch (err) {
      console.error("Error ending story:", err);
      setError(`Failed to end story: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={60} className="animate-spin text-indigo-400" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Alert message={error} />
      </div>
    );
  }
  
  if (!room) {
     return (
      <div className="flex items-center justify-center h-screen p-4">
        <Alert message="Room not found. Returning to lobby..." />
      </div>
    );
  }

  const isMyTurn = room.currentTurn === userId;
  const lastLine = room.lines.length > 0 ? room.lines[room.lines.length - 1] : null;

  return (
    <>
      {/* Render the Gemini Modal */}
      {showGeminiModal && (
        <GeminiApiKeyModal
          onSave={handleSaveKeyAndSubmit}
          onClose={() => setShowGeminiModal(false)}
        />
      )}
      <div className="w-full max-w-3xl mx-auto p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white">{room.name}</h2>
              <div 
        className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-indigo-300"
        onClick={copyRoomId}
      >
        {/* --- UPDATED: Show full (short) ID --- */}
        Room ID: {roomId}
        {/* --- End of Update --- */}
        <AnimatePresence mode="wait">
          {isCopied ? (
                    <motion.span
                      key="copied"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                    >
                      <Check size={16} className="text-green-400" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                    >
                      <Copy size={16} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleLeaveRoom} variant="secondary">
                <LogOut size={18} /> Leave
              </Button>
              {isHost && room.status !== 'finished' && (
                <Button onClick={handleEndStory} variant="danger">
                  End Story
                </Button>
              )}
            </div>
          </div>

          {/* Game Area */}
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-6">
            {/* Waiting Room */}
            {room.status === 'waiting' && (
              <div className="text-center py-10">
                <h3 className="text-2xl text-gray-300 mb-6">
                  Waiting for players...
                </h3>
                {isHost && (
                  <Button onClick={handleStartGame}>
                    {room.players.length < 2 ? 'Start Solo (you can use AI)' : 'Start Game'}
                  </Button>
                )}
              </div>
            )}

            {/* Playing Room */}
            {room.status === 'playing' && (
              <>
                {/* Last Line */}
                <div className="mb-6">
                  <h4 className="text-sm text-gray-400 uppercase font-semibold mb-2">Last Line</h4>
                  <div className="bg-gray-900 p-4 rounded-lg min-h-[70px] flex items-center">
                    {lastLine ? (
                      <p className="text-lg text-gray-200">
                        <span className={`font-semibold ${lastLine.isAI ? 'text-yellow-300' : 'text-indigo-300'}`}>
                          {lastLine.username}:
                        </span> {lastLine.text}
                      </p>
                    ) : (
                      <p className="text-lg text-gray-400 italic">The story is about to begin...</p>
                    )}
                  </div>
                </div>

                {/* Turn Indicator */}
                <h4 className="text-lg font-semibold text-center mb-4">
                  {isMyTurn ? (
                    <span className="text-green-400 animate-pulse">It's your turn!</span>
                  ) : (
                    <span className="text-gray-400">
                      Waiting for {room.players.find(p => p.id === room.currentTurn)?.name || '...'}
                    </span>
                  )}
                </h4>
                
                {aiError && <Alert message={aiError} className="mb-4" />}

                {/* Input Form */}
                <form onSubmit={handleFormSubmit}>
                  <fieldset disabled={!isMyTurn || isSubmitting || isAiLoading} className="flex flex-col gap-3">
                    <Input
                      type="text"
                      placeholder="Write the next line..."
                      value={newLine}
                      onChange={(e) => setNewLine(e.target.value)}
                      disabled={!isMyTurn}
                      autoComplete="off"
                    />
                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        className="flex-1"
                        isLoading={isSubmitting}
                        disabled={!newLine.trim() || isAiLoading}
                      >
                        <Send size={18} /> Submit Line
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        isLoading={isAiLoading}
                        disabled={isSubmitting}
                        onClick={() => handleAiSubmit()}
                      >
                        <Sparkles size={18} className="text-yellow-300" /> Ask AI
                      </Button>
                    </div>
                  </fieldset>
                </form>
              </>
            )}

            {/* Player List */}
            <div className="mt-8">
              <h4 className="text-sm text-gray-400 uppercase font-semibold mb-3">
                Players in room ({room.players.length})
              </h4>
              <div className="flex flex-wrap gap-3">
                {room.players.map((player, index) => (
                  <motion.div
                    key={`${player.id}-${index}`} // Fix for duplicate key issue
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${
                      room.currentTurn === player.id
                        ? 'bg-indigo-800 border-indigo-500'
                        : 'bg-gray-700 border-gray-600'
                    }`}
                  >
                    {player.crown && <Crown size={16} className="text-yellow-400" />}
                    <span className="font-semibold text-white">{player.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};


/**
 * Screen 4: Story Reveal
 */
const StoryRevealScreen = ({ room, username, onPlayAgain }) => {
  const storyContainerRef = useRef(null);

  const copyStory = () => {
    if (storyContainerRef.current) {
      const storyText = Array.from(storyContainerRef.current.children)
        .map(child => child.innerText.replace(': ', ':\n') + '\n')
        .join('\n');
        
      navigator.clipboard.writeText(storyText).then(() => {
         // Replaced alert with a more modern approach (if we had state)
         // For now, console.log is safer
         console.log("Story copied to clipboard!");
      }).catch(err => {
        console.error('Failed to copy story:', err);
      });
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-4xl font-bold text-white text-center mb-4">The Full Story!</h2>
        <p className="text-xl text-gray-400 text-center mb-8">Here's the masterpiece you all created.</p>

        <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-6 md:p-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">{room.name}</h3>
          
          <div className="max-h-[50vh] overflow-y-auto pr-4 space-y-4" ref={storyContainerRef}>
            {room.lines.map((line, index) => (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="flex items-start gap-3"
              >
                <span className={`font-bold ${line.isAI ? 'text-yellow-400' : 'text-indigo-300'}`}>
                  {line.username}:
                </span>
                <p className="text-gray-200 text-lg">{line.text}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mt-8 pt-6 border-t border-gray-700">
            <Button onClick={onPlayAgain} variant="secondary" className="flex-1">
              <LogOut size={18} /> Back to Lobby
            </Button>
            <Button onClick={copyStory} className="flex-1">
              <Copy size={18} /> Copy Story
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};


/**
 * Main App Component
 */
export default function App() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(() => localStorage.getItem('mystery_chain_username'));
  const [authLoading, setAuthLoading] = useState(true);

  const [currentScreen, setCurrentScreen] = useState('username'); // 'username', 'lobby', 'room', 'reveal'
  const [currentRoom, setCurrentRoom] = useState(null); // stores roomId
  const [finishedRoom, setFinishedRoom] = useState(null); // stores room data

  // Handle Auth
  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth is not initialized.");
      setAuthLoading(false);
      return;
    }
    
    const attemptSignIn = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Error signing in anonymously:", err);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setUserId(firebaseUser.uid);
        if (username) {
          setCurrentScreen('lobby');
        } else {
          setCurrentScreen('username');
        }
      } else {
        setUser(null);
        setUserId(null);
        setCurrentScreen('username');
        attemptSignIn(); // Try to sign in again if user gets signed out
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [username]);

  // Handlers for navigation
  const handleUsernameSet = (name) => {
    localStorage.setItem('mystery_chain_username', name);
    setUsername(name);
    setCurrentScreen('lobby');
  };

  const handleJoinRoom = (roomId) => {
    setCurrentRoom(roomId);
    setCurrentScreen('room');
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setCurrentScreen('lobby');
  };

  const handleEndStory = (roomData) => {
    setFinishedRoom(roomData);
    setCurrentRoom(null);
    setCurrentScreen('reveal');
  };

  const handlePlayAgain = () => {
    setFinishedRoom(null);
    setCurrentScreen('lobby');
  };
  
  // --- NEW: Logout handler ---
  const handleLogout = () => {
    try {
      signOut(auth); // Sign out the anonymous user
    } catch (e) {
      console.error("Error signing out:", e);
    }
    localStorage.removeItem('mystery_chain_username');
    setUsername(null);
    setCurrentScreen('username'); // Force screen change
  };
  // --- End of new handler ---
  
  // Render loading screen
  if (authLoading || !userId) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center font-sans">
        <Loader2 size={60} className="animate-spin text-indigo-400" />
      </div>
    );
  }
  
  // Render content based on screen
  const renderContent = () => {
    switch (currentScreen) {
      case 'username':
        return <UsernameScreen onUsernameSet={handleUsernameSet} />;
      case 'lobby':
        return <RoomListScreen username={username} userId={userId} onJoinRoom={handleJoinRoom} />;
      case 'room':
        return (
          <StoryRoomScreen
            username={username}
            userId={userId}
            roomId={currentRoom}
            onLeaveRoom={handleLeaveRoom}
            onEndStory={handleEndStory}
          />
        );
      case 'reveal':
        return (
          <StoryRevealScreen 
            room={finishedRoom} 
            username={username} 
            onPlayAgain={handlePlayAgain}
          />
        );
      default:
        return <UsernameScreen onUsernameSet={handleUsernameSet} />;
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col font-sans p-4">
      <header className="w-full max-w-6xl mx-auto flex justify-between items-center py-4">
        <div className="text-2xl font-bold">
          <span className="text-indigo-400">Mystery</span> Chain
        </div>
        {username && (
          <div className="flex items-center gap-4">
            <div className="text-right text-sm text-gray-400">
              <div>Logged in as: <span className="font-bold text-gray-200">{username}</span></div>
              <div>User ID: <span className="font-mono text-xs">{userId.substring(0, 10)}...</span></div>
            </div>
            {/* --- NEW: Logout Button --- */}
            <Button onClick={handleLogout} variant="secondary" title="Logout" className="!p-2">
              <LogOut size={18} />
            </Button>
            {/* --- End of New Button --- */}
          </div>
        )}
      </header>
      <main className="flex-grow flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}


