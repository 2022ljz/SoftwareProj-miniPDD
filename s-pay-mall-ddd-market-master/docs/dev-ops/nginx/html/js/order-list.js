// 订单明细页面JavaScript
class OrderListManager {
    constructor() {
        this.userId = AppUtils.getUserIdFromUrl(); // 从公共工具获取用户ID
        this.lastId = null;
        this.pageSize = 10;
        this.hasMore = true;
        this.loading = false;
        this.currentRefundOrderId = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.displayUserId();
        this.loadOrderList();
    }
    
    bindEvents() {
        // 加载更多按钮事件
        document.getElementById('loadMoreBtn').addEventListener('click', () => {
            this.loadOrderList();
        });
        
        // 退单弹窗事件
        document.getElementById('cancelRefund').addEventListener('click', () => {
            this.hideRefundModal();
        });
        
        document.getElementById('confirmRefund').addEventListener('click', () => {
            this.processRefund();
        });
        
        // 点击弹窗外部关闭
        document.getElementById('refundModal').addEventListener('click', (e) => {
            if (e.target.id === 'refundModal') {
                this.hideRefundModal();
            }
        });
    }
    
    displayUserId() {
        const userIdElement = document.getElementById('userIdDisplay');
        if (userIdElement && this.userId) {
            userIdElement.textContent = `User ID: ${AppUtils.obfuscateUserId(this.userId)}`;
        }
    }
    
    async loadOrderList() {
        if (this.loading || !this.hasMore) return;
        
        this.loading = true;
        this.showLoading();
        
        try {
            const requestData = {
                userId: this.userId,
                lastId: this.lastId,
                pageSize: this.pageSize
            };
            
            // 调用后端API
            const response = await fetch(AppConfig.sPayMallUrl + '/api/v1/alipay/query_user_order_list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            if (result.code === '0000' && result.data) {
                this.renderOrderList(result.data.orderList, this.lastId === null);
                this.hasMore = result.data.hasMore;
                this.lastId = result.data.lastId;
                
                // 更新加载更多按钮状态
                this.updateLoadMoreButton();
            } else {
                this.showError('加载订单列表失败: ' + (result.info || '未知错误'));
            }
        } catch (error) {
            console.error('加载订单列表出错:', error);
            this.showError('网络错误，请稍后重试');
        } finally {
            this.loading = false;
            this.hideLoading();
        }
    }
    
    async renderOrderList(orders, isFirstLoad = false) {
        const orderListElement = document.getElementById('orderList');
        const emptyStateElement = document.getElementById('emptyState');
        
        if (isFirstLoad) {
            orderListElement.innerHTML = '';
        }
        
        if (orders && orders.length > 0) {
            emptyStateElement.style.display = 'none';
            
            // 查询拼团订单的团队信息
            await this.loadGroupInfo(orders);
            
            orders.forEach(order => {
                const orderElement = this.createOrderElement(order);
                orderListElement.appendChild(orderElement);
            });
        } else if (isFirstLoad) {
            emptyStateElement.style.display = 'block';
        }
    }
    
