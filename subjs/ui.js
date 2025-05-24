// ui.js

import { menuItems, saveMenus } from './core.js';
import { getUserLocation, searchNearbyRestaurants } from './location.js';

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const resultEl = document.getElementById("result");
const spinBtn = document.getElementById("spinBtn");
const menuInput = document.getElementById("menuInput");
const addMenuBtn = document.getElementById("addMenuBtn");
const removeMenuBtn = document.getElementById("removeMenuBtn");
const confettiContainer = document.getElementById("confetti");
const popupResult = document.getElementById("popupResult");
const tooltipEl = document.getElementById("menuTooltip");

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

menuInput.addEventListener("mouseenter", () => {
  tooltipEl.classList.add("show");
});
menuInput.addEventListener("mouseleave", () => {
  tooltipEl.classList.remove("show");
});
menuInput.addEventListener("focus", () => {
  tooltipEl.classList.remove("show");
});

spinBtn.addEventListener("click", spinWheel);
drawWheel();
