import React, { useEffect, useState } from 'react';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);

  // Fetch favorites when the page loads
  useEffect(() => {
    fetchFavorites();
  }, []);

  // Fetches the list of favorites from the API.
  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://travelcheck-1016857315f8.herokuapp.com/favorites', {
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
      const response = await fetch(`https://travelcheck-1016857315f8.herokuapp.com/favorites/${favoriteId}`, {
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
    <div className="favorites-page-container">
      <h1>Favorite Locations</h1>
      <ul className="favorites-list">
        {favorites.map((favorite) => (
          <li key={favorite.id} className="favorite-card">
            <div className="favorite-info">
              <h2>{favorite.name}</h2>
              <p>{favorite.address}</p>
            </div>
            <button className="delete-button" onClick={() => handleDeleteFavorite(favorite.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FavoritesPage;
