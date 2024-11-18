import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  const [activeTab, setActiveTab] = useState('reviews');


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reviewResponse, commentResponse, blogResponse, blogCommentResponse] = await Promise.all([
          fetch('https://travelcheck.azurewebsites.net/manage/reviews', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
          fetch('https://travelcheck.azurewebsites.net/manage/comments', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
          fetch('https://travelcheck.azurewebsites.net/manage/blogs', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
          fetch('https://travelcheck.azurewebsites.net/manage/blog-comments', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        ]);

        const [reviewsData, commentsData, blogsData, blogCommentsData] = await Promise.all([
          reviewResponse.json(),
          commentResponse.json(),
          blogResponse.json(),
          blogCommentResponse.json(),
        ]);

        setReviews(reviewsData);
        setComments(commentsData);
        setBlogs(blogsData);
        setBlogComments(blogCommentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
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
      await fetch(`https://travelcheck.azurewebsites.net/reviews/${reviewId}`, {
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
      await fetch(`https://travelcheck.azurewebsites.net/comments/${commentId}`, {
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
      const response = await fetch(`https://travelcheck.azurewebsites.net/reviews/${editReviewId}`, {
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
            ? { ...review, review_text: editReviewText, rating: editReviewRating, location_id: locationId, image_url: editImageURL }
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
    await fetch(`https://travelcheck.azurewebsites.net/comments/${editCommentId}`, {
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
    setEditImageURL(e.target.files[0]); // Store the selected image
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
      await fetch(`https://travelcheck.azurewebsites.net/blogs/${blogId}`, {
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
      await fetch(`https://travelcheck.azurewebsites.net/blog-comments/${commentId}`, {
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
  
    const formData = new FormData();
    formData.append('title', editBlogTitle);
    formData.append('content', editBlogText);
  
    if (editImageURL instanceof File) {
      formData.append('image', editImageURL); // Append image if it's selected.
    } else if (editImageURL === null) {
      formData.append('delete_image', 'true'); // Request image deletion.
    }
  
    try {
      const response = await fetch(`https://travelcheck.azurewebsites.net/blogs/${editBlogId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
  
      if (!response.ok) throw new Error('Failed to update the blog.');
  
      setBlogs((prev) =>
        prev.map((blog) =>
          blog.id === editBlogId ? { ...blog, title: editBlogTitle, content: editBlogText, image_url: editImageURL } : blog
        )
      );
  
      // Reset the form after updating the blog.
      setEditBlogId(null);
      setEditBlogTitle('');
      setEditBlogText('');
      setEditImageURL('');
    } catch (error) {
      console.error('Error updating blog:', error);
    }
  };
  

  const handleUpdateBlogComment = async (e) => {
    e.preventDefault();
    await fetch(`https://travelcheck.azurewebsites.net/blog-comments/${editBlogCommentId}`, {
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

  const modules = {
    toolbar: [
      [{ header: '1' }, { header: '2' }, { font: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ align: [] }],
      ['clean'],
    ],
  };

  return (
    <div className="manage-post-container">
{/* Tab Navigation */}
<div className="tabs">
        <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>Reviews</button>
        <button className={activeTab === 'comments' ? 'active' : ''} onClick={() => setActiveTab('comments')}>Review Comments</button>
        <button className={activeTab === 'blogs' ? 'active' : ''} onClick={() => setActiveTab('blogs')}>Blogs</button>
        <button className={activeTab === 'blogComments' ? 'active' : ''} onClick={() => setActiveTab('blogComments')}>Blog Comments</button>
      </div>

      {activeTab === 'reviews' && (
      <div>
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
                  onChange={(e) => setEditImageURL(e.target.files[0])}
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
</div>
    )}

{activeTab === 'comments' && (
      <div>
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
</div>
    )}

{activeTab === 'blogs' && (
      <div>
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
                <ReactQuill
                  value={editBlogText}
                  onChange={setEditBlogText}
                  modules={modules}
                  required
                />
                <input
                  type="file"
                  onChange={(e) => setEditImageURL(e.target.files[0])}
                  accept="image/*"
                />
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
                <p><strong>{blog.title}</strong> </p>
                <div
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />
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
      </div>
    )}

{activeTab === 'blogComments' && (
      <div>
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
  )}
  </div>
);
};

export default ManagePost;