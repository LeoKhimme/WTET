// 위치 정보 요청 및 룰렛 기능을 위한 스크립트

// 위치 정보를 저장할 변수
let userLocation = null;
let map; // To hold the Google Map object
let markers = []; // To hold the markers for search results

// 사용자 위치 요청 함수
function getUserLocation(callback) {
  if (userLocation) {
    // 이미 수신된 위치가 있으면 재요청 안 함
    console.log("✅ 위치 정보는 이미 수신됨:", userLocation);
    if (callback) callback(userLocation);
    return;
  }

  alert("📍 근처 식당 검색을 위하여 위치 정보를 요청합니다");

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        userLocation = { lat: latitude, lng: longitude };
        alert("✅ 위치 정보를 받았습니다!");
        if (callback) callback(userLocation);
      },
      (error) => {
        console.error("⚠️ 위치 정보 오류:", error);
        alert("❌ 위치 정보를 가져올 수 없습니다. 권한을 허용해주세요.");
      }
    );
  } else {
    alert("❌ 이 브라우저는 위치 정보를 지원하지 않습니다.");
  }
}

// Placeholder for Google Maps initialization
function initMap() {
  // Default location (e.g., center of Seoul, or any other city)
  // This will be used if userLocation is not yet available when map loads.
  const defaultLocation = { lat: 37.5665, lng: 126.9780 };
  const initialLocation = userLocation || defaultLocation;

  map = new google.maps.Map(document.getElementById("map"), {
    center: initialLocation,
    zoom: 14, // Adjust zoom level as needed
  });

  console.log("Google Map initialized.");

  // If userLocation is available when map loads, and a menu item was already selected,
  // we could trigger a search. However, the current flow triggers search
  // after menu selection via handleMenuSelectionForLocation, which is fine.
}

