import { atom } from "jotai";
import { ShopItemData } from "../components/ShopItem";

export interface ToastData {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  duration?: number; // 显示时长（毫秒），默认 3000
  showIcon?: boolean; // 是否显示前置图标
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  points: number;
  trend: "up" | "down" | "steady";
  delta: number;
}

export const clickCountAtom = atom(0);

export const clicksAtom = atom(0); // 实际点击次数（不显示在前端）

export const stageAtom = atom(0); // 游戏阶段，等于用户总共产生的点数

export const clickMultiplierAtom = atom(1); // 点击倍数，默认为1

export const penguinLevelAtom = atom(0); // 企鹅展示等级
export const skeletonLevelAtom = atom(0); // 骷髅展示等级

export const showStageIndicatorAtom = atom(false); // 是否显示游戏进度表
export const showFloatingPanelAtom = atom(false); // 是否显示 AI 功能
export const showLeaderboardAtom = atom(false); // 是否显示排行榜
export const fancyButtonAtom = atom(false); // 是否启用炫酷按钮
export const showAbstractVideoAtom = atom(false); // 是否显示终局视频
export const finaleModeAtom = atom(false); // 是否进入终局模式
export const factoryLevelAtom = atom(0); // 点数工厂等级
export const bonusLevelAtom = atom(0); // 幸运硬币等级
export const displayUpgradeLevelAtom = atom(0); // 点数显示器升级等级
export const leaderboardStyleLevelAtom = atom(0); // 排行榜炫酷等级
export const leaderboardBoostUntilAtom = atom(0); // 排名临时上升截止时间戳
export const leaderboardComedownUntilAtom = atom(0); // 排名回落截止时间戳

export const leaderboardAtom = atom<LeaderboardEntry[]>([
  {
    id: "1",
    rank: 1,
    name: "孙笑川258",
    points: 1280,
    trend: "steady",
    delta: 0,
  },
  {
    id: "2",
    rank: 2,
    name: "张伟Beta",
    points: 1175,
    trend: "steady",
    delta: 0,
  },
  {
    id: "player",
    rank: 3,
    name: "你·阿尔法",
    points: 945,
    trend: "steady",
    delta: 0,
  },
  {
    id: "3",
    rank: 4,
    name: "暴走系数",
    points: 930,
    trend: "steady",
    delta: 0,
  },
  { id: "4", rank: 5, name: "QiangG", points: 755, trend: "steady", delta: 0 },
  {
    id: "5",
    rank: 6,
    name: "一号线末班",
    points: 640,
    trend: "steady",
    delta: 0,
  },
]);

export const toastsAtom = atom<ToastData[]>([]);

export const shopItemsAtom = atom<ShopItemData[]>([
  {
    id: "multiplier",
    name: "点击倍增器",
    description: "使每次点击获得更多点数",
    price: 50,
    effect: "点击 x2",
    icon: "✨",
    level: 1,
    repeatable: true,
    currentLevel: 0,
    maxLevel: 5,
    stageThreshold: 5,
  },
  {
    id: "factory",
    name: "点数工厂",
    description: "大幅提升自动生产效率",
    price: 200,
    effect: "每3秒 +0",
    icon: "🏭",
    level: 2,
    repeatable: true,
    currentLevel: 0,
    maxLevel: 10,
    stageThreshold: 200,
  },
  {
    id: "bonus",
    name: "幸运硬币",
    description: "点击时有机会获得额外点数",
    price: 250,
    effect: "双倍概率 0%",
    icon: "🪙",
    level: 2,
    repeatable: true,
    currentLevel: 0,
    maxLevel: 10,
    stageThreshold: 200,
  },
  {
    id: "display-upgrade",
    name: "显示器焕新",
    description: "升级点数显示器的视觉表现",
    price: 180,
    effect: "字体 +0%",
    icon: "📺",
    level: 2,
    repeatable: true,
    currentLevel: 0,
    maxLevel: 5,
    stageThreshold: 150,
  },
  {
    id: "leaderboard",
    name: "全服排行榜",
    description: "开启全球玩家实时排名面板",
    price: 350,
    effect: "显示排行榜",
    icon: "🏆",
    level: 3,
    repeatable: false,
    stageThreshold: 250,
  },
  {
    id: "leaderboard-upgrade",
    name: "榜单声光包",
    description: "让排行榜更炸裂并暂时冲上头名",
    price: 260,
    effect: "炫酷度 Lv.0",
    icon: "📣",
    level: 3,
    repeatable: true,
    currentLevel: 0,
    maxLevel: 5,
    stageThreshold: 250,
  },
  {
    id: "button-upgrade",
    name: "彩虹按钮",
    description: "将主按钮升级为炫彩流动效果",
    price: 180,
    effect: "按钮获得彩虹特效",
    icon: "🌈",
    level: 2,
    repeatable: false,
    stageThreshold: 150,
  },
  {
    id: "penguin",
    name: "企鹅",
    description: "解锁并扩建企鹅护照阵列",
    price: 400,
    effect: "企鹅数量 x0",
    icon: "🐧",
    level: 3,
    repeatable: true,
    currentLevel: 0,
    maxLevel: 5,
    stageThreshold: 300,
  },
  {
    id: "skeleton",
    name: "骷髅",
    description: "举办更盛大的骷髅舞会",
    price: 500,
    effect: "骷髅数量 x0",
    icon: "💀",
    level: 3,
    repeatable: true,
    currentLevel: 0,
    maxLevel: 5,
    stageThreshold: 300,
  },
  {
    id: "stage-indicator",
    name: "游戏进度表",
    description: "显示游戏进度和阶段信息",
    price: 150,
    effect: "显示进度条",
    icon: "📊",
    level: 2,
    repeatable: false,
    stageThreshold: 100,
  },
  {
    id: "ai-panel",
    name: "AI 功能",
    description: "启用智能助手和通知系统",
    price: 60,
    effect: "显示 AI 面板",
    icon: "🤖",
    level: 1,
    repeatable: false,
    stageThreshold: 20,
  },
  {
    id: "rocket",
    name: "火箭",
    description: "点数增长加速",
    price: 1000,
    effect: "所有效果 x3",
    icon: "🚀",
    level: 5,
    repeatable: false,
    stageThreshold: 500,
  },
]);
