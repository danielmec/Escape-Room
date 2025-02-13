// client/src/App.js
import React, { useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import CreateLobby from './components/CreateLobby';
import JoinLobby from './components/JoinLobby';
import Options from './components/Options';
import Lobby from './components/Lobby';
import { MusicProvider, useMusic } from './components/MusicContext'; 

// Componente che gestisce l'audio di sottofondo
function BackgroundMusic() {
  const { musicOn } = useMusic();
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      if (musicOn) {
        // Prova a riprodurre la musica 
        audioRef.current.play().catch((err) => {
          console.error("Errore durante la riproduzione dell'audio:", err);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [musicOn]);

  return (
    //L'audio si trova in public/stranger.mp3
    <audio ref={audioRef} src="/stranger.mp3" loop />
  );
}

function App() {
  return (
    <MusicProvider>
      {/* Il componente BackgroundMusic sarà attivo in tutte le pagine */}
      <BackgroundMusic />
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/createlobby" element={<CreateLobby />} />
            <Route path="/join" element={<JoinLobby />} />
            <Route path="/options" element={<Options />} />
            <Route path="/lobby" element={<Lobby />} />
          </Routes>
        </div>
      </Router>
    </MusicProvider>
  );
}

export default App;
