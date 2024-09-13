import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/style.css';

const Header = () => {
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
        <Link to="/login" className="login-link">Login/SignUp</Link>
      </div>
    </header>
  );
};

export default Header;
