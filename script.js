const parade = document.querySelector("#parade");
const cakeButton = document.querySelector("#cakeButton");
const letterDialog = document.querySelector("#letterDialog");
const letterClose = document.querySelector("#letterClose");
const letterCopy = document.querySelector("#letterCopy");
const fallbackLetter = `糕糕祝South生日快乐，在新的一岁一切顺利！
和South的聊天给我带来很多放松和帮助，非常感谢您并希望和您一直是很好的朋友捏！`;

const characterOrder = [
  1, 2, 3, 4, 5,
  6, 7, 8, 9, 10,
  11, 1, 3, 5,
  7, 9, 11, 2, 4
];

const travelDuration = 22;

function createDancers() {
  const characters = shuffle([...characterOrder]);
  const laneSize = Math.ceil(characters.length / 2);

  characters.forEach((character, index) => {
    const dancer = document.createElement("div");
    const upright = document.createElement("div");
    const hop = document.createElement("div");
    const image = document.createElement("img");
    const isUpperLane = index < laneSize;
    const slot = isUpperLane ? index : index - laneSize;
    const laneCount = isUpperLane ? laneSize : characters.length - laneSize;
    const progress = (slot + randomBetween(-0.25, 0.25)) / laneCount;
    const travelDelay = -travelDuration * normalizeProgress(progress);
    const hopDuration = 0.92 + (index % 5) * 0.09;
    const flipDuration = (0.72 + (index % 4) * 0.08) * 3;

    dancer.className = `dancer ${isUpperLane ? "lane-upper" : "lane-lower"}`;
    upright.className = "dancer-upright";
    hop.className = "dancer-hop";

    dancer.style.setProperty("--travel-duration", `${travelDuration}s`);
    dancer.style.setProperty("--travel-delay", `${travelDelay.toFixed(2)}s`);
    dancer.style.setProperty("--travel-extra", `${Math.round(randomBetween(0, 92))}px`);
    dancer.style.setProperty("--lane-jitter", `${Math.round(randomBetween(-12, 12))}px`);
    dancer.style.setProperty("--hop-duration", `${hopDuration}s`);
    dancer.style.setProperty("--flip-duration", `${flipDuration}s`);
    dancer.style.setProperty("--hop-delay", `${index * -0.08}s`);
    dancer.style.setProperty("--flip-delay", `${index * -0.05}s`);
    dancer.style.setProperty("--hop-height", `${11 + (index % 4) * 2}%`);

    image.src = `assets/characters/${character}.png`;
    image.alt = "";
    image.draggable = false;

    hop.append(image);
    upright.append(hop);
    dancer.append(upright);
    parade.append(dancer);
  });

  createLaneHoppers();
}

function createLaneHoppers() {
  const hopperCount = Math.random() < 0.5 ? 3 : 4;

  for (let index = 0; index < hopperCount; index += 1) {
    createLaneHopper(index, hopperCount);
  }
}

function createLaneHopper(index, total) {
  const dancer = document.createElement("div");
  const body = document.createElement("div");
  const image = document.createElement("img");

  dancer.className = "lane-hopper";
  dancer.style.setProperty("--hopper-scale", randomBetween(0.92, 1.12).toFixed(2));
  dancer.dataset.groundOffset = randomBetween(-14, 18).toFixed(1);
  body.className = "hopper-body";

  image.src = "assets/characters/12.png";
  image.alt = "";
  image.draggable = false;

  body.append(image);
  dancer.append(body);
  parade.append(dancer);
  startLaneHopper(dancer, index, total);
}

