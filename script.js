// script.js

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const resultEl = document.getElementById("result");
const spinBtn = document.getElementById("spinBtn");
const menuInput = document.getElementById("menuInput");
const tooltip = document.getElementById("tooltip");

menuInput.addEventListener("mouseenter", () => {
  tooltip.style.display = "block";
});

menuInput.addEventListener("mouseleave", () => {
  tooltip.style.display = "none";
});

const addMenuBtn = document.getElementById("addMenuBtn");
const removeMenuBtn = document.getElementById("removeMenuBtn");
const confettiContainer = document.getElementById("confetti");
const popupResult = document.getElementById("popupResult");

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

let menuItems = ['김밥', '라면', '슈니첼(독)', '된장찌개', '햄버거', '빠에야(스)', '스파게티', '뽈보(포)'];
const colors = ['#FFD700', '#FF8C00', '#FF69B4', '#ADFF2F', '#87CEEB', '#FFB6C1', '#98FB98', '#FFA07A'];

const savedMenus = localStorage.getItem("menuItems");
if (savedMenus) {
  try {
    const parsed = JSON.parse(savedMenus);
    if (Array.isArray(parsed) && parsed.length > 0) {
      menuItems = parsed;
    }
  } catch (e) {
    console.error("메뉴 불러오기 실패:", e);
  }
}

function saveMenus() {
  localStorage.setItem("menuItems", JSON.stringify(menuItems));
}

let startAngle = 0;
let rotation = 0;
let spinning = false;

function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const anglePerSlice = (2 * Math.PI) / menuItems.length;

  for (let i = 0; i < menuItems.length; i++) {
    const angle = startAngle + i * anglePerSlice;

    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.arc(200, 200, 200, angle, angle + anglePerSlice);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(200, 200);
    ctx.rotate(angle + anglePerSlice / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
    ctx.font = "16px Arial";
    ctx.fillText(menuItems[i], 130, 10);
    ctx.restore();
  }
}

function spinWheel() {
  if (spinning) return;
  spinning = true;
  resultEl.textContent = "돌리는 중... 🎯";
  popupResult.style.display = "none";

  let duration = 4000;
  let finalAngle = Math.random() * 2 * Math.PI;
  let totalRotation = (Math.PI * 10) + finalAngle;
  const start = performance.now();

  function animate(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const easing = 1 - Math.pow(1 - progress, 3);

    rotation = totalRotation * easing;
    startAngle = rotation;

    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      showResult();
    }
  }

  requestAnimationFrame(animate);

  getUserLocation((coords) => {
    console.log("식당 검색 준비:", coords);
  });
}

function showResult() {
  const anglePerSlice = (2 * Math.PI) / menuItems.length;
  const pointerAngle = (3 * Math.PI / 2 - (rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const index = Math.floor(pointerAngle / anglePerSlice);
  const selected = menuItems[index];
  resultEl.textContent = `오늘은 이거 👉 ${selected}! 🍽️`;
  launchConfetti();
  showPopup(selected);
  searchNearbyRestaurants(selected);
}

function showPopup(text) {
  popupResult.textContent = `🎉 ${text} 🎉`;
  popupResult.style.display = "block";
  setTimeout(() => {
    popupResult.style.display = "none";
  }, 3000);
}

function launchConfetti() {
  confettiContainer.innerHTML = '';
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
    confettiContainer.appendChild(confetti);
    setTimeout(() => confetti.remove(), 4000);
  }
}

addMenuBtn.addEventListener("click", () => {
  const value = menuInput.value.trim();
  if (value && !menuItems.includes(value)) {
    menuItems.push(value);
    saveMenus();
    drawWheel();
    menuInput.value = "";
  }
});

removeMenuBtn.addEventListener("click", () => {
  const value = menuInput.value.trim();
  if (!value) {
    alert("삭제할 메뉴를 입력하세요.");
    return;
  }
  const index = menuItems.indexOf(value);
  if (index === -1) {
    alert(`'${value}' 메뉴가 존재하지 않습니다.`);
    return;
  }
  const confirmDelete = confirm(`'${value}' 메뉴를 삭제할까요?`);
  if (confirmDelete) {
    menuItems.splice(index, 1);
    saveMenus();
    drawWheel();
    menuInput.value = "";
  }
});

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - 200;
  const y = e.clientY - rect.top - 200;
  const distance = Math.sqrt(x * x + y * y);
  if (distance > 200) return;

  const angleFromClick = Math.atan2(y, x);
  const correctedStartAngle = startAngle % (2 * Math.PI);
  const angle = (angleFromClick - correctedStartAngle + 2 * Math.PI) % (2 * Math.PI);
  const anglePerSlice = (2 * Math.PI) / menuItems.length;
  const index = Math.floor(angle / anglePerSlice);
  const item = menuItems[index];

  if (item) {
    const confirmDelete = confirm(`'${item}' 메뉴를 삭제할까요?`);
    if (confirmDelete) {
      menuItems.splice(index, 1);
      saveMenus();
      drawWheel();
    }
  }
});

drawWheel();
spinBtn.addEventListener("click", spinWheel);

const menuInputEl = document.getElementById("menuInput");
const tooltipEl = document.getElementById("menuTooltip");

menuInputEl.addEventListener("mouseenter", () => {
  tooltipEl.classList.add("show");
});

menuInputEl.addEventListener("mouseleave", () => {
  tooltipEl.classList.remove("show");
});

menuInputEl.addEventListener("focus", () => {
  tooltipEl.classList.remove("show");
});

function searchNearbyRestaurants(menuKeyword) {
  if (!userLocation) {
    return;
  }

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
