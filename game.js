(function () {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const IS_TOUCH_DEVICE = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
  const IS_ANDROID = /Android/i.test(navigator.userAgent);
  const MAX_PARTICLES = IS_TOUCH_DEVICE ? 160 : 320;
  const MOBILE_JUMP_DEBOUNCE_MS = 110;

  const ui = {
    gameStage: document.querySelector(".game-stage"),
    startScreen: document.getElementById("start-screen"),
    gameOverScreen: document.getElementById("game-over-screen"),
    playButton: document.getElementById("play-button"),
    retryButton: document.getElementById("retry-button"),
    shareButton: document.getElementById("share-button"),
    score: document.getElementById("score"),
    highScore: document.getElementById("high-score"),
    finalScore: document.getElementById("final-score"),
    bestScore: document.getElementById("best-score"),
    powerLabel: document.getElementById("powerup-label"),
    superrunTimer: document.getElementById("superrun-timer"),
    superrunTimerValue: document.getElementById("superrun-timer-value"),
    shieldBanner: document.getElementById("shield-banner"),
    pauseBadge: document.getElementById("pause-badge"),
    jumpTouch: document.getElementById("jump-touch"),
  };

  const TREX_SVG = `<svg width="183" height="227" viewBox="0 0 183 227" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="139.5" y="47" width="4" height="31" fill="white"/><rect x="157.5" y="47" width="4" height="31" fill="white"/><rect x="145.5" y="47" width="4" height="31" fill="white"/><rect x="139.5" y="84" width="4" height="13" fill="white"/><rect x="151.5" y="47" width="4" height="31" fill="white"/><rect x="157.5" y="84" width="4" height="13" fill="white"/><rect x="145.5" y="84" width="4" height="13" fill="white"/><rect x="163.5" y="47" width="4" height="31" fill="white"/><rect x="151.5" y="84" width="4" height="13" fill="white"/><rect x="169.5" y="47" width="4" height="31" fill="white"/><rect x="176.5" y="47" width="4" height="31" fill="white"/><rect x="129" width="3" height="7" fill="white"/><path d="M35 190.5H45V226.5H62.5V217H53.5V208H62.5V199H71.5V189H81V198.5H89.5V226H110.5V217H101.5V181H110.5V171.5H119V155H129V125H138.5V133.5H145.5V115H128V97.5H164V88.5H136V66H182.5V37H173.5V28H101.5V38.5H89.5V97.5H81V106H68.5V115H53.5V125H45V133.5H27V125H17.5V115H8.5V97.5H0V151.5H9.5V159H17.5V172.5H27V181H35V190.5Z" fill="#525252"/><rect x="114.5" y="41" width="12" height="31" fill="white"/><rect x="143.5" y="88" width="8" height="6" fill="#FF4747"/><rect x="150.5" y="88" width="4" height="23" fill="#FF4747"/><path d="M114.5 21C114.5 12.1634 121.663 5 130.5 5H131.5C140.337 5 147.5 12.1634 147.5 21H114.5Z" fill="#F4D93B"/><rect x="117.5" width="12" height="2" fill="#3E81BC"/><rect x="131.5" width="12" height="2" fill="#3E81BC"/><mask id="mask0_19705_10445" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="114" y="5" width="34" height="16"><path d="M114.5 21C114.5 12.1634 121.663 5 130.5 5H131.5C140.337 5 147.5 12.1634 147.5 21H114.5Z" fill="#F7FF00"/></mask><g mask="url(#mask0_19705_10445)"><path d="M122 20.5C122 16.8333 123.6 8.3 130 3.5H119C116.833 5.16667 112.4 8.6 112 9C111.6 9.4 110.833 17.1667 110.5 21L122 20.5Z" fill="#3E81BC"/><path d="M137.5 20.5C137.5 16.8333 135.9 8.3 129.5 3.5H140.5C142.667 5.16667 147.1 8.6 147.5 9C147.9 9.4 148.667 17.1667 149 21L137.5 20.5Z" fill="#FF3535"/></g><rect x="112.5" y="20" width="55" height="2" fill="white"/><rect opacity="0.11" x="75.5" y="113" width="21" height="12" fill="#D9D9D9"/><rect opacity="0.11" x="56.5" y="130" width="21" height="25" fill="#D9D9D9"/><rect opacity="0.11" x="85.5" y="138" width="21" height="10" fill="#D9D9D9"/><rect opacity="0.11" x="25.5" y="143" width="21" height="10" fill="#D9D9D9"/><rect x="119.5" y="47" width="4" height="13" fill="#FF4747"/></svg>`;

  // Central gameplay tuning lives here so balancing remains easy to edit.
  const CONFIG = {
    gravity: 2400,
    jumpVelocity: -980,
    doubleJumpVelocity: -900,
    slideDuration: 0.68,
    groundY: 590,
    startSpeed: 430,
    maxSpeed: 1020,
    acceleration: 10,
    skateboardBoost: 120,
    shieldSpeedBoost: 140,
    shieldAccelerationBoost: 1.2,
    superRunThreshold: 6,
    superRunShieldDuration: 5.5,
    nitroTrexGapBonus: 110,
    nitroDuration: 3,
    trexBaseGap: 455,
    trexCatchupRate: 2.1,
    trexDangerGap: 170,
    pickupRadius: 24,
    pickupHeights: [142, 196, 238],
    obstacleDifficultyScore: 450,
    obstacleRepeatTolerance: 2,
    obstacleMidOffset: { easy: 98, hard: 64 },
    obstacleHighOffset: { easy: 182, hard: 132 },
    laserStartX: 980,
    laserLockDuration: 0.8,
    laserFireDuration: 0.32,
    laserAimEase: 9,
    cctvLaserStartX: 1040,
    cctvLaserLockDuration: 0.65,
    cctvLaserFireDuration: 0.24,
    cctvLaserAimEase: 11,
    cctvLaserMinArmGap: 150,
    cctvLaserCancelGap: 105,
    laserReadyGroundTime: 0.22,
    obstacleInterval: [1.05, 1.9],
    laserFollowupSpacing: 260,
    pickupInterval: [0.6, 1.2],
    comboTimeout: 2.2,
    meterPerPickup: 18,
    passiveScoreRate: 12,
    powerupDuration: 5.5,
    shieldHits: 1,
    deathDuration: 1.15,
    airDeathFreezeDuration: 1,
    groundDeathFreezeDuration: 1,
    trexSmashBurst: 30,
    trexGroundBurst: 16,
  };

  // Shield is now reserved for combo streak rewards only.
  const POWERUPS = [];

  const OBSTACLE_TYPES = [
    { key: "tvBot", width: 138, height: 92, lane: "ground" },
    { key: "laserMachine", width: 30, height: 116, lane: "ground" },
    { key: "surveillanceBot", width: 118, height: 84, lane: "ground" },
    { key: "aiBarrier", width: 132, height: 88, lane: "ground" },
    { key: "aiStandProp", width: 135, height: 172, lane: "ground" },
    { key: "cctvBot", width: 126, height: 118, lane: "mid" },
  ];

  const state = {
    running: false,
    paused: false,
    over: false,
    dying: false,
    pendingStart: false,
    orientationHold: false,
    score: 0,
    highScore: Number(localStorage.getItem("ducky-dash-high-score") || 0),
    distance: 0,
    speed: CONFIG.startSpeed,
    combo: 0,
    comboTimer: 0,
    meter: 0,
    activePower: null,
    powerTimer: 0,
    shieldCharges: 0,
    nextPowerIndex: 0,
    screenShake: 0,
    flash: 0,
    dangerPulse: 0,
    obstacleTimer: 0.8,
    pickupTimer: 0.45,
    time: 0,
    bitePhase: 0,
    deathTimer: 0,
    skateboardActive: false,
    superRunActive: false,
    superRunShieldTimer: 0,
    nitroActive: false,
    nitroTimer: 0,
    biteLock: 0,
    recentObstacleKeys: [],
    obstaclesSpawned: 0,
    groundedTime: 0,
    shieldBannerTimer: 0,
    shieldBannerShown: false,
    lastFrame: 0,
  };

  const player = {
    x: 268,
    y: CONFIG.groundY,
    width: 68,
    height: 54,
    baseHeight: 54,
    slideHeight: 30,
    velocityY: 0,
    onGround: true,
    sliding: false,
    slideTimer: 0,
    jumpsRemaining: 2,
    doubleJumping: false,
    doubleJumpTimer: 0,
    deathStartedOnGround: false,
    deathFreezeOffsetX: 0,
    deathFreezeTimer: 0,
    deathFreezeY: CONFIG.groundY,
    deathFreezeRotation: 0,
    rotation: 0,
    biteOffsetX: 0,
    biteOffsetY: 0,
  };

  const trex = {
    x: 0,
    width: 170,
    height: 152,
    deathX: 0,
  };

  const obstacles = [];
  const pickups = [];
  const particles = [];
  let audioContext = null;
  let lastJumpInputAt = 0;
  const trexFrames = ["trex-1.png", "trex-2.png", "trex-3.png", "trex-4.png", "trex-5.png", "trex-6.png"].map((src) => {
    const image = new Image();
    image.src = src;
    return image;
  });
  const happyTrexImage = new Image();
  happyTrexImage.src = "happy-rex.png";
  const duckFrames = ["frame-1.png", "frame-2.png", "frame-3.png", "frame-4.png"].map((src) => {
    const image = new Image();
    image.src = src;
    return image;
  });
  const duckJumpFrame = new Image();
  duckJumpFrame.src = "jump-1.png";
  const duckJumpSkateFrame = new Image();
  duckJumpSkateFrame.src = "jump-skate.png";
  const duckAirDeathFrame = new Image();
  duckAirDeathFrame.src = "air-death.png";
  const duckGroundDeathFrame = new Image();
  duckGroundDeathFrame.src = "death-ground.png";
  const duckDoubleJumpFrames = ["double-jump-1.png", "double-jump-2.png", "double-jump-3.png", "double-jump-4.png"].map((src) => {
    const image = new Image();
    image.src = src;
    return image;
  });
  const duckSkateFrames = ["skate-1.png", "skate-2.png", "skate-3.png", "skate-4.png", "skate-5.png", "skate-6.png"].map((src) => {
    const image = new Image();
    image.src = src;
    return image;
  });
  const duckSuperRunFrames = ["superrun-1.png", "superrun-2.png", "superrun-3.png"].map((src) => {
    const image = new Image();
    image.src = src;
    return image;
  });
  const tvBotFrames = ["tvbot-1.png", "tvbot-2.png", "tvbot-3.png", "tvbot-4.png", "tvbot-5.png"].map((src) => {
    const image = new Image();
    image.src = src;
    return image;
  });
  const botSpiderFrames = ["bot-spider-1.png", "bot-spider-2.png", "bot-spider-3.png", "bot-spider-4.png", "bot-spider-5.png", "bot-spider-6.png"].map((src) => {
    const image = new Image();
    image.src = src;
    return image;
  });
  const cctvBotFrames = ["cctv-bot-1.png", "cctv-bot-2.png", "cctv-bot-3.png", "cctv-bot-4.png", "cctv-bot-5.png"].map((src) => {
    const image = new Image();
    image.src = src;
    return image;
  });
  const aiBarrierImage = new Image();
  aiBarrierImage.src = "ai-obstacle.png";
  const aiStandPropImage = new Image();
  aiStandPropImage.src = "ai-stand-prop.png";
  const cloudPropImages = ["cloud-prop-1.png", "cloud-prop-2.png"].map((src) => {
    const image = new Image();
    image.src = src;
    return image;
  });
  const bgPropImages = ["bg-prop-1.png", "bg-prop-2.png", "bg-prop-3.png"].map((src) => {
    const image = new Image();
    image.src = src;
    return image;
  });
  const cloudBits = createCloudBits();
  const skylineBits = createSkyline();
  const rewardImage = new Image();
  rewardImage.src = "reward.png";

  function createCloudBits() {
    let offsetX = -180;
    return Array.from({ length: 6 }, () => {
      offsetX += randomRange(180, 320);
      return {
        x: offsetX,
        size: randomRange(101, 165),
        depth: randomRange(0.05, 0.12),
        imageIndex: Math.floor(Math.random() * cloudPropImages.length),
        y: randomRange(54, 154),
        opacity: randomRange(0.28, 0.46),
      };
    });
  }

  function createSkyline() {
    let offsetX = -120;
    return Array.from({ length: 8 }, () => {
      offsetX += randomRange(180, 320);
      return {
        x: offsetX,
        size: randomRange(132, 210),
        depth: randomRange(0.16, 0.32),
        imageIndex: Math.floor(Math.random() * bgPropImages.length),
        yOffset: randomRange(-4, 24),
        opacity: randomRange(0.2, 0.34),
      };
    });
  }

  function createSvgImage(svgMarkup) {
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
    return image;
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function playTone(type, frequency, duration, volume) {
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.value = volume;
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      const now = audioContext.currentTime;
      oscillator.start(now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.stop(now + duration);
    } catch (error) {
      // Sound is optional, so we fail quietly if the browser blocks it.
    }
  }

  function resizeCanvas() {
    const maxRatio = IS_TOUCH_DEVICE ? 1.15 : 1.6;
    const ratio = Math.min(window.devicePixelRatio || 1, maxRatio);
    canvas.width = 1280 * ratio;
    canvas.height = 720 * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function updateViewportMetrics() {
    const viewport = window.visualViewport;
    const width = viewport ? viewport.width : window.innerWidth;
    const height = viewport ? viewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--app-vw", `${width}px`);
    document.documentElement.style.setProperty("--app-vh", `${height}px`);
    document.documentElement.classList.toggle("is-android", IS_ANDROID);
    document.documentElement.classList.toggle("is-mobile-portrait", IS_TOUCH_DEVICE && width < height);
    document.documentElement.classList.toggle("is-mobile-landscape", IS_TOUCH_DEVICE && width >= height);
  }

  function isLandscapeViewport() {
    const viewport = window.visualViewport;
    const width = viewport ? viewport.width : window.innerWidth;
    const height = viewport ? viewport.height : window.innerHeight;
    return width >= height;
  }

  function setOverlayVisibility(element, visible) {
    element.classList.toggle("overlay-visible", visible);
  }

  function updateRotatePromptState() {
    ui.gameStage.classList.toggle(
      "show-rotate-notice",
      IS_TOUCH_DEVICE && !state.over && !state.dying && (state.pendingStart || state.orientationHold)
    );
  }

  function syncOrientationState() {
    if (!IS_TOUCH_DEVICE || state.over || state.dying) {
      state.orientationHold = false;
      updateRotatePromptState();
      return;
    }

    const landscape = isLandscapeViewport();

    if (state.pendingStart && landscape) {
      startGame();
      return;
    }

    if (state.running) {
      state.orientationHold = !landscape;
      state.paused = state.orientationHold;
      ui.pauseBadge.style.display = state.orientationHold ? "none" : (state.paused ? "block" : "none");
    } else {
      state.orientationHold = false;
    }

    updateRotatePromptState();
  }

  function resetGame() {
    state.running = true;
    state.paused = false;
    state.over = false;
    state.dying = false;
    state.pendingStart = false;
    state.orientationHold = false;
    state.score = 0;
    state.distance = 0;
    state.speed = CONFIG.startSpeed;
    state.combo = 0;
    state.comboTimer = 0;
    state.meter = 0;
    state.activePower = null;
    state.powerTimer = 0;
    state.shieldCharges = 0;
    state.nextPowerIndex = 0;
    state.screenShake = 0;
    state.flash = 0;
    state.dangerPulse = 0;
    state.obstacleTimer = 1;
    state.pickupTimer = 0.6;
    state.time = 0;
    state.bitePhase = 0;
    state.deathTimer = 0;
    state.skateboardActive = false;
    state.superRunActive = false;
    state.superRunShieldTimer = 0;
    state.nitroActive = false;
    state.nitroTimer = 0;
    state.biteLock = 0;
    state.recentObstacleKeys = [];
    state.obstaclesSpawned = 0;
    state.groundedTime = 1;
    state.shieldBannerTimer = 0;
    state.shieldBannerShown = false;

    player.y = CONFIG.groundY;
    player.height = player.baseHeight;
    player.velocityY = 0;
    player.onGround = true;
    player.sliding = false;
    player.slideTimer = 0;
    player.jumpsRemaining = 2;
    player.doubleJumping = false;
    player.doubleJumpTimer = 0;
    player.deathStartedOnGround = false;
    player.deathFreezeOffsetX = 0;
    player.deathFreezeTimer = 0;
    player.deathFreezeY = CONFIG.groundY;
    player.deathFreezeRotation = 0;
    player.rotation = 0;
    player.biteOffsetX = 0;
    player.biteOffsetY = 0;

    trex.x = -20;
    trex.deathX = -20;
    obstacles.length = 0;
    pickups.length = 0;
    particles.length = 0;

    setOverlayVisibility(ui.startScreen, false);
    setOverlayVisibility(ui.gameOverScreen, false);
    ui.pauseBadge.style.display = "none";
    if (ui.shieldBanner) {
      ui.shieldBanner.classList.remove("is-visible");
    }
    updateHud();
    updateRotatePromptState();
  }

  function startGame() {
    if (IS_TOUCH_DEVICE && !isLandscapeViewport()) {
      state.pendingStart = true;
      setOverlayVisibility(ui.startScreen, false);
      setOverlayVisibility(ui.gameOverScreen, false);
      updateRotatePromptState();
      return;
    }

    if (!state.running) {
      resetGame();
    }
    state.orientationHold = false;
    updateRotatePromptState();
  }

  async function shareResult() {
    const text = `I scored ${state.score} in Ducky Dash. Best run: ${state.highScore}.`;
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Ducky Dash",
          text,
          url,
        });
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(`${text} ${url}`);
        if (ui.shareButton) {
          const previous = ui.shareButton.textContent;
          ui.shareButton.textContent = "Copied";
          window.setTimeout(() => {
            ui.shareButton.textContent = previous;
          }, 1800);
        }
      }
    } catch (error) {
      // Ignore cancelled shares and clipboard failures.
    }
  }

  function finalizeGameOver() {
    if (state.over) {
      return;
    }
    state.running = false;
    state.over = true;
    state.dying = false;
    state.pendingStart = false;
    state.orientationHold = false;
    state.highScore = Math.max(state.highScore, state.score);
    localStorage.setItem("ducky-dash-high-score", String(state.highScore));
    ui.finalScore.textContent = String(state.score);
    ui.bestScore.textContent = String(state.highScore);
    setOverlayVisibility(ui.gameOverScreen, true);
    updateRotatePromptState();
  }

  function startDeath() {
    if (state.dying || state.over) {
      return;
    }
    state.running = false;
    state.dying = true;
    state.pendingStart = false;
    state.orientationHold = false;
    updateRotatePromptState();
    player.deathStartedOnGround = player.onGround;
    trex.deathX = trex.x;
    player.deathFreezeOffsetX = player.onGround ? 10 : 0;
    player.deathFreezeTimer = player.onGround
      ? CONFIG.groundDeathFreezeDuration
      : CONFIG.airDeathFreezeDuration;
    player.deathFreezeY = player.y;
    player.deathFreezeRotation = player.rotation;
    state.deathTimer = CONFIG.deathDuration + player.deathFreezeTimer;
    state.screenShake = 14;
    player.velocityY = Math.min(player.velocityY, -320);
    playTone("sawtooth", 130, 0.4, 0.08);
  }

  function endGame() {
    startDeath();
  }

  function togglePause() {
    if (!state.running || state.over) {
      return;
    }
    state.paused = !state.paused;
    ui.pauseBadge.style.display = state.paused ? "block" : "none";
  }

  function jump() {
    if (IS_TOUCH_DEVICE) {
      const now = performance.now();
      if (now - lastJumpInputAt < MOBILE_JUMP_DEBOUNCE_MS) {
        return;
      }
      lastJumpInputAt = now;
    }

    if ((!state.running && !state.dying) || state.paused || state.over || state.dying) {
      return;
    }
    if (player.jumpsRemaining <= 0) {
      return;
    }

    const isSecondJump = !player.onGround && player.jumpsRemaining === 1;
    player.velocityY = isSecondJump ? CONFIG.doubleJumpVelocity : CONFIG.jumpVelocity;
    player.onGround = false;
    player.sliding = false;
    player.height = player.baseHeight;
    player.jumpsRemaining -= 1;
    player.doubleJumping = isSecondJump;
    player.doubleJumpTimer = isSecondJump ? 0 : player.doubleJumpTimer;
    player.rotation = isSecondJump ? -0.15 : 0;
    playTone("triangle", isSecondJump ? 660 : 520, 0.11, 0.045);
  }

  function spawnObstacle() {
    const difficulty = Math.min(1, state.score / CONFIG.obstacleDifficultyScore);
    let pool = [...OBSTACLE_TYPES];
    if (difficulty > 0.18) {
      pool = pool.concat(OBSTACLE_TYPES.filter((type) => type.key === "surveillanceBot"));
    }
    if (difficulty > 0.28) {
      pool = pool.concat(OBSTACLE_TYPES.filter((type) => type.key === "aiBarrier" || type.key === "cctvBot"));
    }
    if (difficulty > 0.32) {
      pool = pool.concat(OBSTACLE_TYPES.filter((type) => type.key === "aiStandProp"));
    }
    if (difficulty > 0.42) {
      pool = pool.concat(OBSTACLE_TYPES.filter((type) => type.key === "aiStandProp"));
    }
    if (difficulty > 0.52) {
      pool = pool.concat(OBSTACLE_TYPES.filter((type) => type.key === "laserMachine"));
    }
    if (difficulty > 0.62) {
      pool = pool.concat(OBSTACLE_TYPES.filter((type) => type.key === "surveillanceBot"));
    }

    let availablePool = pool;
    const recentKeys = state.recentObstacleKeys.slice(-CONFIG.obstacleRepeatTolerance);
    if (pool.length > 1 && recentKeys.length > 0) {
      const filteredPool = pool.filter((type) => !recentKeys.includes(type.key));
      if (filteredPool.length > 0) {
        availablePool = filteredPool;
      }
    }

    if (state.obstaclesSpawned === 0) {
      const safeOpeningPool = availablePool.filter((type) => type.key !== "cctvBot" && type.key !== "laserMachine");
      if (safeOpeningPool.length > 0) {
        availablePool = safeOpeningPool;
      }
    }

    const type = availablePool[Math.floor(Math.random() * availablePool.length)];
    const previousObstacle = obstacles[obstacles.length - 1];
    const obstacle = {
      ...type,
      x: 1360,
      y: CONFIG.groundY - type.height,
      pulse: Math.random() * Math.PI * 2,
      arming: false,
      charge: 0,
      firing: false,
      hasFired: false,
      fireTimer: 0,
      targetY: CONFIG.groundY - 96,
      lockedY: CONFIG.groundY - 96,
      variantIndex: 0,
    };

    if (type.lane === "mid") {
      const midOffset = CONFIG.obstacleMidOffset.easy - ((CONFIG.obstacleMidOffset.easy - CONFIG.obstacleMidOffset.hard) * difficulty);
      obstacle.y = CONFIG.groundY - type.height - midOffset;
    }
    if (type.lane === "high") {
      const highOffset = CONFIG.obstacleHighOffset.easy - ((CONFIG.obstacleHighOffset.easy - CONFIG.obstacleHighOffset.hard) * difficulty);
      obstacle.y = CONFIG.groundY - type.height - highOffset;
    }

    const followsStaticObstacle = previousObstacle && (
      previousObstacle.key === "tvBot" ||
      previousObstacle.key === "surveillanceBot" ||
      previousObstacle.key === "aiBarrier" ||
      previousObstacle.key === "aiStandProp"
    );
    const isLaserObstacle = type.key === "laserMachine" || type.key === "cctvBot";
    if (followsStaticObstacle && isLaserObstacle) {
      const minimumSpawnX = previousObstacle.x + previousObstacle.width + CONFIG.laserFollowupSpacing;
      obstacle.x = Math.max(obstacle.x, minimumSpawnX);
    }

    obstacles.push(obstacle);
    state.recentObstacleKeys.push(type.key);
    if (state.recentObstacleKeys.length > CONFIG.obstacleRepeatTolerance) {
      state.recentObstacleKeys.shift();
    }
    state.obstaclesSpawned += 1;
    state.obstacleTimer = randomRange(CONFIG.obstacleInterval[0], CONFIG.obstacleInterval[1]) / (state.speed / 440);
  }

  function spawnPickup() {
    const pickupHeight = CONFIG.pickupHeights[Math.floor(Math.random() * CONFIG.pickupHeights.length)];
    pickups.push({
      x: 1360,
      y: CONFIG.groundY - pickupHeight,
      bob: Math.random() * Math.PI * 2,
      radius: CONFIG.pickupRadius,
    });
    state.pickupTimer = randomRange(CONFIG.pickupInterval[0], CONFIG.pickupInterval[1]);
  }

  function emitBurst(x, y, color, amount) {
    for (let index = 0; index < amount; index += 1) {
      if (particles.length >= MAX_PARTICLES) {
        break;
      }
      particles.push({
        x,
        y,
        dx: randomRange(-150, 150),
        dy: randomRange(-220, -50),
        life: randomRange(0.35, 0.8),
        color,
      });
    }
  }

  function activatePowerup(key) {
    state.activePower = key;
    state.powerTimer = CONFIG.powerupDuration;

    state.shieldCharges = CONFIG.shieldHits;
    ui.powerLabel.textContent = "Shield online";
    playTone("sine", 740, 0.18, 0.06);

    state.flash = 0.25;
    showShieldBanner();
  }

  function showShieldBanner() {
    if (state.shieldBannerShown) {
      return;
    }
    state.shieldBannerShown = true;
    state.shieldBannerTimer = 3;
    if (!ui.shieldBanner) {
      return;
    }
    ui.shieldBanner.classList.remove("is-visible");
    void ui.shieldBanner.offsetWidth;
    ui.shieldBanner.classList.add("is-visible");
  }

  function maybeGrantPowerup() {
    if (!POWERUPS.length) {
      return;
    }
    const nextPower = POWERUPS[state.nextPowerIndex];
    if (!nextPower || state.meter < nextPower.threshold) {
      return;
    }
    state.meter = 0;
    activatePowerup(nextPower.key);
    state.nextPowerIndex = (state.nextPowerIndex + 1) % POWERUPS.length;
  }

  function collectPickup(index) {
    pickups.splice(index, 1);
    state.comboTimer = CONFIG.comboTimeout;
    state.combo += 1;
    const comboBonus = Math.min(state.combo - 1, 6);
    state.score += 10 + comboBonus * 4;
    state.meter = Math.min(100, state.meter + CONFIG.meterPerPickup);
    state.flash = 0.16;
    emitBurst(player.x + 56, player.y - 24, "#17c964", 8);
    playTone("sine", 860, 0.09, 0.035);
    maybeGrantPowerup();
  }

  function hitObstacle(index, source = "body") {
    const obstacle = obstacles[index];

    if (source === "body" && state.skateboardActive && !player.onGround) {
      obstacles.splice(index, 1);
      emitBurst(obstacle.x + obstacle.width * 0.5, obstacle.y + obstacle.height * 0.5, "#f5e2a6", 22);
      emitBurst(obstacle.x + obstacle.width * 0.5, obstacle.y + obstacle.height * 0.5, "#7f8f88", 10);
      state.flash = 0.18;
      state.screenShake = Math.max(state.screenShake, 6);
      playTone("square", 260, 0.1, 0.05);
      return;
    }

    if (state.superRunShieldTimer > 0) {
      obstacles.splice(index, 1);
      emitBurst(obstacle.x, obstacle.y, "#96f7c3", 18);
      emitBurst(obstacle.x + obstacle.width * 0.5, obstacle.y + obstacle.height * 0.5, "#ffd27c", 6);
      state.flash = 0.26;
      state.screenShake = 8;
      playTone("triangle", 220, 0.14, 0.08);
      return;
    }

    if (state.activePower === "shield" && state.shieldCharges > 0) {
      state.shieldCharges -= 1;
      obstacles.splice(index, 1);
      emitBurst(obstacle.x, obstacle.y, "#96f7c3", 10);
      state.flash = 0.3;
      state.screenShake = 10;
      playTone("triangle", 190, 0.15, 0.08);
      if (state.shieldCharges <= 0) {
        state.activePower = null;
        ui.powerLabel.textContent = "Shield spent";
      }
      return;
    }

    startDeath();
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y;
  }

  function insetRect(obstacle, insetX, insetTop, insetBottom = insetTop) {
    return {
      x: obstacle.x + insetX,
      y: obstacle.y + insetTop,
      width: Math.max(18, obstacle.width - insetX * 2),
      height: Math.max(18, obstacle.height - insetTop - insetBottom),
    };
  }

  function getObstacleHitbox(obstacle) {
    if (obstacle.key === "tvBot") {
      return insetRect(obstacle, 16, 12, 12);
    }
    if (obstacle.key === "surveillanceBot") {
      return insetRect(obstacle, 15, 10, 12);
    }
    if (obstacle.key === "aiBarrier") {
      return insetRect(obstacle, 18, 10, 10);
    }
    if (obstacle.key === "aiStandProp") {
      return insetRect(obstacle, 28, 12, 14);
    }
    if (obstacle.key === "laserMachine") {
      return insetRect(obstacle, 8, 16, 8);
    }
    if (obstacle.key === "cctvBot") {
      return insetRect(obstacle, 18, 14, 20);
    }

    return insetRect(obstacle, 10, 8, 8);
  }

  function circleRectOverlap(circle, rect) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return (dx * dx) + (dy * dy) < circle.radius * circle.radius;
  }

  function getPlayerRect() {
    return {
      x: player.x - 8,
      y: player.y - player.height + 6,
      width: player.width - 12,
      height: player.height - 8,
    };
  }

  function getLaserTargetY(playerRect) {
    return Math.max(
      CONFIG.groundY - 172,
      Math.min(CONFIG.groundY - 54, playerRect.y + playerRect.height * 0.5)
    );
  }

  function getCctvEyeAnchor(obstacle) {
    const hoverBob = Math.sin(obstacle.pulse * 1.25) * 10;
    const drawHeight = obstacle.height * 1.22;
    const aspectRatio = cctvBotFrames[0].naturalWidth && cctvBotFrames[0].naturalHeight
      ? cctvBotFrames[0].naturalWidth / cctvBotFrames[0].naturalHeight
      : 1;
    const drawWidth = drawHeight * aspectRatio;
    const drawX = (obstacle.width - drawWidth) * 0.5;
    const drawY = (obstacle.height - drawHeight) * 0.5 + hoverBob;

    return {
      x: obstacle.x + drawX + (drawWidth * 0.17),
      y: obstacle.y + drawY + (drawHeight * 0.18),
    };
  }

  function getLaserBeamRect(obstacle) {
    const anchorX = obstacle.key === "cctvBot"
      ? getCctvEyeAnchor(obstacle).x
      : obstacle.x + 8;
    const beamY = (obstacle.lockedY || obstacle.targetY) - 7;
    return {
      x: 0,
      y: beamY,
      width: anchorX,
      height: 14,
    };
  }

  function update(delta) {
    if (state.paused || state.over) {
      return;
    }

    if (state.dying) {
      updateDeath(delta);
      updateHud();
      return;
    }

    if (!state.running) {
      return;
    }

    const timeScale = 1;
    const scaledDelta = delta * timeScale;

    state.time += scaledDelta;
    state.distance += state.speed * scaledDelta;
    if (!state.skateboardActive && state.combo >= 3) {
      state.skateboardActive = true;
      state.flash = 0.2;
      playTone("square", 480, 0.16, 0.05);
    }
    if (!state.superRunActive && state.combo >= CONFIG.superRunThreshold) {
      state.superRunActive = true;
      state.superRunShieldTimer = CONFIG.superRunShieldDuration;
      state.flash = 0.24;
      playTone("square", 560, 0.18, 0.055);
      showShieldBanner();
    }
    if (state.skateboardActive && !state.nitroActive && state.combo >= 12) {
      state.nitroActive = true;
      state.nitroTimer = CONFIG.nitroDuration;
      state.flash = 0.26;
      playTone("sawtooth", 720, 0.18, 0.05);
    }

    const shieldActive = state.superRunShieldTimer > 0 || (state.activePower === "shield" && state.shieldCharges > 0);
    const speedCap = (state.skateboardActive ? CONFIG.maxSpeed + CONFIG.skateboardBoost : CONFIG.maxSpeed)
      + (shieldActive ? CONFIG.shieldSpeedBoost : 0);
    const baseAcceleration = (state.skateboardActive ? CONFIG.acceleration * 1.25 : CONFIG.acceleration)
      * (shieldActive ? CONFIG.shieldAccelerationBoost : 1);
    state.speed = Math.min(speedCap, state.speed + baseAcceleration * scaledDelta);
    state.score += Math.floor(CONFIG.passiveScoreRate * scaledDelta);
    state.obstacleTimer -= scaledDelta;
    state.pickupTimer -= scaledDelta;
    state.screenShake = Math.max(0, state.screenShake - 26 * scaledDelta);
    if (shieldActive) {
      state.screenShake = Math.max(state.screenShake, 1.8 + Math.abs(Math.sin(state.time * 18)) * 1.2);
    }
    state.flash = Math.max(0, state.flash - scaledDelta);
    state.dangerPulse += scaledDelta * 3;
    state.bitePhase += scaledDelta * (4 + Math.max(0, (CONFIG.trexDangerGap - (player.x - trex.x)) / 26));

    if (state.comboTimer > 0) {
      state.comboTimer -= scaledDelta;
      if (state.comboTimer <= 0) {
        state.combo = 0;
        state.skateboardActive = false;
        state.superRunActive = false;
        state.superRunShieldTimer = 0;
        state.nitroActive = false;
        state.nitroTimer = 0;
      }
    }

    if (state.superRunShieldTimer > 0) {
      state.superRunShieldTimer = Math.max(0, state.superRunShieldTimer - scaledDelta);
    }
    if (state.shieldBannerTimer > 0) {
      state.shieldBannerTimer = Math.max(0, state.shieldBannerTimer - scaledDelta);
      if (state.shieldBannerTimer <= 0 && ui.shieldBanner) {
        ui.shieldBanner.classList.remove("is-visible");
      }
    }

    if (state.nitroActive) {
      state.nitroTimer -= scaledDelta;
      if (state.nitroTimer <= 0) {
        state.nitroActive = false;
        state.nitroTimer = 0;
      }
    }

    if (state.activePower) {
      state.powerTimer -= scaledDelta;
      if (state.powerTimer <= 0) {
        state.activePower = null;
        state.shieldCharges = 0;
        ui.powerLabel.textContent = "Stand by";
      }
    }

    player.slideTimer -= scaledDelta;
    if (player.sliding && player.slideTimer <= 0) {
      player.sliding = false;
      player.height = player.baseHeight;
    }

    player.velocityY += CONFIG.gravity * scaledDelta;
    player.y += player.velocityY * scaledDelta;
    if (player.doubleJumping) {
      player.doubleJumpTimer += scaledDelta;
    }
    if (player.y >= CONFIG.groundY) {
      player.y = CONFIG.groundY;
      player.velocityY = 0;
      player.onGround = true;
      player.jumpsRemaining = 2;
      player.doubleJumping = false;
      player.doubleJumpTimer = 0;
      player.rotation = 0;
    }
    state.groundedTime = player.onGround ? state.groundedTime + scaledDelta : 0;

    if (state.obstacleTimer <= 0) {
      spawnObstacle();
    }
    if (state.pickupTimer <= 0) {
      spawnPickup();
    }

    const movement = state.speed * scaledDelta;
    let playerRect = getPlayerRect();

    for (let index = obstacles.length - 1; index >= 0; index -= 1) {
      const obstacle = obstacles[index];
      obstacle.x -= movement;
      obstacle.pulse += scaledDelta * 5;

      if (obstacle.key === "laserMachine" || obstacle.key === "cctvBot") {
        const desiredTargetY = getLaserTargetY(playerRect);
        const aimEase = obstacle.key === "cctvBot" ? CONFIG.cctvLaserAimEase : CONFIG.laserAimEase;
        const startX = obstacle.key === "cctvBot" ? CONFIG.cctvLaserStartX : CONFIG.laserStartX;
        const lockDuration = obstacle.key === "cctvBot" ? CONFIG.cctvLaserLockDuration : CONFIG.laserLockDuration;
        const fireDuration = obstacle.key === "cctvBot" ? CONFIG.cctvLaserFireDuration : CONFIG.laserFireDuration;
        const cctvGapToPlayer = obstacle.x - (playerRect.x + playerRect.width);
        const cctvCanArm = obstacle.key !== "cctvBot" || cctvGapToPlayer >= CONFIG.cctvLaserMinArmGap;
        const laserCanArm = player.onGround && state.groundedTime >= CONFIG.laserReadyGroundTime;
        obstacle.targetY += (desiredTargetY - obstacle.targetY) * Math.min(1, scaledDelta * aimEase);

        if (!obstacle.arming && !obstacle.firing && !obstacle.hasFired && obstacle.x <= startX && laserCanArm && cctvCanArm) {
          obstacle.arming = true;
          obstacle.charge = 0;
        }

        if (obstacle.arming && !obstacle.firing) {
          if (obstacle.key === "cctvBot" && cctvGapToPlayer < CONFIG.cctvLaserCancelGap) {
            obstacle.arming = false;
            obstacle.charge = 0;
            obstacle.hasFired = true;
            continue;
          }
          obstacle.charge += scaledDelta;
          obstacle.lockedY = obstacle.targetY;
          if (obstacle.charge >= lockDuration) {
            obstacle.firing = true;
            obstacle.fireTimer = fireDuration;
            obstacle.arming = false;
            obstacle.hasFired = true;
            obstacle.lockedY = obstacle.targetY;
            playTone("square", obstacle.key === "cctvBot" ? 1120 : 980, 0.08, 0.035);
          }
        } else if (obstacle.firing) {
          obstacle.fireTimer -= scaledDelta;
          if (rectsOverlap(playerRect, getLaserBeamRect(obstacle))) {
            hitObstacle(index, "beam");
            continue;
          }
          if (obstacle.fireTimer <= 0) {
            obstacle.firing = false;
            obstacle.charge = 0;
          }
        }
      }

      if (obstacle.x + obstacle.width < -40) {
        obstacles.splice(index, 1);
        continue;
      }
      if (obstacle.x < trex.x + 128) {
        const impactX = obstacle.x + obstacle.width * 0.5;
        const impactY = obstacle.y + obstacle.height * 0.5;
        const smashAmount = CONFIG.trexSmashBurst + Math.floor((obstacle.width + obstacle.height) * 0.06);
        emitBurst(impactX, impactY, "#6e7f77", smashAmount);
        emitBurst(impactX - 12, impactY - 6, "#89968f", Math.floor(smashAmount * 0.45));
        emitBurst(impactX + 8, impactY + 10, "#d6e1db", Math.floor(smashAmount * 0.25));
        emitBurst(impactX, CONFIG.groundY + 8, "#b8c8c0", CONFIG.trexGroundBurst);
        emitBurst(impactX - 18, CONFIG.groundY + 4, "rgba(92, 103, 97, 0.7)", 10);
        obstacles.splice(index, 1);
        state.screenShake = Math.max(state.screenShake, 7);
        continue;
      }
      if (rectsOverlap(playerRect, getObstacleHitbox(obstacle))) {
        hitObstacle(index, "body");
      }
    }

    for (let index = pickups.length - 1; index >= 0; index -= 1) {
      const pickup = pickups[index];
      pickup.x -= movement;
      pickup.bob += scaledDelta * 4;
      if (pickup.x + pickup.radius < -30) {
        pickups.splice(index, 1);
        continue;
      }
      if (state.superRunShieldTimer > 0) {
        collectPickup(index);
        continue;
      }
      if (circleRectOverlap({ x: pickup.x, y: pickup.y + Math.sin(pickup.bob) * 12, radius: pickup.radius }, playerRect)) {
        collectPickup(index);
      }
    }

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.life -= scaledDelta;
      particle.x += particle.dx * scaledDelta;
      particle.y += particle.dy * scaledDelta;
      particle.dy += 420 * scaledDelta;
      if (particle.life <= 0) {
        particles.splice(index, 1);
      }
    }

    const nitroGap = state.nitroActive ? CONFIG.nitroTrexGapBonus : 0;
    const maintainedGap = Math.max(
      320,
      CONFIG.trexBaseGap + nitroGap - Math.min(72, state.score * 0.06)
    );
    const targetTrexX = Math.max(
      -20,
      player.x - maintainedGap + Math.min(120, state.speed * 0.045) - Math.min(18, state.combo * 1.5)
    );
    trex.x += (targetTrexX - trex.x) * CONFIG.trexCatchupRate * scaledDelta;
    const gap = player.x - trex.x;
    if (gap < CONFIG.trexDangerGap) {
      state.screenShake = Math.max(state.screenShake, 3 + ((CONFIG.trexDangerGap - gap) / 18));
      if (gap < 96) {
        startDeath();
      }
    }

    updateHud();
  }

  function updateDeath(delta) {
    state.time += delta;
    state.deathTimer -= delta;
    state.screenShake = Math.max(0, state.screenShake - 20 * delta);
    trex.x = trex.deathX;

    if (player.deathFreezeTimer > 0) {
      player.deathFreezeTimer = Math.max(0, player.deathFreezeTimer - delta);
      state.screenShake = Math.max(state.screenShake, 2);
    }

    player.velocityY = 0;
    player.y = player.deathFreezeY;
    player.rotation = player.deathFreezeRotation;
    player.biteOffsetX = player.deathFreezeOffsetX;
    player.biteOffsetY = 0;

    if (state.deathTimer <= 0) {
      finalizeGameOver();
    }
  }

  function updateHud() {
    ui.score.textContent = String(state.score);
    ui.highScore.textContent = String(Math.max(state.highScore, state.score));
    if (ui.superrunTimer && ui.superrunTimerValue) {
      const superrunRemaining = Math.max(0, state.superRunShieldTimer);
      ui.superrunTimerValue.textContent = superrunRemaining > 0
        ? `${superrunRemaining.toFixed(1)}s`
        : `x${Math.max(1, state.combo)}`;
      ui.superrunTimer.classList.toggle("is-active", superrunRemaining > 0);
    }
    if (!state.activePower) {
      if (state.combo > 1) {
        if (state.nitroActive) {
          ui.powerLabel.textContent = `Nitro x${state.combo}`;
        } else if (state.superRunActive) {
          ui.powerLabel.textContent = state.superRunShieldTimer > 0 ? "Superrun shield" : `Superrun x${state.combo}`;
        } else if (state.skateboardActive) {
          ui.powerLabel.textContent = `Skateboard x${state.combo}`;
        } else {
          ui.powerLabel.textContent = `Combo x${state.combo}`;
        }
      } else if (state.superRunActive) {
        ui.powerLabel.textContent = state.superRunShieldTimer > 0 ? "Superrun shield" : "Superrun";
      } else if (state.skateboardActive) {
        ui.powerLabel.textContent = state.nitroActive ? "Nitro dash" : "Skateboard dash";
      } else {
        ui.powerLabel.textContent = "Stand by";
      }
    }
  }

  function drawBackground() {
    ctx.fillStyle = "#e24f37";
    ctx.fillRect(0, 0, 1280, 720);

    cloudBits.forEach((cloud) => {
      const image = cloudPropImages[cloud.imageIndex];
      if (!image.complete) {
        return;
      }
      const aspectRatio = image.naturalWidth && image.naturalHeight
        ? image.naturalWidth / image.naturalHeight
        : 1;
      const drawWidth = cloud.size * aspectRatio;
      const drawHeight = cloud.size;
      const travel = 1280 + drawWidth + 240;
      const scroll = (state.distance * (0.04 + cloud.depth)) % travel;
      const drawX = 1280 - scroll + cloud.x - 120;

      ctx.save();
      ctx.globalAlpha = cloud.opacity;
      ctx.drawImage(image, drawX, cloud.y, drawWidth, drawHeight);
      if (drawX + drawWidth > 1280) {
        ctx.drawImage(image, drawX - travel, cloud.y, drawWidth, drawHeight);
      }
      ctx.restore();
    });

    skylineBits.forEach((prop) => {
      const image = bgPropImages[prop.imageIndex];
      if (!image.complete) {
        return;
      }
      const aspectRatio = image.naturalWidth && image.naturalHeight
        ? image.naturalWidth / image.naturalHeight
        : 1;
      const drawHeight = prop.size;
      const drawWidth = drawHeight * aspectRatio;
      const travel = 1280 + drawWidth + 220;
      const scroll = (state.distance * (0.18 + prop.depth)) % travel;
      const drawX = 1280 - scroll + prop.x - 160;
      const drawY = CONFIG.groundY - drawHeight + 14 + prop.yOffset;

      ctx.save();
      ctx.globalAlpha = prop.opacity;
      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      if (drawX + drawWidth > 1280) {
        ctx.drawImage(image, drawX - travel, drawY, drawWidth, drawHeight);
      }
      ctx.restore();
    });

    ctx.fillStyle = "#2f3934";
    ctx.fillRect(0, CONFIG.groundY, 1280, 12);
    ctx.fillStyle = "#1f2723";
    ctx.fillRect(0, CONFIG.groundY + 12, 1280, 720 - (CONFIG.groundY + 12));

  }

  function drawDuck() {
    const duckX = player.x + player.biteOffsetX;
    const duckY = player.y + player.biteOffsetY;
    const runFrame = Math.floor(state.time * 12) % duckFrames.length;
    const doubleJumpFrame = Math.min(
      duckDoubleJumpFrames.length - 1,
      Math.floor(player.doubleJumpTimer * 14)
    );
    const skateFrame = Math.floor(state.time * 14) % duckSkateFrames.length;
    const superRunFrame = Math.floor(state.time * 15) % duckSuperRunFrames.length;
    const runSwing = player.onGround && !state.dying && !state.skateboardActive
      ? Math.sin(state.time * 12) * 4
      : 0;
    const bodyBob = player.onGround && !state.dying && !state.skateboardActive
      ? Math.abs(Math.sin(state.time * 12)) * 2
      : 0;
    const tilt = !player.onGround ? -0.12 : state.dying ? player.rotation : runSwing * 0.01;
    const drawWidth = 122;
    const drawHeight = 122;
    const activeDuckFrame = state.dying
      ? (player.deathStartedOnGround ? duckGroundDeathFrame : duckAirDeathFrame)
      : player.onGround && state.superRunActive
        ? duckSuperRunFrames[superRunFrame]
      : !player.onGround && state.superRunActive
        ? duckJumpFrame
      : player.onGround && state.skateboardActive
        ? duckSkateFrames[skateFrame]
      : !player.onGround && state.skateboardActive
        ? duckJumpSkateFrame
      : player.doubleJumping
        ? duckDoubleJumpFrames[doubleJumpFrame]
        : !player.onGround
        ? duckJumpFrame
        : !state.skateboardActive
          ? duckFrames[runFrame]
          : duckFrames[1];

    if ((state.activePower === "shield" || state.superRunShieldTimer > 0) && !state.dying) {
      const shieldCenterX = duckX + 18;
      const shieldCenterY = duckY - 32;
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#96f7c3";
      ctx.beginPath();
      ctx.ellipse(shieldCenterX, shieldCenterY, 68, 56, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (state.skateboardActive && !state.dying && player.onGround) {
      if (state.nitroActive) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = "#9cffc7";
        ctx.beginPath();
        ctx.ellipse(duckX - 22, duckY - 2, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const drawOffsetX = state.dying && player.deathStartedOnGround
      ? -38
      : state.superRunActive && player.onGround
        ? -58
        : -53;
    const drawOffsetY = state.dying && player.deathStartedOnGround
      ? 14
      : state.superRunActive && player.onGround
        ? 36
        : player.onGround && !state.skateboardActive
          ? 42
        : 38;
    ctx.save();
    ctx.translate(duckX + drawOffsetX + runSwing, duckY - drawHeight + drawOffsetY - bodyBob);
    ctx.rotate(tilt);
    if (activeDuckFrame.complete) {
      ctx.drawImage(activeDuckFrame, 0, 0, drawWidth, drawHeight);
    }
    ctx.restore();
  }

  function drawTrex() {
    const stomp = state.dying || state.over ? 0 : Math.sin(state.time * 13) * 5;
    const trexFrameIndex = Math.floor(state.time * 14) % trexFrames.length;
    const activeTrexFrame = state.dying || state.over ? happyTrexImage : trexFrames[trexFrameIndex];
    const baseScale = 0.84;
    const drawWidth = (activeTrexFrame.naturalWidth || 405) * baseScale;
    const drawHeight = (activeTrexFrame.naturalHeight || 405) * baseScale;
    const drawX = trex.x + 228 - drawWidth;
    const drawY = CONFIG.groundY - drawHeight + 36 + stomp;
    if (activeTrexFrame.complete) {
      ctx.drawImage(activeTrexFrame, drawX, drawY, drawWidth, drawHeight);
    }
  }

  function drawObstacle(obstacle) {
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);

    if (obstacle.key === "tvBot") {
      const tvFrame = tvBotFrames[Math.floor(obstacle.pulse * 1.45) % tvBotFrames.length];
      const aspectRatio = tvFrame.naturalWidth && tvFrame.naturalHeight
        ? tvFrame.naturalWidth / tvFrame.naturalHeight
        : 1;
      const drawHeight = (obstacle.height + 18) * 1.72;
      const drawWidth = drawHeight * aspectRatio;
      const drawX = (obstacle.width - drawWidth) * 0.5;
      const drawY = obstacle.height - drawHeight + 50;
      if (tvFrame.complete) {
        ctx.drawImage(tvFrame, drawX, drawY, drawWidth, drawHeight);
      }
    } else if (obstacle.key === "laserMachine") {
      const aimY = (obstacle.firing ? obstacle.lockedY : obstacle.targetY) - obstacle.y;
      const reticleX = player.x + 26 - obstacle.x;
      const muzzleX = 18;

      if (obstacle.arming || obstacle.firing) {
        ctx.save();
        ctx.globalAlpha = obstacle.firing ? 0.92 : 0.28 + Math.min(0.4, obstacle.charge / CONFIG.laserLockDuration);
        ctx.strokeStyle = obstacle.firing ? "#ff3434" : "#ffe2e2";
        ctx.lineWidth = obstacle.firing ? 5 : 2;
        if (!obstacle.firing) {
          ctx.setLineDash([8, 7]);
        }
        ctx.beginPath();
        ctx.moveTo(muzzleX, aimY);
        ctx.lineTo(0 - obstacle.x, aimY);
        ctx.stroke();
        ctx.setLineDash([]);
        if (obstacle.firing) {
          ctx.globalAlpha = 0.2;
          ctx.fillStyle = "#ff6a6a";
          ctx.fillRect(0 - obstacle.x, aimY - 7, muzzleX + obstacle.x, 14);
        } else {
          ctx.globalAlpha = 0.72;
          ctx.strokeStyle = "#fff5f5";
          ctx.lineWidth = 2;
          ctx.strokeRect(reticleX - 12, aimY - 12, 24, 24);
        }
        ctx.restore();
      }

      ctx.save();
      ctx.translate(obstacle.width, 0);
      ctx.scale(-1, 1);

      ctx.fillStyle = "#202724";
      ctx.fillRect(18, obstacle.height - 14, obstacle.width - 36, 10);

      ctx.fillStyle = "#f0d53c";
      ctx.beginPath();
      ctx.moveTo(28, obstacle.height - 14);
      ctx.lineTo(36, obstacle.height - 42);
      ctx.lineTo(44, obstacle.height - 14);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(52, obstacle.height - 14);
      ctx.lineTo(60, obstacle.height - 44);
      ctx.lineTo(68, obstacle.height - 14);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#3f7db4";
      ctx.beginPath();
      ctx.moveTo(22, obstacle.height - 20);
      ctx.lineTo(30, obstacle.height - 60);
      ctx.lineTo(68, obstacle.height - 60);
      ctx.lineTo(76, obstacle.height - 20);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#2a5f90";
      ctx.beginPath();
      ctx.ellipse(49, obstacle.height - 38, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#1c211f";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(46, obstacle.height - 60);
      ctx.lineTo(45, obstacle.height - 84);
      ctx.stroke();

      ctx.fillStyle = "#ef5537";
      ctx.beginPath();
      ctx.moveTo(18, obstacle.height - 90);
      ctx.lineTo(46, obstacle.height - 96);
      ctx.lineTo(82, obstacle.height - 90);
      ctx.lineTo(76, obstacle.height - 66);
      ctx.lineTo(24, obstacle.height - 68);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#1c211f";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#1c211f";
      ctx.beginPath();
      ctx.arc(28, obstacle.height - 82, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(33, obstacle.height - 87, 8, 10);

      ctx.fillStyle = obstacle.firing ? "#ff3d3d" : "#fff3f1";
      ctx.beginPath();
      ctx.arc(28, obstacle.height - 82, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#1c211f";
      ctx.fillRect(54, obstacle.height - 84, 14, 3);
      ctx.fillRect(56, obstacle.height - 77, 10, 3);

      ctx.strokeStyle = "#1c211f";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(18, obstacle.height - 82);
      ctx.lineTo(0, aimY);
      ctx.stroke();

      ctx.fillStyle = "#ffefef";
      ctx.beginPath();
      ctx.arc(0, aimY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff5252";
      ctx.beginPath();
      ctx.arc(0, aimY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (obstacle.key === "surveillanceBot") {
      const spiderFrame = botSpiderFrames[Math.floor(obstacle.pulse * 1.8) % botSpiderFrames.length];
      const aspectRatio = spiderFrame.naturalWidth && spiderFrame.naturalHeight
        ? spiderFrame.naturalWidth / spiderFrame.naturalHeight
        : 1;
      const drawHeight = (obstacle.height + 28) * 2.03;
      const drawWidth = drawHeight * aspectRatio;
      const drawX = (obstacle.width - drawWidth) * 0.5;
      const drawY = obstacle.height - drawHeight + 84;
      if (spiderFrame.complete) {
        ctx.drawImage(spiderFrame, drawX, drawY, drawWidth, drawHeight);
      }
    } else if (obstacle.key === "aiBarrier") {
      const aspectRatio = aiBarrierImage.naturalWidth && aiBarrierImage.naturalHeight
        ? aiBarrierImage.naturalWidth / aiBarrierImage.naturalHeight
        : 1;
      const drawHeight = obstacle.height * 1.56;
      const drawWidth = drawHeight * aspectRatio;
      const drawX = (obstacle.width - drawWidth) * 0.5;
      const drawY = obstacle.height - drawHeight + 34;
      if (aiBarrierImage.complete) {
        ctx.drawImage(aiBarrierImage, drawX, drawY, drawWidth, drawHeight);
      }
    } else if (obstacle.key === "aiStandProp") {
      const aspectRatio = aiStandPropImage.naturalWidth && aiStandPropImage.naturalHeight
        ? aiStandPropImage.naturalWidth / aiStandPropImage.naturalHeight
        : 1;
      const drawHeight = obstacle.height * 1.02;
      const drawWidth = drawHeight * aspectRatio;
      const drawX = (obstacle.width - drawWidth) * 0.5;
      const drawY = obstacle.height - drawHeight + 36;
      if (aiStandPropImage.complete) {
        ctx.drawImage(aiStandPropImage, drawX, drawY, drawWidth, drawHeight);
      }
    } else if (obstacle.key === "cctvBot") {
      const cctvFrame = cctvBotFrames[Math.floor(obstacle.pulse * 1.6) % cctvBotFrames.length];
      const aspectRatio = cctvFrame.naturalWidth && cctvFrame.naturalHeight
        ? cctvFrame.naturalWidth / cctvFrame.naturalHeight
        : 1;
      const hoverBob = Math.sin(obstacle.pulse * 1.25) * 10;
      const drawHeight = obstacle.height * 1.22;
      const drawWidth = drawHeight * aspectRatio;
      const drawX = (obstacle.width - drawWidth) * 0.5;
      const drawY = (obstacle.height - drawHeight) * 0.5 + hoverBob;
      const eyeX = drawX + (drawWidth * 0.17);
      const beamY = (obstacle.firing ? obstacle.lockedY : obstacle.targetY) - obstacle.y;
      const reticleX = player.x + 26 - obstacle.x;

      if (obstacle.arming || obstacle.firing) {
        ctx.save();
        ctx.globalAlpha = obstacle.firing ? 0.88 : 0.24 + Math.min(0.34, obstacle.charge / CONFIG.cctvLaserLockDuration);
        ctx.strokeStyle = obstacle.firing ? "#ff4b4b" : "#ffe9e9";
        ctx.lineWidth = obstacle.firing ? 4 : 2;
        if (!obstacle.firing) {
          ctx.setLineDash([7, 6]);
        }
        ctx.beginPath();
        ctx.moveTo(eyeX, beamY);
        ctx.lineTo(-obstacle.x, beamY);
        ctx.stroke();
        ctx.setLineDash([]);
        if (obstacle.firing) {
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = "#ff7a7a";
          ctx.fillRect(-obstacle.x, beamY - 7, obstacle.x + eyeX, 14);
        } else {
          ctx.globalAlpha = 0.68;
          ctx.strokeStyle = "#fff6f6";
          ctx.lineWidth = 2;
          ctx.strokeRect(reticleX - 10, beamY - 10, 20, 20);
        }
        ctx.restore();
      }
      if (cctvFrame.complete) {
        ctx.drawImage(cctvFrame, drawX, drawY, drawWidth, drawHeight);
      }
    }

    ctx.restore();
  }

  function drawPickup(pickup) {
    const bobY = pickup.y + Math.sin(pickup.bob) * 12;
    ctx.save();
    ctx.translate(pickup.x, bobY);
    if (rewardImage.complete) {
      ctx.drawImage(rewardImage, -38, -38, 76, 76);
    }
    ctx.restore();
  }

  function drawParticles() {
    particles.forEach((particle) => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, 6, 6);
    });
    ctx.globalAlpha = 1;
  }

  function drawHudEffects() {
    const shieldActive = state.superRunShieldTimer > 0 || (state.activePower === "shield" && state.shieldCharges > 0);
    if (shieldActive) {
      const pulse = 0.12 + ((Math.sin(state.time * 6) + 1) * 0.5 * 0.08);
      const glow = ctx.createRadialGradient(640, 360, 120, 640, 360, 760);
      glow.addColorStop(0, `rgba(150, 247, 195, ${pulse})`);
      glow.addColorStop(0.45, `rgba(23, 201, 100, ${pulse * 0.55})`);
      glow.addColorStop(1, "rgba(23, 201, 100, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1280, 720);
    }

    if (state.activePower) {
      ctx.fillStyle = "rgba(23, 201, 100, 0.16)";
      ctx.fillRect(0, 0, 1280, 720);
    }

    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${state.flash})`;
      ctx.fillRect(0, 0, 1280, 720);
    }
  }

  function render() {
    ctx.save();
    const superRunCamera = state.superRunActive && state.combo >= CONFIG.superRunThreshold && !state.dying;
    const shakeX = (state.screenShake > 0 ? randomRange(-state.screenShake, state.screenShake) : 0)
      + (superRunCamera ? Math.sin(state.time * 20) * 1.4 + randomRange(-0.5, 0.5) : 0);
    const shakeY = (state.screenShake > 0 ? randomRange(-state.screenShake, state.screenShake) : 0)
      + (superRunCamera ? Math.cos(state.time * 16) * 0.8 + randomRange(-0.35, 0.35) : 0);
    ctx.translate(shakeX, shakeY);
    drawBackground();
    drawTrex();
    pickups.forEach(drawPickup);
    obstacles.forEach(drawObstacle);
    drawDuck();
    drawParticles();
    drawHudEffects();
    ctx.restore();
  }

  function frame(timestamp) {
    if (!state.lastFrame) {
      state.lastFrame = timestamp;
    }
    const delta = Math.min(0.032, (timestamp - state.lastFrame) / 1000);
    state.lastFrame = timestamp;
    update(delta);
    render();
    requestAnimationFrame(frame);
  }

  function handleKeyDown(event) {
    if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
      event.preventDefault();
      if (!state.running && !state.over) {
        startGame();
      }
      jump();
      return;
    }

    if (event.code === "KeyP") {
      event.preventDefault();
      togglePause();
      return;
    }

    if (event.code === "KeyR" && state.over) {
      event.preventDefault();
      startGame();
    }
  }

  function bindTouchControls() {
    const attachPress = (element, onStart, onEnd) => {
      const supportsPointerEvents = "PointerEvent" in window;
      const startEvents = supportsPointerEvents ? ["pointerdown"] : ["touchstart"];
      const endEvents = supportsPointerEvents ? ["pointerup", "pointercancel"] : ["touchend", "touchcancel"];

      startEvents.forEach((type) => {
        element.addEventListener(type, (event) => {
          event.preventDefault();
          onStart(event.target);
        }, { passive: false });
      });

      endEvents.forEach((type) => {
        element.addEventListener(type, (event) => {
          event.preventDefault();
          if (onEnd) {
            onEnd(event.target);
          }
        }, { passive: false });
      });
    };

    attachPress(ui.jumpTouch, () => {
      if (!state.running && !state.over) {
        startGame();
      }
      jump();
    });

    const supportsPointerEvents = "PointerEvent" in window;
    const stageTapEvents = supportsPointerEvents ? ["pointerdown"] : ["touchstart"];
    stageTapEvents.forEach((type) => {
      ui.gameStage.addEventListener(type, (event) => {
        if (!IS_TOUCH_DEVICE) {
          return;
        }

        if (event.target && event.target.closest("button, a")) {
          return;
        }

        event.preventDefault();
        if (!state.running && !state.over) {
          startGame();
        }
        jump();
      }, { passive: false });
    });
  }

  ui.playButton.addEventListener("click", startGame);
  ui.retryButton.addEventListener("click", startGame);
  if (ui.shareButton) {
    ui.shareButton.addEventListener("click", shareResult);
  }
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("resize", () => {
    updateViewportMetrics();
    syncOrientationState();
    resizeCanvas();
  });
  window.addEventListener("orientationchange", () => {
    window.setTimeout(() => {
      updateViewportMetrics();
      syncOrientationState();
      resizeCanvas();
    }, 120);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      updateViewportMetrics();
      syncOrientationState();
    });
    window.visualViewport.addEventListener("scroll", updateViewportMetrics);
  }

  updateViewportMetrics();
  resizeCanvas();
  bindTouchControls();
  updateHud();
  syncOrientationState();
  render();
  requestAnimationFrame(frame);
})();
