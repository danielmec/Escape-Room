// client/src/App.js
import React, { useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './components/HomePage';
import CreateLobby from './components/CreateLobby';
import JoinLobby from './components/JoinLobby';
import Options from './components/Options';
import Lobby from './components/Lobby';
import Game from './components/Game';
import Puzzle from './components/Puzzle';
import { MusicProvider, useMusic } from './components/MusicContext';

function BackgroundMusic() {
  const { musicOn } = useMusic();
  const location = useLocation();
  const audioRef = useRef(null);

  // Quando il percorso cambia, aggiorna il source solo se necessario.
  useEffect(() => {
    if (audioRef.current) {

      const newMusicSource = (location.pathname === '/game' || location.pathname === '/puzzle') ? '/game.mp3' : '/stranger.mp3';
      const currentSrc = audioRef.current.src ? new URL(audioRef.current.src).pathname : "";
      if (currentSrc !== newMusicSource) {
        // Cambia traccia solo se è diverso
        audioRef.current.pause();
        audioRef.current.src = newMusicSource;
        audioRef.current.load();
        if (musicOn) {
          audioRef.current.play().catch((err) =>
            console.error("Errore durante la riproduzione dell'audio:", err)
          );
        }
      }
    }
  }, [location, musicOn]);

  // Gestione della riproduzione/pausa in base a musicOn
  useEffect(() => {
    if (audioRef.current) {
      if (musicOn) {
        audioRef.current.play().catch((err) =>
          console.error("Errore durante la riproduzione dell'audio:", err)
        );
      } else {
        audioRef.current.pause();
      }
    }
  }, [musicOn]);

  return <audio ref={audioRef} src="/stranger.mp3" loop />;
}

function App() {
  return (
    <MusicProvider>
      <Router>
        {/* BackgroundMusic è dentro il Router per poter usare useLocation */}
        <BackgroundMusic />
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/createlobby" element={<CreateLobby />} />
            <Route path="/join" element={<JoinLobby />} />
            <Route path="/options" element={<Options />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/game" element={<Game />} />
            <Route path="/puzzle" element={<Puzzle />} />
          </Routes>
        </div>
      </Router>
    </MusicProvider>
  );
}

export default App;
