'use client';

import { useAtom } from 'jotai';
import {
  clickCountAtom,
  shopItemsAtom,
  stageAtom,
  clickMultiplierAtom,
  showPenguinAtom,
  showSkeletonAtom,
  showStageIndicatorAtom,
  showFloatingPanelAtom,
  showLeaderboardAtom,
  fancyButtonAtom,
  factoryLevelAtom,
  bonusLevelAtom
} from '../store/atoms';
import ShopItem, { ShopItemData } from './ShopItem';
import { handleItemPurchase } from '../utils/purchaseHandler';

export default function Shop() {
  const [clickCount] = useAtom(clickCountAtom);
  const [shopItems, setShopItems] = useAtom(shopItemsAtom);
  const [stage, setStage] = useAtom(stageAtom);
  const [, setClickMultiplier] = useAtom(clickMultiplierAtom);
  const [, setShowPenguin] = useAtom(showPenguinAtom);
  const [, setShowSkeleton] = useAtom(showSkeletonAtom);
  const [, setShowStageIndicator] = useAtom(showStageIndicatorAtom);
  const [, setShowFloatingPanel] = useAtom(showFloatingPanelAtom);
  const [, setShowLeaderboard] = useAtom(showLeaderboardAtom);
  const [, setFancyButton] = useAtom(fancyButtonAtom);
  const [, setFactoryLevel] = useAtom(factoryLevelAtom);
  const [, setBonusLevel] = useAtom(bonusLevelAtom);

  if (clickCount === 0) {
    return null;
  }

  const handlePurchase = (item: ShopItemData) => {
    // 调用统一的购买处理器
    handleItemPurchase({
      item,
      setShopItems,
      setStage,
      setClickMultiplier,
      setShowPenguin,
      setShowSkeleton,
      setShowStageIndicator,
      setShowFloatingPanel,
      setShowLeaderboard,
      setFancyButton,
      setFactoryLevel,
      setBonusLevel,
    });
  };

  // 过滤掉隐藏的 items 和 stage 不够的 items
  const visibleItems = shopItems.filter(item => {
    if (item.hidden) return false;
    if (item.stageThreshold && stage < item.stageThreshold) return false;
    return true;
  });

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {visibleItems.map(item => (
        <ShopItem
          key={item.id}
          item={item}
          onPurchase={handlePurchase}
        />
      ))}
    </div>
  );
}
