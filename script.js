// Classificador de talheres (Teachable Machine + TensorFlow.js)
// Cada classe prevista dispara automaticamente a exibição do prato correspondente.

const MODEL_URL = "./model/model.json";
const METADATA_URL = "./model/metadata.json";

// Limiar de confiança: só dispara ação acima disso, para evitar ruído/flicker.
const CONFIDENCE_THRESHOLD = 0.9;

// A classe precisa se manter acima do limiar por esse tempo (ms) antes de disparar a
// ação — evita que um único frame ruim (sem nenhum talher na cena) acione um prato.
const SUSTAIN_MS = 600;

// Quanto tempo (ms) o banner "Servido!" e o destaque do prato ficam visíveis.
const SERVING_DURATION_MS = 2800;

// As chaves devem bater com os labels treinados no Teachable Machine (case-insensitive).
const DISH_INFO = {
  garfo: {
    dish: "Macarrão",
    italian: "Pasta al Pomodoro",
    emoji: "🍝",
    particles: ["🍝", "🍅", "🌿", "⭐", "✨"],
  },
  faca: {
    dish: "Carne",
    italian: "Bistecca alla Fiorentina",
    emoji: "🥩",
    particles: ["🥩", "🔥", "⭐", "✨", "🌿"],
  },
  colher: {
    dish: "Sopa",
    italian: "Zuppa del Giorno",
    emoji: "🍲",
    particles: ["🍲", "♨️", "🌿", "⭐", "✨"],
  },
};

let model, webcam, rafId;
let cameraOn = false;
let lastTriggeredClass = null;
let pendingClass = null;
let pendingSince = 0;
let servingInProgress = false;
let servingTimeoutId = null;
const eatenCounts = { garfo: 0, faca: 0, colher: 0 };

const startBtn = document.getElementById("start-btn");
const btnLabel = document.getElementById("btn-label");
const cameraCard = document.getElementById("camera-card");
const webcamContainer = document.getElementById("webcam-container");
const statusMessage = document.getElementById("status-message");
const confidenceOffline = document.getElementById("confidence-offline");
const sessionTotal = document.getElementById("session-total");
const particlesLayer = document.getElementById("particles-layer");
const servedBanner = document.getElementById("served-banner");
const bannerEmoji = document.getElementById("banner-emoji");
const bannerSubtitle = document.getElementById("banner-subtitle");

const confidenceFills = new Map(
  Object.keys(DISH_INFO).map((key) => [key, document.getElementById(`fill-${key}`)])
);
const confidenceValues = new Map(
  Object.keys(DISH_INFO).map((key) => [key, document.getElementById(`value-${key}`)])
);
const dishCards = new Map(
  Array.from(document.querySelectorAll(".dish-card")).map((el) => [el.dataset.class, el])
);
const eatenBadges = new Map(
  Object.keys(DISH_INFO).map((key) => [key, document.getElementById(`count-${key}`)])
);

startBtn.addEventListener("click", toggleCamera);

async function toggleCamera() {
  if (cameraOn) {
    stopCamera();
  } else {
    await startCamera();
  }
}

async function startCamera() {
  startBtn.disabled = true;
  cameraCard.classList.remove("error");
  setStatusMessage("Carregando modelo...");

  try {
    if (!model) {
      model = await tmImage.load(MODEL_URL, METADATA_URL);
    }

    webcam = new tmImage.Webcam(480, 270, true);
    await webcam.setup();
    await webcam.play();

    webcamContainer.innerHTML = "";
    webcamContainer.appendChild(webcam.canvas);

    cameraOn = true;
    cameraCard.classList.add("active");
    confidenceOffline.hidden = true;
    btnLabel.textContent = "Desligar Câmera";
    startBtn.classList.add("on");
    setStatusMessage("aponte um talher para a câmera");

    rafId = window.requestAnimationFrame(loop);
  } catch (err) {
    console.error(err);
    cameraCard.classList.add("error");
    setStatusMessage("câmera não autorizada ou modelo indisponível");
  } finally {
    startBtn.disabled = false;
  }
}

