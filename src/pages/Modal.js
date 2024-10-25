import React, { useState } from "react";
import "../styles/style.css";
import { FaStar } from "react-icons/fa";

const Modal = ({ place, reviews, onClose }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const openImageModal = (imageUrl) => setSelectedImage(imageUrl);
  const closeImageModal = () => setSelectedImage(null);

  return (
    <>
      <div className={`modal-overlay ${place ? "show" : ""}`} onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" onClick={onClose}>&times;</button>
          <h2>{place.name}</h2>
          <p>{place.formatted_address || place.vicinity}</p>

          {place.photos?.length > 0 && (
            <div className="modal-images">
              {place.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo.getUrl({ maxWidth: 400 })}
                  alt={`${place.name} photo ${index}`}
                  onClick={() => openImageModal(photo.getUrl({ maxWidth: 800 }))}
                  className="clickable-image"
                />
              ))}
            </div>
          )}

          <h3>Reviews</h3>
          <p className="average-rating">
            <strong>
              Average Rating:{" "}
              {reviews.length
                ? (
                    reviews.reduce((acc, review) => acc + review.rating, 0) /
                    reviews.length
                  ).toFixed(1)
                : 0}
            </strong>
          </p>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="user-info">
                    <div className="username">{review.username}</div>
                  </div>
                  <div className="rating">
                    {Array.from({ length: 5 }, (_, i) => (
                      <FaStar
                        key={i}
                        color={i < review.rating ? "#ffc107" : "#e4e5e9"}
                      />
                    ))}
                  </div>
                </div>
                <p className="review-text">{review.review_text}</p>
                {review.image_url && (
                  <img
                    src={review.image_url}
                    alt={review.title}
                    className="rev-image clickable-image"
                    onClick={() => openImageModal(review.image_url)}
                  />
                )}
              </div>
            ))
          ) : (
            <p>No reviews available for this location.</p>
          )}

          
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closeImageModal}>&times;</button>
            <img src={selectedImage} alt="Enlarged view" className="enlarged-image" />
          </div>
        </div>
      )}
    </>
  );
};

export default Modal;
