// Test callback page JavaScript logic

// Initialize after page loads
document.addEventListener('DOMContentLoaded', function() {
    initTestCallback();
});

function initTestCallback() {
    const testBtn = document.getElementById('testBtn');
    const outTradeNoInput = document.getElementById('outTradeNo');
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');
    
    // Bind test button click event
    testBtn.addEventListener('click', function() {
        const outTradeNo = outTradeNoInput.value.trim();
        
        if (!outTradeNo) {
            showError('Please enter merchant order number');
            return;
        }
        
        // Validate order number format (simple validation)
        if (outTradeNo.length < 6) {
            showError('Merchant order number format is incorrect');
            return;
        }
        
        executeTestCallback(outTradeNo);
    });
    
    // Enter key submission
    outTradeNoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            testBtn.click();
        }
    });
}

// Execute test callback
function executeTestCallback(outTradeNo) {
    const testBtn = document.getElementById('testBtn');
    const btnText = testBtn.querySelector('.btn-text');
    const loading = testBtn.querySelector('.loading');
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');
    
    // 设置加载状态
    testBtn.disabled = true;
    btnText.style.display = 'none';
    loading.style.display = 'inline-block';
    
    // 隐藏之前的结果
    resultSection.style.display = 'none';
    resultSection.className = 'result-section';
    
    // 构建请求URL
    const apiUrl = `${getApiBaseUrl()}/api/v1/alipay/active_pay_notify`;
    
    // 发送POST请求
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `outTradeNo=${encodeURIComponent(outTradeNo)}`
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('API响应:', data);
        showResult(data, true);
    })
    .catch(error => {
        console.error('请求失败:', error);
        showResult({
            code: 'ERROR',
            info: '请求失败',
            data: error.message
        }, false);
    })
    .finally(() => {
        // 恢复按钮状态
        testBtn.disabled = false;
        btnText.style.display = 'inline-block';
        loading.style.display = 'none';
    });
}

// 显示结果
function showResult(data, isSuccess) {
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');
    
    // Translate Chinese API responses to English
    const translateMessage = (message) => {
        const translations = {
            '调用成功': 'Call successful',
            '交易成功，订单状态已更新': 'Transaction successful, order status has been updated',
            '未知错误': 'Unknown error',
            '请检查订单号是否正确': 'Please check if the order number is correct'
        };
        return translations[message] || message;
    };
    
    // Format display results
    let resultText = '';
    if (isSuccess && data.code === '0000') {
        resultText = `✅ Test Successful\n\n`;
        resultText += `Response Code: ${data.code}\n`;
        resultText += `Response Message: ${translateMessage(data.info)}\n`;
        resultText += `Processing Result: ${translateMessage(data.data)}\n`;
        resultText += `\n🎉 Order status has been successfully updated!`;
        
        resultSection.className = 'result-section result-success';
    } else {
        resultText = `❌ Test Failed\n\n`;
        resultText += `Response Code: ${data.code || 'ERROR'}\n`;
        resultText += `Response Message: ${translateMessage(data.info) || 'Unknown error'}\n`;
        resultText += `Error Details: ${translateMessage(data.data) || 'Please check if the order number is correct'}\n`;
        
        resultSection.className = 'result-section result-error';
    }
    
    resultContent.textContent = resultText;
    resultSection.style.display = 'block';
    
    // Scroll to result section
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show error message
function showError(message) {
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');
    
    resultContent.textContent = `❌ Input Error\n\n${message}`;
    resultSection.className = 'result-section result-error';
    resultSection.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        resultSection.style.display = 'none';
    }, 3000);
}

// 获取API基础URL
function getApiBaseUrl() {
    // 从AppConfig中获取API地址
    if (window.AppConfig && window.AppConfig.sPayMallUrl) {
        return window.AppConfig.sPayMallUrl;
    }
    
    // 如果AppConfig不可用，则使用默认配置
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8080';
    } else {
        // 生产环境或其他环境的API地址
        return `http://${hostname}:8080`;
    }
}

// 工具函数：复制结果到剪贴板
function copyResult() {
    const resultContent = document.getElementById('resultContent');
    const text = resultContent.textContent;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('结果已复制到剪贴板');
        }).catch(err => {
            console.error('复制失败:', err);
        });
    } else {
        // 兼容旧浏览器
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('结果已复制到剪贴板');
        } catch (err) {
            console.error('复制失败:', err);
        }
        document.body.removeChild(textArea);
    }
}

// 显示提示消息
function showToast(message) {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 1000;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 100);
    
    // 3秒后移除
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}