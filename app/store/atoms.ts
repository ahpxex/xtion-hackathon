import { atom } from 'jotai';
import { ShopItemData } from '../components/ShopItem';

export interface ToastData {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number; // 显示时长（毫秒），默认 3000
}

export const clickCountAtom = atom(0);

export const stageAtom = atom(0); // 游戏阶段 0-1000

export const clickMultiplierAtom = atom(1); // 点击倍数，默认为1

export const showPenguinAtom = atom(false); // 是否显示企鹅
export const showSkeletonAtom = atom(false); // 是否显示骷髅

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
    maxLevel: 5
  },
  {
    id: 'penguin',
    name: '企鹅',
    description: '解锁可爱的企鹅动画',
    price: 100,
    effect: '显示企鹅',
    icon: '🐧',
    level: 2,
    repeatable: false
  },
  {
    id: 'skeleton',
    name: '骷髅',
    description: '解锁跳舞的骷髅动画',
    price: 150,
    effect: '显示骷髅',
    icon: '💀',
    level: 2,
    repeatable: false
  },
  {
    id: 'factory',
    name: '点数工厂',
    description: '大幅提升自动生产效率',
    price: 200,
    effect: '+5 点数/秒',
    icon: '🏭',
    level: 3,
    repeatable: false
  },
  {
    id: 'bonus',
    name: '幸运硬币',
    description: '点击时有机会获得额外点数',
    price: 250,
    effect: '10% 获得双倍点数',
    icon: '🪙',
    level: 3,
    repeatable: false
  },
  {
    id: 'robot',
    name: '机器人',
    description: '全自动点击系统',
    price: 300,
    effect: '+10 点数/秒',
    icon: '🤖',
    level: 4,
    repeatable: false
  },
  {
    id: 'rocket',
    name: '火箭',
    description: '点数增长加速',
    price: 500,
    effect: '所有效果 x3',
    icon: '🚀',
    level: 5,
    repeatable: false
  }
]);
