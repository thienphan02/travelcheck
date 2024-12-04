import React, { useState, useEffect } from 'react';

const SettingsPage = () => {
  const [userInfo, setUserInfo] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailError, setEmailError] = useState('');

  // Fetches user information when the component is mounted using the stored token for authorization.
  useEffect(() => {
    const token = localStorage.getItem('token'); // Retrieve the JWT token from localStorage

    const fetchUserInfo = async () => {
      try {
        const response = await fetch('https://travelcheck-1016857315f8.herokuapp.com/users/me', { // API endpoint for fetching user info
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user info'); // Handle unsuccessful responses
        }

        const data = await response.json();
        setUserInfo(data); // Update userInfo state with fetched data
        setLoading(false); // Stop loading spinner
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);


  // Handles updating user information. Sends updated user information to the server using a PUT request with JWT authorization.
  const handleUpdateUserInfo = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('https://travelcheck-1016857315f8.herokuapp.com/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userInfo), // Send the updated user data
      });

      if (response.ok) {
        alert('User information updated successfully');
      } else {
        const errorData = await response.json(); // Read the response for error details
        console.error('Failed to update user information:', errorData.message);
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error updating user information:', error);
    }
  };

  // Validates the email format and updates the `userInfo` state.
  const handleEmailChange = (e) => {
    setUserInfo({ ...userInfo, email: e.target.value });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(e.target.value)) {
      setEmailError('Invalid email format'); // Set error if email is invalid
    } else {
      setEmailError(''); // Clear error if email is valid
    }
  };

  if (loading) {
    return <div>Loading user information...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="settings-page-container">
      <h1>Settings</h1>
      <div className="settings-form">
        <input
          type="text"
          value={userInfo.username}
          onChange={(e) => setUserInfo({ ...userInfo, username: e.target.value })}
          placeholder="Username"
        />
        <input
          type="email"
          value={userInfo.email}
          onChange={handleEmailChange}
          placeholder="Email"
        />
        {emailError && <p className="error">{emailError}</p>}

        <input
          type="password"
          value={userInfo.password}
          onChange={(e) => setUserInfo({ ...userInfo, password: e.target.value })}
          placeholder="New Password"
        />
        <button onClick={handleUpdateUserInfo}>Update Information</button>
      </div>
    </div>
  );
};

export default SettingsPage;
