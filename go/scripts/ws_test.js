/*
 * WebSocket 测试脚本
 * 功能：
 * 1) 连接 ws://localhost:8080/ws
 * 2) 发送一次 purchase
 * 3) 每500ms发送一次，共10次 user_action
 * 4) 等待来自 LLM 的响应（非 USER_STATE_UPDATED / 非 PURCHASE_RESPONSE）
 * 运行：
 *   npm init -y && npm install ws
 *   node scripts/ws_test.js
 */

const WebSocket = require('ws');

const WS_URL = process.env.WS_URL || 'ws://localhost:8080/ws';

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function logSend(type, payload) {
  const msg = { type, ...payload };
  console.log(`📤 Sent ${type}:`, JSON.stringify(msg));
}

function isLLMResponse(data) {
  if (!data || !data.state || !data.message) return false;
  // 过滤掉即时确认和购买反馈，只保留 LLM 分析消息
  return data.state !== 'USER_STATE_UPDATED' && data.state !== 'PURCHASE_RESPONSE';
}

async function run() {
  console.log(`Connecting to ${WS_URL} ...`);
  const ws = new WebSocket(WS_URL);

  let llmResolved = false;
  let llmResolve;
  const llmPromise = new Promise((resolve) => {
    llmResolve = resolve;
  });

  ws.on('open', async () => {
    console.log('✅ WebSocket connected');

    // 1) 循环测试所有 item_id 的 purchase（0..14），不传 category
    for (let itemId = 0; itemId <= 14; itemId += 1) {
      const purchaseMsg = {
        type: 'purchase',
        item_id: itemId,
        timestamp: nowSec(),
      };
      ws.send(JSON.stringify(purchaseMsg));
      logSend('purchase', purchaseMsg);
      await new Promise((r) => setTimeout(r, 100));
    }

    // 2) 十个定时推送的 UserAction
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      const stage = 10 * count; // 10, 20, ... 100
      const clicks = 50 * count; // 50, 100, ... 500
      const uaMsg = {
        type: 'user_action',
        stage,
        clicks,
        timestamp: nowSec(),
      };
      ws.send(JSON.stringify(uaMsg));
      logSend('user_action', uaMsg);

      if (count >= 10) {
        clearInterval(interval);
      }
    }, 500);

    // 3) 最长等待 30 秒，若出现 LLM 响应则提前结束
    const timeout = setTimeout(() => {
      if (!llmResolved) {
        console.warn('⏱️ Timeout: no LLM response within 30s');
        llmResolved = true;
        llmResolve();
      }
    }, 30000);

    llmPromise.then(() => {
      clearTimeout(timeout);
      console.log('🏁 Test completed, closing WebSocket.');
      ws.close();
    });
  });

  ws.on('message', (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch (e) {
      console.error('Failed to parse message:', raw.toString());
      return;
    }

    const { type, timestamp, data } = message;
    if (type === 'response') {
      console.log(`📨 Response @${timestamp}:`, data);
      if (!llmResolved && isLLMResponse(data)) {
        console.log('🤖 LLM response detected:', data);
        llmResolved = true;
        llmResolve();
      }
    } else if (type === 'client_info') {
      console.log('ℹ️ Client info:', data);
    } else if (type === 'error') {
      console.error('❌ Error:', data);
    } else {
      console.log('📩 Unknown message:', message);
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket closed');
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});