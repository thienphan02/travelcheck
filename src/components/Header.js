import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/style.css';
import gearIcon from '../img/settings-icon.png'; // Update the path as necessary

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // State to check if user is admin
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);

      // Decode the token to check if the user is an admin
      const decodedToken = jwtDecode(token);
      if (decodedToken.userType === 'admin') {
        setIsAdmin(true); // Set isAdmin to true if userType is 'admin'
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsAdmin(false); // Reset admin status on logout
    navigate('/login');
  };

  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
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
        <div className="gear-icon" onClick={toggleDropdown}>
          <img src={gearIcon} alt="Settings" style={{ width: '24px', height: '24px' }} /> {/* Adjust size as needed */}
        </div>
        {dropdownOpen && (
          <div className="dropdown-menu">
            {isLoggedIn ? (
              <>
                <Link to="/settings" className="dropdown-item">Settings</Link>

                <Link to="/manage-post" className="dropdown-item">Manage Posts</Link>

                <Link to="/favorite" className="dropdown-item">Favorite</Link>
                
                {/* Conditionally render Manage Users link for admins */}
                {isAdmin && (
                  <Link to="/manage-users" className="dropdown-item">Manage Users</Link>
                )}

                <button onClick={handleLogout} className="dropdown-item">Logout</button>
              </>
            ) : (
              <Link to="/login" className="dropdown-item">Login/Sign Up</Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
