import React, { useState, useEffect } from 'react';
import { Autocomplete, useLoadScript, InfoWindow } from '@react-google-maps/api';
import Modal from './Modal';
import '../styles/style.css';

const LIBRARIES = ['places'];

const Home = () => {
  const [token, setToken] = useState(null); // State to store the token
  const [center, setCenter] = useState({ lat: 0, lng: 0 });
  const [reviews, setReviews] = useState([]); // State to store reviews
  const [currentLocation, setCurrentLocation] = useState('');
  const [autocompleteLocation, setAutocompleteLocation] = useState(null);
  const [autocompleteSearch, setAutocompleteSearch] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [locationCoords, setLocationCoords] = useState({ lat: 0, lng: 0 });
  const [searchOptions, setSearchOptions] = useState({ location: null, radius: 50000 });
  const [recommendedPlaces, setRecommendedPlaces] = useState({
    lodging: [],
    restaurant: [],
    cafe: [],
    tourist_attraction: [],
    shopping_mall: [],
  });

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);

  },[]);

  const fetchReviews = async (placeId) => {
    try {
      const response = await fetch(`http://localhost:5000/map/reviews?location=${placeId}`);
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      const data = await response.json();
      setReviews(data); // Set reviews in state
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  useEffect(() => {
    const getCurrentLocation = () => {
      if (navigator.geolocation && isLoaded) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setCenter({ lat: latitude, lng: longitude });
            setLocationCoords({ lat: latitude, lng: longitude });
            if (window.google) {
              const geocoder = new window.google.maps.Geocoder();
              geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                  const addressComponents = results[0].address_components;
                  const city = addressComponents.find((component) => component.types.includes('locality'))?.long_name || '';
                  const country = addressComponents.find((component) => component.types.includes('country'))?.long_name || '';
                  setCurrentLocation(`${city}, ${country}`);
                  fetchAllRecommendedPlaces(latitude, longitude); // Fetch all categories
                } else {
                  console.error('Error in reverse geocoding:', status);
                }
              });
            }
          },
          (error) => {
            console.error('Error getting user location:', error);
          }
        );
      }
    };
    getCurrentLocation();
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded && locationCoords.lat && locationCoords.lng) {
      const newSearchOptions = {
        location: new window.google.maps.LatLng(locationCoords.lat, locationCoords.lng),
        radius: 50000,
      };
      setSearchOptions(newSearchOptions);
      if (autocompleteSearch) {
        autocompleteSearch.setOptions(newSearchOptions); // Update the autocomplete options
      }
    }
  }, [locationCoords, isLoaded, autocompleteSearch]);

  const fetchRecommendedPlaces = async (latitude, longitude, category) => {
    if (window.google) {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      const request = {
        location: new window.google.maps.LatLng(latitude, longitude),
        radius: 5000,
        type: [category],
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setRecommendedPlaces((prev) => ({ ...prev, [category]: results }));
        } else {
          console.error('Error fetching recommended places:', status);
        }
      });
    }
  };

  // Fetch all categories
  const fetchAllRecommendedPlaces = async (latitude, longitude) => {
    const categories = ['lodging', 'restaurant', 'cafe', 'tourist_attraction', 'shopping_mall'];
    for (const category of categories) {
      await fetchRecommendedPlaces(latitude, longitude, category);
    }
  };

  const onLocationPlaceChanged = () => {
    if (autocompleteLocation) {
      const place = autocompleteLocation.getPlace();
      if (place.geometry) {
        const newLocationCoords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setCurrentLocation(place.formatted_address);
        setLocationCoords(newLocationCoords);
        setCenter(newLocationCoords);
        setIsChangingLocation(false);
        setLocationInput('');
  
        // Update the search options based on the new location
        const newSearchOptions = {
          location: new window.google.maps.LatLng(newLocationCoords.lat, newLocationCoords.lng),
          radius: 5000,
        };
        setSearchOptions(newSearchOptions);
  
        // Update the autocomplete options with the new location
        if (autocompleteSearch) {
          autocompleteSearch.setOptions(newSearchOptions);
        }
  
        // Fetch all recommended places based on the new location
        fetchAllRecommendedPlaces(newLocationCoords.lat, newLocationCoords.lng);
      }
    }
  };
  
  const onSearchPlaceChanged = () => {
    if (autocompleteSearch) {
      const place = autocompleteSearch.getPlace();
      if (place.geometry) {
        setSelectedPlace(place);
        setCenter({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
        fetchReviews(place.name); // Fetch reviews for the selected place
      }
    }
  };
  

  const handleChangeLocation = () => {
    setIsChangingLocation(true);
    setLocationInput('');
    setSearchInput('');
    setAutocompleteSearch(null);
  };

  const handleAddToFavorites = async (place) => {
    if (!token) {
      alert('You must be logged in to add favorites.');
      return;
    }
  
    console.log("Token:", token); // Log the token for debugging
  
    try {
      const response = await fetch('http://localhost:5000/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: place.name,
          address: place.vicinity || place.formatted_address,
        }),
      });
  
      if (response.ok) {
        alert('Added to favorites!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      alert('Failed to add to favorites.');
    }
  };
  
  
  const autocompleteSearchOptions = {
    ...searchOptions, // Ensure it includes the updated location and radius
    types: ['establishment'], // Optionally filter types if needed
  };


  if (loadError) return <div>Error</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="home-container">
      <h1>Welcome to Travel Reviews</h1>
      <p>Discover the best places to visit, eat, and stay!</p>
      <div className="location-display">
        <strong>Current Location: </strong>
        {isChangingLocation ? (
          <Autocomplete
            onLoad={(autocompleteInstance) => setAutocompleteLocation(autocompleteInstance)}
            onPlaceChanged={onLocationPlaceChanged}
          >
            <input
              type="text"
              placeholder="Enter a new location"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              style={{ width: '400px', padding: '8px' }}
            />
          </Autocomplete>
        ) : (
          <span onClick={handleChangeLocation} style={{ cursor: 'pointer', color: 'blue' }}>
            {currentLocation || 'Fetching location...'} (Click to change)
          </span>
        )}
      </div>

      {/* Category Sections */}
      <div className="category-container">
  <h2>Recommended Places</h2>
  {Object.entries(recommendedPlaces).map(([category, places]) => (
    <div key={category} className="category-section">
      <h3>{category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')}</h3>
      {places.length > 0 ? (
        <ul>
          {places.map((place) => (
            <li key={place.place_id} onClick={() => {
              setSelectedPlace(place);
              fetchReviews(place.name); // Fetch reviews for the selected place
            }} style={{ cursor: 'pointer' }}>
              <h4>{place.name}</h4>
              <p>{place.vicinity}</p>
              <button onClick={() => handleAddToFavorites(place)}>Add to Favorites</button>
              {place.photos && place.photos.length > 0 && (
                <img
                  src={place.photos[0].getUrl({ maxWidth: 200 })}
                  alt={place.name}
                  style={{ width: '100%', height: 'auto' }}
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No recommendations available.</p>
      )}
    </div>
  ))}
</div>


{selectedPlace && selectedPlace.geometry && (
  <Modal
    place={selectedPlace}
    reviews={reviews}
    onClose={() => setSelectedPlace(null)}
    token={token} // Pass the token here
  />
)}


    </div>
  );
};

export default Home;
