import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useLoadScript, Autocomplete, Marker } from '@react-google-maps/api';
import '../styles/style.css';

const LIBRARIES = ['places']; // Defined outside the component

const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

const MapPage = () => {
  const [center, setCenter] = useState({ lat: 40.712776, lng: -74.005974 }); // Default center to NYC
  const [markers, setMarkers] = useState([]);
  const [autocomplete, setAutocomplete] = useState(null);
  const mapRef = useRef();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY, // Ensure this is set in your .env file
    libraries: LIBRARIES,
  });

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

  const onMapClick = useCallback((event) => {
    const newMarker = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
      time: new Date(),
    };
    setMarkers((current) => [...current, newMarker]);

    if (window.google) {
      new window.google.maps.Marker({
        position: newMarker,
        map: mapRef.current,
      });
    }
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

            new window.google.maps.Marker({
              position: place.geometry.location,
              map: mapRef.current,
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
        <Autocomplete onLoad={(autocomplete) => setAutocomplete(autocomplete)}>
          <input
            type="text"
            placeholder="Search for a place"
            style={{ width: '400px', padding: '8px', marginRight: '8px' }}
            aria-label="Search for a place" // Accessibility improvement
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
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default MapPage;
