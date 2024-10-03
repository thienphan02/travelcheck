import React from 'react';
import '../styles/style.css';

const Modal = ({ isOpen, onClose, blog }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{blog.title}</h3>
        <p>{blog.content}</p>
        <small>By {blog.author} on {new Date(blog.created_at).toLocaleDateString()}</small>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Modal;
