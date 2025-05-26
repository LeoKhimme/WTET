// 위치 정보 요청 및 룰렛 기능을 위한 스크립트

// 위치 정보를 저장할 변수
let userLocation = null;

// 사용자 위치 요청 함수
function getUserLocation(callback) {
  // 이미 수신된 위치가 있으면 재요청 안 함
  if (userLocation) {
    console.log("✅ 위치 정보는 이미 수신됨:", userLocation);
    if (callback) callback(userLocation);
    return;
  }

  // 위치 기능이 있을 경우 요청
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        userLocation = { lat: latitude, lng: longitude };  // 위치 저장

        console.log("📍 현재 위치:", latitude, longitude);
        alert("✅ 위치 정보를 받았습니다!");
        if (callback) callback(userLocation);  // 콜백 실행
      },
      (error) => {
        console.error("⚠️ 위치 정보를 가져올 수 없습니다.", error);
        alert("위치 접근 권한이 필요합니다.");
      }
    );
  } else {
    alert("이 브라우저는 위치 정보를 지원하지 않습니다.");
  }
}

// 룰렛 버튼 클릭 시 위치도 요청 (단 한 번만 실행)
spinBtn.addEventListener("click", () => {
  spinWheel();

  getUserLocation((coords) => {
    console.log("식당 검색 준비:", coords);
    // 향후 API 연동에 사용 예정
  });
});

// (중복된 getUserLocation 재정의 — 동일 기능)
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
