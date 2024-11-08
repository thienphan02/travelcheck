import React from 'react';
import '../styles/style.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p className="footer-contact">
          Contact us at: <a href="mailto:example@gmail.com" className="footer-email">example@gmail.com</a>
        </p>
        <p className="footer-copyright">
          &copy; {new Date().getFullYear()} TravelCheck. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
