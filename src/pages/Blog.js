import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/style.css';

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFormVisible, setFormVisible] = useState(false);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [commentPage, setCommentPage] = useState(1);
  const [comments, setComments] = useState([]);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const COMMENTS_PER_PAGE = 10;
  const [imageName, setImageName] = useState(''); // Store image name for display
  const [imagePreview, setImagePreview] = useState(''); // Store image preview URL


  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch('https://travelcheck-1016857315f8.herokuapp.com/blogs');
        if (response.ok) {
          const data = await response.json();
    
          const blogsWithBasicInfo = data.map((blog) => ({
            ...blog,
            comments: [], // Initialize with empty comments
            liked: !!localStorage.getItem(`liked_${blog.id}`),
          }));
    
          setBlogs(blogsWithBasicInfo);
          setFilteredBlogs(blogsWithBasicInfo);
        } else {
          console.error('Failed to fetch blogs');
        }
      } catch (error) {
        console.error('Error fetching blogs:', error);
      }
    };
    
    fetchBlogs();
  }, []);

  // Handle Search
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = blogs.filter((blog) => {
      const title = blog.title ? blog.title.toLowerCase() : '';
      const content = blog.content ? blog.content.toLowerCase() : '';
      const author = blog.author ? blog.author.toLowerCase() : '';

      return (
        title.includes(query) ||
        content.includes(query) ||
        author.includes(query)
      );
    });

    setFilteredBlogs(filtered);
  };


  const handleLike = async (blogId, liked) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://travelcheck-1016857315f8.herokuapp.com/blogs/${blogId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        const data = await response.json(); // Updated like count
  
        // Update blogs list and store like status in localStorage
        const updateBlogs = (blogsArray) =>
          blogsArray.map((blog) =>
            blog.id === blogId
              ? { ...blog, likes_count: data.likes_count, liked: !liked }
              : blog
          );
  
        setBlogs((prevBlogs) => updateBlogs(prevBlogs));
        setFilteredBlogs((prevBlogs) => updateBlogs(prevBlogs));
  
        // Update localStorage
        if (liked) {
          localStorage.removeItem(`liked_${blogId}`);
        } else {
          localStorage.setItem(`liked_${blogId}`, true);
        }
  
        // Update selected blog if open
        if (selectedBlog && selectedBlog.id === blogId) {
          setSelectedBlog((prev) => ({
            ...prev,
            likes_count: data.likes_count,
            liked: !liked,
          }));
        }
      } else {
        console.error('Failed to like/unlike blog');
      }
    } catch (error) {
      console.error('Error liking blog:', error);
    }
  };
  
  

  const handleCommentSubmit = async (e, blogId) => {
  e.preventDefault();
  const comment = e.target.comment.value.trim();
  const username = localStorage.getItem('username'); // Assuming username is stored in localStorage

  if (!comment) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`https://travelcheck-1016857315f8.herokuapp.com/blogs/${blogId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ comment, username }),
    });

    if (response.ok) {
      // Fetch the latest comments after the new comment is added
      const commentsResponse = await fetch(`https://travelcheck-1016857315f8.herokuapp.com/blogs/${blogId}/comments`);
      const updatedComments = await commentsResponse.json();

      // Update the selectedBlog with the latest comments
      setSelectedBlog((prev) => ({
        ...prev,
        comments: updatedComments,
      }));

      // Update blogs and filteredBlogs states with the latest comments
      setBlogs((prevBlogs) =>
        prevBlogs.map((blog) =>
          blog.id === blogId ? { ...blog, comments: updatedComments } : blog
        )
      );

      setFilteredBlogs((prevBlogs) =>
        prevBlogs.map((blog) =>
          blog.id === blogId ? { ...blog, comments: updatedComments } : blog
        )
      );

      // Clear the input field
      e.target.comment.value = '';
    } else {
      console.error('Failed to submit comment.');
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
      const response = await fetch('https://travelcheck-1016857315f8.herokuapp.com/blogs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, // Keep the token in headers
        },
        body: formData, // Send the form data
      });

      if (response.ok) {
        const newBlog = await response.json();
        setBlogs((prev) => [newBlog, ...prev]);
        setFilteredBlogs((prev) => [newBlog, ...prev]);
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

  const modules = {
    toolbar: [
      [{ header: '1' }, { header: '2' }, { font: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ align: [] }],
      ['clean'],
    ],
  };

  const handleCardClick = async (blog) => {
    setSelectedBlog(blog);
    setComments([]); // Reset comments when opening a new blog
    setCommentPage(1); // Reset the page number
    setHasMoreComments(true); // Reset the load-more flag

    // Load the first batch of comments
    await loadMoreComments(blog.id, 1);
  };
  

  const handleCloseBlog = () => {
    setSelectedBlog(null); // Close the detailed view
  };

  const loadMoreComments = async (blogId, page) => {
    try {
      const response = await fetch(
        `https://travelcheck-1016857315f8.herokuapp.com/blogs/${blogId}/comments?page=${page}&limit=${COMMENTS_PER_PAGE}`
      );
  
      if (!response.ok) throw new Error('Failed to fetch comments');
  
      const newComments = await response.json();
  
      // Append the new comments to the existing ones
      setSelectedBlog((prev) => ({
        ...prev,
        comments: [...(prev?.comments || []), ...newComments],
      }));
  
      // Check if there are more comments to load
      setHasMoreComments(newComments.length === COMMENTS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLoadMoreComments = () => {
    setCommentPage((prevPage) => {
      const nextPage = prevPage + 1;
      loadMoreComments(selectedBlog.id, nextPage);
      return nextPage;
    });
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
  
  return (
    <div className="blog-container">
      <h2>Travel Blog</h2>
      <p>Read our travel blog posts about experiences, tips, and more!</p>

      {/* Conditionally render search bar and post button */}
      {!selectedBlog && (
        <>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search blogs"
            className="search-bar"
          />

          {isLoggedIn && (
            <div className="post-blog">
              <button onClick={() => setFormVisible((prev) => !prev)}>
                {isFormVisible ? 'Cancel' : 'Post a New Blog'}
              </button>
            </div>
          )}

          {isFormVisible && (
            <form onSubmit={handlePostBlog} className="blog-form" encType="multipart/form-data">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                required
              />
              <ReactQuill
                value={content}
                onChange={setContent}
                modules={modules}
                className="blog-content"
                placeholder="Write your blog content here..."
              />
              <label className="custom-file-input">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageChange} 
          style={{ display: 'none' }} 
        />
        Upload Image
      </label>

      {/* Display selected image name or preview */}
      {imagePreview && (
        <div className="image-preview">
          <p>Selected Image: {imageName}</p>
          <img src={imagePreview} alt="Selected Preview" className="image-thumbnail" />
        </div>
      )}
              <button type="submit">Submit Blog</button>
            </form>
          )}
        </>
      )}

      {/* Blog List */}
      <div className={`blog-list ${selectedBlog ? 'blog-detail-view' : ''}`}>
        {selectedBlog ? (
          <div className="blog-detail">
            <button onClick={handleCloseBlog} className="close-btn">&times;</button>

            <h2>{selectedBlog.title}</h2>
            <small>By {selectedBlog.username}</small>

            <div dangerouslySetInnerHTML={{ __html: selectedBlog.content }} />
            {selectedBlog.image_url && <img src={selectedBlog.image_url} alt={selectedBlog.title} />}

            {/* Like Section */}
            <div className="like-section">
              <button onClick={() => handleLike(selectedBlog.id, selectedBlog.liked)}>
                {selectedBlog.liked ? 'Unlike' : 'Like'} ({selectedBlog.likes_count})
              </button>
            </div>

            {/* Comment Section */}
            <div className="comment-section">
              <h4>Comments</h4>
              <ul>
                {selectedBlog?.comments?.length > 0 ? (
                  selectedBlog.comments.map((comment, index) => (
                    <li key={index}>
                      {comment.comment} - <strong>{comment.username}</strong>
                    </li>
                  ))
                ) : (
                  <li>No comments yet.</li>
                )}
              </ul>
            
              {hasMoreComments && (
              <button onClick={handleLoadMoreComments}>Load More Comments</button>
            )}

              {isLoggedIn && (
                <form onSubmit={(e) => handleCommentSubmit(e, selectedBlog.id)}>
                  <input
                    type="text"
                    name="comment"
                    placeholder="Add a comment"
                    required
                  />
                  <button type="submit">Submit</button>
                </form>
              )}
            </div>
          </div>
        ) : (
          filteredBlogs.map((blog) => (
            <div key={blog.id} className="blog-card" onClick={() => handleCardClick(blog)}>
              <h3>{blog.title}</h3>
              <small>By {blog.username}</small>

              {blog.image_url ? (
                <img src={blog.image_url} alt={blog.title} className="blog-image" />
              ) : (
                <div className="placeholder-image"></div>
              )}

              <div className="card-footer">
                <button onClick={(e) => {
                  e.stopPropagation();
                  handleLike(blog.id, blog.liked);
                }}>
                  {blog.liked ? 'Unlike' : 'Like'} ({blog.likes_count})
                </button>
                <span className="read-more">Read More</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BlogPage;