function startLaneHopper(dancer, index, total) {
  const state = {
    x: 0,
    ground: 0,
    facing: 1,
    jump: null,
    pauseUntil: 0,
    speedFactor: randomBetween(0.82, 1.22)
  };

  function reset(now, spread = false) {
    const metrics = getLaneHopperMetrics(dancer);
    if (spread) {
      const slot = (index + randomBetween(0.15, 0.85)) / total;
      state.x = slot * metrics.paradeWidth - metrics.hopperWidth;
    } else {
      state.x = -metrics.hopperWidth - randomBetween(18, 120);
    }
    state.ground = metrics.ground;
    state.facing = 1;
    state.jump = null;
    state.pauseUntil = now + randomBetween(140, 980) / state.speedFactor;
    renderLaneHopper(dancer, state.x, state.ground - metrics.hopperHeight, state.facing, 0);
  }

  function tick(now) {
    const metrics = getLaneHopperMetrics(dancer);
    state.ground = metrics.ground;

    if (state.x > metrics.paradeWidth + metrics.hopperWidth + 20) {
      reset(now);
    }

    if (now >= state.pauseUntil) {
      if (!state.jump) {
        state.jump = {
          startTime: now,
          duration: randomBetween(480, 1080) / state.speedFactor,
          startX: state.x,
          distance: randomBetween(
            Math.max(44, metrics.paradeWidth * 0.08),
            Math.max(76, metrics.paradeWidth * 0.2)
          ),
          height: randomBetween(
            Math.max(32, metrics.hopperHeight * 0.85),
            Math.max(58, metrics.hopperHeight * 1.95)
          )
        };

        if (Math.random() < 0.38) {
          state.facing *= -1;
        }
      }

      const progress = Math.min(1, (now - state.jump.startTime) / state.jump.duration);
      const arc = 4 * progress * (1 - progress);
      const lean = (0.5 - progress) * 10;
      const x = state.jump.startX + state.jump.distance * progress;
      const y = state.ground - metrics.hopperHeight - state.jump.height * arc;

      state.x = x;
      renderLaneHopper(dancer, x, y, state.facing, lean);

      if (progress >= 1) {
        state.jump = null;
        state.pauseUntil = now + randomBetween(60, 380) / state.speedFactor;
      }
    } else {
      renderLaneHopper(dancer, state.x, state.ground - metrics.hopperHeight, state.facing, 0);
    }

    window.requestAnimationFrame(tick);
  }

  reset(performance.now(), true);
  window.requestAnimationFrame(tick);
}

function getLaneHopperMetrics(dancer) {
  const paradeRect = parade.getBoundingClientRect();
  const lowerTops = [...document.querySelectorAll(".lane-lower")].map(element => {
    return element.getBoundingClientRect().top - paradeRect.top;
  });
  const lowerTop = lowerTops.length ? Math.min(...lowerTops) : paradeRect.height * 0.72;
  const hopperWidth = dancer.offsetWidth || 54;
  const hopperHeight = dancer.offsetHeight || 54;
  const groundOffset = Number.parseFloat(dancer.dataset.groundOffset || "0");
  const ground = Math.min(paradeRect.height - 4, lowerTop + hopperHeight * 0.55 + groundOffset);

  return {
    ground,
    hopperHeight,
    hopperWidth,
    paradeWidth: paradeRect.width
  };
}

function renderLaneHopper(dancer, x, y, facing, lean) {
  const scale = Number.parseFloat(dancer.style.getPropertyValue("--hopper-scale")) || 1;
  dancer.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${(scale * facing).toFixed(2)}, ${scale.toFixed(2)}) rotate(${lean.toFixed(1)}deg)`;
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [items[index], items[target]] = [items[target], items[index]];
  }

  return items;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function normalizeProgress(value) {
  return ((value % 1) + 1) % 1;
}

async function loadLetter() {
  try {
    const response = await fetch("assets/letter.txt", { cache: "no-store" });
    if (!response.ok) throw new Error("Letter file unavailable");
    const text = (await response.text()).trim();
    letterCopy.textContent = text || fallbackLetter;
  } catch {
    letterCopy.textContent = fallbackLetter;
  }
}

async function openLetter() {
  await loadLetter();

  if (typeof letterDialog.showModal === "function") {
    letterDialog.showModal();
  } else {
    letterDialog.setAttribute("open", "");
  }
}

function closeLetter() {
  if (typeof letterDialog.close === "function") {
    letterDialog.close();
  } else {
    letterDialog.removeAttribute("open");
  }
}

createDancers();
cakeButton.addEventListener("click", openLetter);
letterClose.addEventListener("click", closeLetter);

letterDialog.addEventListener("click", event => {
  if (event.target === letterDialog) closeLetter();
});
