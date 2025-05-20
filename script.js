// script.js
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const resultEl = document.getElementById("result");
const spinBtn = document.getElementById("spinBtn");
const menuInput = document.getElementById("menuInput");
const addMenuBtn = document.getElementById("addMenuBtn");
const removeMenuBtn = document.getElementById("removeMenuBtn");

let menuItems = ['김밥', '라면', '돈까스', '된장찌개', '제육볶음', '비빔밥', '우동', '칼국수'];
const colors = ['#FFD700', '#FF8C00', '#FF69B4', '#ADFF2F', '#87CEEB', '#FFB6C1', '#98FB98', '#FFA07A'];

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
    ctx.textAlign = "right";
    ctx.fillStyle = "#000";
    ctx.font = "16px Arial";
    ctx.fillText(menuItems[i], 190, 10);
    ctx.restore();
  }
}

function spinWheel() {
  if (spinning) return;
  spinning = true;
  resultEl.textContent = "돌리는 중... 🎯";

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
}

function showResult() {
  const anglePerSlice = (2 * Math.PI) / menuItems.length;
  const pointerAngle = (3 * Math.PI / 2 - (rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const index = Math.floor(pointerAngle / anglePerSlice);
  const selected = menuItems[index];
  resultEl.textContent = `오늘의 점심은 👉 ${selected}! 🍽️`;
}

addMenuBtn.addEventListener("click", () => {
  const value = menuInput.value.trim();
  if (value && !menuItems.includes(value)) {
    menuItems.push(value);
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
    drawWheel();
    menuInput.value = "";
  }
});

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - 200;
  const y = e.clientY - rect.top - 200;

  const distance = Math.sqrt(x * x + y * y);
  if (distance > 200) return; // 바깥 클릭 무시

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
      drawWheel();
    }
  }
});

drawWheel();
spinBtn.addEventListener("click", spinWheel);
