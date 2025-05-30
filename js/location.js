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
    // Attempt to center map on default if user location denied but map exists
    const defaultCenter = { lat: 37.5665, lng: 126.9780 }; // Default if no location
    map.setCenter(defaultCenter);
    alert("Location not available. Showing default map area. Please allow location access and try spinning the wheel again.");
    return;
  }

  console.log(`Searching for restaurants serving: ${menuItem} near`, searchLocation);
  map.setCenter(searchLocation);

  // Clear previous markers
  markers.forEach(marker => marker.setMap(null));
  markers = [];

  const placesService = new google.maps.places.PlacesService(map);
  const request = {
    location: new google.maps.LatLng(searchLocation.lat, searchLocation.lng),
    radius: '5000', // 5km radius
    keyword: menuItem,
    type: ['restaurant'] // Search for restaurants
  };

  placesService.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
      if (results.length === 0) {
        alert(`No restaurants found serving "${menuItem}" nearby.`);
        // Clear previous recommendations if no results
        const recommendationsSection = document.getElementById('recommendations');
        const restaurantListDiv = recommendationsSection.querySelector('.restaurant-list');
        restaurantListDiv.innerHTML = '<p>No restaurants found for this search.</p>';
        // recommendationsSection.style.display = 'block'; // Or 'none' if you prefer to hide the section
        return;
      }

      // 1. Calculate scores and add to each place object
      results.forEach(place => {
        const rating = place.rating || 0;
        const reviews = place.user_ratings_total || 0;
        place.calculated_score = rating * reviews;
      });

      // 2. Sort places by calculated_score descending
      // Create a copy for sorting to preserve original order for map markers if needed,
      // though current map marker logic iterates after this and uses the sorted 'results'.
      // If map markers should show all unsorted results, use a copy for sorting:
      // const sortedResults = [...results].sort((a, b) => b.calculated_score - a.calculated_score);
      // For now, we'll sort in-place as map markers are added from the (now sorted) 'results' array.
      results.sort((a, b) => b.calculated_score - a.calculated_score);
      
      // 3. Get top 3 (or fewer if less than 3 results)
      const topRestaurants = results.slice(0, 3);

      // 4. Display these top 3 in the #recommendations section
      const recommendationsSection = document.getElementById('recommendations');
      const restaurantListDiv = recommendationsSection.querySelector('.restaurant-list');
      
      // Clear previous recommendations
      restaurantListDiv.innerHTML = ''; 

      if (topRestaurants.length > 0 && topRestaurants[0].calculated_score > 0) { // Only show if there are scored recommendations
        // recommendationsSection.style.display = 'block'; // Already visible by default from HTML/CSS changes

        topRestaurants.forEach(place => {
          if (place.calculated_score === 0 && topRestaurants.length === 1 && results.length > 3) {
            // If the only "top" restaurant has a score of 0, and there are other restaurants,
            // it might be better to show "no specific recommendations"
            // This check is a bit nuanced; adjust as needed.
            // For now, we proceed to show it if it's in topRestaurants.
          }

          const card = document.createElement('div');
          card.classList.add('restaurant-card');

          let photoUrl = 'https://via.placeholder.com/300x180.png?text=Restaurant+Image'; // Default placeholder
          if (place.photos && place.photos.length > 0) {
            photoUrl = place.photos[0].getUrl({'maxWidth': 300, 'maxHeight': 180});
          }

          card.innerHTML = `
              <img src="${photoUrl}" alt="${place.name || 'Restaurant image'}" class="restaurant-thumbnail">
              <div class="restaurant-info">
                  <h3 class="restaurant-name">${place.name || 'N/A'}</h3>
                  <p class="restaurant-address">${place.vicinity || 'Address not available'}</p>
                  <p class="restaurant-rating">Rating: ${place.rating || 'N/A'} (${place.user_ratings_total || 0} reviews)</p>
                  <!-- <p>Score: ${place.calculated_score.toFixed(2)}</p> -->
              </div>
          `;
          restaurantListDiv.appendChild(card);
        });
      } else {
        restaurantListDiv.innerHTML = '<p>No specific recommendations based on score, but check the map for nearby options!</p>';
      }

      // Map markers for ALL results (iterates over the potentially sorted 'results' array)
      results.forEach(place => {
        const marker = new google.maps.Marker({
          map: map,
          position: place.geometry.location,
          title: place.name
        });

        // Add an InfoWindow
        const infowindow = new google.maps.InfoWindow({
          content: `<strong>${place.name}</strong><br>
                        Rating: ${place.rating || 'N/A'}<br>
                        Address: ${place.vicinity || 'N/A'}`
        });

        marker.addListener('click', () => {
          // Close other open info windows
          markers.forEach(m => {
              if (m.infowindow) m.infowindow.close();
          });
          infowindow.open(map, marker);
          marker.infowindow = infowindow; // Store it to close later
        });
        markers.push(marker);
      });
    } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
      alert(`No restaurants found serving "${menuItem}" nearby.`);
    } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
      console.error("PlacesService failed: REQUEST_DENIED", status);
      alert("Failed to find restaurants: Request Denied. This often indicates a problem with the Google Maps API key, such as an invalid key, the Places API not being enabled for this key, or billing issues. Please check the Google Cloud Console and the browser's developer console for more details.");
    } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
      console.error("PlacesService failed: OVER_QUERY_LIMIT", status);
      alert("Failed to find restaurants: Over Query Limit. The application has exceeded its request quota for the Google Places API. Please check your API usage and quotas in the Google Cloud Console.");
    } else if (status === google.maps.places.PlacesServiceStatus.INVALID_REQUEST) {
      console.error("PlacesService failed: INVALID_REQUEST", status);
      alert("Failed to find restaurants: Invalid Request. This may be due to an issue with the search parameters or potentially related to API key configuration. Check the browser's developer console for more details.");
    } else {
      console.error("PlacesService failed with status:", status);
      alert("Failed to find restaurants due to an unexpected error. Please check the browser's developer console for more details and the specific status code.");
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
