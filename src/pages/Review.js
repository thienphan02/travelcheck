import React, { useState, useEffect } from 'react'; 
import { Autocomplete, useLoadScript } from '@react-google-maps/api';
import '../styles/style.css';

const libraries = ['places'];

const ReviewPage = () => {
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [locationId, setLocationId] = useState(null); // Reference the location ID
  const [locationName, setLocationName] = useState(''); // Display name of the location
  const [address, setAddress] = useState('');
  const [type, setType] = useState('');
  const [image, setImage] = useState(null); // Store image file
  const [comments, setComments] = useState({}); // Keep it initialized as an object
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
    const name = place.name;
    const address = place.formatted_address;
  
    setLocationName(name);
    setAddress(address);
  
    try {
      const response = await fetch('http://localhost:5000/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address }),
      });
  
      const locationData = await response.json();
      setLocationId(locationData.id);
  
      const reviewsResponse = await fetch(`http://localhost:5000/reviews?location_id=${locationData.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
  
      const reviewsData = await reviewsResponse.json();
      setReviews(reviewsData);
  
      const initialLikes = {};
      reviewsData.forEach((review) => {
        initialLikes[review.id] = {
          count: review.like_count || 0,
          liked: review.user_liked === 1, // Track if the user has liked it
        };
      });
      setLikes(initialLikes);
      setShowReviewSection(true);
    } catch (error) {
      console.error('Error fetching or creating location:', error);
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
    formData.append('location_id', locationId); // Submit location ID
    if (image) formData.append('image', image);
  
    try {
      const response = await fetch('http://localhost:5000/reviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
  
      if (response.ok) {
        const newReview = await response.json();
        setReviews((prev) => [...prev, newReview]);
        resetForm();
      } else {
        alert('Failed to submit review. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };
  

  const resetForm = () => {
    setReview('');
    setRating(0);
    setLocationName('');
    setType('');
    setAddress('');
    setImage(null);
    setShowReviewSection(false);
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]); // Store the selected image
  };

  const handleLike = async (reviewId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to like a review.');
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:5000/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        console.error('Failed to like/unlike review');
        alert('Failed to update like status.');
        return;
      }
  
      const data = await response.json();
  
      setLikes((prev) => ({
        ...prev,
        [reviewId]: {
          count: data.likes_count,
          liked: !prev[reviewId].liked, // Toggle liked state
        },
      }));
    } catch (error) {
      console.error('Error liking/unliking review:', error);
      alert('An error occurred. Please try again.');
    }
  };
  
  
  
  
 

  const handleCommentSubmit = async (e, reviewId) => {
    e.preventDefault();
    const comment = e.target.comment.value.trim();
  
    if (!comment) return;
  
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
      
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const fetchCommentsForReview = async (reviewId) => {
    try {
      const response = await fetch(`http://localhost:5000/reviews/${reviewId}/comments`);
      const data = await response.json();
      setComments((prev) => ({ ...prev, [reviewId]: data }));
    } catch (error) {
      console.error(`Error fetching comments for review ${reviewId}:`, error);
    }
  };
  
  useEffect(() => {
    reviews.forEach((review) => fetchCommentsForReview(review.id));
  }, [reviews]);
  
  

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
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="Search for a location"
          required
          style={{ width: '400px', padding: '8px', marginRight: '8px' }}
        />
      </Autocomplete>

      {showReviewSection && (
        <>
          <h3>Location Details</h3>
          <p><strong>Name:</strong> {locationName}</p>
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

          <h3>Previous Reviews for {locationName}</h3>
          <ul>
            {reviews.map((rev) => (
              <li key={rev.id}>
                <strong>Location:</strong> {rev.location_name} | <strong>Rating:</strong> {rev.rating} | <strong>Review:</strong> {rev.review_text}
                {rev.image_url && (
                  <img src={rev.image_url} alt={rev.title} className="rev-image" />
                )}
                
                <div>
  <button onClick={() => handleLike(rev.id)}>
    {likes[rev.id]?.liked ? 'Unlike' : 'Like'}
  </button>
  <span>{likes[rev.id]?.count || 0} Likes</span>
</div>



                {/* Comment Form */}
                <form onSubmit={(e) => handleCommentSubmit(e, rev.id)}>
                  <input type="text" name="comment" placeholder="Add a comment" required />
                  <button type="submit">Comment</button>
                </form>
                {/* Comments List */}
                <ul>
  {comments[rev.id]?.length > 0 ? (
    comments[rev.id].map((comment, index) => (
      <li key={index}>
        <strong>{comment.username}:</strong> {comment.comment}
      </li>
    ))
  ) : (
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