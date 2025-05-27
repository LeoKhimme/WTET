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
        return;
      }
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
    } else {
      console.error("PlacesService failed:", status);
      alert("Failed to find restaurants. Please check console for details.");
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
