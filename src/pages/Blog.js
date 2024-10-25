import React, { useState, useEffect } from 'react';
import '../styles/style.css';

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFormVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch('http://localhost:5000/blogs');
        if (response.ok) {
          const data = await response.json();

          // Fetch comments for each blog
          const blogsWithComments = await Promise.all(
            data.map(async (blog) => {
              const commentsResponse = await fetch(`http://localhost:5000/blogs/${blog.id}/comments`);
              const commentsData = await commentsResponse.json();
              return { ...blog, comments: commentsData }; // Include comments in blog data
            })
          );

          setBlogs(blogsWithComments);
        } else {
          console.error('Failed to fetch blogs');
        }
      } catch (error) {
        console.error('Error fetching blogs:', error);
      }
    };
    fetchBlogs();
  }, []);

  const handleLike = async (blogId, liked) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/blogs/${blogId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        const data = await response.json(); // Get updated likes count from backend
  
        // Update the blog likes state
        setBlogs((prevBlogs) =>
          prevBlogs.map((blog) =>
            blog.id === blogId
              ? { ...blog, likes_count: data.likes_count, liked: !liked }
              : blog
          )
        );
      } else {
        console.error('Failed to like/unlike blog');
      }
    } catch (error) {
      console.error('Error liking blog:', error);
    }
  };
  

  const handleCommentSubmit = async (e, blogId) => {
    e.preventDefault();
    const comment = e.target.comment.value;

    if (!comment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/blogs/${blogId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ comment }),
      });

      if (response.ok) {
        const updatedBlog = await response.json();
        setBlogs((prevBlogs) =>
          prevBlogs.map((blog) =>
            blog.id === blogId ? { ...blog, comments: updatedBlog.comments } : blog
          )
        );
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handlePostBlog = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert('You must be logged in to post a blog.');
      return;
    }

    // Create a new FormData object
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (image) {
      formData.append('image', image); // Add the image file
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/blogs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, // Keep the token in headers
        },
        body: formData, // Send the form data
      });

      if (response.ok) {
        const newBlog = await response.json();
        setBlogs((prev) => [newBlog, ...prev]);
        setTitle('');
        setContent('');
        setImage(null); // Reset the image
        setFormVisible(false);
      } else {
        alert('Failed to post blog.');
      }
    } catch (error) {
      console.error('Error posting blog:', error);
    }
  };

  return (
    <div className="blog-container">
      <h2>Travel Blog</h2>
      <p>Read our travel blog posts about experiences, tips, and more!</p>

      {isLoggedIn && (
        <div className="post-blog">
          <button onClick={() => setFormVisible((prev) => !prev)}>
            {isFormVisible ? 'Cancel' : 'Post a New Blog'}
          </button>
        </div>
      )}

      {isFormVisible && (
        <form onSubmit={handlePostBlog} encType="multipart/form-data">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your blog content here"
            required
          />
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
          <button type="submit">Submit Blog</button>
        </form>
      )}

      {/* Display blog list */}
      <div className="blog-list">
        {blogs.map((blog) => (
          <div key={blog.id} className="blog-post">
            <h3>{blog.title}</h3>
            <small>By {blog.author}</small>
            <p>{blog.content}</p>

            {blog.image_url && <img src={blog.image_url} alt={blog.title} className="blog-image" />}

            {/* Like Section */}
            <div className="like-section">
            <button onClick={() => handleLike(blog.id, blog.liked)}>
              {blog.liked ? 'Unlike' : 'Like'} ({blog.likes_count})
            </button>
          </div>

            {/* Comment Section */}
            <div className="comment-section">
              <h4>Comments</h4>
              <ul>
                {Array.isArray(blog.comments) && blog.comments.length > 0 ? (
                  blog.comments.map((comment, index) => (
                    <li key={index}>
                      {comment.comment} - <strong>{comment.username}</strong>
                    </li>
                  ))
                ) : (
                  <li>No comments yet.</li>
                )}
              </ul>
              {isLoggedIn && (
                <form onSubmit={(e) => handleCommentSubmit(e, blog.id)}>
                  <input type="text" name="comment" placeholder="Add a comment" required />
                  <button type="submit">Submit</button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogPage;
