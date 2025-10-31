import NativeButton from "./components/NativeButton";
import CreditDisplay from "./components/CreditDisplay";
import Shop from "./components/Shop";
import { ShopItemData } from "./components/ShopItem";

const shopItems: ShopItemData[] = [
  {
    id: 'cursor',
    name: '自动点击器',
    description: '每秒自动增加点数',
    price: 10,
    effect: '+1 点数/秒',
    icon: '👆'
  },
  {
    id: 'multiplier',
    name: '点击倍增器',
    description: '使每次点击获得更多点数',
    price: 50,
    effect: '点击效果 x2',
    icon: '✨'
  },
  {
    id: 'factory',
    name: '点数工厂',
    description: '大幅提升自动生产效率',
    price: 100,
    effect: '+5 点数/秒',
    icon: '🏭'
  },
  {
    id: 'bonus',
    name: '幸运硬币',
    description: '点击时有机会获得额外点数',
    price: 75,
    effect: '10% 获得双倍点数',
    icon: '🪙'
  },
  {
    id: 'robot',
    name: '机器人',
    description: '全自动点击系统',
    price: 200,
    effect: '+10 点数/秒',
    icon: '🤖'
  },
  {
    id: 'rocket',
    name: '火箭',
    description: '点数增长加速',
    price: 500,
    effect: '所有效果 x3',
    icon: '🚀'
  }
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col gap-6 justify-center items-center py-8">
      <CreditDisplay size="sm" />
      <NativeButton clickValue={1}>Native Button</NativeButton>
      <Shop items={shopItems} />
    </div>
  );
}
