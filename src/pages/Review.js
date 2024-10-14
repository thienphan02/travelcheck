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
  const [address, setAddress] = useState('');
  const [type, setType] = useState('');
  const [image, setImage] = useState(null); // To store the image file
  const [comments, setComments] = useState({}); // Store comments for each review
  const [likes, setLikes] = useState({}); // Store likes for each review
  const [autocomplete, setAutocomplete] = useState(null);
  const [showReviewSection, setShowReviewSection] = useState(false);

  // Load Google Maps API
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handlePlaceChanged = async () => {
    const place = autocomplete.getPlace();
    setLocation(place.name);
    setAddress(place.formatted_address);

    if (place.types && place.types.length > 0) {
      setType(place.types[0]);
    }

    // Fetch reviews for this location
    try {
      const response = await fetch(`http://localhost:5000/reviews?location=${place.name}`);
      const data = await response.json();
      setReviews(data);
      setShowReviewSection(true);

      // Initialize likes and comments for the fetched reviews
      setLikes(Object.fromEntries(data.map(rev => [rev.id, 0]))); // Initialize likes count
      setComments(Object.fromEntries(data.map(rev => [rev.id, []]))); // Initialize comments

      // Fetch comments for each review
      await Promise.all(data.map(async (rev) => {
        const commentResponse = await fetch(`http://localhost:5000/reviews/${rev.id}/comments`);
        const commentsData = await commentResponse.json();
        setComments(prev => ({ ...prev, [rev.id]: commentsData }));
      }));
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert('You must be logged in to submit a review.');
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('rating', rating);
    formData.append('review_text', review);
    formData.append('location', location);
    formData.append('type', type);
    if (image) {
      formData.append('image', image); // Attach image if selected
    }

    try {
      const response = await fetch('http://localhost:5000/reviews', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
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
    setAddress('');
    setImage(null);
    setShowReviewSection(false);
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]); // Store the selected image
  };

  const handleLike = (reviewId) => {
    setLikes((prev) => ({ ...prev, [reviewId]: prev[reviewId] + 1 }));
    // Optionally, send a request to the backend to update likes
  };

  const handleDislike = (reviewId) => {
    setLikes((prev) => ({ ...prev, [reviewId]: prev[reviewId] - 1 }));
    // Optionally, send a request to the backend to update dislikes
  };

  const handleCommentSubmit = async (e, reviewId) => {
    e.preventDefault();
    const comment = e.target.comment.value;

    if (!comment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment }),
      });

      if (response.ok) {
        // Refetch comments after a successful submission
        const commentResponse = await fetch(`http://localhost:5000/reviews/${reviewId}/comments`);
        const commentsData = await commentResponse.json();
        setComments(prev => ({ ...prev, [reviewId]: commentsData }));
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };


  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="review-container">
      <h2>Search for a Location to Review</h2>
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

      {showReviewSection && (
        <>
          <h3>Location Details</h3>
          <p><strong>Name:</strong> {location}</p>
          <p><strong>Address:</strong> {address}</p>

          <form onSubmit={handleSubmit}>
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
            <input type="file" onChange={handleImageChange} />
            <button type="submit">Submit Review</button>
          </form>

          <h3>Previous Reviews for {location}</h3>
          <ul>
            {reviews.map((rev) => (
              <li key={rev.id}>
                <strong>Location:</strong> {rev.location} | <strong>Rating:</strong> {rev.rating} | <strong>Review:</strong> {rev.review_text}
                {rev.image_url && (
                  <img src={rev.image_url} alt={rev.title} className="rev-image" />
                )}
                <div>
                  <button onClick={() => handleLike(rev.id)}>Like</button>
                  <span>{likes[rev.id] || 0} Likes</span>
                  <button onClick={() => handleDislike(rev.id)}>Dislike</button>
                </div>
                {/* Comment Form */}
                <form onSubmit={(e) => handleCommentSubmit(e, rev.id)}>
                  <input type="text" name="comment" placeholder="Add a comment" required />
                  <button type="submit">Comment</button>
                </form>
                {/* Comments List */}
                <ul>
                  {comments[rev.id]?.map((comment, index) => (
                    <li key={index}>{comment.comment}</li>
                  ))}

                  {/* If no comments, show a message */}
                  {(!comments[rev.id] || comments[rev.id].length === 0) && (
                    <li>No comments yet.</li>
                  )}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );

};

export default ReviewPage;