function stopCamera() {
  if (rafId) window.cancelAnimationFrame(rafId);
  webcam?.stop();
  webcamContainer.innerHTML = "";

  cameraOn = false;
  lastTriggeredClass = null;
  pendingClass = null;
  cameraCard.classList.remove("active");
  confidenceOffline.hidden = false;
  btnLabel.textContent = "Ligar Câmera";
  startBtn.classList.remove("on");
  setStatusMessage("aguardando câmera...");

  resetConfidenceBars();
  resetDishes();
}

async function loop() {
  try {
    webcam.update();
    await predict();
  } catch (err) {
    // Um frame ruim não pode derrubar o loop inteiro (rAF nunca mais seria chamado).
    console.error("Erro ao processar frame:", err);
  }
  rafId = window.requestAnimationFrame(loop);
}

async function predict() {
  const predictions = await model.predict(webcam.canvas);

  let best = predictions[0];
  for (const p of predictions) {
    const key = p.className.trim().toLowerCase();
    const percent = Math.round(p.probability * 100);
    const isHigh = p.probability >= CONFIDENCE_THRESHOLD;

    const fill = confidenceFills.get(key);
    const value = confidenceValues.get(key);
    if (fill) {
      fill.style.width = `${percent}%`;
      fill.classList.toggle("high", isHigh);
    }
    if (value) {
      value.textContent = `${percent}%`;
      value.classList.toggle("high", isHigh);
    }

    if (p.probability > best.probability) best = p;
  }

  handlePrediction(best);
}

function handlePrediction(best) {
  const key = best.className.trim().toLowerCase();
  const info = DISH_INFO[key];

  if (!info || best.probability < CONFIDENCE_THRESHOLD) {
    pendingClass = null;
    if (!servingInProgress) lastTriggeredClass = null;
    return;
  }

  if (servingInProgress || lastTriggeredClass === key) return;

  const now = performance.now();
  if (pendingClass !== key) {
    pendingClass = key;
    pendingSince = now;
    return;
  }
  if (now - pendingSince < SUSTAIN_MS) return;

  pendingClass = null;
  lastTriggeredClass = key;
  serveDish(key, info);
}

function serveDish(key, info) {
  servingInProgress = true;

  eatenCounts[key] += 1;
  const badge = eatenBadges.get(key);
  if (badge) {
    badge.textContent = `${eatenCounts[key]}×`;
    bump(badge);
  }

  const total = eatenCounts.garfo + eatenCounts.faca + eatenCounts.colher;
  sessionTotal.textContent = `${total} prato${total === 1 ? "" : "s"}`;
  bump(sessionTotal);

  resetDishes();
  dishCards.get(key)?.classList.add("serving");

  showBanner(info);
  spawnParticles(info.particles);
  setStatusMessage(`✓ ${info.italian} sendo servido!`);

  clearTimeout(servingTimeoutId);
  servingTimeoutId = setTimeout(() => {
    servingInProgress = false;
    lastTriggeredClass = null;
    resetDishes();
    hideBanner();
    if (cameraOn) setStatusMessage("aponte um talher para a câmera");
  }, SERVING_DURATION_MS);
}

function showBanner(info) {
  bannerEmoji.textContent = info.emoji;
  bannerSubtitle.textContent = info.italian;
  servedBanner.hidden = false;
}

function hideBanner() {
  servedBanner.hidden = true;
}

function spawnParticles(emojiPool) {
  for (let i = 0; i < 14; i++) {
    const span = document.createElement("span");
    span.className = "particle";
    span.textContent = emojiPool[i % emojiPool.length];
    span.style.setProperty("--px", `${5 + Math.random() * 90}vw`);
    span.style.animationDelay = `${(Math.random() * 0.6).toFixed(2)}s`;
    particlesLayer.appendChild(span);
    span.addEventListener("animationend", () => span.remove());
  }
}

function resetDishes() {
  dishCards.forEach((card) => card.classList.remove("serving"));
}

function resetConfidenceBars() {
  confidenceFills.forEach((fill) => {
    if (!fill) return;
    fill.style.width = "0%";
    fill.classList.remove("high");
  });
  confidenceValues.forEach((value) => {
    if (!value) return;
    value.textContent = "0%";
    value.classList.remove("high");
  });
}

function bump(el) {
  el.classList.remove("pop");
  void el.offsetWidth; // reinicia a animação mesmo em toques seguidos
  el.classList.add("pop");
}

function setStatusMessage(text) {
  statusMessage.textContent = text;
}
