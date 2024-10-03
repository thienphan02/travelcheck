import React, { useState, useEffect } from 'react';
import { Autocomplete, useLoadScript } from '@react-google-maps/api';
import '../styles/style.css';

const libraries = ['places'];

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');  // For storing location
  const [locationType, setLocationType] = useState('');  // For storing location type
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFormVisible, setFormVisible] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null); // For Google Places autocomplete

  // Load Google Maps API
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

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
          setBlogs(data);
        } else {
          console.error('Failed to fetch blogs');
        }
      } catch (error) {
        console.error('Error fetching blogs:', error);
      }
    };
    fetchBlogs();
  }, []);

  const handlePlaceChanged = () => {
    const place = autocomplete.getPlace();
    setLocation(place.name); // Get the location name from Google Places
    if (place.types && place.types.length > 0) {
      setLocationType(place.types[0]); // Get the first type from the place details
    }
  };

  const handlePostBlog = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert('You must be logged in to post a blog.');
      return;
    }

    const blogData = { title, content, location, location_type: locationType };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(blogData),
      });

      if (response.ok) {
        const newBlog = await response.json();
        setBlogs((prev) => [newBlog, ...prev]);
        setTitle('');
        setContent('');
        setLocation('');
        setLocationType('');
        setFormVisible(false);
      } else {
        alert('Failed to post blog.');
      }
    } catch (error) {
      console.error('Error posting blog:', error);
    }
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

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
        <form onSubmit={handlePostBlog}>
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
            />
          </Autocomplete>

          <input type="text" value={locationType} readOnly placeholder="Location type" />

          <button type="submit">Submit Blog</button>
        </form>
      )}

      {/* Display blog list */}
      <div className="blog-list">
        {blogs.map((blog) => (
          <div key={blog.id} className="blog-post">
            <h3>{blog.title}</h3>
            <small>By {blog.author} | {blog.location} | {blog.location_type}</small>
            <p>{blog.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogPage;
