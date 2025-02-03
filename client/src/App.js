// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import CreateLobby from './components/CreateLobby';
import JoinLobby from './components/JoinLobby';
import Options from './components/Options';
import ChatTest from './components/ChatTest';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lobby" element={<CreateLobby/>} />
          <Route path="/join" element={<JoinLobby/>} />
          <Route path="/options" element={<Options/>} />
          <Route path="/chat" element={<ChatTest/>}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
