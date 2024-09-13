import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, Autocomplete } from '@react-google-maps/api';
import '../styles/style.css';

const libraries = ['places']; // Include libraries for search
const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

const MapPage = () => {
  const [center, setCenter] = useState({ lat: 40.712776, lng: -74.005974 }); // Default to New York
  const [markers, setMarkers] = useState([]);
  const [autocomplete, setAutocomplete] = useState(null);
  const mapRef = useRef(); // Reference to the map

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY, // Use your Google Maps API key
    libraries,
  });

  useEffect(() => {
    // Try to get the user's current location
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
  }, []);

  const onMapClick = useCallback((event) => {
    setMarkers((current) => [
      ...current,
      {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
        time: new Date(),
      },
    ]);
  }, []);

  const onSearch = () => {
    if (autocomplete) {
      const placesService = new window.google.maps.places.PlacesService(mapRef.current);
      placesService.findPlaceFromQuery(
        {
          query: autocomplete.getPlace().name,
          fields: ['geometry', 'name'],
        },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const place = results[0];
            setMarkers([
              {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                name: place.name,
                time: new Date(),
              },
            ]);
            setCenter({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          }
        }
      );
    }
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div className="map-container">
      <h2>Find Places to Visit</h2>
      <div className="search-container">
        <Autocomplete
          onLoad={(autocomplete) => setAutocomplete(autocomplete)}
        >
          <input
            type="text"
            placeholder="Search for a place"
            style={{ width: '400px', padding: '8px', marginRight: '8px' }}
          />
        </Autocomplete>
        <button onClick={onSearch}>Search</button>
      </div>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={12}
        center={center}
        onClick={onMapClick}
        onLoad={(map) => (mapRef.current = map)}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.time.toISOString()}
            position={{ lat: marker.lat, lng: marker.lng }}
            label={marker.name}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default MapPage;
