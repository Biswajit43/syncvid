import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import YouTube from 'react-youtube';
import { Toaster, toast } from 'react-hot-toast';
import { Crown, Send, Users, RefreshCw, Play, Copy, Clapperboard, Sparkles, Video, MessageCircle } from 'lucide-react';

// Helper function
const extractVideoId = (url) => {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// This should be updated for deployment
const socket = io.connect("http://localhost:3001");

// ==============================
// MAIN APP COMPONENT
// ==============================
export default function App() {
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [initialVideoId, setInitialVideoId] = useState('');
  const [initialParticipants, setInitialParticipants] = useState([]);

  const handleJoin = (code, name) => {
    socket.emit('joinRoom', { roomCode: code, name });
    socket.on('joinedRoom', ({ videoId, isHost: hostStatus, participants }) => {
      setRoomCode(code);
      setIsHost(hostStatus);
      setInitialVideoId(videoId);
      setInitialParticipants(participants || []);
    });

    socket.on('roomError', (errorMessage) => {
      toast.error(errorMessage);
    });
  };

  if (!roomCode) {
    return (
      <>
        <Toaster 
          position="top-center" 
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
              color: '#fff',
              border: '1px solid #374151',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
          }}
        />
        <LandingPage onJoin={handleJoin} />
      </>
    );
  }

  return <WatchRoom roomCode={roomCode} initialIsHost={isHost} initialVideoId={initialVideoId} initialParticipants={initialParticipants} />;
}


