import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import ReviewPage from './pages/Review';
import MapPage from './pages/Map';
import BlogPage from './pages/Blog';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Header from './components/Header';
import SettingsPage from './pages/Setting';
import ManageUsers from './pages/ManageUsers';
import ManagePost from './pages/ManagePost';
import Favorite from './pages/Favorite';

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
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/manage-post" element={<ManagePost />} />
        <Route path="/favorite" element={<Favorite />} />
        <Route path="/manage-users" element={<ManageUsers />} />
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
