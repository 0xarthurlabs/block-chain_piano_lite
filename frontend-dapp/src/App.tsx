import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';  // 公共布局，含导航栏
import GuessPage from './pages/GuessPage';
import MintPage from './pages/MintPage';
import BuyPage from './pages/BuyPage';
import NFTsPage from './pages/NFTsPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/buy" />} />
          <Route path="/guess" element={<GuessPage />} />
          <Route path="/mint" element={<MintPage />} />
          <Route path="/buy" element={<BuyPage />} />
          <Route path="/nfts" element={<NFTsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
