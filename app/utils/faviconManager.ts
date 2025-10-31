/**
 * 图标管理系统
 * 根据 item id 设置网页标题和图标
 */

interface FaviconConfig {
  title: string;
  emoji: string; // 使用 emoji 作为 favicon
}

// 图标配置映射
const faviconConfigs: Record<string, FaviconConfig> = {
  multiplier: {
    title: '点击游戏 - 倍增模式',
    emoji: '✨',
  },
  penguin: {
    title: '点击游戏 - 企鹅陪伴',
    emoji: '🐧',
  },
  skeleton: {
    title: '点击游戏 - 骷髅狂舞',
    emoji: '💀',
  },
  factory: {
    title: '点击游戏 - 工厂运转中',
    emoji: '🏭',
  },
  bonus: {
    title: '点击游戏 - 幸运加持',
    emoji: '🪙',
  },
  'stage-indicator': {
    title: '点击游戏 - 进度追踪',
    emoji: '📊',
  },
  'ai-panel': {
    title: '点击游戏 - AI 助手',
    emoji: '🤖',
  },
  'button-upgrade': {
    title: '点击游戏 - 彩虹按钮上线',
    emoji: '🌈',
  },
  leaderboard: {
    title: '点击游戏 - 排行榜热区',
    emoji: '🏆',
  },
  rocket: {
    title: '点击游戏 - 火箭加速',
    emoji: '🚀',
  },
};

/**
 * 将 emoji 转换为 data URL 用作 favicon
 */
function emojiToDataUrl(emoji: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.font = '48px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 32, 32);

  return canvas.toDataURL();
}

/**
 * 设置网页标题
 */
export function setPageTitle(title: string): void {
  document.title = title;
}

/**
 * 设置网页图标
 */
export function setPageFavicon(emoji: string): void {
  // 移除现有的 favicon
  const existingFavicon = document.querySelector("link[rel*='icon']");
  if (existingFavicon) {
    existingFavicon.remove();
  }

  // 创建新的 favicon
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = emojiToDataUrl(emoji);
  document.head.appendChild(link);
}

/**
 * 根据 item id 设置标题和图标
 */
export function setPageMetaByItemId(itemId: string): void {
  const config = faviconConfigs[itemId];

  if (!config) {
    console.warn(`No favicon config found for item: ${itemId}`);
    return;
  }

  setPageTitle(config.title);
  setPageFavicon(config.emoji);

  console.log(`✅ Page meta updated for item: ${itemId}`);
}

/**
 * 重置为默认标题和图标
 */
export function resetPageMeta(): void {
  setPageTitle('点击游戏');
  setPageFavicon('🎮');
}

/**
 * 获取所有可用的图标配置
 */
export function getAllFaviconConfigs(): Record<string, FaviconConfig> {
  return faviconConfigs;
}
