// 全局变量定义
let numDisks = 8;
const towers = {
    A: document.getElementById('tower-A'),
    B: document.getElementById('tower-B'),
    C: document.getElementById('tower-C')
};
const hanoiContainer = document.querySelector('.hanoi-container');
const startButton = document.getElementById('start-button');
const speedSlider = document.getElementById('speed-slider');
const speedValueSpan = document.getElementById('speed-value');
const moveCountSpan = document.getElementById('move-count');
const numDisksInput = document.getElementById('num-disks-input');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const resetButton = document.getElementById('reset-button');
const themeToggleButton = document.getElementById('theme-toggle-button');
const bodyElement = document.body;

let disks = [];
let moves = [];
let moveIndex = 0;
let animationFrameId = null;
let animationSpeed = 600;
let isPaused = true;
let currentMoveCount = 0;
let hanoiInitializedForDisks = 0;

function applyTheme(theme) {
    if (theme === 'light') {
        bodyElement.classList.add('light-theme');
        themeToggleButton.textContent = '🌙';
        themeToggleButton.title = '切换到深色主题 / Switch to Dark Theme';
    } else {
        bodyElement.classList.remove('light-theme');
        themeToggleButton.textContent = '☀️';
        themeToggleButton.title = '切换到浅色主题 / Switch to Light Theme';
    }
}

function toggleTheme() {
    const currentTheme = bodyElement.classList.contains('light-theme') ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    try {
        localStorage.setItem('hanoiTheme', newTheme);
    } catch (e) {
        console.warn('无法访问 localStorage，主题偏好不会被保存。');
    }
}

function loadThemePreference() {
    try {
        const savedTheme = localStorage.getItem('hanoiTheme');
        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            applyTheme('dark');
        }
    } catch (e) {
        console.warn('无法访问 localStorage，将使用默认主题。');
        applyTheme('dark');
    }
}

function handleError(error) {
    console.error('发生错误:', error);
    alert(`操作过程中发生错误: ${error.message || error}\n请检查控制台获取详细信息，或刷新页面重试。`);
    stopAnimation();
    startButton.innerHTML = '错误 <span class="en-text">Error</span>';
    startButton.disabled = true;
}

function updateButtonState(button, textZh, textEn, disabled) {
    button.innerHTML = `${textZh} <span class="en-text">${textEn}</span>`;
    button.disabled = disabled;
}

function updateMoveCountDisplay() {
    moveCountSpan.innerHTML = `步数: ${currentMoveCount} <span class="en-text">Moves: ${currentMoveCount}</span>`;
}

function resetAndInitialize(newNumDisks) {
    try {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        isPaused = true;
        updateButtonState(startButton, '开始', 'Start', false);
        updateButtonState(prevButton, '上一步', 'Previous', true);
        updateButtonState(nextButton, '下一步', 'Next', true);

        numDisks = parseInt(newNumDisks, 10);
        if (isNaN(numDisks) || numDisks < 4 || numDisks > 20) {
            alert(`无效的圆盘数量: ${newNumDisks}。请输入 4 到 20 之间的整数。
Invalid number of disks: ${newNumDisks}. Please enter an integer between 4 and 20.`);
            numDisks = hanoiInitializedForDisks > 0 ? hanoiInitializedForDisks : 8;
            numDisksInput.value = numDisks;
        }

        document.querySelector('h1').textContent = `蓝银草_汉诺塔教学_(${numDisks}个圆盘）`;

        Object.values(towers).forEach(tower => tower.innerHTML = '');
        disks = [];
        moves = [];
        moveIndex = 0;
        currentMoveCount = 0;
        updateMoveCountDisplay();
        hanoiInitializedForDisks = 0;

        hanoiContainer.querySelectorAll('.disk').forEach(d => d.remove());

        createDisks();
        adjustContainerHeight();
        updateStepButtons();
    } catch (error) {
        handleError(error);
    }
}