// ==============================
// LANDING PAGE COMPONENT
// ==============================
function LandingPage({ onJoin }) {
  const [joinCode, setJoinCode] = useState('');
  const [name, setName] = useState('');

  const handleCreateRoom = () => {
    if (!name.trim()) { toast.error('Please enter your name!'); return; }
    const newRoomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    onJoin(newRoomCode, name);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Please enter your name!'); return; }
    if (!joinCode.trim()) { toast.error('Please enter a room code!'); return; }
    onJoin(joinCode, name);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative text-center p-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-indigo-500/20 w-full max-w-md transform hover:scale-105 transition-all duration-300">
        {/* Logo and title */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <Video size={40} className="text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-tight">
            SyncPlay
          </h1>
          <p className="text-gray-300 text-lg font-medium">Watch YouTube together, in perfect sync.</p>
          <div className="flex items-center justify-center mt-3 text-indigo-300">
            <Sparkles size={16} className="mr-2" />
            <span className="text-sm">Real-time synchronized playback</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <input
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full bg-white/10 border border-white/20 rounded-xl py-4 px-5 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
            />
          </div>

          <button 
            onClick={handleCreateRoom} 
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 flex items-center justify-center space-x-2"
          >
            <Crown size={20} />
            <span>Create New Room</span>
          </button>

          <div className="flex items-center text-gray-400 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
            <span className="px-4 text-sm font-medium">OR</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Or enter a room code..."
                className="w-full bg-white/10 border border-white/20 rounded-xl py-4 px-5 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-white/20 border border-white/20 hover:bg-white/30 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 backdrop-blur-sm flex items-center justify-center space-x-2"
            >
              <Users size={20} />
              <span>Join Room</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ==============================
// WATCH ROOM COMPONENT
// ==============================
// ==============================
// WATCH ROOM COMPONENT (VIDEO SIZE FIXED)
// ==============================
function WatchRoom({ roomCode, initialIsHost, initialVideoId, initialParticipants }) {
  const [isHost, setIsHost] = useState(initialIsHost);
  const [videoId, setVideoId] = useState(initialVideoId);
  const [urlInput, setUrlInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState(initialParticipants);
  const playerRef = useRef(null);
  const lastKnownHostState = useRef('pause');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    socket.on('systemMessage', (message) => {
        toast(message, { icon: '👋' });
    });

    socket.on('videoLoaded', (newVideoId) => {
        toast.success('Host changed the video!', {
          style: { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', border: '1px solid #10b981' }
        });
        setVideoId(newVideoId);
    });

    socket.on('playbackSynced', (data) => {
      const player = playerRef.current;
      if (player && !isHost) {
        lastKnownHostState.current = data.action;
        if (data.action === 'play') {
          if (Math.abs(player.getCurrentTime() - data.time) > 1.5) {
            player.seekTo(data.time, true);
          }
          player.playVideo();
        } else if (data.action === 'pause') {
          player.pauseVideo();
        }
      }
    });

    socket.on('resync', (data) => {
        const player = playerRef.current;
        if(player) {
            toast('Re-syncing with host...', { icon: '🔄', style: { background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#fff', border: '1px solid #60a5fa' } });
            player.seekTo(data.time, true);
            if (data.state === 'play') {
                player.playVideo();
            } else {
                player.pauseVideo();
            }
        }
    });

    socket.on('messageReceived', (data) => setMessages((prev) => [...prev, data]));
    socket.on('updateParticipants', (participantList) => setParticipants(participantList));
    
    const handlePromotion = () => {
      setIsHost(true);
      toast.success("You are the new host!", {
        icon: '👑',
        style: { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', border: '1px solid #fbbf24' }
      });
    };
    socket.on('promoteToHost', handlePromotion);

    return () => {
      socket.off('systemMessage');
      socket.off('videoLoaded');
      socket.off('playbackSynced');
      socket.off('resync');
      socket.off('messageReceived');
      socket.off('updateParticipants');
      socket.off('promoteToHost', handlePromotion);
    };
  }, [roomCode]);

  const handleLoadVideo = () => {
    const newVideoId = extractVideoId(urlInput);
    if (newVideoId && isHost) {
      socket.emit('loadVideo', { roomCode, videoId: newVideoId });
      setUrlInput('');
    } else {
      toast.error("Invalid YouTube URL or you are not the host.");
    }
  };
  
  const handleResync = () => {
    if (isHost && playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      const playerState = playerRef.current.getPlayerState();
      const state = playerState === 1 ? 'play' : 'pause';
      socket.emit('forceResync', { roomCode, time: currentTime, state });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socket.emit('sendMessage', { roomCode, message: newMessage });
      setNewMessage('');
    }
  };
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!', {
      style: { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', border: '1px solid #10b981' }
    });
  };

  const handlePlayerReady = (event) => playerRef.current = event.target;

  const handlePlayerStateChange = (event) => {
    if (!isHost) {
        if(event.data === 1 && lastKnownHostState.current === 'pause') playerRef.current.pauseVideo();
        if(event.data === 2 && lastKnownHostState.current === 'play') playerRef.current.playVideo();
        return;
    }
    if (event.data === 1) { // Playing
        lastKnownHostState.current = 'play';
        socket.emit('syncPlayback', { roomCode, action: 'play', time: playerRef.current.getCurrentTime() });
    }
    else if (event.data === 2) { // Paused
        lastKnownHostState.current = 'pause';
        socket.emit('syncPlayback', { roomCode, action: 'pause' });
    }
  };

  return (
    <>
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            color: '#fff',
            border: '1px solid #374151',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        }}
      />
      
      {/* --- KEY FIX 1: Use `min-h-screen` to allow scrolling on mobile --- */}
      <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white font-sans">
        {/* Main Content Area */}
        <div className="flex-grow flex flex-col p-4 lg:p-8 space-y-6 min-w-0">
          {/* Enhanced Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Video size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-tight">
                  SyncPlay
                </h1>
                <p className="text-gray-400 text-sm">Real-time synchronized viewing</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300 text-sm font-medium">Room:</span>
                </div>
                <strong className="text-white select-all font-mono text-lg tracking-wider">{roomCode}</strong>
                <button 
                  onClick={handleCopyCode} 
                  title="Copy Room Code" 
                  className="p-2 text-gray-400 hover:text-white transition-all duration-200 hover:bg-white/10 rounded-lg"
                >
                  <Copy size={16}/>
                </button>
              </div>
              
              {isHost && (
                <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
                  <Crown size={16} className="text-yellow-400" />
                  <span className="text-yellow-400 font-semibold text-sm">Host</span>
                </div>
              )}
            </div>
          </header>
          
          {/* Host Controls */}
          {isHost && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl order-last lg:order-none">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Crown size={20} className="text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Host Controls</h3>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <input
                    type="text" 
                    value={urlInput} 
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Paste a YouTube URL here..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-4 px-5 pr-12 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                  />
                  <Video size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={handleLoadVideo} 
                    title="Load Video" 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold p-4 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 min-w-[60px]"
                  >
                    <Play size={20}/>
                  </button>
                  
                  <button 
                    onClick={handleResync} 
                    title="Force Re-Sync All Players" 
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold p-4 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-green-600/30 hover:shadow-green-600/50 min-w-[60px]"
                  >
                    <RefreshCw size={20}/>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* --- KEY FIX 2: Replaced `flex-grow` with `w-full aspect-video` --- */}
          <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/40 border border-gray-700/50 relative">
            {videoId ? (
              <YouTube
                videoId={videoId}
                opts={{ 
                  width: '100%', 
                  height: '100%', 
                  playerVars: { 
                    autoplay: 1, 
                    controls: isHost ? 1 : 0, 
                    disablekb: isHost ? 0 : 1, 
                    modestbranding: 1, 
                    iv_load_policy: 3,
                    rel: 0
                  } 
                }}
                onReady={handlePlayerReady}
                onStateChange={handlePlayerStateChange}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                <div className="p-8 bg-white/5 rounded-3xl backdrop-blur-xl border border-white/10 text-center">
                  <Clapperboard size={80} className="mx-auto mb-6 text-gray-500"/>
                  <h3 className="text-2xl font-bold text-white mb-2">Ready to Watch</h3>
                  <p className="text-xl text-gray-300 max-w-md">
                    {isHost 
                      ? "Paste a YouTube URL to get started!" 
                      : "Waiting for the host to select a video..."
                    }
                  </p>
                  {!isHost && (
                    <div className="flex items-center justify-center mt-4 text-indigo-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-400 border-t-transparent mr-2"></div>
                      <span className="text-sm">Synchronizing...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Sidebar */}
        <div className="w-full lg:w-96 bg-white/5 backdrop-blur-xl flex flex-col border-t-2 lg:border-t-0 lg:border-l-2 border-white/10">
          {/* Participants Section */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users size={20} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Participants ({participants.length})
              </h2>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    {p.isHost && (
                      <Crown size={12} className="absolute -top-1 -right-1 text-yellow-400 bg-gray-900 rounded-full p-0.5" />
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className={`font-semibold truncate ${p.isHost ? 'text-yellow-400' : 'text-white'}`}>
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-400">{p.isHost ? 'Room Host' : 'Viewer'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Section */}
          <div className="flex-grow flex flex-col p-6 min-h-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MessageCircle size={20} className="text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Chat</h2>
            </div>
            
            {/* Messages */}
            <div className="flex-grow overflow-y-auto space-y-3 mb-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {msg.user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`font-semibold text-sm ${msg.user.isHost ? 'text-yellow-400' : 'text-indigo-400'}`}>
                        {msg.user.name}
                      </span>
                      {msg.user.isHost && <Crown size={12} className="text-yellow-400" />}
                    </div>
                    <div className="ml-8">
                      <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl rounded-tl-md border border-white/10 text-gray-100 text-sm leading-relaxed">
                        {msg.message}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex space-x-3">
              <input 
                type="text" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Say something..." 
                className="flex-grow bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
              />
              <button 
                type="submit"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 p-3 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/30"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </>
  );
}