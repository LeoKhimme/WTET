// core.js

const colors = ['#FFD700', '#FF8C00', '#FF69B4', '#ADFF2F', '#87CEEB', '#FFB6C1', '#98FB98', '#FFA07A'];

let menuItems = ['김밥', '라면', '슈니첼(독)', '된장찌개', '햄버거', '빠에야(스)', '스파게티', '뽈보(포)'];
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
