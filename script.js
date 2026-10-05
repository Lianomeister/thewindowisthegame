  /* ---------- Uhr / Taskbar-Zeit ---------- */
  var clockInterval = null;
  var clockReversing = false;

  var frozenDate = null;

  function pad(n){ return String(n).padStart(2,'0'); }
  function formatDateTime(d){
    return pad(d.getDate()) + '.' + pad(d.getMonth()+1) + '. ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function tick(){
    var el = document.getElementById('clock');
    if(clockReversing || frozenDate) return;
    var now = new Date();
    el.textContent = formatDateTime(now);
  }
  function startClockInterval(){
    if(clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(tick, 15000);
  }

  tick();
  startClockInterval();

  function reverseClock(){
    if(clockReversing || frozenDate) return;
    clockReversing = true;
    if(clockInterval) clearInterval(clockInterval);

    var el = document.getElementById('clock');
    var bigClock = document.getElementById('bigClock');
    var bigTime = document.getElementById('bigClockTime');

    var current = new Date();
    bigTime.textContent = formatDateTime(current);
    bigClock.classList.add('is-active');

    setTimeout(function(){
      el.classList.add('glitch');
      bigTime.classList.add('glitch');
      document.body.classList.add('time-shaking');
      document.body.classList.add('time-graying');
      if(window.closeAllWindowsForTimeTravel) window.closeAllWindowsForTimeTravel();
      if(window.showTimeTravelLog) window.showTimeTravelLog();

      var stopTime = new Date(current.getTime() - 24*60*60*1000);
      var stepMs = 6 * 60 * 1000; /* 6 Minuten pro Tick */
      var intervalMs = 18;

      var timer = setInterval(function(){
        current = new Date(current.getTime() - stepMs);
        if(current.getTime() <= stopTime.getTime()){
          current = stopTime;
          el.textContent = formatDateTime(current);
          bigTime.textContent = formatDateTime(current);
          clearInterval(timer);
          document.body.classList.remove('time-shaking');
          document.body.classList.remove('time-graying');
          document.body.classList.add('time-grayed');
          setTimeout(function(){
            el.classList.remove('glitch');
            bigTime.classList.remove('glitch');
            bigClock.classList.remove('is-active');
            clockReversing = false;
            frozenDate = formatDateTime(current);
            try{ localStorage.setItem('witg_search_unlocked', '1'); }catch(err){}
          }, 700);
          return;
        }
        el.textContent = formatDateTime(current);
        bigTime.textContent = formatDateTime(current);
      }, intervalMs);
    }, 900);
  }
  document.getElementById('clock').addEventListener('click', reverseClock);

  /* ---------- Narrator-Audio ---------- */
  var audioMoving = document.getElementById('audioMoving');
  var audioIdle = document.getElementById('audioIdle');
  var audioTooEarly = document.getElementById('audioTooEarly');
  var lastMovingPlay = 0;
  var movingCooldown = 20000;

  function playMoving(){
    var now = Date.now();
    if(now - lastMovingPlay < movingCooldown) return;
    lastMovingPlay = now;
    audioMoving.currentTime = 0;
    audioMoving.play().catch(function(){});
  }

  var idleTimer = null;
  var idlePlayed = false;
  function scheduleIdleLine(){
    if(idleTimer) clearTimeout(idleTimer);
    idlePlayed = false;
    var delay = 90000 + Math.random() * 60000; /* 90–150s */
    idleTimer = setTimeout(function(){
      if(!idlePlayed){
        idlePlayed = true;
        audioIdle.currentTime = 0;
        audioIdle.play().catch(function(){});
      }
    }, delay);
  }
  scheduleIdleLine();

  /* ---------- Screensaver ---------- */
  var ssEl = document.getElementById('screensaver');
  var ssTimer = null;
  var ssActive = false;
  var ssRaf = null;
  var ssCD = null;
  var ssHue = 0;
  var ssSpin = 0;

  function buildScreensaverCD(){
    ssEl.querySelectorAll('.ss-cd').forEach(function(n){ n.remove(); });
    var div = document.createElement('div');
    div.className = 'ss-cd';
    div.innerHTML =
      '<svg viewBox="0 0 90 90" width="90" height="90">' +
        '<defs><linearGradient id="cdShine" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#fff" stop-opacity="0.9"/>' +
          '<stop offset="35%" stop-color="#fff" stop-opacity="0.15"/>' +
          '<stop offset="55%" stop-color="#000" stop-opacity="0.05"/>' +
          '<stop offset="100%" stop-color="#fff" stop-opacity="0.35"/>' +
        '</linearGradient></defs>' +
        '<circle cx="45" cy="45" r="43" fill="#b8c6d6"/>' +
        '<circle cx="45" cy="45" r="43" fill="url(#cdShine)"/>' +
        '<circle cx="45" cy="45" r="43" fill="none" stroke="#8fa0b3" stroke-width="1"/>' +
        '<circle cx="45" cy="45" r="14" fill="none" stroke="#8fa0b3" stroke-width="0.6" opacity="0.6"/>' +
        '<circle cx="45" cy="45" r="9" fill="#d9dfe6"/>' +
        '<circle cx="45" cy="45" r="3.2" fill="#222"/>' +
      '</svg>';
    ssEl.appendChild(div);
    ssCD = {
      el: div,
      x: Math.random() * (window.innerWidth - 90),
      y: Math.random() * (window.innerHeight - 90),
      vx: (Math.random() * 0.5 + 0.5) * (Math.random() < 0.5 ? -1 : 1),
      vy: (Math.random() * 0.5 + 0.5) * (Math.random() < 0.5 ? -1 : 1)
    };
    ssHue = 0;
  }

  function ssStep(){
    if(!ssActive) return;
    var w = window.innerWidth, h = window.innerHeight;
    var ic = ssCD;
    ic.x += ic.vx;
    ic.y += ic.vy;
    var bounced = false;
    if(ic.x <= 0 || ic.x >= w - 90){ ic.vx *= -1; bounced = true; }
    if(ic.y <= 0 || ic.y >= h - 90){ ic.vy *= -1; bounced = true; }
    if(bounced){
      ssHue = Math.floor(Math.random() * 360);
    }
    ssSpin = (ssSpin + 0.3) % 360;
    ic.el.style.transform = 'translate(' + ic.x + 'px,' + ic.y + 'px) rotate(' + ssSpin + 'deg)';
    ic.el.style.filter = 'hue-rotate(' + ssHue + 'deg) saturate(2.4) brightness(1.1)';
    ssRaf = requestAnimationFrame(ssStep);
  }

  function startScreensaver(){
    if(ssActive) return;
    ssActive = true;
    buildScreensaverCD();
    ssEl.classList.add('is-active');
    ssRaf = requestAnimationFrame(ssStep);
  }
  function stopScreensaver(){
    if(!ssActive) return;
    ssActive = false;
    ssEl.classList.remove('is-active');
    if(ssRaf) cancelAnimationFrame(ssRaf);
  }
  function scheduleScreensaver(){
    if(ssTimer) clearTimeout(ssTimer);
    ssTimer = setTimeout(startScreensaver, 100000);
  }
  scheduleScreensaver();

  function registerActivity(e){
    if(ssActive){
      if(e.type === 'pointerdown'){
        stopScreensaver();
        scheduleScreensaver();
        scheduleIdleLine();
      }
      return;
    }
    scheduleScreensaver();
    scheduleIdleLine();
  }
  ['pointerdown','pointermove','keydown','wheel'].forEach(function(evt){
    window.addEventListener(evt, registerActivity, { passive: true });
  });

  document.querySelectorAll('.xp-window').forEach(function(win){
    var handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'window-resize-handle';
    handle.setAttribute('aria-label', 'Fenstergröße ändern');
    handle.title = 'Fenstergröße ändern';
    win.appendChild(handle);

    var resizeStart = null;
    handle.addEventListener('pointerdown', function(e){
      e.preventDefault();
      e.stopPropagation();
      var rect = win.getBoundingClientRect();
      resizeStart = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height
      };
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', function(e){
      if(!resizeStart) return;
      win.style.width = Math.max(220, resizeStart.width + e.clientX - resizeStart.x) + 'px';
      win.style.height = Math.max(140, resizeStart.height + e.clientY - resizeStart.y) + 'px';
    });
    handle.addEventListener('pointerup', function(){ resizeStart = null; });
    handle.addEventListener('pointercancel', function(){ resizeStart = null; });
    handle.addEventListener('keydown', function(e){
      if(e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      var step = e.shiftKey ? 50 : 10;
      var rect = win.getBoundingClientRect();
      var width = rect.width, height = rect.height;
      if(e.key === 'ArrowLeft') width -= step;
      if(e.key === 'ArrowRight') width += step;
      if(e.key === 'ArrowUp') height -= step;
      if(e.key === 'ArrowDown') height += step;
      win.style.width = Math.max(220, width) + 'px';
      win.style.height = Math.max(140, height) + 'px';
    });
  });

  /* ---------- Fenster-Drag ---------- */
  (function(){
    function makeDraggable(win, handleSelector, initX, initY, onMove){
      var handle = win.querySelector(handleSelector);
      var x = initX, y = initY;
      var dragging = false;
      var startX = 0, startY = 0, baseX = 0, baseY = 0;

      function clampAndApply(){
        win.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        if(onMove) onMove(x, y);
      }
      clampAndApply();

      handle.addEventListener('pointerdown', function(e){
        if(win.classList.contains('is-maximized') || e.target.closest('.xp-controls')) return;
        dragging = true;
        handle.setPointerCapture(e.pointerId);
        startX = e.clientX; startY = e.clientY;
        baseX = x; baseY = y;
        playMoving();
      });
      handle.addEventListener('pointermove', function(e){
        if(!dragging) return;
        x = baseX + (e.clientX - startX);
        y = baseY + (e.clientY - startY);
        clampAndApply();
      });
      handle.addEventListener('pointerup', function(){ dragging = false; });

      return {
        reset: function(nx, ny){ x = nx; y = ny; clampAndApply(); },
        recompute: function(nx, ny){ x = nx; y = ny; clampAndApply(); }
      };
    }

    var heroWin = document.getElementById('dragWindow');
    var conceptWin = document.getElementById('conceptWindow');
    var paintWin = document.getElementById('paintWindow');
    var storyWin = document.getElementById('storyWindow');
    var browserWin = document.getElementById('browserWindow');
    var logWin = document.getElementById('logWindow');
    var logCtrl = null;
    var posLabel = document.getElementById('pos');
    var paintMaximizeButton = paintWin.querySelector('.xp-controls button:nth-child(2)');
    var paintRestoreStyles = null;

    paintMaximizeButton.setAttribute('aria-label', 'Paint-Fenster maximieren');
    paintMaximizeButton.title = 'Maximieren';
    function restorePaintMaximizedWindow(){
      paintWin.classList.remove('is-maximized');
      paintWin.style.width = paintRestoreStyles.width;
      paintWin.style.height = paintRestoreStyles.height;
      paintWin.style.transform = paintRestoreStyles.transform;
      paintRestoreStyles = null;
    }
    function maximizePaintWindow(){
      if(paintWin.classList.contains('is-maximized')) return;
      paintRestoreStyles = {
        width: paintWin.style.width,
        height: paintWin.style.height,
        transform: paintWin.style.transform
      };
      paintWin.classList.add('is-maximized');
      paintMaximizeButton.textContent = '❐';
      paintMaximizeButton.setAttribute('aria-label', 'Paint-Fenster wiederherstellen');
      paintMaximizeButton.title = 'Wiederherstellen';
    }
    function updatePaintFullscreenButton(){
      var isFullscreen = document.fullscreenElement === paintWin;
      paintMaximizeButton.textContent = isFullscreen ? '❐' : '□';
      paintMaximizeButton.setAttribute('aria-label', isFullscreen ? 'Paint-Vollbild beenden' : 'Paint-Fenster maximieren');
      paintMaximizeButton.title = isFullscreen ? 'Vollbild beenden (Esc)' : 'Vollbild';
    }
    paintMaximizeButton.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      if(document.fullscreenElement === paintWin){
        document.exitFullscreen().catch(function(error){
          console.error('Could not exit Paint fullscreen:', error);
        });
        return;
      }
      if(paintWin.classList.contains('is-maximized')){
        restorePaintMaximizedWindow();
        updatePaintFullscreenButton();
        return;
      }
      if(typeof paintWin.requestFullscreen === 'function'){
        paintWin.requestFullscreen().catch(function(error){
          console.warn('Paint fullscreen is unavailable; using window maximize instead.', error);
          maximizePaintWindow();
        });
      } else {
        maximizePaintWindow();
      }
    });
    document.addEventListener('fullscreenchange', updatePaintFullscreenButton);

    function layout(){
      var heroRect = heroWin.getBoundingClientRect();
      var heroLeft = (window.innerWidth - heroRect.width) / 2;
      var heroTop = window.innerHeight * 0.20;
      var conceptLeft = window.innerWidth * 0.125;
      var conceptTop = window.innerHeight * 0.565;
      var paintLeft = window.innerWidth * 0.34;
      var paintTop = window.innerHeight * 0.18;
      var storyLeft = window.innerWidth * 0.55;
      var storyTop = window.innerHeight * 0.60;
      var browserLeft = window.innerWidth * 0.20;
      var browserTop = window.innerHeight * 0.22;
      return { heroLeft: heroLeft, heroTop: heroTop, conceptLeft: conceptLeft, conceptTop: conceptTop, paintLeft: paintLeft, paintTop: paintTop, storyLeft: storyLeft, storyTop: storyTop, browserLeft: browserLeft, browserTop: browserTop };
    }

    var initial = layout();
    var bsodArmed = true;

    function overlapArea(a, b){
      var x1 = Math.max(a.left, b.left), x2 = Math.min(a.right, b.right);
      var y1 = Math.max(a.top, b.top), y2 = Math.min(a.bottom, b.bottom);
      var w = Math.max(0, x2 - x1), h = Math.max(0, y2 - y1);
      return w * h;
    }

    function checkStartCollision(){
      if(!bsodArmed) return;
      var winRect = heroWin.getBoundingClientRect();
      var startRect = document.querySelector('.start-btn').getBoundingClientRect();
      var area = overlapArea(winRect, startRect);
      var startArea = startRect.width * startRect.height;
      if(area >= startArea * 0.9){
        bsodArmed = false;
        triggerBSOD();
      }
    }

    var objectiveTimer = null;
    function startObjectiveFlicker(){
      var el = document.getElementById('bsodObjective');
      function roll(){
        var n = Math.floor(1000 + Math.random() * 9000);
        el.textContent = 'You are not supposed to leave... yet... Specimen ' + n;
      }
      roll();
      objectiveTimer = setInterval(roll, 60);
    }
    function stopObjectiveFlicker(){
      if(objectiveTimer) clearInterval(objectiveTimer);
      objectiveTimer = null;
    }

    function triggerBSOD(){
      var el = document.getElementById('bsod');
      el.classList.add('is-active');
      startObjectiveFlicker();
      animateWindowClose(heroWin);
      el.addEventListener('click', function onClick(){
        el.removeEventListener('click', onClick);
        stopObjectiveFlicker();
        el.classList.remove('is-active');
        bsodArmed = true;
      });
    }

    var snakeWindow = document.getElementById('snakeWindow');
    var snakeTaskButton = document.getElementById('taskSnake');
    var snakeWindowCtrl = null;
    var snakeMaximizeButton = snakeWindow.querySelector('.xp-controls button:nth-child(2)');
    var snakeRestoreStyles = null;
    var snakeCanvas = document.getElementById('snakeCanvas');
    var snakeContext = snakeCanvas.getContext('2d');
    var snakeScoreEl = document.getElementById('snakeScore');
    var snakeMessageEl = document.getElementById('snakeMessage');
    var snakeInterval = null;
    var snakeBody = [];
    var snakeDirection = { x: 0, y: 0 };
    var snakeNextDirection = { x: 0, y: 0 };
    var snakeFood = { x: 14, y: 10 };
    var snakeScore = 0;
    var snakeGameOver = false;
    var snakeStarted = false;
    var snakeArrangementLatched = false;
    var snakeCellSize = 16;
    var heroCtrl = makeDraggable(heroWin, '.xp-titlebar', initial.heroLeft, initial.heroTop, function(x, y){
      posLabel.textContent = 'x: ' + Math.round(x) + ', y: ' + Math.round(y);
      checkStartCollision();
      checkSnakeArrangement();
    });
    var conceptCtrl = makeDraggable(conceptWin, '.xp-titlebar', initial.conceptLeft, initial.conceptTop, checkSnakeArrangement);
    var paintCtrl = makeDraggable(paintWin, '.xp-titlebar', initial.paintLeft, initial.paintTop, checkSnakeArrangement);
    var storyCtrl = makeDraggable(storyWin, '.xp-titlebar', initial.storyLeft, initial.storyTop);
    var browserCtrl = makeDraggable(browserWin, '.xp-titlebar', initial.browserLeft, initial.browserTop);

    function drawSnake(){
      var size = snakeCanvas.width;
      var cells = size / snakeCellSize;
      snakeContext.fillStyle = '#101820';
      snakeContext.fillRect(0, 0, size, size);
      snakeContext.strokeStyle = 'rgba(255,255,255,.055)';
      snakeContext.lineWidth = 1;
      for(var i = 0; i <= cells; i++){
        var gridPos = i * snakeCellSize + .5;
        snakeContext.beginPath();
        snakeContext.moveTo(gridPos, 0);
        snakeContext.lineTo(gridPos, size);
        snakeContext.moveTo(0, gridPos);
        snakeContext.lineTo(size, gridPos);
        snakeContext.stroke();
      }

      snakeContext.fillStyle = '#ff5a4d';
      snakeContext.beginPath();
      snakeContext.arc((snakeFood.x + .5) * snakeCellSize, (snakeFood.y + .5) * snakeCellSize, snakeCellSize * .38, 0, Math.PI * 2);
      snakeContext.fill();
      snakeContext.fillStyle = '#ffd7a8';
      snakeContext.fillRect(snakeFood.x * snakeCellSize + 4, snakeFood.y * snakeCellSize + 3, 3, 3);

      snakeBody.forEach(function(part, index){
        snakeContext.fillStyle = index === 0 ? '#d8ff66' : '#7fe066';
        snakeContext.fillRect(part.x * snakeCellSize + 1, part.y * snakeCellSize + 1, snakeCellSize - 2, snakeCellSize - 2);
      });
      if(snakeGameOver){
        snakeContext.fillStyle = 'rgba(0,0,0,.62)';
        snakeContext.fillRect(0, 0, size, size);
        snakeContext.fillStyle = '#fff';
        snakeContext.textAlign = 'center';
        snakeContext.font = 'bold 20px Tahoma, sans-serif';
        snakeContext.fillText('GAME OVER', size / 2, size / 2);
      }
    }

    function placeSnakeFood(){
      var cells = snakeCanvas.width / snakeCellSize;
      do {
        snakeFood = { x: Math.floor(Math.random() * cells), y: Math.floor(Math.random() * cells) };
      } while(snakeBody.some(function(part){ return part.x === snakeFood.x && part.y === snakeFood.y; }));
    }

    function stopSnake(){
      if(snakeInterval) clearInterval(snakeInterval);
      snakeInterval = null;
    }

    function snakeStep(){
      snakeDirection = snakeNextDirection;
      var head = {
        x: snakeBody[0].x + snakeDirection.x,
        y: snakeBody[0].y + snakeDirection.y
      };
      var grows = head.x === snakeFood.x && head.y === snakeFood.y;
      var collisionBody = grows ? snakeBody : snakeBody.slice(0, -1);
      var cells = snakeCanvas.width / snakeCellSize;
      if(head.x < 0 || head.y < 0 || head.x >= cells || head.y >= cells ||
         collisionBody.some(function(part){ return part.x === head.x && part.y === head.y; })){
        snakeGameOver = true;
        snakeMessageEl.textContent = 'GAME OVER — ENTER TO RETRY';
        stopSnake();
        drawSnake();
        return;
      }
      snakeBody.unshift(head);
      if(grows){
        snakeScore += 10;
        snakeScoreEl.textContent = String(snakeScore);
        placeSnakeFood();
      } else {
        snakeBody.pop();
      }
      drawSnake();
    }

    function startSnake(){
      stopSnake();
      snakeScore = 0;
      snakeScoreEl.textContent = '0';
      snakeGameOver = false;
      snakeStarted = false;
      snakeDirection = { x: 0, y: 0 };
      snakeNextDirection = { x: 0, y: 0 };
      snakeBody = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
      placeSnakeFood();
      snakeMessageEl.textContent = 'ARROWS / WASD TO START';
      drawSnake();
    }

    function closeSnake(){
      stopSnake();
      snakeWindow.classList.add('is-hidden');
      snakeWindow.classList.add('is-inactive');
      snakeTaskButton.classList.remove('is-pressed');
    }

    function openSnake(){
      snakeWindow.classList.remove('is-hidden', 'is-inactive');
      snakeTaskButton.classList.remove('is-hidden');
      snakeTaskButton.classList.add('is-pressed');
      if(!snakeWindowCtrl){
        var rect = snakeWindow.getBoundingClientRect();
        snakeWindowCtrl = makeDraggable(
          snakeWindow,
          '.xp-titlebar',
          (window.innerWidth - rect.width) / 2,
          (window.innerHeight - rect.height - 40) / 2
        );
      }
      if(snakeStarted && !snakeGameOver && !snakeInterval){
        snakeInterval = setInterval(snakeStep, 125);
      }
    }

    function checkSnakeArrangement(){
      var viewWidth = window.innerWidth;
      var viewHeight = window.innerHeight;
      var targets = [
        { win: conceptWin, x: .041, y: .118, w: .367, h: .178 },
        { win: paintWin, x: .344, y: .141, w: .270, h: .573 },
        { win: heroWin, x: .493, y: .470, w: .448, h: .257 }
      ];
      var matches = targets.every(function(target){
        if(target.win.classList.contains('is-hidden') || target.win.classList.contains('is-maximized')) return false;
        var rect = target.win.getBoundingClientRect();
        return Math.abs(rect.left / viewWidth - target.x) < .14 &&
          Math.abs(rect.top / viewHeight - target.y) < .14 &&
          Math.abs(rect.width / viewWidth - target.w) < .19 &&
          Math.abs(rect.height / viewHeight - target.h) < .19;
      });
      if(!matches){
        if(snakeWindow.classList.contains('is-hidden')) snakeArrangementLatched = false;
        return;
      }
      if(snakeArrangementLatched) return;
      snakeArrangementLatched = true;
      openSnake();
      startSnake();
    }

    document.getElementById('snakeClose').addEventListener('click', closeSnake);
    document.getElementById('snakeMinimize').addEventListener('click', closeSnake);
    snakeTaskButton.addEventListener('click', openSnake);
    snakeMaximizeButton.addEventListener('click', function(){
      if(!snakeWindow.classList.contains('is-maximized')){
        snakeRestoreStyles = {
          width: snakeWindow.style.width,
          height: snakeWindow.style.height,
          transform: snakeWindow.style.transform
        };
        snakeWindow.classList.add('is-maximized');
        snakeMaximizeButton.textContent = '❐';
        snakeMaximizeButton.setAttribute('aria-label', 'Snake wiederherstellen');
        snakeMaximizeButton.title = 'Wiederherstellen';
      } else {
        snakeWindow.classList.remove('is-maximized');
        snakeWindow.style.width = snakeRestoreStyles.width;
        snakeWindow.style.height = snakeRestoreStyles.height;
        snakeWindow.style.transform = snakeRestoreStyles.transform;
        snakeRestoreStyles = null;
        snakeMaximizeButton.textContent = '□';
        snakeMaximizeButton.setAttribute('aria-label', 'Snake maximieren');
        snakeMaximizeButton.title = 'Maximieren';
      }
    });
    document.addEventListener('keydown', function(e){
      if(snakeWindow.classList.contains('is-hidden')) return;
      e.stopImmediatePropagation();
      if(e.key === 'Escape'){
        e.preventDefault();
        closeSnake();
        return;
      }
      if(e.key === 'Enter' && snakeGameOver){
        e.preventDefault();
        startSnake();
        return;
      }
      var directions = {
        ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }
      };
      var next = directions[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if(!next) return;
      e.preventDefault();
      if(snakeGameOver) return;
      if(!snakeStarted){
        snakeStarted = true;
        snakeDirection = next;
        snakeNextDirection = next;
        snakeMessageEl.textContent = 'EAT THE RED APPLES';
        snakeInterval = setInterval(snakeStep, 125);
        return;
      }
      if(next.x === -snakeDirection.x && next.y === -snakeDirection.y) return;
      snakeNextDirection = next;
    });

    document.addEventListener('pointerup', checkSnakeArrangement);

    window.addEventListener('resize', function(){
      var l = layout();
      heroCtrl.recompute(l.heroLeft, l.heroTop);
      conceptCtrl.recompute(l.conceptLeft, l.conceptTop);
      paintCtrl.recompute(l.paintLeft, l.paintTop);
      storyCtrl.recompute(l.storyLeft, l.storyTop);
      browserCtrl.recompute(l.browserLeft, l.browserTop);
      checkSnakeArrangement();
    });

    document.getElementById('taskGameWindow').addEventListener('click', function(e){
      e.preventDefault();
      heroWin.classList.remove('is-hidden');
      var l = layout();
      heroCtrl.reset(l.heroLeft, l.heroTop);
    });
    document.getElementById('taskConcept').addEventListener('click', function(e){
      e.preventDefault();
      conceptWin.classList.remove('is-hidden');
      var l = layout();
      conceptCtrl.reset(l.conceptLeft, l.conceptTop);
    });
    document.getElementById('taskPaint').addEventListener('click', function(e){
      e.preventDefault();
      paintWin.classList.remove('is-hidden');
      var l = layout();
      paintCtrl.reset(l.paintLeft, l.paintTop);
    });
    document.getElementById('taskStory').addEventListener('click', function(e){
      e.preventDefault();
      storyWin.classList.remove('is-hidden');
      var l = layout();
      storyCtrl.reset(l.storyLeft, l.storyTop);
    });
    document.getElementById('taskBrowser').addEventListener('click', function(e){
      e.preventDefault();
      browserWin.classList.remove('is-hidden');
      var l = layout();
      browserCtrl.reset(l.browserLeft, l.browserTop);
    });

    function animateWindowClose(win, cb){
      if(win.classList.contains('is-hidden')) { if(cb) cb(); return; }
      var baseTransform = win.style.transform || '';
      var duration = 260;
      var startTs = null;
      win.style.willChange = 'transform, opacity';
      function frame(ts){
        if(startTs === null) startTs = ts;
        var t = Math.min(1, (ts - startTs) / duration);
        var eased = t * t;
        var scale = 1 - 0.55 * eased;
        win.style.opacity = String(1 - eased);
        win.style.transform = baseTransform + ' scale(' + scale + ')';
        if(t < 1){
          requestAnimationFrame(frame);
        } else {
          win.classList.add('is-hidden');
          win.style.opacity = '';
          win.style.transform = baseTransform;
          win.style.willChange = '';
          if(cb) cb();
        }
      }
      requestAnimationFrame(frame);
    }

    window.closeAllWindowsForTimeTravel = function(){
      animateWindowClose(heroWin);
      animateWindowClose(conceptWin);
      animateWindowClose(paintWin);
      animateWindowClose(storyWin);
      animateWindowClose(browserWin);
    };

    ['dragWindow','conceptWindow','paintWindow','storyWindow','browserWindow','logWindow'].forEach(function(id){
      var win = document.getElementById(id);
      var btn = win && win.querySelector('.xp-controls .close');
      if(btn){
        btn.addEventListener('click', function(){
          animateWindowClose(win);
        });
      }
    });

    var LOG_LINES = [
      'Specimen 3582 - closed window',
      'Specimen 2854 - finished',
      'Specimen 9523 - Started Training',
      'Specimen 5650 - Unknown'
    ];

    function typeLogLines(el, lines, cb){
      el.textContent = '';
      var li = 0;
      function nextLine(){
        if(li >= lines.length){ if(cb) cb(); return; }
        var line = lines[li];
        var buffer = el.textContent;
        var ci = 0;
        function typeChar(){
          if(ci <= line.length){
            el.textContent = buffer + line.slice(0, ci);
            ci++;
            setTimeout(typeChar, 18);
          } else {
            el.textContent = buffer + line + '\n';
            li++;
            setTimeout(nextLine, 260);
          }
        }
        typeChar();
      }
      nextLine();
    }

    function escapeHtml(s){
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
    function inlineMarkdown(s){
      s = escapeHtml(s);
      s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      return s;
    }
    function markdownToHtml(md){
      var blocks = md.trim().split(/\n\s*\n/);
      var html = '';
      blocks.forEach(function(block){
        var lines = block.split('\n');
        var headingMatch = lines[0].match(/^#{1,6}\s+(.*)$/);
        if(headingMatch){
          html += '<h3>' + inlineMarkdown(headingMatch[1]) + '</h3><hr>';
          lines.shift();
          if(lines.length){
            html += '<p>' + inlineMarkdown(lines.join('\n')).replace(/\n/g, '<br>') + '</p>';
          }
        } else {
          html += '<p>' + inlineMarkdown(block).replace(/\n/g, '<br>') + '</p>';
        }
      });
      return html;
    }

    var STORY_MARKDOWN =
      '### "The Window Is The Game"\n' +
      'is a meta-adventure where the player initially believes\n' +
      'they\u2019re playing a normal puzzle game.\n' +
      'But shortly after, they discover that the game is actually running\n' +
      'on a virtual, fake desktop.\n\n' +
      'By digging through files and exploring various apps,\n' +
      'the player slowly uncovers the true story behind everything\n' +
      'they encounter on this artificial system.\n\n' +
      'But beware of the **Narrator**.\n' +
      'At first, he seems friendly and helpful,\n' +
      'yet over time he becomes increasingly hostile,\n' +
      'closing apps you open, interfering with your progress,\n' +
      'and manipulating the desktop itself to stop you.';

    var storyBodyEl = document.getElementById('storyBody');
    if(storyBodyEl){
      storyBodyEl.innerHTML = markdownToHtml(STORY_MARKDOWN);
    }

    window.showTimeTravelLog = function(){
      logWin.classList.remove('is-hidden');
      logWin.classList.remove('is-inactive');
      logWin.classList.add('is-revealing');
      var left = window.innerWidth * 0.30;
      var top = window.innerHeight * 0.28;
      if(!logCtrl){
        logCtrl = makeDraggable(logWin, '.xp-titlebar', left, top);
      } else {
        logCtrl.reset(left, top);
      }
      setTimeout(function(){
        logWin.classList.remove('is-revealing');
        typeLogLines(document.getElementById('logText'), LOG_LINES);
      }, 750);
      setTimeout(function(){
        if(audioTooEarly){
          audioTooEarly.currentTime = 0;
          audioTooEarly.play().catch(function(){});
        }
      }, 900);
    };
  })();

  /* ---------- Browser-Fenster ---------- */
  (function(){
    var SEARCH_SUGGESTIONS = []; /* kommen noch */

    function isSearchUnlocked(){
      try{ return localStorage.getItem('witg_search_unlocked') === '1'; }catch(err){ return false; }
    }

    function homeHtml(){
      var links = '<li><button type="button" class="browser-link" data-target="about">about_this_pc</button></li>' +
        '<li><button type="button" class="browser-link" data-target="restricted">restricted_area</button></li>';
      if(isSearchUnlocked()){
        links += '<li><button type="button" class="browser-link" data-target="search">search</button></li>';
      }
      return '<h2>Local Start Page</h2>' +
        '<p>No network connection detected. Showing cached pages only.</p>' +
        '<ul class="browser-links">' + links + '</ul>';
    }

    var pages = {
      about: {
        url: 'local://desktop/about_this_pc',
        html: '<h2>About This PC</h2>' +
          '<p>System is running in a limited offline mode.</p>' +
          '<p>Some files and locations are not accessible from this browser.</p>' +
          '<ul class="browser-links">' +
            '<li><button type="button" class="browser-link" data-target="home">back to start page</button></li>' +
          '</ul>'
      },
      restricted: {
        url: 'local://desktop/restricted_area',
        html: '<h2 class="browser-error">This page cannot be displayed</h2>' +
          '<p>You do not have permission to view this content.</p>' +
          '<ul class="browser-links">' +
            '<li><button type="button" class="browser-link" data-target="home">back to start page</button></li>' +
          '</ul>'
      },
      search: {
        url: 'local://desktop/search',
        html: '<h2>Search</h2>' +
          '<div class="browser-search-box">' +
            '<input type="text" id="browserSearchInput" placeholder="Type to search…" autocomplete="off">' +
          '</div>' +
          '<ul class="browser-suggestions" id="browserSuggestions"></ul>' +
          '<ul class="browser-links">' +
            '<li><button type="button" class="browser-link" data-target="home">back to start page</button></li>' +
          '</ul>'
      }
    };

    var history = ['home'];
    var historyIndex = 0;

    var pageEl = document.getElementById('browserPage');
    var addressEl = document.getElementById('browserAddress');
    var statusEl = document.getElementById('browserStatus');

    function updateSuggestions(query){
      var list = document.getElementById('browserSuggestions');
      if(!list) return;
      list.innerHTML = '';
      if(!query) return;
      var q = query.toLowerCase();
      SEARCH_SUGGESTIONS
        .filter(function(s){ return s.toLowerCase().indexOf(q) !== -1; })
        .forEach(function(s){
          var li = document.createElement('li');
          li.textContent = s;
          list.appendChild(li);
        });
    }

    function currentPage(key){
      if(key === 'home' || !pages[key]){
        return { url: 'local://desktop/home', html: homeHtml() };
      }
      return pages[key];
    }

    function renderPage(key){
      var page = currentPage(key);
      addressEl.textContent = page.url;
      statusEl.textContent = 'Loading…';
      pageEl.innerHTML = '';
      setTimeout(function(){
        pageEl.innerHTML = page.html;
        statusEl.textContent = 'Done';
        pageEl.querySelectorAll('.browser-link').forEach(function(link){
          link.addEventListener('click', function(){
            navigateTo(link.getAttribute('data-target'));
          });
        });
        var searchInput = document.getElementById('browserSearchInput');
        if(searchInput){
          searchInput.addEventListener('input', function(){
            updateSuggestions(searchInput.value);
          });
        }
      }, 180);
    }

    function navigateTo(key){
      if(key !== 'home' && !pages[key]) return;
      history = history.slice(0, historyIndex + 1);
      history.push(key);
      historyIndex = history.length - 1;
      renderPage(key);
    }

    document.getElementById('browserBack').addEventListener('click', function(){
      if(historyIndex > 0){
        historyIndex--;
        renderPage(history[historyIndex]);
      }
    });
    document.getElementById('browserForward').addEventListener('click', function(){
      if(historyIndex < history.length - 1){
        historyIndex++;
        renderPage(history[historyIndex]);
      }
    });
    document.getElementById('browserRefresh').addEventListener('click', function(){
      renderPage(history[historyIndex]);
    });
    document.getElementById('browserGo').addEventListener('click', function(){
      renderPage(history[historyIndex]);
    });

    renderPage('home');
  })();

  /* ---------- Paint-Fenster ---------- */
  (function(){
    var canvas = document.getElementById('paintCanvas');
    var canvasWrap = document.getElementById('paintCanvasWrap');
    var viewCtx = canvas.getContext('2d');
    var artwork = document.createElement('canvas');
    var canvasWidthInput = document.getElementById('paintCanvasWidth');
    var canvasHeightInput = document.getElementById('paintCanvasHeight');
    var canvasPresetInput = document.getElementById('paintCanvasPreset');
    var qualityInput = document.getElementById('paintQuality');
    var exportScaleInput = document.getElementById('paintExportScale');
    var exportFormatInput = document.getElementById('paintExportFormat');
    var exportContentInput = document.getElementById('paintExportContent');
    var exportTransparentInput = document.getElementById('paintExportTransparent');
    var optionsPanel = document.getElementById('paintOptions');
    var optionsToggle = document.getElementById('paintOptionsToggle');
    var optionsNote = document.getElementById('paintOptionsNote');
    var displayQuality = qualityInput.value;
    artwork.width = 1420;
    artwork.height = 1040;
    var layers = [];
    var activeLayerIndex = 0;
    var ctx = null;
    var colors = ['#111111','#ff5a4d','#4dc9ff','#7fe066','#ffcc33','#c084fc','#ffffff'];
    var currentColor = colors[0];
    var colorOpacityInput = document.getElementById('paintColorOpacity');
    var brushSize = 2;
    var currentTool = 'brush';
    var drawing = false;
    var panning = null;
    var last = null;
    var dragStart = null;
    var strokeBaseline = null;
    var selection = null;
    var selectionStart = null;
    var selectionMove = null;
    var shapeFill = false;
    var zoom = 1;
    var panX = 0;
    var panY = 0;
    var undoStack = [];
    var redoStack = [];
    var UNDO_LIMIT = 12;
    var brushOpacityInput = document.getElementById('paintBrushOpacity');
    var brushHardnessInput = document.getElementById('paintBrushHardness');
    var brushSmoothingInput = document.getElementById('paintBrushSmoothing');
    var fillToleranceInput = document.getElementById('paintFillTolerance');
    var fillContiguousInput = document.getElementById('paintFillContiguous');
    var fillAllLayersInput = document.getElementById('paintFillAllLayers');
    var selectionOptions = document.getElementById('paintSelectionOptions');
    var fillOptions = document.getElementById('paintFillOptions');
    var brushOptions = document.getElementById('paintBrushOptions');
    var lastRawPoint = null;
    var swatchButtons = [];
    var customColorWrap = null;
    var customColorInput = null;
    var strokeSettings = document.getElementById('paintStrokeSettings');
    var strokeWidthInput = document.getElementById('paintStrokeWidth');
    var strokeStyleInput = document.getElementById('paintStrokeStyle');
    var tooltip = document.createElement('div');
    var tooltipTarget = null;
    tooltip.className = 'paint-tooltip';
    tooltip.hidden = true;
    document.body.appendChild(tooltip);

    function showTooltip(target){
      tooltipTarget = target;
      tooltip.textContent = target.getAttribute('data-tip');
      tooltip.hidden = false;
      var rect = target.getBoundingClientRect();
      var bounds = tooltip.getBoundingClientRect();
      var left;
      var top;
      if(target.closest('.paint-tools-vertical')){
        left = rect.right + 7;
        if(left + bounds.width > window.innerWidth - 4) left = rect.left - bounds.width - 7;
        top = rect.top + (rect.height - bounds.height) / 2;
      } else {
        left = rect.left + (rect.width - bounds.width) / 2;
        top = rect.top - bounds.height - 6;
        if(top < 4) top = rect.bottom + 6;
      }
      left = Math.max(4, Math.min(left, window.innerWidth - bounds.width - 4));
      top = Math.max(4, Math.min(top, window.innerHeight - bounds.height - 4));
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    }

    function hideTooltip(){
      tooltip.hidden = true;
      tooltipTarget = null;
    }

    document.querySelectorAll('[data-tip]').forEach(function(element){
      if(!element.hasAttribute('aria-label')) element.setAttribute('aria-label', element.getAttribute('data-tip'));
      element.removeAttribute('title');
    });
    document.addEventListener('pointerover', function(e){
      var target = e.target.closest('[data-tip]');
      if(target) showTooltip(target);
    });
    document.addEventListener('pointerout', function(e){
      if(tooltipTarget && tooltipTarget.contains(e.target) && !tooltipTarget.contains(e.relatedTarget)) hideTooltip();
    });
    document.addEventListener('focusin', function(e){
      var target = e.target.closest('[data-tip]');
      if(target) showTooltip(target);
    });
    document.addEventListener('focusout', function(e){
      if(tooltipTarget && tooltipTarget.contains(e.target)) hideTooltip();
    });
    window.addEventListener('resize', function(){
      if(tooltipTarget) showTooltip(tooltipTarget);
    });
    function makeLayer(name, visible, isBackground){
      var layerCanvas = document.createElement('canvas');
      layerCanvas.width = artwork.width;
      layerCanvas.height = artwork.height;
      return {
        name: name,
        visible: visible,
        opacity: 1,
        isBackground: Boolean(isBackground),
        canvas: layerCanvas,
        undo: [],
        redo: []
      };
    }

    layers.push(makeLayer('Background', true, true));
    layers[0].undo = undoStack;
    layers[0].redo = redoStack;
    ctx = layers[0].canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, artwork.width, artwork.height);

    function setActiveLayer(index){
      if(selectionMove) ctx.putImageData(selectionMove.baseline, 0, 0);
      selection = null;
      selectionStart = null;
      selectionMove = null;
      activeLayerIndex = index;
      ctx = layers[index].canvas.getContext('2d', { willReadFrequently: true });
      undoStack = layers[index].undo;
      redoStack = layers[index].redo;
      var layerOpacity = Math.round(layers[index].opacity * 100);
      document.getElementById('paintLayerOpacity').value = String(layerOpacity);
      document.getElementById('paintLayerOpacityValue').textContent = layerOpacity + '%';
      renderLayerList();
      renderCanvas();
    }

    function renderLayerList(){
      var list = document.getElementById('paintLayerList');
      list.textContent = '';
      layers.forEach(function(layer, index){
        var row = document.createElement('div');
        row.className = 'paint-layer-item' + (index === activeLayerIndex ? ' is-active' : '');
        row.setAttribute('role', 'option');
        row.setAttribute('aria-selected', String(index === activeLayerIndex));
        var visibility = document.createElement('input');
        visibility.type = 'checkbox';
        visibility.checked = layer.visible;
        visibility.setAttribute('aria-label', 'Show ' + layer.name);
        visibility.addEventListener('click', function(e){ e.stopPropagation(); });
        visibility.addEventListener('change', function(){
          layer.visible = visibility.checked;
          renderCanvas();
        });
        var name = document.createElement('span');
        name.textContent = layer.name;
        name.title = 'Double-click to rename';
        name.addEventListener('dblclick', function(e){
          e.stopPropagation();
          var nextName = window.prompt('Layer name', layer.name);
          if(nextName && nextName.trim()){
            layer.name = nextName.trim().slice(0, 40);
            renderLayerList();
          }
        });
        var preview = document.createElement('canvas');
        preview.className = 'paint-layer-thumb';
        preview.width = 48;
        preview.height = 32;
        preview.setAttribute('data-layer-index', String(index));
        preview.setAttribute('aria-hidden', 'true');
        preview.getContext('2d').drawImage(layer.canvas, 0, 0, preview.width, preview.height);
        row.appendChild(visibility);
        row.appendChild(preview);
        row.appendChild(name);
        row.addEventListener('click', function(){ setActiveLayer(index); });
        list.appendChild(row);
      });
      document.getElementById('paintLayerCurrent').textContent = layers[activeLayerIndex].name;
      document.getElementById('paintDeleteLayer').disabled = layers.length <= 1;
      document.getElementById('paintAddLayer').disabled = layers.length >= 20;
      refreshLayerThumbs();
    }

    function refreshLayerThumbs(){
      document.querySelectorAll('.paint-layer-thumb').forEach(function(preview){
        var layer = layers[Number(preview.getAttribute('data-layer-index'))];
        if(!layer) return;
        var previewCtx = preview.getContext('2d');
        previewCtx.clearRect(0, 0, preview.width, preview.height);
        if(!layer.visible) return;
        previewCtx.globalAlpha = layer.opacity;
        previewCtx.drawImage(layer.canvas, 0, 0, preview.width, preview.height);
        previewCtx.globalAlpha = 1;
      });
    }

    var layerToggle = document.getElementById('paintLayerToggle');
    var layerContent = document.getElementById('paintLayerContent');
    function setLayerPanelOpen(open){
      layerContent.hidden = !open;
      layerToggle.setAttribute('aria-expanded', String(open));
      layerToggle.setAttribute('title', open ? 'Collapse layers' : 'Expand layers');
      layerToggle.querySelector('.paint-layer-chevron').textContent = open ? '▾' : '▸';
    }
    layerToggle.addEventListener('click', function(){
      setLayerPanelOpen(layerContent.hidden);
    });
    document.getElementById('paintAddLayer').addEventListener('click', function(){
      if(layers.length >= 20) return;
      var layer = makeLayer('Layer ' + (layers.length + 1), true);
      layers.push(layer);
      setLayerPanelOpen(true);
      setActiveLayer(layers.length - 1);
    });
    document.getElementById('paintDeleteLayer').addEventListener('click', function(){
      if(layers.length <= 1) return;
      layers.splice(activeLayerIndex, 1);
      setActiveLayer(Math.max(0, activeLayerIndex - 1));
    });
    document.getElementById('paintLayerUp').addEventListener('click', function(){
      if(activeLayerIndex >= layers.length - 1) return;
      var moving = layers.splice(activeLayerIndex, 1)[0];
      layers.splice(activeLayerIndex + 1, 0, moving);
      setActiveLayer(activeLayerIndex + 1);
    });
    document.getElementById('paintLayerDown').addEventListener('click', function(){
      if(activeLayerIndex <= 0) return;
      var moving = layers.splice(activeLayerIndex, 1)[0];
      layers.splice(activeLayerIndex - 1, 0, moving);
      setActiveLayer(activeLayerIndex - 1);
    });
    document.getElementById('paintLayerOpacity').addEventListener('input', function(){
      layers[activeLayerIndex].opacity = Number(this.value) / 100;
      document.getElementById('paintLayerOpacityValue').textContent = this.value + '%';
      renderCanvas();
    });

    function composeArtwork(){
      var compositeCtx = artwork.getContext('2d', { willReadFrequently: true });
      compositeCtx.globalAlpha = 1;
      compositeCtx.globalCompositeOperation = 'source-over';
      compositeCtx.clearRect(0, 0, artwork.width, artwork.height);
      layers.forEach(function(layer){
        if(!layer.visible) return;
        compositeCtx.globalAlpha = layer.opacity;
        compositeCtx.drawImage(layer.canvas, 0, 0);
      });
      compositeCtx.globalAlpha = 1;
    }

    function restoreSnapshot(imageData){
      ctx.putImageData(imageData, 0, 0);
      renderCanvas();
    }

    function renderCanvas(){
      var availableWidth = canvasWrap.clientWidth;
      var availableHeight = canvasWrap.clientHeight;
      var ratio = artwork.width / artwork.height;
      var w = Math.min(availableWidth, availableHeight * ratio);
      var h = w / ratio;
      if(!w || !h) return;
      composeArtwork();
      refreshLayerThumbs();
      selectionOptions.hidden = currentTool !== 'select' || !selection || !selection.width || !selection.height;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      var pixelRatio = window.devicePixelRatio || 1;
      var pixelWidth = Math.max(1, Math.round(w * pixelRatio));
      var pixelHeight = Math.max(1, Math.round(h * pixelRatio));
      if(canvas.width !== pixelWidth || canvas.height !== pixelHeight){
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      var scale = w / artwork.width * zoom;
      var offsetX = (w - artwork.width * scale) / 2 + panX;
      var offsetY = (h - artwork.height * scale) / 2 + panY;
      viewCtx.clearRect(0, 0, canvas.width, canvas.height);
      viewCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      viewCtx.imageSmoothingEnabled = scale < 1 && displayQuality !== 'pixel';
      viewCtx.imageSmoothingQuality = displayQuality === 'high' ? 'high' : 'medium';
      canvas.style.imageRendering = scale >= 1 ? 'pixelated' : 'auto';
      viewCtx.drawImage(artwork, offsetX, offsetY, artwork.width * scale, artwork.height * scale);
      if(selection && selection.width > 0 && selection.height > 0){
        viewCtx.save();
        viewCtx.setLineDash([4, 3]);
        viewCtx.lineWidth = 1;
        viewCtx.strokeStyle = '#111';
        viewCtx.strokeRect(offsetX + selection.x * scale, offsetY + selection.y * scale, selection.width * scale, selection.height * scale);
        viewCtx.lineDashOffset = 4;
        viewCtx.strokeStyle = '#fff';
        viewCtx.strokeRect(offsetX + selection.x * scale, offsetY + selection.y * scale, selection.width * scale, selection.height * scale);
        viewCtx.restore();
      }
      viewCtx.setTransform(1, 0, 0, 1, 0, 0);
    }

    function buildSwatches(){
      var wrap = document.getElementById('paintSwatches');

      colors.forEach(function(c, i){
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'swatch' + (i === 0 ? ' is-active' : '');
        b.style.background = c;
        b.title = c;
        b.addEventListener('click', function(){
          currentColor = c;
          updateColorPreview();
          swatchButtons.forEach(function(s){ s.classList.remove('is-active'); });
          customColorWrap.classList.remove('is-active');
          b.classList.add('is-active');
          if(currentTool === 'eraser') setTool('brush');
        });
        swatchButtons.push(b);
        wrap.appendChild(b);
      });

      customColorWrap = document.createElement('label');
      customColorWrap.className = 'custom-color-wrap';
      customColorWrap.title = 'Custom color';
      customColorInput = document.createElement('input');
      customColorInput.type = 'color';
      customColorInput.value = '#808080';
      customColorInput.addEventListener('input', function(){
        currentColor = customColorInput.value;
        updateColorPreview();
        swatchButtons.forEach(function(s){ s.classList.remove('is-active'); });
        customColorWrap.classList.add('is-active');
        if(currentTool === 'eraser') setTool('brush');
      });
      customColorWrap.appendChild(customColorInput);
      wrap.appendChild(customColorWrap);
      updateColorPreview();
    }

    function updateColorPreview(){
      var opacity = Number(colorOpacityInput.value) / 100;
      document.getElementById('paintColorOpacityValue').textContent = colorOpacityInput.value + '%';
      document.getElementById('paintColorPreview').style.backgroundColor = currentColor;
      document.getElementById('paintColorPreview').style.opacity = String(opacity);
      customColorWrap.style.backgroundColor = currentColor;
    }
    colorOpacityInput.addEventListener('input', updateColorPreview);

    function setTool(tool){
      if(currentTool === 'select' && tool !== 'select'){
        if(selectionMove) ctx.putImageData(selectionMove.baseline, 0, 0);
        selection = null;
        selectionStart = null;
        selectionMove = null;
        drawing = false;
        renderCanvas();
      }
      currentTool = tool;
      document.querySelectorAll('.tool-btn').forEach(function(btn){
        btn.classList.toggle('is-active', btn.getAttribute('data-tool') === tool);
      });
      strokeSettings.hidden = tool !== 'line' && tool !== 'rect' && tool !== 'ellipse';
      document.getElementById('paintShapeFillOption').hidden = tool === 'line';
      brushOptions.hidden = tool !== 'brush' && tool !== 'eraser';
      fillOptions.hidden = tool !== 'bucket';
      selectionOptions.hidden = tool !== 'select' || !selection || !selection.width || !selection.height;
    }
    document.querySelectorAll('.tool-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        setTool(btn.getAttribute('data-tool'));
      });
    });

    function getPos(e){
      var rect = canvas.getBoundingClientRect();
      var availableWidth = canvas.clientWidth;
      var availableHeight = canvas.clientHeight;
      var scale = Math.min(availableWidth / artwork.width, availableHeight / artwork.height) * zoom;
      var offsetX = (availableWidth - artwork.width * scale) / 2 + panX;
      var offsetY = (availableHeight - artwork.height * scale) / 2 + panY;
      return {
        x: Math.max(0, Math.min(artwork.width, (e.clientX - rect.left - offsetX) / scale)),
        y: Math.max(0, Math.min(artwork.height, (e.clientY - rect.top - offsetY) / scale))
      };
    }

    function getBrushWidth(){
      return brushSize;
    }

    function configurePaintContext(){
      ctx.globalAlpha = Number(brushOpacityInput.value) * Number(colorOpacityInput.value) / 10000;
      var softness = 100 - Number(brushHardnessInput.value);
      ctx.filter = softness > 0 ? 'blur(' + (brushSize * softness / 250) + 'px)' : 'none';
      ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
    }

    function resetPaintContext(){
      ctx.globalAlpha = 1;
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'source-over';
    }

    function smoothPoint(point){
      var smoothing = Number(brushSmoothingInput.value);
      if(!smoothing || !lastRawPoint) return point;
      var amount = 1 / (smoothing + 1);
      return {
        x: lastRawPoint.x + (point.x - lastRawPoint.x) * amount,
        y: lastRawPoint.y + (point.y - lastRawPoint.y) * amount
      };
    }

    function snapshot(){
      return ctx.getImageData(0, 0, artwork.width, artwork.height);
    }

    function pushUndoSnapshot(){
      try{
        undoStack.push(snapshot());
        if(undoStack.length > UNDO_LIMIT) undoStack.shift();
        redoStack.length = 0;
        return true;
      }catch(err){
        console.error('Could not save Paint undo snapshot.', err);
        document.getElementById('paintStatus').textContent = 'Undo snapshot failed';
        return false;
      }
    }

    function normalizedRect(a, b){
      return {
        x: Math.min(a.x, b.x),
        y: Math.min(a.y, b.y),
        width: Math.abs(b.x - a.x),
        height: Math.abs(b.y - a.y)
      };
    }

    function drawShape(point, constrain){
      ctx.beginPath();
      var strokeStyle = strokeStyleInput.value;
      ctx.lineCap = strokeStyle === 'dotted' ? 'round' : 'butt';
      if(currentTool === 'line'){
        ctx.moveTo(dragStart.x, dragStart.y);
        ctx.lineTo(point.x, point.y);
      } else if(currentTool === 'ellipse'){
        var ellipsePoint = point;
        if(constrain){
          var size = Math.max(Math.abs(point.x - dragStart.x), Math.abs(point.y - dragStart.y));
          ellipsePoint = {
            x: dragStart.x + (point.x < dragStart.x ? -size : size),
            y: dragStart.y + (point.y < dragStart.y ? -size : size)
          };
        }
        var rect = normalizedRect(dragStart, ellipsePoint);
        ctx.ellipse(rect.x + rect.width / 2, rect.y + rect.height / 2, Math.max(rect.width / 2, 0.5), Math.max(rect.height / 2, 0.5), 0, 0, Math.PI * 2);
      } else {
        ctx.rect(Math.min(dragStart.x, point.x), Math.min(dragStart.y, point.y), Math.abs(point.x - dragStart.x), Math.abs(point.y - dragStart.y));
      }
      var strokeWidth = parseInt(strokeWidthInput.value, 10);
      ctx.lineWidth = strokeWidth;
      ctx.setLineDash(strokeStyle === 'dashed' ? [8, 5] : strokeStyle === 'dotted' ? [1, 4] : []);
      if(shapeFill && currentTool !== 'line') ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function chooseColorAt(point){
      composeArtwork();
      var pixel = artwork.getContext('2d', { willReadFrequently: true }).getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1).data;
      currentColor = '#' + [pixel[0], pixel[1], pixel[2]].map(function(value){
        return value.toString(16).padStart(2, '0');
      }).join('');
      colorOpacityInput.value = String(Math.round(pixel[3] / 255 * 100));
      updateColorPreview();
      swatchButtons.forEach(function(button){ button.classList.remove('is-active'); });
      customColorInput.value = currentColor;
      customColorWrap.classList.add('is-active');
      if(currentTool === 'eraser') setTool('brush');
      document.getElementById('paintStatus').textContent = 'Color picked';
    }

    function fillAt(point){
      var x = Math.floor(point.x);
      var y = Math.floor(point.y);
      if(x < 0 || y < 0 || x >= artwork.width || y >= artwork.height) return;
      composeArtwork();
      var pixelCount = artwork.width * artwork.height;
      var mergedSampling = fillAllLayersInput.checked;
      var sampleCanvas = mergedSampling ? artwork : layers[activeLayerIndex].canvas;
      var sampleData = sampleCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, artwork.width, artwork.height).data;
      var activeImage = ctx.getImageData(0, 0, artwork.width, artwork.height);
      var activeData = activeImage.data;
      var seedIndex = (y * artwork.width + x) * 4;
      var target = [sampleData[seedIndex], sampleData[seedIndex + 1], sampleData[seedIndex + 2], sampleData[seedIndex + 3]];
      var fillColor = currentColor.match(/[0-9a-f]{2}/gi).map(function(channel){ return parseInt(channel, 16); });
      var fillAlpha = Math.round(Number(brushOpacityInput.value) * Number(colorOpacityInput.value) / 10000 * 255);
      var tolerance = Number(fillToleranceInput.value);
      var toleranceLimit = tolerance * tolerance * 3;

      function matches(index){
        if(sampleData[index + 3] === 0 && target[3] === 0) return true;
        var dr = sampleData[index] - target[0];
        var dg = sampleData[index + 1] - target[1];
        var db = sampleData[index + 2] - target[2];
        var da = mergedSampling ? 0 : (sampleData[index + 3] - target[3]);
        return dr * dr + dg * dg + db * db + da * da <= toleranceLimit;
      }

      if(matches(seedIndex) === false) return;
      var newRgba = fillColor.concat(fillAlpha);
      if(!fillContiguousInput.checked){
        for(var i = 0; i < pixelCount; i++){
          var dataIndex = i * 4;
          if(!matches(dataIndex)) continue;
          activeData[dataIndex] = newRgba[0];
          activeData[dataIndex + 1] = newRgba[1];
          activeData[dataIndex + 2] = newRgba[2];
          activeData[dataIndex + 3] = newRgba[3];
        }
      } else {
        var queue = new Uint32Array(pixelCount);
        var visited = new Uint8Array(pixelCount);
        var head = 0;
        var tail = 0;
        var seed = y * artwork.width + x;
        queue[tail++] = seed;
        visited[seed] = 1;
        function enqueue(next){
          if(visited[next]) return;
          visited[next] = 1;
          if(matches(next * 4)) queue[tail++] = next;
        }
        while(head < tail){
          var position = queue[head++];
          var dataIndex = position * 4;
          activeData[dataIndex] = newRgba[0];
          activeData[dataIndex + 1] = newRgba[1];
          activeData[dataIndex + 2] = newRgba[2];
          activeData[dataIndex + 3] = newRgba[3];
          var px = position % artwork.width;
          var py = Math.floor(position / artwork.width);
          if(px > 0) enqueue(position - 1);
          if(px + 1 < artwork.width) enqueue(position + 1);
          if(py > 0) enqueue(position - artwork.width);
          if(py + 1 < artwork.height) enqueue(position + artwork.width);
        }
      }
      if(!pushUndoSnapshot()) return;
      ctx.putImageData(activeImage, 0, 0);
      document.getElementById('paintStatus').textContent = 'Filled';
      renderCanvas();
    }

    function pointInSelection(point){
      return selection && point.x >= selection.x && point.x <= selection.x + selection.width &&
        point.y >= selection.y && point.y <= selection.y + selection.height;
    }

    function transformSelection(rotation){
      if(!selection || !selection.width || !selection.height) return;
      var rect = {
        x: Math.max(0, Math.floor(selection.x)),
        y: Math.max(0, Math.floor(selection.y)),
        width: Math.max(1, Math.min(artwork.width - Math.floor(selection.x), Math.ceil(selection.width))),
        height: Math.max(1, Math.min(artwork.height - Math.floor(selection.y), Math.ceil(selection.height)))
      };
      var scalePercent = Number(document.getElementById('paintSelectionScale').value);
      if(!Number.isFinite(scalePercent) || scalePercent < 10 || scalePercent > 800) return;
      var scaledWidth = Math.max(1, Math.round(rect.width * scalePercent / 100));
      var scaledHeight = Math.max(1, Math.round(rect.height * scalePercent / 100));
      var rotatedBoundsWidth = Math.abs(rotation) % Math.PI === Math.PI / 2 ? scaledHeight : scaledWidth;
      var rotatedBoundsHeight = Math.abs(rotation) % Math.PI === Math.PI / 2 ? scaledWidth : scaledHeight;
      var fitScale = Math.min(1, artwork.width / rotatedBoundsWidth, artwork.height / rotatedBoundsHeight);
      scaledWidth = Math.max(1, Math.floor(scaledWidth * fitScale));
      scaledHeight = Math.max(1, Math.floor(scaledHeight * fitScale));
      rotatedBoundsWidth = Math.abs(rotation) % Math.PI === Math.PI / 2 ? scaledHeight : scaledWidth;
      rotatedBoundsHeight = Math.abs(rotation) % Math.PI === Math.PI / 2 ? scaledWidth : scaledHeight;
      var temp = document.createElement('canvas');
      temp.width = rect.width;
      temp.height = rect.height;
      temp.getContext('2d').drawImage(layers[activeLayerIndex].canvas, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
      if(!pushUndoSnapshot()) return;
      ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
      var centerX = rect.x + rect.width / 2;
      var centerY = rect.y + rect.height / 2;
      centerX = Math.max(rotatedBoundsWidth / 2, Math.min(artwork.width - rotatedBoundsWidth / 2, centerX));
      centerY = Math.max(rotatedBoundsHeight / 2, Math.min(artwork.height - rotatedBoundsHeight / 2, centerY));
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'source-over';
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);
      ctx.drawImage(temp, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      ctx.restore();
      var radians = Math.abs(rotation) % (Math.PI * 2);
      var swapBounds = Math.abs(radians - Math.PI / 2) < 0.001 || Math.abs(radians - Math.PI * 1.5) < 0.001;
      selection = {
        x: Math.max(0, centerX - (swapBounds ? scaledHeight : scaledWidth) / 2),
        y: Math.max(0, centerY - (swapBounds ? scaledWidth : scaledHeight) / 2),
        width: swapBounds ? scaledHeight : scaledWidth,
        height: swapBounds ? scaledWidth : scaledHeight
      };
      selection.width = Math.min(selection.width, artwork.width - selection.x);
      selection.height = Math.min(selection.height, artwork.height - selection.y);
      selectionMove = null;
      renderCanvas();
    }

    document.getElementById('paintRotateLeft').addEventListener('click', function(){ transformSelection(-Math.PI / 2); });
    document.getElementById('paintRotateRight').addEventListener('click', function(){ transformSelection(Math.PI / 2); });
    document.getElementById('paintApplyTransform').addEventListener('click', function(){ transformSelection(0); });
    document.getElementById('paintSelectionScale').addEventListener('input', function(){
      document.getElementById('paintApplyTransform').textContent = 'Apply ' + this.value + '% scale';
    });

    canvas.addEventListener('pointerdown', function(e){
      if(e.button === 1){
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        panning = {
          x: e.clientX,
          y: e.clientY,
          panX: panX,
          panY: panY
        };
        canvas.classList.add('is-panning');
        document.getElementById('paintStatus').textContent = 'Panning…';
        return;
      }
      var p = getPos(e);

      if(currentTool === 'eyedropper'){
        chooseColorAt(p);
        setTool('brush');
        return;
      }
      if(currentTool === 'bucket'){
        fillAt(p);
        return;
      }

      if(currentTool === 'select'){
        canvas.setPointerCapture(e.pointerId);
        if(pointInSelection(p)){
          var selectedRect = {
            x: Math.floor(selection.x),
            y: Math.floor(selection.y),
            width: Math.max(1, Math.ceil(selection.width)),
            height: Math.max(1, Math.ceil(selection.height))
          };
          var selectedImage = ctx.getImageData(selectedRect.x, selectedRect.y, selectedRect.width, selectedRect.height);
          if(!pushUndoSnapshot()) return;
          selectionMove = {
            start: p,
            rect: selectedRect,
            image: selectedImage,
            baseline: undoStack[undoStack.length - 1]
          };
        } else {
          selectionStart = p;
          selection = { x: p.x, y: p.y, width: 0, height: 0 };
        }
        drawing = true;
        renderCanvas();
        return;
      }

      drawing = true;
      canvas.setPointerCapture(e.pointerId);
      if(!pushUndoSnapshot()) return;
      strokeBaseline = undoStack[undoStack.length - 1];
      last = p;
      lastRawPoint = p;
      dragStart = p;
      configurePaintContext();
      ctx.strokeStyle = currentColor;
      ctx.fillStyle = currentTool === 'eraser' ? '#fff' : currentColor;
      ctx.lineWidth = getBrushWidth();
      ctx.lineCap = 'round';
      if(currentTool === 'brush' || currentTool === 'eraser'){
        ctx.fillStyle = currentTool === 'eraser' ? '#fff' : currentColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, getBrushWidth() / 2, 0, Math.PI * 2);
        ctx.fill();
        renderCanvas();
      }
      if(currentTool === 'line' || currentTool === 'rect' || currentTool === 'ellipse'){
        drawShape(p, e.shiftKey);
        renderCanvas();
      }
      document.getElementById('paintStatus').textContent = currentTool === 'eraser' ? 'Erasing…' : 'Drawing…';
    });

    canvas.addEventListener('pointermove', function(e){
      if(panning){
        panX = panning.panX + e.clientX - panning.x;
        panY = panning.panY + e.clientY - panning.y;
        renderCanvas();
        return;
      }
      if(!drawing) return;
      var rawPoint = getPos(e);
      var p = currentTool === 'brush' || currentTool === 'eraser' ? smoothPoint(rawPoint) : rawPoint;
      lastRawPoint = rawPoint;

      if(currentTool === 'select'){
        if(selectionMove){
          var deltaX = Math.round(p.x - selectionMove.start.x);
          var deltaY = Math.round(p.y - selectionMove.start.y);
          var nextX = selectionMove.rect.x + deltaX;
          var nextY = selectionMove.rect.y + deltaY;
          nextX = Math.max(0, Math.min(artwork.width - selectionMove.rect.width, nextX));
          nextY = Math.max(0, Math.min(artwork.height - selectionMove.rect.height, nextY));
          ctx.putImageData(selectionMove.baseline, 0, 0);
          ctx.clearRect(selectionMove.rect.x, selectionMove.rect.y, selectionMove.rect.width, selectionMove.rect.height);
          ctx.putImageData(selectionMove.image, nextX, nextY);
          selection = { x: nextX, y: nextY, width: selectionMove.rect.width, height: selectionMove.rect.height };
        } else if(selectionStart){
          selection = normalizedRect(selectionStart, p);
        }
        renderCanvas();
        return;
      }

      if(currentTool === 'line' || currentTool === 'rect' || currentTool === 'ellipse'){
        ctx.putImageData(strokeBaseline, 0, 0);
        ctx.strokeStyle = currentColor;
        ctx.fillStyle = currentColor;
        ctx.lineWidth = getBrushWidth();
        ctx.lineCap = 'round';
        drawShape(p, e.shiftKey);
        renderCanvas();
        return;
      }

      ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
      ctx.lineWidth = getBrushWidth();
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      renderCanvas();
      last = p;
    });

    canvas.addEventListener('pointerup', function(){
      if(panning){
        panning = null;
        canvas.classList.remove('is-panning');
        document.getElementById('paintStatus').textContent = 'Ready';
        return;
      }
      if(!drawing) return;
      if(selectionMove){
        selectionMove = null;
      }
      selectionStart = null;
      drawing = false;
      lastRawPoint = null;
      resetPaintContext();
      selectionOptions.hidden = currentTool !== 'select' || !selection || !selection.width || !selection.height;
      renderCanvas();
      document.getElementById('paintStatus').textContent = 'Ready';
    });
    canvas.addEventListener('pointercancel', function(){
      if(panning){
        panning = null;
        canvas.classList.remove('is-panning');
        document.getElementById('paintStatus').textContent = 'Ready';
        return;
      }
      if(selectionMove) ctx.putImageData(selectionMove.baseline, 0, 0);
      selectionMove = null;
      selectionStart = null;
      drawing = false;
      lastRawPoint = null;
      resetPaintContext();
      renderCanvas();
    });
    function zoomAt(localX, localY, factor){
      var availableWidth = canvas.clientWidth;
      var availableHeight = canvas.clientHeight;
      var baseScale = Math.min(availableWidth / artwork.width, availableHeight / artwork.height);
      var oldScale = baseScale * zoom;
      var oldOffsetX = (availableWidth - artwork.width * oldScale) / 2 + panX;
      var oldOffsetY = (availableHeight - artwork.height * oldScale) / 2 + panY;
      var anchorX = (localX - oldOffsetX) / oldScale;
      var anchorY = (localY - oldOffsetY) / oldScale;
      zoom = Math.max(0.25, Math.min(8, zoom * factor));
      var newScale = baseScale * zoom;
      panX = localX - anchorX * newScale - (availableWidth - artwork.width * newScale) / 2;
      panY = localY - anchorY * newScale - (availableHeight - artwork.height * newScale) / 2;
      document.getElementById('paintZoom').textContent = Math.round(zoom * 100) + '%';
      renderCanvas();
    }

    canvas.addEventListener('wheel', function(e){
      e.preventDefault();
      var rect = canvas.getBoundingClientRect();
      var wheelSteps = Math.min(3, Math.abs(e.deltaY) / 100);
      var factor = Math.pow(1.2, wheelSteps);
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? factor : 1 / factor);
    }, { passive: false });
    canvas.addEventListener('auxclick', function(e){
      if(e.button === 1) e.preventDefault();
    });

    document.querySelectorAll('.size-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        setBrushSize(parseInt(btn.getAttribute('data-size'), 10));
      });
    });

    function undo(){
      if(!undoStack.length) return;
      redoStack.push(snapshot());
      var prev = undoStack.pop();
      selection = null;
      selectionOptions.hidden = true;
      restoreSnapshot(prev);
    }

    function redo(){
      if(!redoStack.length) return;
      undoStack.push(snapshot());
      var next = redoStack.pop();
      selection = null;
      selectionOptions.hidden = true;
      restoreSnapshot(next);
    }

    document.getElementById('paintUndo').addEventListener('click', undo);
    document.getElementById('paintRedo').addEventListener('click', redo);

    function setBrushSize(size){
      brushSize = size;
      document.getElementById('paintBrushSize').value = String(size);
      document.querySelectorAll('.size-btn').forEach(function(btn){
        btn.classList.toggle('is-active', parseInt(btn.getAttribute('data-size'), 10) === size);
      });
    }

    document.getElementById('paintBrushSize').addEventListener('change', function(){
      var value = Math.max(1, Math.min(128, Math.round(Number(this.value) || 1)));
      this.value = String(value);
      setBrushSize(value);
    });
    brushOpacityInput.addEventListener('input', function(){
      document.getElementById('paintBrushOpacityValue').textContent = this.value + '%';
    });
    brushHardnessInput.addEventListener('input', function(){
      document.getElementById('paintBrushHardnessValue').textContent = this.value + '%';
    });
    brushSmoothingInput.addEventListener('input', function(){
      document.getElementById('paintBrushSmoothingValue').textContent = this.value;
    });
    fillToleranceInput.addEventListener('input', function(){
      document.getElementById('paintFillToleranceValue').textContent = this.value;
    });

    [
      ['paintBrush', 'Brush (B)'],
      ['paintEraser', 'Eraser (E)'],
      ['paintLine', 'Line (L)'],
      ['paintRect', 'Rectangle (R)'],
      ['paintEllipse', 'Ellipse / circle (O)'],
      ['paintEyedropper', 'Eyedropper (I)'],
      ['paintBucket', 'Fill bucket (G)'],
      ['paintSelect', 'Selection / move (V)'],
      ['paintUndo', 'Undo (Ctrl+Z)'],
      ['paintRedo', 'Redo (Ctrl+Y)'],
    ].forEach(function(item){
      var button = document.getElementById(item[0]);
      button.setAttribute('data-tip', item[1]);
      button.setAttribute('aria-label', item[1]);
    });
    document.getElementById('paintZoom').title = 'Zoom: mouse wheel or + / -; hold middle mouse button to pan; reset with 0. Brush / stroke size: [ and ]';
    document.querySelectorAll('.size-btn').forEach(function(btn){
      var label = btn.getAttribute('data-tip') + ' ([ / ])';
      btn.setAttribute('data-tip', label);
      btn.setAttribute('aria-label', label);
    });

    function resetZoom(){
      zoom = 1;
      panX = 0;
      panY = 0;
      document.getElementById('paintZoom').textContent = '100%';
      renderCanvas();
    }

    document.addEventListener('keydown', function(e){
      if(document.getElementById('paintWindow').classList.contains('is-hidden')) return;
      if(e.target.closest('input, select, textarea, [contenteditable="true"]')) return;

      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){
        e.preventDefault();
        if(e.shiftKey) redo(); else undo();
        return;
      }
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y'){
        e.preventDefault();
        redo();
        return;
      }
      if(e.ctrlKey || e.metaKey || e.altKey) return;

      var toolKeys = {
        b: 'brush',
        e: 'eraser',
        l: 'line',
        r: 'rect',
        o: 'ellipse',
        i: 'eyedropper',
        g: 'bucket',
        v: 'select'
      };
      var tool = toolKeys[e.key.toLowerCase()];
      if(tool){
        e.preventDefault();
        setTool(tool);
        return;
      }

      if(e.key === '[' || e.key === ']'){
        e.preventDefault();
        var sizes = [1, 2, 4, 9, 16, 32, 64, 128];
        if(currentTool === 'line' || currentTool === 'rect' || currentTool === 'ellipse'){
          var strokeSizes = [1, 2, 4, 6, 9];
          var strokeIndex = strokeSizes.indexOf(parseInt(strokeWidthInput.value, 10));
          strokeWidthInput.value = strokeSizes[Math.max(0, Math.min(strokeSizes.length - 1, strokeIndex + (e.key === ']' ? 1 : -1)))];
        } else {
          var sizeIndex = sizes.indexOf(brushSize);
          setBrushSize(sizes[Math.max(0, Math.min(sizes.length - 1, sizeIndex + (e.key === ']' ? 1 : -1)))]);
        }
        return;
      }

      if(e.key === '+' || e.key === '='){
        e.preventDefault();
        zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1.1);
      } else if(e.key === '-' ){
        e.preventDefault();
        zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1 / 1.1);
      } else if(e.key === '0'){
        e.preventDefault();
        resetZoom();
      } else if(e.key.toLowerCase() === 'f'){
        e.preventDefault();
        var shapeFillInput = document.getElementById('paintShapeFill');
        shapeFillInput.checked = !shapeFillInput.checked;
        shapeFill = shapeFillInput.checked;
      }
    });

    document.getElementById('paintClear').addEventListener('click', function(){
      if(!pushUndoSnapshot()) return;
      if(activeLayerIndex === 0){
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, artwork.width, artwork.height);
      } else {
        ctx.clearRect(0, 0, artwork.width, artwork.height);
      }
      selection = null;
      document.getElementById('paintStatus').textContent = 'Canvas cleared';
      renderCanvas();
    });
    document.getElementById('paintShapeFill').addEventListener('change', function(){
      shapeFill = this.checked;
    });

    function setOptionsOpen(open){
      optionsPanel.hidden = !open;
      optionsToggle.setAttribute('aria-expanded', String(open));
    }

    optionsToggle.addEventListener('click', function(){
      setOptionsOpen(optionsPanel.hidden);
    });
    document.getElementById('paintOptionsClose').addEventListener('click', function(){
      setOptionsOpen(false);
      optionsToggle.focus();
    });
    canvasPresetInput.addEventListener('change', function(){
      if(canvasPresetInput.value === 'custom') return;
      var dimensions = canvasPresetInput.value.split('x');
      canvasWidthInput.value = dimensions[0];
      canvasHeightInput.value = dimensions[1];
    });
    [canvasWidthInput, canvasHeightInput].forEach(function(input){
      input.addEventListener('input', function(){
        canvasPresetInput.value = 'custom';
      });
    });
    qualityInput.addEventListener('change', function(){
      displayQuality = qualityInput.value;
      renderCanvas();
      document.getElementById('paintStatus').textContent = 'Quality: ' + qualityInput.options[qualityInput.selectedIndex].text;
    });
    document.getElementById('paintCanvasApply').addEventListener('click', function(){
      var newWidth = Number(canvasWidthInput.value);
      var newHeight = Number(canvasHeightInput.value);
      if(!Number.isInteger(newWidth) || !Number.isInteger(newHeight) ||
         newWidth < 64 || newHeight < 64 || newWidth > 4096 || newHeight > 4096 ||
         newWidth * newHeight > 2097152){
        optionsNote.textContent = 'Use 64–4096 px per side and no more than 2 megapixels total.';
        optionsNote.classList.add('is-error');
        return;
      }
      if(newWidth === artwork.width && newHeight === artwork.height){
        optionsNote.textContent = 'Canvas is already ' + newWidth + ' × ' + newHeight + ' px.';
        optionsNote.classList.remove('is-error');
        return;
      }

      var resizedLayers = layers.map(function(layer){
        var resized = document.createElement('canvas');
        resized.width = newWidth;
        resized.height = newHeight;
        var resizedCtx = resized.getContext('2d');
        resizedCtx.imageSmoothingEnabled = displayQuality !== 'pixel';
        resizedCtx.imageSmoothingQuality = displayQuality === 'high' ? 'high' : 'medium';
      var fitScale = Math.min(newWidth / artwork.width, newHeight / artwork.height);
      var fitWidth = artwork.width * fitScale;
      var fitHeight = artwork.height * fitScale;
        resizedCtx.drawImage(layer.canvas, (newWidth - fitWidth) / 2, (newHeight - fitHeight) / 2, fitWidth, fitHeight);
        layer.canvas = resized;
        layer.undo = [];
        layer.redo = [];
        return layer;
      });

      layers = resizedLayers;
      artwork.width = newWidth;
      artwork.height = newHeight;
      ctx = layers[activeLayerIndex].canvas.getContext('2d', { willReadFrequently: true });
      undoStack = layers[activeLayerIndex].undo;
      redoStack = layers[activeLayerIndex].redo;
      selection = null;
      selectionStart = null;
      selectionMove = null;
      drawing = false;
      resetZoom();
      document.getElementById('paintDimensions').textContent = newWidth + ' × ' + newHeight + ' px';
      optionsNote.textContent = 'Canvas: ' + newWidth + ' × ' + newHeight + ' px. Existing drawing fitted; undo history cleared.';
      optionsNote.classList.remove('is-error');
      document.getElementById('paintStatus').textContent = 'Canvas resized';
    });

    document.getElementById('paintSave').addEventListener('click', function(){
      var exportScale = Number(exportScaleInput.value);
      var format = exportFormatInput.value;
      var exportContent = exportContentInput.value;
      var transparent = format === 'png' && exportTransparentInput.checked;
      if(exportContent === 'project'){
        var totalLayerPixels = artwork.width * artwork.height * layers.length;
        if(totalLayerPixels > 16777216){
          document.getElementById('paintStatus').textContent = 'Project export is too large; reduce the layer count or canvas size.';
          return;
        }
        var project = {
          format: 'paint-layer-project',
          version: 1,
          width: artwork.width,
          height: artwork.height,
          layers: layers.map(function(layer){
            return {
              name: layer.name,
              visible: layer.visible,
              opacity: layer.opacity,
              isBackground: layer.isBackground,
              image: layer.canvas.toDataURL('image/png')
            };
          })
        };
        var projectUrl = URL.createObjectURL(new Blob([JSON.stringify(project)], { type: 'application/json' }));
        var projectLink = document.createElement('a');
        projectLink.download = 'painting-' + new Date().toISOString().replace(/[:.]/g, '-') + '.paint.json';
        projectLink.href = projectUrl;
        document.body.appendChild(projectLink);
        projectLink.click();
        document.body.removeChild(projectLink);
        window.setTimeout(function(){ URL.revokeObjectURL(projectUrl); }, 1000);
        document.getElementById('paintStatus').textContent = 'Downloaded layered project · ' + layers.length + ' layers';
        return;
      }
      if(artwork.width * artwork.height * exportScale * exportScale > 33554432){
        document.getElementById('paintStatus').textContent = 'Export too large; choose a smaller scale or canvas.';
        return;
      }
      var exportCanvas = document.createElement('canvas');
      exportCanvas.width = artwork.width * exportScale;
      exportCanvas.height = artwork.height * exportScale;
      var exportCtx = exportCanvas.getContext('2d');
      exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
      if(!transparent){
        exportCtx.fillStyle = '#fff';
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      }
      exportCtx.imageSmoothingEnabled = displayQuality !== 'pixel';
      exportCtx.imageSmoothingQuality = displayQuality === 'high' ? 'high' : 'medium';
      if(exportContent === 'active'){
        var activeLayer = layers[activeLayerIndex];
        if(!(transparent && activeLayer.isBackground)){
          exportCtx.globalAlpha = activeLayer.opacity;
          exportCtx.drawImage(activeLayer.canvas, 0, 0, exportCanvas.width, exportCanvas.height);
        }
      } else {
        layers.forEach(function(layer){
          if(!layer.visible || (transparent && layer.isBackground)) return;
          exportCtx.globalAlpha = layer.opacity;
          exportCtx.drawImage(layer.canvas, 0, 0, exportCanvas.width, exportCanvas.height);
        });
      }
      exportCtx.globalAlpha = 1;

      var link = document.createElement('a');
      var stamp = new Date().toISOString().replace(/[:.]/g, '-');
      var mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      var extension = format === 'jpeg' ? 'jpg' : 'png';
      link.download = 'painting-' + stamp + '.' + extension;
      link.href = exportCanvas.toDataURL(mimeType, format === 'jpeg' ? 0.92 : undefined);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      document.getElementById('paintStatus').textContent = 'Downloaded ' + extension.toUpperCase() + ' · ' + exportCanvas.width + ' × ' + exportCanvas.height;
      setTimeout(function(){ document.getElementById('paintStatus').textContent = 'Ready'; }, 1600);
    });
    exportFormatInput.addEventListener('change', function(){
      exportTransparentInput.disabled = this.value !== 'png' || exportContentInput.value === 'project';
      var label = exportContentInput.value === 'project' ? 'Save layered project' : 'Save as ' + this.value.toUpperCase();
      var saveButton = document.getElementById('paintSave');
      saveButton.title = label;
      saveButton.setAttribute('data-tip', label);
      saveButton.setAttribute('aria-label', label);
    });
    exportContentInput.addEventListener('change', function(){
      var isProject = this.value === 'project';
      exportTransparentInput.disabled = exportFormatInput.value !== 'png' || isProject;
      exportScaleInput.disabled = isProject;
      exportFormatInput.disabled = isProject;
      var saveLabel = isProject ? 'Save layered project' : 'Save as ' + exportFormatInput.value.toUpperCase();
      var saveButton = document.getElementById('paintSave');
      saveButton.title = saveLabel;
      saveButton.setAttribute('data-tip', saveLabel);
      saveButton.setAttribute('aria-label', saveLabel);
    });
    exportTransparentInput.disabled = exportFormatInput.value !== 'png' || exportContentInput.value === 'project';

    try{ localStorage.removeItem('witg_paint_v1'); }catch(err){}

    buildSwatches();
    renderLayerList();
    setActiveLayer(0);
    renderCanvas();
    if(typeof ResizeObserver !== 'undefined'){
      var canvasResizeObserver = new ResizeObserver(renderCanvas);
      canvasResizeObserver.observe(canvasWrap);
    } else {
      window.addEventListener('resize', renderCanvas);
    }
  })();