function createDisks() {
    try {
        Object.values(towers).forEach(tower => {
            const textNode = Array.from(tower.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
            tower.innerHTML = '';
            if (textNode) {
                tower.appendChild(textNode);
            }
        });
        disks = [];

        const containerWidth = hanoiContainer.clientWidth;
        if (containerWidth <= 0) {
            console.error("获取容器宽度失败 (<=0)，无法计算圆盘宽度。请检查容器CSS或布局。/ Failed to get container width (<=0). Cannot calculate disk widths.");
            console.warn("将使用固定的圆盘宽度尝试渲染。/ Attempting to render with fixed disk widths.");
            const fixedBaseWidth = 100;
            const fixedMinWidth = 30;
            const fixedWidthDecrement = numDisks > 1 ? (fixedBaseWidth - fixedMinWidth) / (numDisks - 1) : 0;
            createDisksWithParams(fixedBaseWidth, fixedMinWidth, fixedWidthDecrement);
            return;
        }

        const towerSpacing = 32 * 2;
        const containerPadding = 24 * 2;
        const availableWidthPerTower = Math.max(50, (containerWidth - containerPadding - towerSpacing) / 3);

        const baseWidthPercent = 85;
        const minWidthPx = 30;
        const baseWidth = Math.max(minWidthPx, availableWidthPerTower * (baseWidthPercent / 100));

        const widthDecrement = numDisks > 1 ? (baseWidth - minWidthPx) / (numDisks - 1) : 0;

        createDisksWithParams(baseWidth, minWidthPx, widthDecrement);

    } catch (error) {
        handleError(error);
    }
}

function createDisksWithParams(baseWidth, minWidthPx, widthDecrement) {
    const colors = [
        '#FF4136', '#FF851B', '#FFDC00', '#2ECC40', '#0074D9',
        '#B10DC9', '#F012BE', '#7FDBFF', '#39CCCC', '#3D9970',
        '#01FF70', '#85144b', '#DDA0DD', '#111111', '#AAAAAA',
        '#DDDDDD', '#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9'
    ];
    const diskHeight = 24;

    for (let i = numDisks; i >= 1; i--) {
        const disk = document.createElement('div');
        disk.classList.add('disk');
        disk.dataset.size = i;
        disk.id = `disk-${i}`;
        disk.textContent = i;

        const diskWidth = Math.max(minWidthPx, baseWidth - (numDisks - i) * widthDecrement);
        if (isNaN(diskWidth) || diskWidth <= 0) {
            console.error(`计算出的圆盘 ${i} 宽度无效: ${diskWidth}。将使用最小宽度 ${minWidthPx}px。`);
            disk.style.width = `${minWidthPx}px`;
        } else {
            disk.style.width = `${diskWidth}px`;
        }
        disk.style.height = `${diskHeight}px`;
        disk.style.lineHeight = `${diskHeight}px`;
        disk.style.backgroundColor = colors[(i - 1) % colors.length];

        let towerALeft = 50;
        try {
            const towerARect = towers.A.getBoundingClientRect();
            const containerRect = hanoiContainer.getBoundingClientRect();
            if (towerARect.width > 0 && containerRect.width > 0) {
                towerALeft = towerARect.left - containerRect.left + (towerARect.width / 2);
                disk.style.left = `${towerALeft}px`;
            } else {
                console.warn(`无法精确获取塔A位置，圆盘 ${i} 将使用百分比定位。`);
                disk.style.left = '16.66%';
            }
        } catch (e) {
            console.error("读取塔位置时出错: ", e);
            disk.style.left = '16.66%';
        }

        const initialBottom = (numDisks - i) * (diskHeight + 2);
        disk.style.bottom = `${initialBottom}px`;

        hanoiContainer.appendChild(disk);
        disks.push(disk);
    }
}

function adjustContainerHeight() {
    try {
        const diskHeight = 24;
        const marginBottom = 2;
        const requiredHeight = numDisks * (diskHeight + marginBottom) + 100;
        hanoiContainer.style.minHeight = `${requiredHeight}px`;
    } catch (error) {
        handleError(error);
    }
}

function hanoi(n, source, destination, auxiliary) {
    try {
        if (n > 0) {
            hanoi(n - 1, source, auxiliary, destination);
            moves.push({ disk: n, from: source, to: destination });
            hanoi(n - 1, auxiliary, destination, source);
        }
    } catch (error) {
        handleError(error);
    }
}

async function animateMove() {
    try {
        if (isPaused || moveIndex >= moves.length) {
            stopAnimation();
            return;
        }

        const move = moves[moveIndex];
        await moveDisk(move.disk, move.from, move.to);
        currentMoveCount++;
        updateMoveCountDisplay();
        moveIndex++;

        updateStepButtons();

        if (!isPaused) {
            animationFrameId = requestAnimationFrame(animateMove);
        }
    } catch (error) {
        handleError(error);
    }
}

function runAnimationStep() {
    try {
        if (isPaused) return;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(animateMove);
    } catch (error) {
        handleError(error);
    }
}

function startAnimation() {
    try {
        if (moves.length === 0 || hanoiInitializedForDisks !== numDisks) {
            moves = [];
            hanoi(numDisks, 'A', 'C', 'B');
            hanoiInitializedForDisks = numDisks;
            moveIndex = 0;
            currentMoveCount = 0;
            updateMoveCountDisplay();
        }
        if (moveIndex >= moves.length) {
            return;
        }

        isPaused = false;
        updateButtonState(startButton, '暂停', 'Pause', false);
        speedSlider.disabled = true;
        numDisksInput.disabled = true;
        updateButtonState(prevButton, '上一步', 'Previous', true);
        updateButtonState(nextButton, '下一步', 'Next', true);

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        runAnimationStep();
    } catch (error) {
        handleError(error);
    }
}

function pauseAnimation() {
    try {
        isPaused = true;
        updateButtonState(startButton, '继续', 'Continue', false);
        speedSlider.disabled = false;
        numDisksInput.disabled = false;
        updateStepButtons();
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    } catch (error) {
        handleError(error);
    }
}

function stopAnimation() {
    try {
        isPaused = true;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        speedSlider.disabled = false;
        numDisksInput.disabled = false;
        updateStepButtons();
    } catch (error) {
        handleError(error);
    }
}

async function stepForward() {
    try {
        if (!isPaused || moveIndex >= moves.length) return;
        if (moves.length === 0 || hanoiInitializedForDisks !== numDisks) {
            moves = [];
            hanoi(numDisks, 'A', 'C', 'B');
            hanoiInitializedForDisks = numDisks;
        }

        const move = moves[moveIndex];
        await moveDisk(move.disk, move.from, move.to);
        currentMoveCount++;
        updateMoveCountDisplay();
        moveIndex++;
        updateStepButtons();
    } catch (error) {
        handleError(error);
    }
}

async function stepBackward() {
    try {
        if (!isPaused || moveIndex <= 0) return;
        if (moves.length === 0 || hanoiInitializedForDisks !== numDisks) return;

        moveIndex--;
        const move = moves[moveIndex];
        await moveDisk(move.disk, move.to, move.from);
        currentMoveCount--;
        updateMoveCountDisplay();
        updateStepButtons();
    } catch (error) {
        handleError(error);
    }
}

function updateStepButtons() {
    try {
        if (moves.length === 0 || hanoiInitializedForDisks !== numDisks) {
            if (numDisks > 0) {
                moves = [];
                hanoi(numDisks, 'A', 'C', 'B');
                hanoiInitializedForDisks = numDisks;
            } else {
                moves = [];
            }
        }

        const canStep = isPaused && moves.length > 0;
        updateButtonState(prevButton, '上一步', 'Previous', !canStep || moveIndex <= 0);
        updateButtonState(nextButton, '下一步', 'Next', !canStep || moveIndex >= moves.length);

        if (isPaused) {
            if (moveIndex >= moves.length && moves.length > 0) {
                updateButtonState(startButton, '重置', 'Reset', false);
            } else if (moveIndex === 0) {
                updateButtonState(startButton, '开始', 'Start', false);
            } else {
                updateButtonState(startButton, '继续', 'Continue', false);
            }
        } else {
            updateButtonState(startButton, '暂停', 'Pause', false);
        }

    } catch (error) {
        handleError(error);
    }
}

async function moveDisk(diskSize, fromTowerId, toTowerId) {
    try {
        const diskElement = document.getElementById(`disk-${diskSize}`);
        if (!diskElement) {
            throw new Error(`找不到圆盘元素: disk-${diskSize}`);
        }

        const fromTower = towers[fromTowerId];
        const toTower = towers[toTowerId];
        if (!fromTower || !toTower) {
            throw new Error(`无效的塔ID: ${fromTowerId} 或 ${toTowerId}`);
        }
        const containerRect = hanoiContainer.getBoundingClientRect();
        const liftHeight = hanoiContainer.clientHeight - diskElement.offsetHeight - 5;

        diskElement.style.transition = `bottom ${animationSpeed / 3000}s ease-in-out, left 0s`;
        diskElement.style.bottom = `${liftHeight}px`;
        await new Promise(resolve => setTimeout(resolve, animationSpeed / 3));

        const toTowerRect = toTower.getBoundingClientRect();
        const targetLeft = toTowerRect.left - containerRect.left + (toTowerRect.width / 2);
        diskElement.style.transition = `left ${animationSpeed / 3000}s ease-in-out, bottom 0s`;
        diskElement.style.left = `${targetLeft}px`;
        await new Promise(resolve => setTimeout(resolve, animationSpeed / 3));

        const disksOnTargetTower = Array.from(hanoiContainer.querySelectorAll('.disk')).filter(d => {
            if (d === diskElement) return false;
            const dRect = d.getBoundingClientRect();
            const tRect = toTowerRect;
            return Math.abs((dRect.left + dRect.width / 2) - (tRect.left + tRect.width / 2)) < tRect.width;
        });
        const diskHeight = diskElement.offsetHeight;
        const marginBottom = 2;
        const targetBottom = disksOnTargetTower.length * (diskHeight + marginBottom);

        diskElement.style.transition = `bottom ${animationSpeed / 3000}s ease-in-out, left 0s`;
        diskElement.style.bottom = `${targetBottom}px`;
        await new Promise(resolve => setTimeout(resolve, animationSpeed / 3));

        diskElement.style.transition = `bottom 0.5s, left 0.5s`;

    } catch (error) {
        handleError(error);
        throw error;
    }
}

startButton.addEventListener('click', () => {
    try {
        if (startButton.textContent.includes('重置') || startButton.textContent.includes('Reset')) {
            resetAndInitialize(numDisksInput.value);
            updateButtonState(startButton, '开始', 'Start', false);
            updateStepButtons();
            return;
        }

        if (isPaused) {
            startAnimation();
        } else {
            pauseAnimation();
        }
    } catch (error) {
        handleError(error);
    }
});

resetButton.addEventListener('click', () => {
    try {
        stopAnimation();
        resetAndInitialize(numDisksInput.value);
        updateButtonState(startButton, '开始', 'Start', false);
        updateStepButtons();
    } catch (error) {
        handleError(error);
    }
});

speedSlider.addEventListener('input', (event) => {
    try {
        animationSpeed = 1100 - parseInt(event.target.value, 10);
        speedValueSpan.textContent = `${(animationSpeed / 1000).toFixed(1)}s`;
    } catch (error) {
        handleError(error);
    }
});

numDisksInput.addEventListener('change', (event) => {
    try {
        stopAnimation();
        resetAndInitialize(event.target.value);
        updateStepButtons();
    } catch (error) {
        handleError(error);
    }
});

prevButton.addEventListener('click', stepBackward);
nextButton.addEventListener('click', stepForward);

themeToggleButton.addEventListener('click', toggleTheme);

function initializeApp() {
    try {
        loadThemePreference();
        speedValueSpan.textContent = `${((1100 - parseInt(speedSlider.value, 10)) / 1000).toFixed(1)}s`;
        animationSpeed = 1100 - parseInt(speedSlider.value, 10);
        resetAndInitialize(numDisksInput.value);
        updateStepButtons();
    } catch (error) {
        handleError(error);
        if (!themeToggleButton.onclick) {
            themeToggleButton.addEventListener('click', toggleTheme);
        }
    }
}

document.addEventListener('DOMContentLoaded', initializeApp); 