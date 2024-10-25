import React, { useEffect, useState } from 'react';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);

  // Fetch favorites when the page loads
  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/favorites', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch favorites');
      const data = await response.json();
      setFavorites(data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  // Handle deleting a favorite
  const handleDeleteFavorite = async (favoriteId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/favorites/${favoriteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove the deleted favorite from the state
        setFavorites(favorites.filter((favorite) => favorite.id !== favoriteId));
      } else {
        console.error('Failed to delete favorite');
        alert('Error deleting favorite.');
      }
    } catch (error) {
      console.error('Error deleting favorite:', error);
      alert('Failed to delete favorite.');
    }
  };

  return (
    <div>
      <h1>Your Favorite Locations</h1>
      <ul>
        {favorites.map((favorite) => (
          <li key={favorite.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flexGrow: 1 }}>
              <h2>{favorite.name}</h2>
              <p>{favorite.address}</p>
            </div>
            <button onClick={() => handleDeleteFavorite(favorite.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FavoritesPage;
