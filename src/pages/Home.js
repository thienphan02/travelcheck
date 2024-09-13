import React from 'react';
import '../styles/style.css';

const Home = () => {
  return (
    <div className="home-container">
      <h1>Welcome to Travel Reviews</h1>
      <p>Discover the best places to visit, eat, and stay!</p>
      <div className="recommended-places">
        <h2>Recommended Places</h2>
        {/* You can later dynamically render these items from API data */}
        <ul>
          <li>Hue, Vietnam</li>
          <li>Kyoto, Japan</li>
          <li>Seoul, South Korea</li>
          <li>Paris, France</li>
          <li>New York, USA</li>
          <li>Rome, Italy</li>
          <li>Bali, Indonesia</li>
          <li>London, United Kingdom</li>
        </ul>
      </div>
    </div>
  );
};

export default Home;
