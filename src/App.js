import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import ReviewPage from './pages/Review';
import MapPage from './pages/Map';
import BlogPage from './pages/Blog';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Header from './components/Header';

const AppContent = () => {
  const location = useLocation();
  const showHeader = !['/login', '/signup'].includes(location.pathname);

  return (
    <>
      {showHeader && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
