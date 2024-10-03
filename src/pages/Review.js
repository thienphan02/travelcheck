import React, { useState, useEffect } from 'react';
import { Autocomplete, useLoadScript } from '@react-google-maps/api';
import '../styles/style.css';

const libraries = ['places'];

const ReviewPage = () => {
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [location, setLocation] = useState('');
  const [type, setType] = useState(''); // State for type selection
  const [autocomplete, setAutocomplete] = useState(null);

  // Load Google Maps API
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    const fetchReviews = async () => {
      const response = await fetch('http://localhost:5000/reviews');
      const data = await response.json();
      setReviews(data);
    };
    fetchReviews();
  }, []);

  const handlePlaceChanged = () => {
    const place = autocomplete.getPlace();
    setLocation(place.name);
    if (place.types && place.types.length > 0) {
      setType(place.types[0]); // Set the first type from the place details
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert('You must be logged in to submit a review.');
      return;
    }

    const reviewData = {
      rating,
      review_text: review,
      location,
      type,
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        const result = await response.json();
        setReviews((prev) => [...prev, result]);
        resetForm();
      } else {
        alert('Failed to submit review. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('An error occurred while submitting your review.');
    }
  };

  const resetForm = () => {
    setReview('');
    setRating(0);
    setLocation('');
    setType('');
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="review-container">
      <h2>Write a Review and Rate a Place</h2>
      <form onSubmit={handleSubmit}>
        <Autocomplete
          onLoad={(autocomplete) => setAutocomplete(autocomplete)}
          onPlaceChanged={handlePlaceChanged}
        >
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Search for a location"
            required
            style={{ width: '400px', padding: '8px', marginRight: '8px' }}
          />
        </Autocomplete>

        <div>
          <label>
            Type:
            <input type="text" value={type} readOnly />
          </label>
        </div>

        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Write your review here"
          required
        />
        <div className="rating">
          <label>
            Rating:
            <input
              type="number"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              min="1"
              max="5"
              required
            />
          </label>
        </div>
        <button type="submit">Submit</button>
      </form>

      <h3>Submitted Reviews</h3>
      <ul>
        {reviews.map((rev) => (
          <li key={rev.id}>
            <strong>Location:</strong> {rev.location} | <strong>Type:</strong> {rev.type} |{' '}
            <strong>Rating:</strong> {rev.rating} | <strong>Review:</strong> {rev.review_text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReviewPage;
