import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/style.css';
import gearIcon from '../img/settings-icon.png'; // Update the path as necessary
import '@fortawesome/fontawesome-free/css/all.min.css';


const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // State to check if user is admin
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">TravelCheck</Link>

        {/* Navbar Links */}
        <nav className={`navbar ${menuOpen ? 'open' : ''}`}>
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/review">Review</Link></li>
            <li><Link to="/map">Map</Link></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/favorite">Favorite</Link></li>
          </ul>
        </nav>

       {/* Icon Group */}
    <div className="icon-group">
      {/* Hamburger Icon for Small Screens */}
      <label className="checkbtn" onClick={toggleMenu}>
        <i className="fas fa-bars"></i>
      </label>

      {/* Settings Icon and Dropdown Menu */}
      <div className="settings-icon" onClick={toggleDropdown} aria-expanded={dropdownOpen}>
        <img src={gearIcon} alt="Settings" />
      </div>
    </div>

        {dropdownOpen && (
          <div className="dropdown-menu" role="menu">
            {isLoggedIn ? (
              <>
                <Link to="/settings" className="dropdown-item">Settings</Link>
                <Link to="/manage-post" className="dropdown-item">Manage Posts</Link>
                {isAdmin && <Link to="/manage-users" className="dropdown-item">Manage Users</Link>}
                <a href="#" onClick={handleLogout} className="dropdown-item logout-link" role="button">Logout</a>

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
