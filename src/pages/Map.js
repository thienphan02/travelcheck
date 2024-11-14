import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, useLoadScript, Autocomplete, Marker, InfoWindow, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faHeart } from '@fortawesome/free-solid-svg-icons';
import '../styles/style.css';

const LIBRARIES = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const MapPage = () => {
  const [center, setCenter] = useState({ lat: 40.712776, lng: -74.005974 }); // Default center to NYC
  const [markers, setMarkers] = useState([]);
  const [autocomplete, setAutocomplete] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const mapRef = useRef();
  const [reviews, setReviews] = useState([]); // State to store reviews
  const [searchInput, setSearchInput] = useState(''); // For user input
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [autocompleteFrom, setAutocompleteFrom] = useState(null);
  const [autocompleteTo, setAutocompleteTo] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const fetchReviews = async (placeName) => {
    try {
      const response = await fetch(
        `https://travelcheck-hzdwesazbcead2bm.canadacentral-01.azurewebsites.net/map/reviews?name=${encodeURIComponent(placeName)}`
      );
      if (!response.ok) throw new Error('Failed to fetch reviews');

      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleAddToFavorites = async () => {
    if (!selectedPlace) {
      alert('Please select a place to add to favorites.');
      return;
    }
  
    const { place_id, name, formatted_address } = selectedPlace; // Use place_id from selectedPlace
    
    try {
      const response = await fetch('https://travelcheck-hzdwesazbcead2bm.canadacentral-01.azurewebsites.net/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming you're storing the token in localStorage
        },
        body: JSON.stringify({
          placeId: place_id, // Updated to send place_id
          name,
          address: formatted_address,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to add to favorites: ' + response.statusText);
      }
  
      const data = await response.json();
      alert(`Added to favorites`);
      setIsFavorite(true);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      alert('Error adding to favorites.');
    }
  };
  

  useEffect(() => {
    const handleGeolocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCenter({ lat: latitude, lng: longitude });
          },
          (error) => {
            console.error("Error getting user's location:", error);
          }
        );
      } else {
        console.warn("Geolocation is not supported by this browser.");
      }
    };

    handleGeolocation();
  }, []);

  // const handleMarkerClick = (marker) => {
  //   setSelectedPlace(marker); // Set selected place
  //   fetchReviews(marker.name); // Fetch reviews based on place name
  // };

  // Handle both text and nearby search
  const onSearch = () => {
    const placesService = new window.google.maps.places.PlacesService(mapRef.current);

    if (selectedPlace && selectedPlace.place_id) {
      // Use the selected place from Autocomplete
      placesService.getDetails(
        {
          placeId: selectedPlace.place_id,
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const newMarkers = [
              {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                name: place.name,
                time: new Date(),
                placeId: place.place_id,
              },
            ];
            setMarkers(newMarkers);
            setCenter({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
            fetchReviews(place.name);
          } else {
            console.error('Error fetching place details:', status);
          }
        }
      );
    } else if (searchInput.trim() !== '') {
      // Perform a text search if the input is not empty
      const textSearchRequest = {
        query: searchInput, // Use the input string for text search
        location: center,   // Optional: Use current center as a reference location
        radius: '5000',     // Optional: Specify a radius (in meters) for the search
      };

      placesService.textSearch(textSearchRequest, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const newMarkers = results.map((place) => ({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            name: place.name,
            time: new Date(),
            placeId: place.place_id,
          }));

          setMarkers(newMarkers);
          if (newMarkers.length > 0) {
            setCenter({
              lat: newMarkers[0].lat,
              lng: newMarkers[0].lng,
            });
            fetchReviews(newMarkers[0].name);
          }
        } else {
          console.error('Error with text search:', status);
        }
      });
    } else {
      // Perform a nearby search if no input was provided
      const request = {
        location: center,
        radius: '5000', // 5 km radius
        keyword: searchInput, // Search for the input keyword
      };

      placesService.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const newMarkers = results.map((place) => {
            if (place.place_id) { // Check for place_id
              return {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                name: place.name,
                time: new Date(),
                placeId: place.place_id,
              };
            }
            return null; // Return null if place_id is missing
          }).filter(marker => marker !== null); // Filter out null markers

          setMarkers(newMarkers);
          if (newMarkers.length > 0) {
            setCenter({
              lat: newMarkers[0].lat,
              lng: newMarkers[0].lng,
            });
            fetchReviews(newMarkers[0].name);
          }
        } else {
          console.error('Error with nearby search:', status);
        }
      });
    }
  };





  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const location = { lat, lng };

    // Fetch details for the clicked location
    const placesService = new window.google.maps.places.PlacesService(mapRef.current);
    placesService.getDetails(
      {
        placeId: event.placeId, // Make sure to provide a valid placeId
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setSelectedPlace(place);
          setMarkers((current) => [
            ...current,
            { lat, lng, name: place.name, time: new Date(), placeId: place.place_id },
          ]);

          // Fetch reviews for the selected place
          fetchReviews(place.name); // Assuming place.name is your location identifier
        }
      }
    );
  };

  const handleDirectionsRequest = () => {
    if (autocompleteFrom && autocompleteTo) {
      const fromPlace = autocompleteFrom.getPlace();
      const toPlace = autocompleteTo.getPlace();
      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin: { placeId: fromPlace.place_id },
          destination: { placeId: toPlace.place_id },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirectionsResponse(result);
          } else {
            console.error('Error fetching directions:', result);
          }
        }
      );
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const renderStars = () => {
    const average = Math.round(calculateAverageRating());
    return Array.from({ length: 5 }, (_, index) => (
      <FontAwesomeIcon
        key={index}
        icon={faStar}
        color={index < average ? 'gold' : 'gray'}
      />
    ));
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div className="map-container">
      <div className="search-container">
        <Autocomplete
          onLoad={(autocompleteInstance) => setAutocomplete(autocompleteInstance)}
          onPlaceChanged={() => {
            if (autocomplete) {
              const place = autocomplete.getPlace();
              setSelectedPlace(place);
              setSearchInput(place.name); // Optionally update input with selected place name
              fetchReviews(place.name);
            }
          }}
        >
          <input
            type="text"
            placeholder="Search for a place"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ width: '400px', padding: '8px', marginRight: '8px' }}
            aria-label="Search for a place"
          />
        </Autocomplete>
        <button onClick={onSearch}>Search</button>
      </div>
      <div className="directions-container">
        <Autocomplete
          onLoad={(autocompleteInstance) => setAutocompleteFrom(autocompleteInstance)}
          onPlaceChanged={() => {
            if (autocompleteFrom) {
              const place = autocompleteFrom.getPlace();
              setFromInput(place.name);
            }
          }}
        >
          <input
            type="text"
            placeholder="From"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
            style={{ width: '300px', padding: '8px', marginRight: '8px' }}
            aria-label="From"
          />
        </Autocomplete>

        {/* Search input for "To" location */}
        <Autocomplete
          onLoad={(autocompleteInstance) => setAutocompleteTo(autocompleteInstance)}
          onPlaceChanged={() => {
            if (autocompleteTo) {
              const place = autocompleteTo.getPlace();
              setToInput(place.name);
            }
          }}
        >
          <input
            type="text"
            placeholder="To"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            style={{ width: '300px', padding: '8px', marginRight: '8px' }}
            aria-label="To"
          />
        </Autocomplete>

        <button onClick={handleDirectionsRequest}>Get Directions</button>
      </div>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={12}
        center={center}
        onLoad={(map) => (mapRef.current = map)}
        onClick={handleMapClick}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.placeId}
            position={{ lat: marker.lat, lng: marker.lng }}
            onClick={() => setSelectedPlace(marker)}
          />
        ))}

        {directionsResponse && (
          <DirectionsRenderer directions={directionsResponse} />
        )}

        {selectedPlace && selectedPlace.geometry && selectedPlace.geometry.location && (
          <InfoWindow
            position={{
              lat: selectedPlace.geometry.location.lat(),
              lng: selectedPlace.geometry.location.lng(),
            }}
            onCloseClick={() => setSelectedPlace(null)}
          >
            <div>
              <h2>{selectedPlace.name}</h2>
              <p>{selectedPlace.formatted_address}</p>
              <div className="image-container">
              <button
                  onClick={handleAddToFavorites}
                  className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
                >
                  <FontAwesomeIcon icon={faHeart} />
                </button>
              {selectedPlace.photos && selectedPlace.photos.length > 0 && (
                <img
                  src={selectedPlace.photos[0].getUrl({ maxWidth: 500 })}
                  alt={selectedPlace.name}
                  style={{ width: '100%', height: 'auto', maxHeight: '300px' }}
                />
              )}
              </div>
              {/* Display reviews */}
              <div>
              <p><strong>Average Rating:</strong> {renderStars()} ({calculateAverageRating()})</p>
                <h3>Reviews</h3>
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id}>
                      <p><strong>{review.username}</strong>: {review.review_text}</p>
                      {review.image_url && (
                        <img src={review.image_url} alt={review.title} className="rev-image" />
                      )}
                    </div>
                  ))
                ) : (
                  <p>No reviews available for this location.</p>
                )}
                
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default MapPage;