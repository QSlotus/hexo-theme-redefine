// article-ai-summary.js
let currentController = null;
let currentStyle = 'prompt1';  // 默认风格
let promptConfig = null;

async function sha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return hashHex;
}

async function initPromptButtons() {
    try {
        const response = await fetch('https://summary.qiusyan.top/prompt_config');
        promptConfig = await response.json();
        
        const buttonContainer = document.querySelector('.style-buttons');
        buttonContainer.innerHTML = Object.entries(promptConfig)
        .map(([style, config]) => `
            <button class="style-button ${style === currentStyle ? 'active' : ''} 
                    flex items-center gap-1 px-2 py-1 rounded text-sm border border-border-color 
                    hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
                    data-style="${style}" onclick="generateAISummary('${style}')">
                <i class="${config.icon}"></i>
                <span>${config.name}</span>
            </button>
        `).join('');
    } catch (error) {
        console.error('Failed to load prompt config:', error);
    }
}

async function generateAISummary(style = currentStyle) {
    currentStyle = style;
    const outputContainer = document.getElementById("ai-output");
    if (!outputContainer) return;

    if (currentController) {
        currentController.abort();
    }

    currentController = new AbortController();
    const signal = currentController.signal;

    if (typeof window.articleTitle === 'undefined' || typeof window.articleContent === 'undefined') {
        console.warn('Article data not yet available');
        return;
    }

    // 更新按钮状态
    document.querySelectorAll('.style-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.style === style) {
            btn.classList.add('active');
        }
    });

    outputContainer.innerHTML = `
        <div class="flex items-center gap-2">
            正在生成中...
        </div>`;

    const postContent = "文章标题：" + window.articleTitle + 
                       "；文章内容：" + window.articleContent;
    
    try {
        const contentHash = await sha256(postContent);
        const currentPath = encodeURIComponent(location.pathname);

        // 检查摘要是否存在
        const checkResponse = await fetch(
            `https://summary.qiusyan.top/is_uploaded?id=${currentPath}&sign=${encodeURIComponent(contentHash)}`,
            { signal }
        );
        
        if (signal.aborted) return;
        const status = await checkResponse.text();

        if (status === "yes") {
            const summaryResponse = await fetch(
                `https://summary.qiusyan.top/get_summary?id=${currentPath}&sign=${encodeURIComponent(contentHash)}&style=${style}`,
                { signal }
            );
            if (signal.aborted) return;
            const summary = await summaryResponse.text();
            if (outputContainer) {
                outputContainer.textContent = summary;
            }
        } else {
            // 上传内容
            await fetch(`https://summary.qiusyan.top/upload_blog?id=${currentPath}`, {
                method: 'POST',
                body: postContent,
                signal
            });
            if (signal.aborted) return;

            // 初始化 SSE
            const evSource = new EventSource(
                `https://summary.qiusyan.top/summary?id=${currentPath}&style=${style}`
            );
            
            if (outputContainer) {
                outputContainer.textContent = "";
            }

            signal.addEventListener('abort', () => {
                evSource.close();
            });

            evSource.onmessage = (event) => {
                if (!outputContainer || signal.aborted) {
                    evSource.close();
                    return;
                }

                if (event.data === "[DONE]") {
                    evSource.close();
                    return;
                }
                try {
                    const data = JSON.parse(event.data);
                    outputContainer.textContent += data.response;
                } catch (e) {
                    console.error('Error parsing SSE message:', e);
                }
            };

            evSource.onerror = () => {
                evSource.close();
                if (outputContainer && !outputContainer.textContent && !signal.aborted) {
                    outputContainer.textContent = "摘要生成失败，请稍后刷新页面重试。";
                }
            };

            // 触发摘要生成
            fetch(
                `https://summary.qiusyan.top/get_summary?id=${currentPath}&sign=${encodeURIComponent(contentHash)}&style=${style}`,
                { signal }
            );
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            return;  // 请求被取消，静默返回
        }
        console.error('AI Summary Error:', error);
        if (outputContainer && !signal.aborted) {
            outputContainer.textContent = "摘要生成失败，请稍后刷新页面重试。";
        }
    }
}

function initAISummary() {
    const aiOutput = document.getElementById('ai-output');
    if (!aiOutput) return;

    // 初始化提示词按钮
    initPromptButtons();

    if (typeof window.articleTitle !== 'undefined' && typeof window.articleContent !== 'undefined') {
        generateAISummary();
        return;
    }

    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = setInterval(() => {
        if (typeof window.articleTitle !== 'undefined' && typeof window.articleContent !== 'undefined') {
            clearInterval(retryInterval);
            generateAISummary();
            return;
        }

        retryCount++;
        if (retryCount >= maxRetries) {
            clearInterval(retryInterval);
            console.error('Failed to load article data after multiple attempts');
            const outputContainer = document.getElementById("ai-output");
            if (outputContainer) {
                outputContainer.textContent = "无法加载文章数据，请刷新页面重试。";
            }
        }
    }, 1000);
}

// 清理函数
function cleanup() {
    if (currentController) {
        currentController.abort();
        currentController = null;
    }
}

// 事件监听器
document.addEventListener("DOMContentLoaded", initAISummary);

// Swup 相关的事件监听器
if (typeof swup !== 'undefined') {
    swup.hooks.on("page:view", () => {
        cleanup();  // 清理旧的请求
        initAISummary();
    });
    swup.hooks.on("content:replace", cleanup);
}

// URL 变化观察器
let lastPath = location.pathname;
const observer = new MutationObserver(() => {
    if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        cleanup();  // 清理旧的请求
        initAISummary();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});