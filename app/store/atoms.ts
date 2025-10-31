import { atom } from 'jotai';
import { ShopItemData } from '../components/ShopItem';

export interface ToastData {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number; // 显示时长（毫秒），默认 3000
}

export const clickCountAtom = atom(0);

export const clicksAtom = atom(0); // 实际点击次数（不显示在前端）

export const stageAtom = atom(0); // 游戏阶段，等于用户总共产生的点数

export const clickMultiplierAtom = atom(1); // 点击倍数，默认为1

export const showPenguinAtom = atom(false); // 是否显示企鹅
export const showSkeletonAtom = atom(false); // 是否显示骷髅

export const showStageIndicatorAtom = atom(false); // 是否显示游戏进度表
export const showFloatingPanelAtom = atom(false); // 是否显示 AI 功能

export const toastsAtom = atom<ToastData[]>([]);

export const shopItemsAtom = atom<ShopItemData[]>([
  {
    id: 'multiplier',
    name: '点击倍增器',
    description: '使每次点击获得更多点数',
    price: 50,
    effect: '点击 +1',
    icon: '✨',
    level: 1,
    repeatable: true,
    currentLevel: 1,
    maxLevel: 5,
    stageThreshold: 50
  },
  {
    id: 'factory',
    name: '点数工厂',
    description: '大幅提升自动生产效率',
    price: 200,
    effect: '+5 点数/秒',
    icon: '🏭',
    level: 2,
    repeatable: false,
    stageThreshold: 200
  },
  {
    id: 'bonus',
    name: '幸运硬币',
    description: '点击时有机会获得额外点数',
    price: 250,
    effect: '10% 获得双倍点数',
    icon: '🪙',
    level: 2,
    repeatable: false,
    stageThreshold: 200
  },
  {
    id: 'penguin',
    name: '企鹅',
    description: '解锁可爱的企鹅动画',
    price: 400,
    effect: '显示企鹅',
    icon: '🐧',
    level: 3,
    repeatable: false,
    stageThreshold: 300
  },
  {
    id: 'skeleton',
    name: '骷髅',
    description: '解锁跳舞的骷髅动画',
    price: 500,
    effect: '显示骷髅',
    icon: '💀',
    level: 3,
    repeatable: false,
    stageThreshold: 300
  },
  {
    id: 'stage-indicator',
    name: '游戏进度表',
    description: '显示游戏进度和阶段信息',
    price: 150,
    effect: '显示进度条',
    icon: '📊',
    level: 2,
    repeatable: false,
    stageThreshold: 100
  },
  {
    id: 'ai-panel',
    name: 'AI 功能',
    description: '启用智能助手和通知系统',
    price: 300,
    effect: '显示 AI 面板',
    icon: '🤖',
    level: 3,
    repeatable: false,
    stageThreshold: 200
  },
  {
    id: 'rocket',
    name: '火箭',
    description: '点数增长加速',
    price: 1000,
    effect: '所有效果 x3',
    icon: '🚀',
    level: 5,
    repeatable: false,
    stageThreshold: 500
  }
]);
