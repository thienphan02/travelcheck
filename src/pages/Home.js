import React, { useState, useEffect } from 'react';
import { Autocomplete, useLoadScript, InfoWindow } from '@react-google-maps/api';
import Modal from './Modal';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import '../styles/style.css';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

const LIBRARIES = ['places'];

// Generates a responsive configuration for the carousel based on the number of places.
const getResponsiveConfig = (placesCount) => ({
  desktop: { breakpoint: { max: 3000, min: 1024 }, items: Math.min(placesCount, 4), slidesToSlide: 1 },
  tablet: { breakpoint: { max: 1024, min: 464 }, items: Math.min(placesCount, 2), slidesToSlide: 1 },
  mobile: { breakpoint: { max: 464, min: 0 }, items: Math.min(placesCount, 1), slidesToSlide: 1 },
});

const Home = () => {
  const [carouselIndexes, setCarouselIndexes] = useState({});
  const [favorites, setFavorites] = useState([]);
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

  // Checks if a place is in the user's favorites.
  const isFavorite = (placeId) => favorites.includes(placeId);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);

  }, []);

  const handlePlaceClick = async (place) => {

    try {
      await fetchReviews(place); // Fetch reviews before opening the modal
      setSelectedPlace(place); // Open the modal
    } catch (error) {
      console.error('Error handling place click:', error);
    }
  };


  //  Fetches reviews for the selected place and updates the reviews state.
  const fetchReviews = async (place) => {
    try {
      console.log('Fetching reviews for:', place.name);

      const response = await fetch(
        `https://travelcheck-1016857315f8.herokuapp.com/map/reviews?name=${encodeURIComponent(place.name)}`
      );

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      console.log('Fetched reviews:', data);
      setReviews(data); // Update state with fetched reviews
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  // Fetches the user's current location using the Geolocation API and sets it as the center of the map.
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

  
  //Fetches recommendations for a specific category based on the user's current location.
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

  // Updates the user's location based on input from the Autocomplete field.
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


  const handleChangeLocation = () => {
    setIsChangingLocation(true);
    setLocationInput('');
    setSearchInput('');
    setAutocompleteSearch(null);
  };

  // Handles add a place to favorite
  const handleAddToFavorites = async (place) => {
    if (!token) {
      alert('You must be logged in to add favorites.');
      return;
    }

    try {
      const response = await fetch('https://travelcheck-1016857315f8.herokuapp.com/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: place.name,
          address: place.vicinity || place.formatted_address, // Use address from place data
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
    if (isFavorite(place.place_id)) {
      setFavorites(favorites.filter((id) => id !== place.place_id)); // Remove from favorites
    } else {
      setFavorites([...favorites, place.place_id]); // Add to favorites
    }
  };

  const updateCarouselIndex = (category, newIndex) => {
    setCarouselIndexes((prev) => ({ ...prev, [category]: newIndex }));
  };

  const isLastSlide = (category, places) => {
    const currentIndex = carouselIndexes[category] || 0;
    const itemsPerSlide = getResponsiveConfig(places.length).desktop.items;
    return currentIndex >= places.length - itemsPerSlide;
  };

  if (loadError) return <div>Error</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="home-container">
      <h1>Discover the best places to visit, eat, and stay!</h1>
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
        {Object.entries(recommendedPlaces).map(([category, places]) => (

          <div key={category} className="category-section">
            <h3>{category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')}</h3>
            {places.length > 0 ? (
              <ul>
                <Carousel
                  responsive={getResponsiveConfig(places.length) }
                  partialVisible
                  arrows
                  className="carousel-container"
                >
                  {places.map((place) => (
                    <li
                      key={place.place_id}
                      className="carousel-item"
                      onClick={() => handlePlaceClick(place)}
                      style={{ cursor: 'pointer' }}
                    >
                      <h4 className="place-name">{place.name}</h4>
                      <p className="place-address">{place.vicinity}</p>
                      <div
                        className="favorite-icon"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the modal
                          handleAddToFavorites(place);
                        }}
                      >
                        {isFavorite(place.place_id) ? (
                          <FaHeart className="filled-heart" />
                        ) : (
                          <FaRegHeart className="outlined-heart" />
                        )}
                      </div>
                      {place.photos?.length > 0 ? (
                        <img
                          src={place.photos[0].getUrl({ maxWidth: 200 })}
                          alt={place.name}
                        />
                      ) : (
                        <img
                          src="https://via.placeholder.com/250x150?text=No+Image"
                          alt="No Image Available"
                        />
                      )}
                    </li>
                  ))}
                </Carousel>
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
          onClose={() => {
            setSelectedPlace(null);
            setReviews([]); // Clear reviews when modal closes
          }}
          token={token} // Pass the token here
        />
      )}
      <div class="background-shapes">
        <div class="shape-1"></div>
        <div class="shape-2"></div>
        <div class="shape-3"></div>
      </div>

    </div>

  );
};

export default Home;
