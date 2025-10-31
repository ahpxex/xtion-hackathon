/**
 * Level 系统
 * 将 stage (0-3000) 映射到非线性的 level
 * 用户不知道总共有多少 level
 */

// Level 阈值配置（非线性增长）
// 每个 level 需要达到的最小 stage 值
const LEVEL_THRESHOLDS = [
  0,      // Level 1: 0-9
  10,     // Level 2: 10-29
  30,     // Level 3: 30-99
  100,    // Level 4: 100-199
  200,    // Level 5: 200-349
  350,    // Level 6: 350-549
  550,    // Level 7: 550-799
  800,    // Level 8: 800-1099
  1100,   // Level 9: 1100-1449
  1450,   // Level 10: 1450-1849
  1850,   // Level 11: 1850-2299
  2300,   // Level 12: 2300-2799
  2800,   // Level 13: 2800-2999
  3000,   // Level 14: 3000+ (最终级别)
];

/**
 * 根据 stage 计算当前 level
 */
export function getLevelFromStage(stage: number): number {
  // 找到当前 stage 对应的 level
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (stage >= LEVEL_THRESHOLDS[i]) {
      return i + 1; // level 从 1 开始
    }
  }
  return 1; // 默认返回 level 1
}

/**
 * 获取当前 level 的进度百分比
 */
export function getLevelProgress(stage: number): number {
  const currentLevel = getLevelFromStage(stage);
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1];

  // 如果已经是最高级别
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return 100;
  }

  const nextThreshold = LEVEL_THRESHOLDS[currentLevel];
  const levelRange = nextThreshold - currentThreshold;
  const progressInLevel = stage - currentThreshold;

  return Math.min(100, (progressInLevel / levelRange) * 100);
}

/**
 * 获取 level 的颜色
 */
export function getLevelColor(level: number): string {
  if (level === 1) return 'text-gray-500';
  if (level <= 3) return 'text-green-600';
  if (level <= 6) return 'text-blue-600';
  if (level <= 9) return 'text-purple-600';
  if (level <= 12) return 'text-orange-600';
  return 'text-red-600'; // Level 13+
}

/**
 * 获取 level 的渐变背景色
 */
export function getLevelGradient(level: number): string {
  if (level === 1) return 'bg-gray-400';
  if (level <= 3) return 'bg-gradient-to-r from-green-400 to-green-600';
  if (level <= 6) return 'bg-gradient-to-r from-blue-400 to-blue-600';
  if (level <= 9) return 'bg-gradient-to-r from-purple-400 to-purple-600';
  if (level <= 12) return 'bg-gradient-to-r from-orange-400 to-orange-600';
  return 'bg-gradient-to-r from-red-400 to-red-600'; // Level 13+
}

/**
 * 获取 level 的状态文字
 */
export function getLevelText(level: number): string {
  if (level === 1) return '新手上路';
  if (level <= 3) return '初出茅庐';
  if (level <= 6) return '渐入佳境';
  if (level <= 9) return '炉火纯青';
  if (level <= 12) return '登峰造极';
  return '超凡入圣'; // Level 13+
}

/**
 * 获取下一个 level 所需的 stage（仅用于内部逻辑，不暴露给用户）
 */
export function getNextLevelThreshold(currentLevel: number): number | null {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return null; // 已经是最高级别
  }
  return LEVEL_THRESHOLDS[currentLevel];
}
