import React from 'react';
import { useMusic } from './MusicContext';
import './Options.css';
import Logo from './Logo';
  
const Options = () => {
  const { musicOn, setMusicOn } = useMusic();

  const toggleMusic = () => {
    setMusicOn(!musicOn);
  };

  return (
    <div className="options-container">
      <Logo />
      <button className='home-button' onClick={toggleMusic}>
        {musicOn ? 'Disattiva musica' : 'Attiva musica'}
      </button>
    </div>
  );
};

export default Options;