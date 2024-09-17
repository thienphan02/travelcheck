import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/style.css';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if a token exists in localStorage or sessionStorage
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    // Remove token from localStorage or sessionStorage
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1>Travel Reviews</h1>
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/review">Review</Link></li>
            <li><Link to="/map" className="map-link">Map</Link></li>
            <li><Link to="/blog">Blog</Link></li>
          </ul>
        </nav>
        {isLoggedIn ? (
          <button onClick={handleLogout} className="logout-button">Logout</button>
        ) : (
          <Link to="/login" className="login-link">Login/Sign Up</Link>
        )}
      </div>
    </header>
  );
};

export default Header;
