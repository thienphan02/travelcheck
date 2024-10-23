import React, { useState, useEffect } from 'react';

const Modal = ({ place, reviews, onClose }) => {
 
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>X</button>
        <h2>{place.name}</h2>
        <p>{place.formatted_address}</p>
        {place.photos && place.photos.length > 0 && (
          <div className="modal-images">
            {place.photos.map((photo, index) => (
              <img
                key={index}
                src={photo.getUrl({ maxWidth: 400 })}
                alt={`${place.name} photo ${index}`}
                style={{ width: '100%', height: 'auto' }}
              />
            ))}
          </div>
        )}
        <h3>Reviews</h3>
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id}>
              <p><strong>{review.username}</strong>: {review.review_text}</p>
              {review.image_url && (
                <img src={review.image_url} alt={review.title} className="rev-image" />
              )}
            </div>
          ))
        ) : (
          <p>No reviews available for this location.</p>
        )}
        <p>
          <strong>Average Rating: {reviews.length ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1) : 0}</strong>
        </p>
      </div>
    </div>
  );
};

export default Modal;
