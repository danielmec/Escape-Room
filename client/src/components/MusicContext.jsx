import React, { createContext, useContext, useState } from 'react';

const MusicContext = createContext();

export const useMusic = () => {
  return useContext(MusicContext);
};

export const MusicProvider = ({ children }) => {
  const [musicOn, setMusicOn] = useState(false); // Inizializza a false

  return (
    <MusicContext.Provider value={{ musicOn, setMusicOn }}>
      {children}
    </MusicContext.Provider>
  );
};