// Placeholder for finding restaurants
function findRestaurants(menuItem, searchLocation) {
  if (!map) {
    console.error("Map not initialized yet.");
    alert("Map is not ready. Please try again shortly.");
    return;
  }
  if (!searchLocation) {
    console.error("User location not available.");
    const defaultCenter = { lat: 37.5665, lng: 126.9780 };
    map.setCenter(defaultCenter);
    alert("Location not available. Showing default map area. Please allow location access and try spinning the wheel again.");
    return;
  }

  console.log(`Searching for restaurants serving: ${menuItem} near`, searchLocation);
  map.setCenter(searchLocation);

  markers.forEach(marker => marker.setMap(null));
  markers = [];

  const placesService = new google.maps.places.PlacesService(map);
  const request = {
    location: new google.maps.LatLng(searchLocation.lat, searchLocation.lng),
    radius: '5000', // 5km radius
    keyword: menuItem,
    type: ['restaurant']
  };

  placesService.nearbySearch(request, (results, status) => {
    const recommendationsSection = document.getElementById('recommendations');
    const restaurantListDiv = recommendationsSection.querySelector('.restaurant-list');
    restaurantListDiv.innerHTML = ''; // Clear previous recommendations early

    if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
      results.forEach(place => {
        const rating = place.rating || 0;
        const reviews = place.user_ratings_total || 0;
        place.calculated_score = rating * reviews;
      });

      results.sort((a, b) => b.calculated_score - a.calculated_score);
      
      const topRestaurants = results.slice(0, 3);

      if (topRestaurants.length > 0 && topRestaurants.some(p => p.calculated_score > 0)) {
        const detailPromises = topRestaurants.map(place => {
          return new Promise((resolve, reject) => {
            const placeDetailRequest = {
              placeId: place.place_id,
              fields: ['formatted_phone_number', 'name', 'geometry', 'vicinity', 'rating', 'user_ratings_total', 'photos'] // Ensure all needed fields
            };
            placesService.getDetails(placeDetailRequest, (detailedPlace, detailStatus) => {
              if (detailStatus === google.maps.places.PlacesServiceStatus.OK && detailedPlace) {
                // Overwrite or augment the original place object with details
                place.formatted_phone_number = detailedPlace.formatted_phone_number || 'N/A';
                place.name = detailedPlace.name || place.name; // Prefer detailed name
                place.vicinity = detailedPlace.vicinity || place.vicinity;
                place.rating = detailedPlace.rating !== undefined ? detailedPlace.rating : place.rating;
                place.user_ratings_total = detailedPlace.user_ratings_total !== undefined ? detailedPlace.user_ratings_total : place.user_ratings_total;
                place.photos = detailedPlace.photos || place.photos; // Prefer detailed photos

                if (userLocation && detailedPlace.geometry && detailedPlace.geometry.location && google.maps.geometry && google.maps.geometry.spherical) {
                  try {
                    const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
                      new google.maps.LatLng(userLocation.lat, userLocation.lng),
                      detailedPlace.geometry.location
                    );
                    place.distance = (distanceInMeters / 1000).toFixed(1) + ' km';
                  } catch (e) {
                    console.error("Error calculating distance:", e);
                    place.distance = 'N/A';
                  }
                } else {
                  place.distance = 'N/A';
                  if (!google.maps.geometry || !google.maps.geometry.spherical) {
                    console.warn('Google Maps Geometry library not loaded, cannot calculate distance.');
                  }
                }
                resolve(place); // Resolve with the augmented original place object
              } else {
                console.error(`Place details request failed for ${place.name || place.place_id} with status: ${detailStatus}`);
                // Augment with N/A to avoid breaking card structure
                place.formatted_phone_number = 'N/A';
                place.distance = 'N/A';
                resolve(place); // Resolve with partial data
              }
            });
          });
        });

        Promise.all(detailPromises)
          .then(detailedTopRestaurants => {
            restaurantListDiv.innerHTML = ''; // Clear previous recommendations

            for (let i = 0; i < 3; i++) {
              const place = detailedTopRestaurants[i];
              const card = document.createElement('div');
              card.classList.add('restaurant-card');

              if (place && (place.calculated_score > 0 || !place.hasOwnProperty('calculated_score'))) { // Display if place exists and has score, or if score is not applicable (e.g. direct search not yet scored)
                let photoUrl = 'https://via.placeholder.com/400x200.png?text=Restaurant+Image';
                if (place.photos && place.photos.length > 0) {
                  photoUrl = place.photos[0].getUrl({'maxWidth': 400, 'maxHeight': 200});
                }
                card.innerHTML = `
                    <img src="${photoUrl}" alt="${place.name || 'Restaurant image'}" class="restaurant-thumbnail">
                    <div class="restaurant-info">
                        <h3 class="restaurant-name">${place.name || 'N/A'}</h3>
                        <p class="restaurant-phone">Tel: ${place.formatted_phone_number || 'N/A'}</p>
                        <p class="restaurant-distance">Distance: ${place.distance || 'N/A'}</p>
                        <p class="restaurant-address">Address: ${place.vicinity || 'N/A'}</p>
                        <p class="restaurant-rating">Rating: ${place.rating || 'N/A'} (${place.user_ratings_total || 0} reviews)</p>
                    </div>
                `;
              } else {
                card.classList.add('restaurant-card-empty');
                card.innerHTML = '<p class="empty-card-message">No restaurant found for this slot</p>';
              }
              restaurantListDiv.appendChild(card);
            }
          })
          .catch(error => {
            console.error("Error processing place details:", error);
            restaurantListDiv.innerHTML = ''; // Clear on error too
            for (let i = 0; i < 3; i++) {
              const card = document.createElement('div');
              card.classList.add('restaurant-card', 'restaurant-card-empty');
              card.innerHTML = '<p class="empty-card-message">Error loading details</p>';
              restaurantListDiv.appendChild(card);
            }
          });

      } else { // No top restaurants with score > 0, or no topRestaurants array populated
        restaurantListDiv.innerHTML = ''; // Clear previous
        for (let i = 0; i < 3; i++) {
          const card = document.createElement('div');
          card.classList.add('restaurant-card', 'restaurant-card-empty');
          // Message reflects that no suitable (scored) restaurants were found from the search
          card.innerHTML = '<p class="empty-card-message">No specific recommendations found</p>';
          restaurantListDiv.appendChild(card);
        }
      }

      // Map markers for ALL results from the initial nearbySearch (results array)
      // This ensures all found places are on map, not just top 3 detailed ones.
      results.forEach(place => {
        const marker = new google.maps.Marker({
          map: map,
          position: place.geometry.location, // This should be a LatLng from nearbySearch
          title: place.name
        });

        const infowindow = new google.maps.InfoWindow({
          content: `<strong>${place.name}</strong><br>
                        Rating: ${place.rating || 'N/A'}<br>
                        Address: ${place.vicinity || 'N/A'}`
        });

        marker.addListener('click', () => {
          markers.forEach(m => { if (m.infowindow) m.infowindow.close(); });
          infowindow.open(map, marker);
          marker.infowindow = infowindow;
        });
        markers.push(marker);
      });

    } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
      // alert(`No restaurants found serving "${menuItem}" nearby.`); // Alert is optional
      restaurantListDiv.innerHTML = ''; // Clear previous
      for (let i = 0; i < 3; i++) {
        const card = document.createElement('div');
        card.classList.add('restaurant-card', 'restaurant-card-empty');
        card.innerHTML = `<p class="empty-card-message">No restaurants found for "${menuItem}"</p>`;
        restaurantListDiv.appendChild(card);
      }
    } else { // Other errors like API error, OVER_QUERY_LIMIT etc.
      console.error("PlacesService failed:", status);
      // alert("Failed to find restaurants. Please check console for details."); // Alert is optional
      restaurantListDiv.innerHTML = ''; // Clear previous
      for (let i = 0; i < 3; i++) {
        const card = document.createElement('div');
        card.classList.add('restaurant-card', 'restaurant-card-empty');
        card.innerHTML = '<p class="empty-card-message">Restaurant search failed</p>';
        restaurantListDiv.appendChild(card);
      }
    }
  });
}

// Global function to handle menu selection and initiate location search
function handleMenuSelectionForLocation() {
  if (window.selectedMenuItem) {
    console.log(`Menu selected: ${window.selectedMenuItem}. Getting location...`);
    getUserLocation((coords) => {
      if (coords) {
        findRestaurants(window.selectedMenuItem, coords);
      } else {
        console.log("Could not get location to find restaurants.");
        // Optionally, alert the user that location is needed
        // alert("위치 정보를 가져올 수 없어 식당 검색을 진행할 수 없습니다.");
      }
    });
  } else {
    console.log("No menu item selected yet. Spin the wheel first!");
    // Optionally, alert the user to spin the wheel
    // alert("룰렛을 먼저 돌려 메뉴를 선택해주세요!");
  }
}
