import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ManagePost = () => {
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  const [blogs, setBlogs] = useState([]); // State for blogs
  const [blogComments, setBlogComments] = useState([]); // State for blog comments
  const [editReviewId, setEditReviewId] = useState(null);
  const [editCommentId, setEditCommentId] = useState(null);
  const [editBlogId, setEditBlogId] = useState(null); // State for editing blog
  const [editBlogCommentId, setEditBlogCommentId] = useState(null); // State for editing blog comment
  const [editReviewText, setEditReviewText] = useState('');
  const [editCommentText, setEditCommentText] = useState('');
  const [editBlogText, setEditBlogText] = useState(''); // State for blog text
  const [editBlogCommentText, setEditBlogCommentText] = useState(''); // State for blog comment text
  const [editReviewRating, setEditReviewRating] = useState(0);
  const [editBlogTitle, setEditBlogTitle] = useState('');
  const [editImageURL, setEditImageURL] = useState('');
  const [locationId, setLocationId] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const reviewResponse = await fetch('http://localhost:5000/manage/reviews', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const commentResponse = await fetch('http://localhost:5000/manage/comments', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const blogResponse = await fetch('http://localhost:5000/manage/blogs', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const blogCommentResponse = await fetch('http://localhost:5000/manage/blog-comments', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        // Check response status
        if (!reviewResponse.ok) {
          const errorText = await reviewResponse.text();
          console.error('Error fetching reviews:', errorText);
          return;
        }

        if (!commentResponse.ok) {
          const errorText = await commentResponse.text();
          console.error('Error fetching comments:', errorText);
          return;
        }

        if (!blogResponse.ok) {
          const errorText = await blogResponse.text();
          console.error('Error fetching blogs:', errorText);
          return;
        }

        if (!blogCommentResponse.ok) {
          const errorText = await blogCommentResponse.text();
          console.error('Error fetching blog comments:', errorText);
          return;
        }

        const reviewsData = await reviewResponse.json();
        const commentsData = await commentResponse.json();
        const blogsData = await blogResponse.json();
        const blogCommentsData = await blogCommentResponse.json();

        setReviews(reviewsData);
        setComments(commentsData);
        setBlogs(blogsData); // Set blogs data
        setBlogComments(blogCommentsData); // Set blog comments data

      } catch (error) {
        console.error('Error fetching reviews/comments:', error);
      }
    };


    fetchData();
  }, []);

  const handleEditReview = (review) => {
    setEditReviewId(review.id);
    setEditReviewText(review.review_text);
    setEditReviewRating(review.rating); // Set the current rating
    setEditImageURL(review.image_url); // Set the current image URL
    setLocationId(review.location_id);
  };



  const handleEditComment = (comment) => {
    setEditCommentId(comment.id);
    setEditCommentText(comment.comment);
  };



  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      await fetch(`http://localhost:5000/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setReviews((prev) => prev.filter((rev) => rev.id !== reviewId));
    }
  };

 

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await fetch(`http://localhost:5000/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    }
  };

  

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    if (!locationId) {
      alert("Location ID is required.");
      return;
    }
  
    const formData = new FormData();
    formData.append('review_text', editReviewText);
    formData.append('rating', editReviewRating);
    formData.append('location_id', locationId); // Ensure it's captured and sent
  
    if (editImageURL instanceof File) {
      formData.append('image', editImageURL);
    } else if (editImageURL === null) {
      formData.append('delete_image', 'true');
    }
  
    try {
      const response = await fetch(`http://localhost:5000/reviews/${editReviewId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
  
      if (!response.ok) throw new Error('Failed to update the review.');
  
      setReviews((prev) =>
        prev.map((review) =>
          review.id === editReviewId
            ? { ...review, review_text: editReviewText, rating: editReviewRating, location_id: locationId }
            : review
        )
      );
  
      // Reset form after successful update
      setEditReviewId(null);
      setEditReviewText('');
      setEditReviewRating(0);
      setEditImageURL('');
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };
  
  
  
  

  


  const handleUpdateComment = async (e) => {
    e.preventDefault();
    await fetch(`http://localhost:5000/comments/${editCommentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ comment: editCommentText }),
    });
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === editCommentId ? { ...comment, comment: editCommentText } : comment
      )
    );
    setEditCommentId(null);
    setEditCommentText('');
  };

  

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setEditImageURL(file); // Store selected image
  };
  
  
  const handleEditBlog = (blog) => {
    setEditBlogId(blog.id);
    setEditBlogText(blog.content); // Set the current blog content
    setEditBlogTitle(blog.title);
  };
  const handleEditBlogComment = (comment) => {
    setEditBlogCommentId(comment.id);
    setEditBlogCommentText(comment.comment);
  };

  const handleDeleteBlog = async (blogId) => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      await fetch(`http://localhost:5000/blogs/${blogId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setBlogs((prev) => prev.filter((blog) => blog.id !== blogId));
    }
  };

  const handleDeleteBlogComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this blog comment?')) {
      await fetch(`http://localhost:5000/blog-comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setBlogComments((prev) => prev.filter((comment) => comment.id !== commentId));
    }
  };

  const handleUpdateBlog = async (e) => {
    e.preventDefault();
    await fetch(`http://localhost:5000/blogs/${editBlogId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ title: editBlogTitle, content: editBlogText }),
    });
    setBlogs((prev) =>
      prev.map((blog) =>
        blog.id === editBlogId ? { ...blog, title: editBlogTitle, content: editBlogText } : blog
      )
    );
    setEditBlogId(null);
    setEditBlogTitle('');
    setEditBlogText('');
  };

  const handleUpdateBlogComment = async (e) => {
    e.preventDefault();
    await fetch(`http://localhost:5000/blog-comments/${editBlogCommentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ comment: editBlogCommentText }),
    });
    setBlogComments((prev) =>
      prev.map((comment) =>
        comment.id === editBlogCommentId ? { ...comment, comment: editBlogCommentText } : comment
      )
    );
    setEditBlogCommentId(null);
    setEditBlogCommentText('');
  };

  return (
    <div className="manage-post-container">
     <h2>Your Reviews</h2>
{reviews.length > 0 ? (
  reviews.map((review) => (
    <div key={review.id}>
      {editReviewId === review.id ? (
        <form onSubmit={handleUpdateReview}>
          <textarea
            value={editReviewText}
            onChange={(e) => setEditReviewText(e.target.value)}
            required
          />
          <input
            type="number"
            value={editReviewRating}
            onChange={(e) => setEditReviewRating(e.target.value)}
            min="1"
            max="5"
            required
          />
          <input
            type="file"
            onChange={handleImageChange}
            accept="image/*"
          />
          {review.image_url && (
            <div>
              <img src={review.image_url} alt="Current Review" width="100" />
              <label>
                <input
                  type="checkbox"
                  onChange={() => setEditImageURL(null)}
                />
                Delete current image
              </label>
            </div>
          )}
          <button type="submit">Update Review</button>
        </form>
      ) : (
        <div>
          <p><strong>Review:</strong> {review.review_text}</p>
          <p><strong>Rating:</strong> {review.rating}</p>
          <p><strong>Location:</strong> {review.location_name}, {review.location_address}</p>
          {review.image_url && <img src={review.image_url} alt="Review" width="100" />}
          <button onClick={() => handleEditReview(review)}>Edit</button>
          <button onClick={() => handleDeleteReview(review.id)}>Delete</button>
        </div>
      )}
    </div>
  ))
) : (
  <p>No reviews found.</p>
)}


<h2>Your Review Comments</h2>
{comments.length > 0 ? (
  comments.map((comment) => (
    <div key={comment.id}>
      {editCommentId === comment.id ? (
        <form onSubmit={handleUpdateComment}>
          <input
            type="text"
            value={editCommentText}
            onChange={(e) => setEditCommentText(e.target.value)}
            required
          />
          <button type="submit">Update Comment</button>
        </form>
      ) : (
        <div>
          <p><strong>Comment:</strong> {comment.comment}</p>
          <p><strong>On Review:</strong> {comment.review_post}</p>
          <button onClick={() => handleEditComment(comment)}>Edit</button>
          <button onClick={() => handleDeleteComment(comment.id)}>Delete</button>
        </div>
      )}
    </div>
  ))
) : (
  <p>No review comments found.</p>
)}


      <h2>Your Blogs</h2>
      {blogs.length > 0 ? (
        blogs.map((blog) => (
          <div key={blog.id}>
            {editBlogId === blog.id ? (
  <form onSubmit={handleUpdateBlog}>
    <textarea
      value={editBlogTitle}
      onChange={(e) => setEditBlogTitle(e.target.value)}
      required
    />
    <textarea
      value={editBlogText}
      onChange={(e) => setEditBlogText(e.target.value)}
      required
    />
    <input type="file" onChange={handleImageChange} accept="image/*" />
    {blog.image_url && (
      <div>
        <img src={blog.image_url} alt="Blog" width="100" />
        <label>
          <input type="checkbox" onChange={() => setEditImageURL(null)} />
          Delete current image
        </label>
      </div>
    )}
    <button type="submit">Update Blog</button>
  </form>
) : (
  <div>
    <p><strong>{blog.title}</strong> {blog.content}</p>
    {blog.image_url && <img src={blog.image_url} alt="Blog" width="100" />}
    <button onClick={() => handleEditBlog(blog)}>Edit</button>
    <button onClick={() => handleDeleteBlog(blog.id)}>Delete</button>
  </div>
)}

          </div>
        ))
      ) : (
        <p>No blogs found.</p>
      )}

<h2>Your Blog Comments</h2>
{blogComments.length > 0 ? (
  blogComments.map((comment) => (
    <div key={comment.id}>
      {editBlogCommentId === comment.id ? (
        <form onSubmit={handleUpdateBlogComment}>
          <input
            type="text"
            value={editBlogCommentText}
            onChange={(e) => setEditBlogCommentText(e.target.value)}
            required
          />
          <button type="submit">Update Blog Comment</button>
        </form>
      ) : (
        <div>
          <p><strong>Comment:</strong> {comment.comment}</p>
          <p><strong>On Blog:</strong> {comment.blog_title}</p> {/* Display blog title */}
          <button onClick={() => handleEditBlogComment(comment)}>Edit</button>
          <button onClick={() => handleDeleteBlogComment(comment.id)}>Delete</button>
        </div>
      )}
    </div>
  ))
) : (
  <p>No blog comments found.</p>
)}

    </div>
  );
};

export default ManagePost;