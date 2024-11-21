import React from 'react';
import '../styles/style.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p className="footer-contact">
          Contact us at: <a href="mailto:pxthien2002@gmail.com" className="footer-email">pxthien2002@gmail.com</a>
        </p>
        <p className="footer-copyright">
          &copy; {new Date().getFullYear()} TravelCheck. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
