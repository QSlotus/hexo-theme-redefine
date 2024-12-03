// 假设这是您的 hitokoto.js 文件

// 这个函数用于加载一言
function loadHitokoto() {
    fetch('https://v1.hitokoto.cn/?encode=jsonp&charset=utf-8')
        .then(response => response.json())
        .then(data => {
            const hitokotoElement = document.getElementById('hitokoto');
            if (hitokotoElement && data.hitokoto) {
                // 使用『』括起一言的文字主体，不展示作者
                hitokotoElement.innerHTML = `『${data.hitokoto}』`;
            }
        })
        .catch(error => console.error('Error fetching hitokoto:', error));
}

// 这个函数用于在 Swup 路由变化时重新加载一言
function onSwupPageView() {
    cleanup();  // 清理旧的请求（如果有的话）
    loadHitokoto();  // 重新加载一言
}

// 事件监听器
document.addEventListener("DOMContentLoaded", loadHitokoto);

// Swup 相关的事件监听器
if (typeof swup !== 'undefined') {
    swup.hooks.on("page:view", onSwupPageView);
    swup.hooks.on("content:replace", cleanup);
}

// 清理函数
function cleanup() {
    // 如果有正在进行的请求，可以在这里进行清理
    // 对于一言来说，可能不需要特别的清理逻辑
}