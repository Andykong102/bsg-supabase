// login.js

// --- 配置 Supabase 客户端 ---
const SUPABASE_URL = 'https://ihvfgneobcjsskwxqxnv.supabase.co';
// 确保这是你的 Anon Key，而不是 Service Role Key
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlodmZnbmVvYmNqc3Nrd3hxeG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NTUwMTAsImV4cCI6MjA2MTQzMTAxMH0.lYs-wGzwN6sTbBn5UTW1sQYzWU5rUAzIeiOThZgEqEE';

// 全局变量，用于持有 Supabase 客户端实例
let supabase = null;

// --- DOM 元素获取 ---
// 在脚本顶部获取 DOM 元素，确保它们在后续函数中可用
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');

const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email'); // 重命名以区分
const loginPasswordInput = document.getElementById('login-password'); // 重命名以区分
const loginErrorMessage = document.getElementById('login-error-message'); // 重命名以区分

const registerForm = document.getElementById('register-form');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const registerMessage = document.getElementById('register-message'); // 获取注册消息元素

const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

const themeToggleButton = document.getElementById('theme-toggle-button');

/**
 * 显示错误消息的辅助函数
 * @param {string} message - 要显示的消息
 */
function displayError(message) {
    if (loginErrorMessage) {
        loginErrorMessage.textContent = message;
        loginErrorMessage.style.display = 'block';
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

// --- 表单切换逻辑 ---
/**
 * @function showLoginForm
 * @description 显示登录表单，隐藏注册表单
 */
function showLoginForm() {
    loginSection.style.display = 'block';
    registerSection.style.display = 'none';
    loginErrorMessage.style.display = 'none'; // 切换时隐藏错误消息
    registerMessage.style.display = 'none'; // 切换时隐藏注册消息
}

/**
 * @function showRegisterForm
 * @description 显示注册表单，隐藏登录表单
 */
function showRegisterForm() {
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
    loginErrorMessage.style.display = 'none'; // 切换时隐藏错误消息
    registerMessage.style.display = 'none'; // 切换时隐藏注册消息
}

// 绑定切换事件
showRegisterLink.addEventListener('click', (event) => {
    event.preventDefault(); // 阻止链接默认行为
    showRegisterForm();
});

showLoginLink.addEventListener('click', (event) => {
    event.preventDefault(); // 阻止链接默认行为
    showLoginForm();
});

/**
 * @function handleLogin
 * @description 处理用户登录表单提交事件
 * @param {Event} event - 表单提交事件对象
 */
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginErrorMessage.style.display = 'none';
    loginErrorMessage.textContent = '';

    const email = loginEmailInput.value.trim(); // 使用更新后的 ID
    const password = loginPasswordInput.value.trim(); // 使用更新后的 ID

    if (!email || !password) {
        loginErrorMessage.textContent = '邮箱和密码不能为空！(Email and password cannot be empty!)';
        loginErrorMessage.style.display = 'block';
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            console.error('登录错误:', error);
            if (error.message.includes('Invalid login credentials')) {
                loginErrorMessage.textContent = '邮箱或密码错误，请重试。(Invalid email or password. Please try again.)';
            } else {
                loginErrorMessage.textContent = `登录失败: ${error.message} (Login failed: ${error.message})`;
            }
            loginErrorMessage.style.display = 'block';
            return;
        }

        // 检查 data.user 是否存在 (更安全的做法)
        if (data.user) {
            console.log('登录成功:', data.user);
            window.location.href = 'main_page.html'; // 跳转到主页面
        } else {
            console.warn('Supabase signInWithPassword returned no error and no user.');
            loginErrorMessage.textContent = '登录响应异常，请稍后重试。(Abnormal login response. Please try again later.)';
            loginErrorMessage.style.display = 'block';
        }


    } catch (error) {
        console.error('捕获到意外错误:', error);
        loginErrorMessage.textContent = `发生意外错误: ${error.message} (An unexpected error occurred: ${error.message})`;
        loginErrorMessage.style.display = 'block';
    }
});

/**
 * @function handleRegister
 * @description 处理用户注册表单提交事件
 * @param {Event} event - 表单提交事件对象
 */
registerForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // 阻止表单默认提交行为
    registerMessage.style.display = 'none'; // 隐藏之前的消息
    registerMessage.textContent = '';
    registerMessage.classList.remove('error-message', 'success-message'); // 移除旧样式

    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    // 前端基本验证
    if (!email || !password || !confirmPassword) {
        registerMessage.textContent = '所有字段均为必填项！(All fields are required!)';
        registerMessage.classList.add('error-message'); // 添加错误样式
        registerMessage.style.display = 'block';
        return;
    }
    if (password !== confirmPassword) {
        registerMessage.textContent = '两次输入的密码不一致！(Passwords do not match!)';
        registerMessage.classList.add('error-message');
        registerMessage.style.display = 'block';
        return;
    }
    // 你可以在这里添加更复杂的密码强度验证逻辑

    try {
        // 调用 Supabase 注册方法
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            // options: { // 如果需要，可以传递额外数据
            //   data: {
            //     first_name: 'John',
            //     age: 27,
            //   }
            // }
        });

        if (error) {
            console.error('注册错误:', error);
            // 根据错误类型显示不同消息
            if (error.message.includes('User already registered')) {
                registerMessage.textContent = '该邮箱已被注册。(Email already registered.)';
            } else if (error.message.includes('Password should be at least 6 characters')) {
                registerMessage.textContent = '密码至少需要6个字符。(Password should be at least 6 characters.)';
            } else {
                registerMessage.textContent = `注册失败: ${error.message} (Registration failed: ${error.message})`;
            }
            registerMessage.classList.add('error-message');
            registerMessage.style.display = 'block';
            return;
        }

        // 注册请求成功提交
        console.log('注册请求成功:', data);

        // 检查是否需要邮件确认 (data.user 不为 null 但 session 为 null)
        if (data.user && data.session === null) {
            registerMessage.textContent = '注册成功！请检查你的邮箱以完成验证。(Registration successful! Please check your email to complete verification.)';
            registerMessage.classList.add('success-message'); // 添加成功样式
            registerForm.reset(); // 清空表单
        } else if (data.user && data.session !== null) {
            // 如果无需邮件确认或自动确认，用户会直接登录
            registerMessage.textContent = '注册成功并已自动登录！(Registration successful and automatically logged in!)';
            registerMessage.classList.add('success-message');
            // 你可以选择直接跳转到主页
            // window.location.href = 'main_page.html';
        } else {
            // 理论上不应发生，但以防万一
            console.warn('Supabase signUp returned unexpected data structure:', data);
            registerMessage.textContent = '注册响应异常，请稍后重试。(Abnormal registration response. Please try again later.)';
            registerMessage.classList.add('error-message');
        }
        registerMessage.style.display = 'block';


    } catch (error) {
        console.error('捕获到注册意外错误:', error);
        registerMessage.textContent = `发生意外错误: ${error.message} (An unexpected error occurred: ${error.message})`;
        registerMessage.classList.add('error-message');
        registerMessage.style.display = 'block';
    }
});

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

// 4. 页面加载时，默认显示登录表单
document.addEventListener('DOMContentLoaded', () => {
    showLoginForm(); // 初始加载时显示登录表单
});