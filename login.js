// login.js

// --- 配置 Supabase 客户端 ---
const SUPABASE_URL = 'https://ihvfgneobcjsskwxqxnv.supabase.co';
// 确保这是你的 Anon Key，而不是 Service Role Key
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlodmZnbmVvYmNqc3Nrd3hxeG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NTUwMTAsImV4cCI6MjA2MTQzMTAxMH0.lYs-wGzwN6sTbBn5UTW1sQYzWU5rUAzIeiOThZgEqEE';

// 全局变量，用于持有 Supabase 客户端实例
let supabase = null;

// --- DOM 元素获取 ---
// 在脚本顶部获取 DOM 元素，确保它们在后续函数中可用
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessageElement = document.getElementById('error-message');
const themeToggleButton = document.getElementById('theme-toggle-button');

/**
 * 显示错误消息的辅助函数
 * @param {string} message - 要显示的消息
 */
function displayError(message) {
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
        errorMessageElement.style.display = 'block';
    } else {
        console.error("Error message element not found!"); // 如果元素找不到，也在控制台记录
    }
}

/**
 * 初始化 Supabase 客户端
 */
function initializeSupabase() {
    // 检查占位符凭据
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY' || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('警告：请在 login.js 中配置有效的 Supabase URL 和匿名密钥。');
        displayError('Supabase 配置不完整或无效。');
        return; // 配置无效，不继续初始化
    }

    try {
        // 检查全局 Supabase 对象 (由 CDN 脚本提供) 是否存在
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            // 使用全局的 window.supabase 对象来创建客户端
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Supabase client initialized successfully.");
        } else {
            // Supabase 库脚本未加载或失败
            throw new Error("Supabase library (supabase-js) not loaded or failed.");
        }
    } catch (e) {
        console.error('初始化 Supabase 客户端时出错:', e);
        displayError('无法连接到认证服务。' + (e.message ? ` (${e.message})` : ''));
        supabase = null; // 确保 supabase 在出错时为 null
    }
}

/**
 * 处理登录表单提交事件。
 * @param {Event} event - 表单提交事件对象。
 */
async function handleLogin(event) {
    event.preventDefault(); // 阻止表单默认提交行为

    // 检查 supabase 客户端是否成功初始化
    if (!supabase) {
        displayError('认证服务不可用，请稍后重试或检查配置。');
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // 清除之前的错误信息
    displayError(''); // 传递空字符串来隐藏错误消息
    errorMessageElement.style.display = 'none';

    // 禁用按钮，防止重复提交
    const submitButton = loginForm.querySelector('button[type="submit"]');
    if (!submitButton) { // 添加检查以防万一
        console.error("Submit button not found in login form.");
        return;
    }
    submitButton.disabled = true;
    submitButton.textContent = '登录中...'; // 提供视觉反馈

    try {
        // 使用 Supabase 进行邮箱密码登录
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            // 登录失败，显示错误信息
            console.error('登录错误:', error);
            displayError(`登录失败：${error.message || '请检查您的邮箱和密码。'}`);
        } else if (data.user) {
            // 登录成功
            console.log('登录成功:', data.user);
            // 重定向到主应用页面
            window.location.href = 'index.html';
        } else {
            // 理论上不应发生，但以防万一
            console.warn('Supabase signInWithPassword returned no error and no user.');
            displayError('登录时发生未知错误。');
        }
    } catch (error) {
        // 网络或其他意外错误
        console.error('捕获到登录过程中的错误:', error);
        displayError('登录过程中发生网络或意外错误，请稍后重试。');
    } finally {
        // 无论成功或失败，恢复按钮状态
        submitButton.disabled = false;
        // 使用 innerHTML 以正确渲染 span
        submitButton.innerHTML = '登录 <span class="en-text">Login</span>';
    }
}

// --- 主执行逻辑 ---

// 1. 初始化 Supabase
initializeSupabase();

// 2. 绑定登录表单事件监听器
if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
} else {
    console.error('未能找到登录表单元素 #login-form，无法绑定提交事件。');
    // 如果表单不存在，可能也需要显示错误
    displayError('登录表单加载失败。');
}

// 3. 可选：处理主题切换按钮
if (themeToggleButton) {
    console.log('找到主题切换按钮，但未实现切换逻辑。');
    // 在这里添加实际的主题切换实现代码
    // themeToggleButton.addEventListener('click', () => { /* ...切换逻辑... */ });
} else {
    console.log('未找到主题切换按钮。');
}