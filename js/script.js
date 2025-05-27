// 캔버스 요소와 2D 그리기 컨텍스트 가져오기
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

// 결과 출력 요소 및 버튼 요소 가져오기
const resultEl = document.getElementById("result");
const spinBtn = document.getElementById("spinBtn");
const menuInput = document.getElementById("menuInput");
const tooltip = document.getElementById("tooltip");

// 메뉴 입력창에 마우스 올렸을 때 툴팁 보이기
menuInput.addEventListener("mouseenter", () => {
  tooltip.style.display = "block";
});

// 메뉴 입력창에서 마우스 나갔을 때 툴팁 숨기기
menuInput.addEventListener("mouseleave", () => {
  tooltip.style.display = "none";
});

menuInput.addEventListener("click", () => {
  tooltipEl.classList.remove("show");
});

// 메뉴 추가/삭제 버튼과 결과 팝업, 폭죽 효과 영역 가져오기
const addMenuBtn = document.getElementById("addMenuBtn");
const removeMenuBtn = document.getElementById("removeMenuBtn");
const confettiContainer = document.getElementById("confetti");
const popupResult = document.getElementById("popupResult");

// 초기 메뉴 목록과 색상 설정
let menuItems = ['김밥', '라면', '슈니첼(독)', '된장찌개', '햄버거', '빠에야(스)', '스파게티', '뽈보(포)'];
const colors = ['#FFD700', '#FF8C00', '#FF69B4', '#ADFF2F', '#87CEEB', '#FFB6C1', '#98FB98', '#FFA07A'];

// 저장된 메뉴 불러오기 (로컬 스토리지 이용)
const savedMenus = localStorage.getItem("menuItems");
if (savedMenus) {
  try {
    const parsed = JSON.parse(savedMenus);
    if (Array.isArray(parsed) && parsed.length > 0) {
      menuItems = parsed;  // 저장된 값이 유효하면 덮어쓰기
    }
  } catch (e) {
    console.error("메뉴 불러오기 실패:", e);
  }
}

// 현재 메뉴 목록을 로컬 스토리지에 저장하는 함수
function saveMenus() {
  localStorage.setItem("menuItems", JSON.stringify(menuItems));
}

// 룰렛 회전 각도 및 상태 변수
let startAngle = 0;    // 시작 각도
let rotation = 0;      // 회전 누적 각도
let spinning = false;  // 회전 중 여부

// 룰렛 그리기 함수
function drawWheel() {
  try {
    // 기존 drawWheel 코드 내용
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
  } catch (e) {
    console.error("Error in drawWheel:", e);
    spinning = false; // drawWheel에서 에러 발생 시 스핀 상태 강제 종료
  }
}

// 룰렛 돌리기 함수
function spinWheel() {
  if (spinning) return; // 이미 돌고 있으면 중복 방지
  spinning = true;
  resultEl.textContent = "돌리는 중... 🎯";
  popupResult.style.display = "none";

  let duration = 4000; // 애니메이션 시간 (ms)
  let finalAngle = Math.random() * 2 * Math.PI; // 랜덤 최종 각도
  let totalRotation = (Math.PI * 10) + finalAngle; // 총 회전 각도 (10바퀴 + 랜덤)
  const start = performance.now(); // 시작 시간 기록

  // 애니메이션 함수
  function animate(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const easing = 1 - Math.pow(1 - progress, 3);

    rotation = totalRotation * easing;
    startAngle = rotation;

    // console.log("Animating, progress:", progress, "spinning:", spinning); // 상세 로그
    drawWheel(); // 현재 상태로 그리기

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      console.log("Animation finished, setting spinning = false. Current spinning state:", spinning);
      spinning = false; // 종료
      showResult(); // 결과 표시
      console.log("After showResult, spinning state:", spinning);
    }
  }

  requestAnimationFrame(animate); // 애니메이션 시작
}

// 룰렛 결과 확인 및 표시
function showResult() {
  try {
    console.log("showResult called. Current spinning state:", spinning);
    
    if (menuItems.length === 0) {
        resultEl.textContent = "메뉴가 없습니다!";
        window.selectedMenuItem = null; // 선택된 메뉴 없음
        if (typeof handleMenuSelectionForLocation === 'function') {
            handleMenuSelectionForLocation(); // 위치 처리 함수 호출 (메뉴 없음을 알리기 위해)
        }
        return;
    }

    const anglePerSlice = (2 * Math.PI) / menuItems.length;
    const pointerAngle = (3 * Math.PI / 2 - (rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const index = Math.floor(pointerAngle / anglePerSlice);

    const selected = menuItems[index];
    resultEl.textContent = `오늘은 이거 👉 ${selected}! 🍽️`; // 결과 출력
    window.selectedMenuItem = selected; // 전역 변수에 선택된 메뉴 저장

    console.log("Selected item:", selected, "at index:", index);

    launchConfetti(); // 폭죽
    showPopup(selected); // 팝업

    // 위치 정보 및 식당 검색 로직 호출
    if (typeof handleMenuSelectionForLocation === 'function') {
      handleMenuSelectionForLocation();
    } else {
      console.warn("handleMenuSelectionForLocation is not defined.");
    }
  } catch (e) {
    console.error("Error in showResult:", e);
    resultEl.textContent = "결과 표시에 오류가 발생했습니다.";
    // spinning = false; // showResult에서 에러 발생 시 스핀 상태는 이미 false일 것으로 예상되나, 안전장치로 추가 가능
  }
}

// 결과 팝업 보여주는 함수
function showPopup(text) {
  try {
    popupResult.textContent = `🎉 ${text} 🎉`;
    popupResult.style.display = "block";
    setTimeout(() => {
      popupResult.style.display = "none"; // 3초 후 자동 닫힘
    }, 3000);
  } catch (e) {
    console.error("Error in showPopup:", e);
  }
}

// 폭죽 효과 함수
function launchConfetti() {
  try {
    confettiContainer.innerHTML = ''; // 초기화
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
      confettiContainer.appendChild(confetti);

      // 일정 시간 후 제거
      setTimeout(() => confetti.remove(), 4000);
    }
  } catch (e) {
    console.error("Error in launchConfetti:", e);
  }
}

// 메뉴 추가 버튼 클릭 시
addMenuBtn.addEventListener("click", () => {
  const value = menuInput.value.trim();
  if (value && !menuItems.includes(value)) {
    menuItems.push(value);
    saveMenus();
    drawWheel();
    menuInput.value = "";
  }
});

// 메뉴 삭제 버튼 클릭 시
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

// 캔버스 클릭 시 조각 위에서 클릭하면 해당 메뉴 삭제
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - 200;
  const y = e.clientY - rect.top - 200;
  const distance = Math.sqrt(x * x + y * y);
  if (distance > 200) return; // 원 밖이면 무시

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

// 초기 룰렛 그리기
drawWheel();

// 돌리기 버튼 클릭 시 룰렛 실행
spinBtn.addEventListener("click", spinWheel);

// 툴팁 마우스 이벤트 (ID가 다른 요소용)
const menuInputEl = document.getElementById("menuInput");
const tooltipEl = document.getElementById("menuTooltip");

menuInputEl.addEventListener("mouseenter", () => {
  tooltipEl.classList.add("show");
});

menuInputEl.addEventListener("mouseleave", () => {
  tooltipEl.classList.remove("show");
});
