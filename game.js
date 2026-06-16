// 游戏配置
const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

// 游戏状态
const gameState = {
    snake: [{ x: 10, y: 10 }],
    direction: { x: 0, y: -1 }, // 初始向上移动
    nextDirection: { x: 0, y: -1 },
    food: { x: 15, y: 15 },
    score: 0,
    isGameOver: false,
    isPaused: false,
    startTime: 0,
    elapsedTime: 0,
    gameFrameCount: 0,
};

// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const speedDisplay = document.getElementById('speed');
const timeDisplay = document.getElementById('time');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const gameStatus = document.getElementById('gameStatus');

// 键盘输入状态
const inputState = {
    aPressed: false,
    dPressed: false,
};

// 监听键盘事件
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'a') {
        inputState.aPressed = true;
    } else if (key === 'd') {
        inputState.dPressed = true;
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'a') {
        inputState.aPressed = false;
    } else if (key === 'd') {
        inputState.dPressed = false;
    }
});

// 生成食物
function generateFood() {
    let newFood;
    let foodOnSnake = true;

    while (foodOnSnake) {
        newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
        };

        foodOnSnake = gameState.snake.some(
            (segment) => segment.x === newFood.x && segment.y === newFood.y
        );
    }

    return newFood;
}

// 获取当前速度倍数（基于游戏时长）
function getSpeedMultiplier() {
    // 每10秒增加0.2倍速度，最高3倍速度
    const speedIncrease = Math.floor(gameState.elapsedTime / 10) * 0.2;
    const multiplier = 1 + speedIncrease;
    return Math.min(multiplier, 3);
}

// 获取当前游戏速度（毫秒）
function getGameSpeed() {
    const baseSpeed = 150; // 基础速度150ms
    const multiplier = getSpeedMultiplier();
    return baseSpeed / multiplier;
}

// 处理蛇的输入
function handleInput() {
    const currentDirection = gameState.direction;

    // 检查A键（左转）
    if (inputState.aPressed) {
        // 如果当前向右，不能立即向左
        if (!(currentDirection.x === 1 && currentDirection.y === 0)) {
            if (currentDirection.y === 0) {
                // 当前向上或向下，转向左边
                gameState.nextDirection = { x: -1, y: 0 };
            } else if (currentDirection.x === 0) {
                // 当前是竖直方向
                // 向上时左转 -> 向左
                // 向下时左转 -> 向右
                gameState.nextDirection = {
                    x: -currentDirection.y,
                    y: currentDirection.x,
                };
            }
        }
    }

    // 检查D键（右转）
    if (inputState.dPressed) {
        // 如果当前向左，不能立即向右
        if (!(currentDirection.x === -1 && currentDirection.y === 0)) {
            if (currentDirection.y === 0) {
                // 当前向上或向下，转向右边
                gameState.nextDirection = { x: 1, y: 0 };
            } else if (currentDirection.x === 0) {
                // 当前是竖直方向
                // 向上时右转 -> 向右
                // 向下时右转 -> 向左
                gameState.nextDirection = {
                    x: currentDirection.y,
                    y: -currentDirection.x,
                };
            }
        }
    }
}

// 更新游戏状态
function updateGame() {
    if (gameState.isGameOver || gameState.isPaused) return;

    handleInput();

    // 更新方向
    gameState.direction = gameState.nextDirection;

    // 计算新的头部位置
    const head = gameState.snake[0];
    const newHead = {
        x: head.x + gameState.direction.x,
        y: head.y + gameState.direction.y,
    };

    // 检查碰撞-墙壁
    if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
    ) {
        endGame();
        return;
    }

    // 检查碰撞-自己
    if (
        gameState.snake.some(
            (segment) => segment.x === newHead.x && segment.y === newHead.y
        )
    ) {
        endGame();
        return;
    }

    // 移动蛇
    gameState.snake.unshift(newHead);

    // 检查食物碰撞
    if (newHead.x === gameState.food.x && newHead.y === gameState.food.y) {
        // 吃到食物，增加分数
        gameState.score += 10;
        scoreDisplay.textContent = gameState.score;

        // 生成新食物
        gameState.food = generateFood();
    } else {
        // 没有吃到食物，去掉尾部
        gameState.snake.pop();
    }

    gameState.gameFrameCount++;
}

// 绘制游戏画面
function drawGame() {
    // 清空画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 绘制网格（可选）
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
        const pos = i * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, CANVAS_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(CANVAS_SIZE, pos);
        ctx.stroke();
    }

    // 绘制食物
    drawFood();

    // 绘制蛇
    drawSnake();
}

