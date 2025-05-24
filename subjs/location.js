// location.js

// ✅ Kakao REST API 키 (주의: KakaoAK 접두사 포함)
const KAKAO_API_KEY = "KakaoAK f088340c65795747ae786f047e25eb11";

let userLocation = null;

function getUserLocation(callback) {
  if (userLocation) {
    if (callback) callback(userLocation);
    return;
  }

  alert("📍 근처 식당 검색을 위하여 위치 정보를 요청합니다");

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        userLocation = { latitude, longitude };
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

function searchNearbyRestaurants(menuKeyword) {
  if (!userLocation) return;

  const { latitude, longitude } = userLocation;
  const query = encodeURIComponent(menuKeyword);
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${query}&x=${longitude}&y=${latitude}&radius=2000`;

  fetch(url, {
    headers: {
      Authorization: KAKAO_API_KEY
    }
  })
    .then(response => response.json())
    .then(data => {
      if (!data.documents || data.documents.length === 0) {
        alert("근처에서 해당 메뉴의 식당을 찾을 수 없습니다.");
        return;
      }

      const topResults = data.documents.slice(0, 5);
      const placeNames = topResults.map(place => `• ${place.place_name} (${place.road_address_name || place.address_name})`);
      alert(`🍽️ 추천 식당 목록:\n\n${placeNames.join("\n")}`);
    })
    .catch(error => {
      console.error("식당 검색 실패:", error);
    });
}
