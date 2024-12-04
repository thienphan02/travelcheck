import React, { useState, useEffect } from 'react';
import { Autocomplete, useLoadScript } from '@react-google-maps/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp as solidThumbsUp, faThumbsUp as regularThumbsUp } from '@fortawesome/free-solid-svg-icons';
import { faStar as fullStar, faStarHalfAlt as halfStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as emptyStar } from '@fortawesome/free-regular-svg-icons';
import '../styles/style.css';

// Google Maps API libraries
const libraries = ['places'];

const ReviewPage = () => {
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [locationId, setLocationId] = useState(null); // Reference the location ID
  const [locationName, setLocationName] = useState(''); // Display name of the location
  const [address, setAddress] = useState('');
  const [image, setImage] = useState(null); // Store image file
  const [comments, setComments] = useState({}); // Keep it initialized as an object
  const [likes, setLikes] = useState({}); // Store likes for each review
  const [autocomplete, setAutocomplete] = useState(null);
  const [showReviewSection, setShowReviewSection] = useState(false);
  const [commentPages, setCommentPages] = useState({});
  const [hasMoreComments, setHasMoreComments] = useState({});
  const [hoverRating, setHoverRating] = useState(0);
  const [imageName, setImageName] = useState(''); // Store image name for display
  const [imagePreview, setImagePreview] = useState(''); // Store image preview URL
  const [averageRating, setAverageRating] = useState(null); // Add averageRating state


  const COMMENTS_PER_PAGE = 10; // Number of comments to fetch per page

  // Load Google Maps API
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  //Checks if the user is logged in by verifying a token in localStorage.
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  // Handles the place selection event from Google Places Autocomplete. Fetches or creates the location in the backend and retrieves existing reviews.
  const handlePlaceChanged = async () => {
    const place = autocomplete.getPlace();
    const name = place.name;
    const address = place.formatted_address;

    setLocationName(name);
    setAddress(address);

    try {
      // Save location to the backend and fetch reviews
      const response = await fetch('https://travelcheck-1016857315f8.herokuapp.com/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address }),
      });

      const locationData = await response.json();
      setLocationId(locationData.id);

      const reviewsResponse = await fetch(
        `https://travelcheck-1016857315f8.herokuapp.com/reviews?location_id=${locationData.id}`
      );

      const { average_rating, reviews = [] } = await reviewsResponse.json(); // Default to empty array
      setReviews(reviews);
      setAverageRating(average_rating);
      setShowReviewSection(true);

      // Initialize likes for the fetched reviews
      const initialLikes = {};
      reviews.forEach((review) => {
        initialLikes[review.id] = {
          count: review.like_count || 0,
          liked: review.user_liked === 1,
        };
      });
      setLikes(initialLikes);
    } catch (error) {
      console.error('Error fetching or creating location:', error);
    }
  };

  // Handles submission of a new review. Validates inputs, sends the data to the backend, and updates the reviews list.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a rating between 1 and 5 stars.");
      return;
    }
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
      const response = await fetch('https://travelcheck-1016857315f8.herokuapp.com/reviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        // Refresh the reviews list to include the new review
        const newReview = await response.json();
        setReviews((prev) => [...prev, newReview]);

        // Clear the review form but keep the location data displayed
        resetForm();
        setShowReviewSection(true);

        // Fetch updated comments for the new review (optional)
        fetchCommentsForReview(newReview.id);

      } else {
        alert('Failed to submit review. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };


  // Resets the review form fields while keeping location data visible.
  const resetForm = () => {
    setReview('');
    setRating(0);
    setImage(null);
    setImageName('');
    setImagePreview('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setImage(file); // Store the selected image file
      setImageName(file.name); // Set image name for display

      // Create an object URL for the preview and store it in state
      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);

      // Clean up previous URL when a new image is chosen
      return () => URL.revokeObjectURL(previewURL);
    } else {
      // Clear image preview if no file is selected
      setImage(null);
      setImageName('');
      setImagePreview('');
    }
  };

  // Handles the like/unlike functionality for a review.
  const handleLike = async (reviewId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to like a review.');
      return;
    }

    try {
      const response = await fetch(`https://travelcheck-1016857315f8.herokuapp.com/reviews/${reviewId}/like`, {
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

  // Handles the comment functionality for a review.
  const handleCommentSubmit = async (e, reviewId) => {
    e.preventDefault();
    const commentText = e.target.comment.value.trim();

    if (!commentText) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://travelcheck-1016857315f8.herokuapp.com/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: commentText }),
      });

      if (response.ok) {
        // Retrieve the new comment object from the response, including the username
        const newComment = await response.json();

        // Update the comments state directly for this reviewId, including the username
        setComments((prev) => ({
          ...prev,
          [reviewId]: [...(prev[reviewId] || []), newComment],
        }));

        // Clear the comment input field
        e.target.comment.value = '';
      } else {
        alert('Failed to submit comment. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };


 // Load more comments if it exceed the limit.
  const handleLoadMoreComments = (reviewId) => {
    setCommentPages((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 1) + 1,
    }));
    fetchCommentsForReview(reviewId, (commentPages[reviewId] || 1) + 1);
  };

  const fetchCommentsForReview = async (reviewId, page = 1) => {
    try {
      const response = await fetch(
        `https://travelcheck-1016857315f8.herokuapp.com/reviews/${reviewId}/comments?page=${page}&limit=${COMMENTS_PER_PAGE}`
      );
      const data = await response.json();

      setComments((prev) => ({
        ...prev,
        [reviewId]: prev[reviewId] ? [...prev[reviewId], ...data] : data,
      }));

      setHasMoreComments((prev) => ({
        ...prev,
        [reviewId]: data.length === COMMENTS_PER_PAGE,
      }));
    } catch (error) {
      console.error(`Error fetching comments for review ${reviewId}:`, error);
    }
  };

  // Handle interactive stars rating
  useEffect(() => {
    reviews.forEach((review) => fetchCommentsForReview(review.id));
  }, [reviews]);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<FontAwesomeIcon key={i} icon={fullStar} style={{ marginRight: 4 }} />);
      } else if (i - rating < 1) {
        stars.push(<FontAwesomeIcon key={i} icon={halfStar} style={{ marginRight: 4 }} />);
      } else {
        stars.push(<FontAwesomeIcon key={i} icon={emptyStar} style={{ marginRight: 4 }} />);
      }
    }
    return stars;
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="review-container">
      <h2>Search for a Location to Review</h2>
      <div className="location-search">
        <Autocomplete onLoad={(autocomplete) => setAutocomplete(autocomplete)} onPlaceChanged={handlePlaceChanged}>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Search for a location"
            className="search-input"
          />
        </Autocomplete>
      </div>

      {showReviewSection && (
        <>
          <div className="review-card">
            <h3>Location Details</h3>
            <p><strong>Name:</strong> {locationName}</p>
            <p><strong>Address:</strong> {address}</p>
            <p><strong>Average Rating:</strong> {averageRating ? renderStars(averageRating) : 'No ratings yet'}</p>


            <form onSubmit={handleSubmit}>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Write your review here"
                required
              />

              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((index) => (
                  <span
                    key={index}
                    className={`star ${index <= (hoverRating || rating) ? 'filled' : ''}`}
                    onClick={() => setRating(index)}
                    onMouseEnter={() => setHoverRating(index)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </span>
                ))}
              </div>

              <label className="custom-file-input">
                <input type="file" onChange={handleImageChange} style={{ display: 'none' }} />
                Upload Image
              </label>
              {/* Display selected image name or preview */}
              {imagePreview && (
                <div className="image-preview">
                  <p>Selected Image: {imageName}</p>
                  <img src={imagePreview} alt="Selected Preview" className="image-thumbnail" />
                </div>
              )}
              <button type="submit">Submit Review</button>
            </form>
          </div>

          <h3>Previous Reviews for {locationName}</h3>
          <ul>
            {reviews.map((rev) => (
              <li key={rev.id} className="review-card">
                <strong>User:</strong> {rev.username}  <strong>Rating:</strong>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {renderStars(rev.rating)}
                </div>  <strong>Review:</strong> {rev.review_text}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {rev.image_url && <img src={rev.image_url} alt={rev.title} className="rev-image" />}
                </div>
                <div className="comment-section">
                  <button
                    className={`like-button ${likes[rev.id]?.liked ? 'liked' : ''}`}
                    onClick={() => handleLike(rev.id)}
                  >
                    <FontAwesomeIcon icon={likes[rev.id]?.liked ? solidThumbsUp : regularThumbsUp} />
                  </button>
                  <span className="like-count">{likes[rev.id]?.count || 0}</span>

                  <form className="comment-form" onSubmit={(e) => handleCommentSubmit(e, rev.id)}>
                    <input type="text" name="comment" placeholder="Add a comment" required />
                    <button type="submit">Comment</button>
                  </form>

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

                  {hasMoreComments[rev.id] && (
                    <button className="load-more-comments" onClick={() => handleLoadMoreComments(rev.id)}>Load More Comments</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );


};

export default ReviewPage;