// 绘制食物
function drawFood() {
    const x = gameState.food.x * CELL_SIZE;
    const y = gameState.food.y * CELL_SIZE;

    // 绘制红色食物
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // 添加光泽
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(x + CELL_SIZE / 3, y + CELL_SIZE / 3, CELL_SIZE / 6, 0, Math.PI * 2);
    ctx.fill();
}

// 绘制蛇
function drawSnake() {
    gameState.snake.forEach((segment, index) => {
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;

        if (index === 0) {
            // 绘制蛇头
            ctx.fillStyle = '#4ecdc4';
            ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);

            // 绘制眼睛
            ctx.fillStyle = '#1a1a2e';
            const eyeSize = CELL_SIZE / 5;
            const eyeOffsetX = gameState.direction.x * CELL_SIZE / 4;
            const eyeOffsetY = gameState.direction.y * CELL_SIZE / 4;

            ctx.fillRect(
                x + CELL_SIZE / 2 - eyeSize + eyeOffsetX - eyeSize / 2,
                y + CELL_SIZE / 2 - eyeSize + eyeOffsetY - eyeSize / 2,
                eyeSize,
                eyeSize
            );
        } else {
            // 绘制蛇身
            const hue = 180 - (index / gameState.snake.length) * 30;
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        }

        // 添加边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    });
}

// 更新UI
function updateUI() {
    if (!gameState.isPaused && !gameState.isGameOver) {
        gameState.elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    }

    timeDisplay.textContent = gameState.elapsedTime + 's';
    speedDisplay.textContent = getSpeedMultiplier().toFixed(1) + 'x';
}

// 游戏循环
let lastUpdateTime = 0;
function gameLoop(currentTime) {
    // 计算距离上次更新的时间
    if (lastUpdateTime === 0) lastUpdateTime = currentTime;
    const deltaTime = currentTime - lastUpdateTime;

    // 根据当前速度决定是否需要更新游戏状态
    if (deltaTime >= getGameSpeed()) {
        updateGame();
        lastUpdateTime = currentTime;
    }

    updateUI();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// 游戏结束
function endGame() {
    gameState.isGameOver = true;
    gameStatus.textContent = `游戏结束! 最终分数: ${gameState.score}`;
    gameStatus.style.color = '#ff6b6b';
    startBtn.textContent = '重新开始';
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// 开始游戏
function startGame() {
    if (!gameState.isGameOver && gameState.startTime !== 0) {
        // 已经开始，不重复开始
        return;
    }

    if (gameState.isGameOver) {
        resetGame();
    }

    gameState.isGameOver = false;
    gameState.isPaused = false;
    gameState.startTime = Date.now() - gameState.elapsedTime * 1000;
    lastUpdateTime = 0;

    gameStatus.textContent = '游戏进行中...';
    gameStatus.style.color = '#667eea';
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;

    requestAnimationFrame(gameLoop);
}

// 暂停/继续游戏
function togglePause() {
    if (gameState.startTime === 0) return;

    gameState.isPaused = !gameState.isPaused;

    if (gameState.isPaused) {
        gameStatus.textContent = '游戏已暂停';
        gameStatus.style.color = '#f5576c';
        pauseBtn.textContent = '继续';
        startBtn.disabled = false;
    } else {
        gameStatus.textContent = '游戏进行中...';
        gameStatus.style.color = '#667eea';
        pauseBtn.textContent = '暂停';
        startBtn.disabled = true;
        gameState.startTime = Date.now() - gameState.elapsedTime * 1000;
        lastUpdateTime = 0;
        requestAnimationFrame(gameLoop);
    }
}

// 重置游戏
function resetGame() {
    gameState.snake = [{ x: 10, y: 10 }];
    gameState.direction = { x: 0, y: -1 };
    gameState.nextDirection = { x: 0, y: -1 };
    gameState.food = { x: 15, y: 15 };
    gameState.score = 0;
    gameState.isGameOver = false;
    gameState.isPaused = false;
    gameState.startTime = 0;
    gameState.elapsedTime = 0;
    gameState.gameFrameCount = 0;

    scoreDisplay.textContent = '0';
    speedDisplay.textContent = '1.0x';
    timeDisplay.textContent = '0s';
    gameStatus.textContent = '';
    startBtn.textContent = '开始游戏';
    startBtn.disabled = false;
    pauseBtn.textContent = '暂停';
    pauseBtn.disabled = true;

    drawGame();
}

// 按钮事件监听
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', resetGame);

// 初始化
resetGame();
