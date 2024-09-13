import React, { useState, useEffect } from 'react';
import '../styles/style.css';

const ReviewPage = () => {
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      const response = await fetch('http://localhost:5000/reviews');
      const data = await response.json();
      setReviews(data);
    };
    fetchReviews();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const reviewData = {
      rating,
      review_text: review,
    };

    try {
      const response = await fetch('http://localhost:5000/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Review submitted successfully:', result);
        setReviews((prev) => [...prev, result]); // Update the list with the new review
      } else {
        console.error('Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }

    // Reset form after submission
    setReview('');
    setRating(0);
  };

  return (
    <div className="review-container">
      <h2>Write a Review and Rate a Place</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Write your review here"
        />
        <div className="rating">
          <label>
            Rating:
            <input
              type="number"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              min="1"
              max="5"
            />
          </label>
        </div>
        <button type="submit">Submit</button>
      </form>

      <h3>Submitted Reviews</h3>
      <ul>
        {reviews.map((rev) => (
          <li key={rev.id}>
            <strong>Rating:</strong> {rev.rating} | <strong>Review:</strong> {rev.review_text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReviewPage;