    async loadGroupInfo(orders) {
        // 找出所有拼团订单
        const groupOrders = orders.filter(order => order.marketType === 1);
        if (groupOrders.length === 0) return;
        
        // 检查是否有临时保存的待拼人数（刚创建的订单）
        const latestRemaining = localStorage.getItem('latest_team_remaining_' + this.userId);
        const latestTimestamp = localStorage.getItem('latest_team_timestamp_' + this.userId);
        
        // 如果临时值存在且是最近5分钟内的，应用到最新的PAY_WAIT订单
        if (latestRemaining && latestTimestamp) {
            const age = Date.now() - parseInt(latestTimestamp);
            if (age < 5 * 60 * 1000) { // 5分钟内有效
                // 找到最新的待支付拼团订单
                const latestPayWait = groupOrders
                    .filter(o => o.status === 'PAY_WAIT')
                    .sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime))[0];
                
                if (latestPayWait) {
                    const remaining = parseInt(latestRemaining);
                    latestPayWait.groupInfo = { 
                        targetCount: 3, 
                        completeCount: 3 - remaining 
                    };
                    console.log('应用临时待拼人数到订单:', latestPayWait.orderId, '剩余:', remaining);
                    
                    // 应用后保存到订单专属key，并清理临时key
                    localStorage.setItem('team_remaining_' + latestPayWait.orderId, remaining);
                    localStorage.removeItem('latest_team_remaining_' + this.userId);
                    localStorage.removeItem('latest_team_timestamp_' + this.userId);
                }
            }
        }
        
        // 为其他订单设置待拼人数
        for (const order of groupOrders) {
            if (order.groupInfo) continue; // 已经设置过了
            
            // 从localStorage读取每个订单的待拼人数
            const remaining = localStorage.getItem('team_remaining_' + order.orderId);
            if (remaining !== null) {
                // 从localStorage读取到了，计算targetCount和completeCount
                const remainingNum = parseInt(remaining);
                order.groupInfo = { 
                    targetCount: 3, 
                    completeCount: 3 - remainingNum 
                };
            } else {
                // 没有记录，默认显示还在2人
                order.groupInfo = { targetCount: 3, completeCount: 1 };
            }
        }
    }
    
    async queryGroupInfoByOrderId(orderId) {
        return null;
    }
    
    createOrderElement(order) {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order-item';
        
        // 存储订单完整信息到data属性
        orderDiv.dataset.orderData = JSON.stringify({
            orderId: order.orderId,
            productId: order.productId,
            marketType: order.marketType,
            payAmount: order.payAmount || order.totalAmount
        });
        
        // Determine which buttons to show based on order status
        let actionButtons = '';
        if (order.status === 'PAY_WAIT') {
            actionButtons = `
                <button class="pay-btn" onclick="orderManager.goPay('${order.orderId}')">Pay Now</button>
                <button class="refund-btn" onclick="orderManager.showRefundModal('${order.orderId}')">Cancel Order</button>
            `;
        } else if (order.status === 'CLOSE') {
            actionButtons = `
                <button class="refund-btn" disabled>Closed</button>
            `;
        } else {
            actionButtons = `
                <button class="refund-btn" onclick="orderManager.showRefundModal('${order.orderId}')">Apply Refund</button>
            `;
        }
        
        // Group buying tip
        let groupTip = '';
        if (order.marketType === 1 && order.groupInfo) {
            // Use saved remaining count from localStorage, fallback to calculated value
            const savedRemaining = localStorage.getItem(`team_remaining_${order.orderId}`);
            const remaining = savedRemaining !== null ? parseInt(savedRemaining) : (order.groupInfo.targetCount - order.groupInfo.completeCount);
            groupTip = `<div class="group-tip">Grouping in progress, ${remaining} more people needed</div>`;
        }
        
        orderDiv.innerHTML = `
            <div class="order-header">
                <div class="order-id" onclick="orderManager.copyOrderId('${order.orderId}')" title="Click to copy order number">
                    Order Number: <span class="order-id-text">${order.orderId}</span>
                    <span class="copy-icon">📋</span>
                </div>
                <div class="order-status status-${order.status}">${this.getStatusText(order.status)}</div>
            </div>
            ${groupTip}
            <div class="order-content">
                <div class="product-name">${order.productName || 'Product Name'}</div>
                <div class="order-details">
                    <div class="order-time">${this.formatTime(order.orderTime)}</div>
                    <div class="pay-amount">¥${order.payAmount || order.totalAmount}</div>
                </div>
            </div>
            <div class="order-actions">
                ${actionButtons}
            </div>
        `;
        
        return orderDiv;
    }
    
    getStatusText(status) {
        const statusMap = {
            'CREATE': 'New Order',
            'PAY_WAIT': 'Waiting for Payment',
            'PAY_SUCCESS': 'Payment Successful',
            'DEAL_DONE': 'Deal Complete',
            'CLOSE': 'Closed',
            'WAIT_REFUND': 'Refunding',
        };
        return statusMap[status] || status;
    }
    
    formatTime(timeStr) {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    
    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (this.hasMore) {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = '加载更多';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
    
    showRefundModal(orderId) {
        this.currentRefundOrderId = orderId;
        document.getElementById('refundModal').style.display = 'flex';
    }
    
    hideRefundModal() {
        document.getElementById('refundModal').style.display = 'none';
        this.currentRefundOrderId = null;
    }
    
    async processRefund() {
        if (!this.currentRefundOrderId) return;
        
        this.showLoading();
        
        try {
            const requestData = {
                userId: this.userId,
                orderId: this.currentRefundOrderId
            };
            
            const response = await fetch(AppConfig.sPayMallUrl + '/api/v1/alipay/refund_order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            if (result.code === '0000' && result.data && result.data.success) {
                this.showSuccess('退单成功');
                this.hideRefundModal();
                // 重新加载订单列表
                this.refreshOrderList();
            } else {
                this.showError('退单失败: ' + (result.info || result.data?.message || '未知错误'));
            }
        } catch (error) {
            console.error('退单操作出错:', error);
            this.showError('网络错误，请稍后重试');
        } finally {
            this.hideLoading();
        }
    }
    
    refreshOrderList() {
        this.lastId = null;
        this.hasMore = true;
        document.getElementById('orderList').innerHTML = '';
        this.loadOrderList();
    }
    
    showLoading() {
        document.getElementById('loadingTip').style.display = 'block';
    }
    
    hideLoading() {
        document.getElementById('loadingTip').style.display = 'none';
    }
    
    showError(message) {
        alert('错误: ' + message);
    }
    
    showSuccess(message) {
        alert('成功: ' + message);
    }
    
    // Pay functionality - reuse main page payment logic
    async goPay(orderId) {
        // 找到对应的订单元素，获取订单信息
        const orderElements = document.querySelectorAll('.order-item');
        let orderData = null;
        
        for (let elem of orderElements) {
            const orderIdText = elem.querySelector('.order-id-text').textContent;
            if (orderIdText === orderId) {
                // 从data属性中读取完整订单信息
                orderData = JSON.parse(elem.dataset.orderData);
                break;
            }
        }
        
        if (!orderData) {
            this.showError('订单信息获取失败');
            return;
        }
        
        this.showLoading();
        
        try {
            // 使用订单中的实际数据
            const requestData = {
                userId: this.userId,
                productId: orderData.productId,
                marketType: orderData.marketType  // 使用订单的实际marketType
            };
            
            const response = await fetch(AppConfig.sPayMallUrl + '/api/v1/alipay/create_pay_order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            if (result.code === '0000' && result.data) {
                // 移除已有的支付表单
                document.querySelectorAll('form').forEach(form => form.remove());
                // 插入新的支付表单
                document.body.insertAdjacentHTML('beforeend', result.data);
                // 显示支付确认弹窗（复用主页面逻辑）
                this.showPaymentConfirm(orderData.payAmount);
            } else {
                this.showError('获取支付信息失败: ' + (result.info || '未知错误'));
            }
        } catch (error) {
            console.error('Error going to pay:', error);
            this.showError('网络错误，请稍后重试');
        } finally {
            this.hideLoading();
        }
    }
    
    // 支付确认弹窗（复用主页面逻辑）
    showPaymentConfirm(price) {
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'payment-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        // 创建弹窗内容
        const modal = document.createElement('div');
        modal.className = 'payment-modal';
        modal.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            max-width: 400px;
            width: 90%;
        `;
        modal.innerHTML = `
            <h3 style="margin: 0 0 20px 0; text-align: center;">Payment Confirmation</h3>
            <p style="margin: 10px 0;">Amount: ￥${price}</p>
            <p style="margin: 10px 0;">Buyer Account: <span class="copyable" data-copy="kvhmoj3832@sandbox.com" style="cursor: pointer; color: #667eea; text-decoration: underline;">kvhmoj3832@sandbox.com</span></p>
            <p style="margin: 10px 0;">Login Password: 111111</p>
            <p style="margin: 10px 0;">Payment Password: 111111</p>
            <div class="modal-buttons" style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="confirm-btn" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Confirm Payment</button>
                <button class="cancel-btn" style="flex: 1; padding: 12px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel Payment</button>
            </div>
        `;
        
        // 确认支付处理
        modal.querySelector('.confirm-btn').addEventListener('click', () => {
            const form = document.querySelector('form');
            if (form) form.submit();
            overlay.remove();
        });
        
        // 取消支付处理
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            document.querySelectorAll('form').forEach(form => form.remove());
            overlay.remove();
        });
        
        // 复制功能
        modal.querySelector('.copyable').addEventListener('click', function() {
            const textToCopy = this.getAttribute('data-copy');
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert('Buyer account copied to clipboard');
            }).catch(err => {
                console.error('Unable to copy text: ', err);
            });
        });
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }
    
    // Copy order number functionality
    copyOrderId(orderId) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(orderId).then(() => {
                this.showToast('订单号已复制到剪贴板');
            }).catch(err => {
                console.error('复制失败:', err);
                this.fallbackCopyTextToClipboard(orderId);
            });
        } else {
            this.fallbackCopyTextToClipboard(orderId);
        }
    }
    
    // 兼容旧浏览器的复制方法
    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showToast('订单号已复制到剪贴板');
            } else {
                this.showToast('复制失败，请手动复制');
            }
        } catch (err) {
            console.error('复制失败:', err);
            this.showToast('复制失败，请手动复制');
        }
        
        document.body.removeChild(textArea);
    }
    
    // 显示提示消息
    showToast(message) {
        // 移除已存在的提示
        const existingToast = document.querySelector('.copy-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 创建新的提示元素
        const toast = document.createElement('div');
        toast.className = 'copy-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
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
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// 页面加载完成后初始化
let orderManager;
document.addEventListener('DOMContentLoaded', function() {
    orderManager = new OrderListManager();
});