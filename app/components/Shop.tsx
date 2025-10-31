'use client';

import { useAtom } from 'jotai';
import {
  clickCountAtom,
  shopItemsAtom,
  stageAtom,
  clickMultiplierAtom,
  penguinLevelAtom,
  skeletonLevelAtom,
  showStageIndicatorAtom,
  showFloatingPanelAtom,
  showLeaderboardAtom,
  fancyButtonAtom,
  factoryLevelAtom,
  bonusLevelAtom,
  displayUpgradeLevelAtom
} from '../store/atoms';
import ShopItem, { ShopItemData } from './ShopItem';
import { handleItemPurchase } from '../utils/purchaseHandler';

export default function Shop() {
  const [clickCount] = useAtom(clickCountAtom);
  const [shopItems, setShopItems] = useAtom(shopItemsAtom);
  const [stage, setStage] = useAtom(stageAtom);
  const [, setClickMultiplier] = useAtom(clickMultiplierAtom);
  const [, setPenguinLevel] = useAtom(penguinLevelAtom);
  const [, setSkeletonLevel] = useAtom(skeletonLevelAtom);
  const [, setShowStageIndicator] = useAtom(showStageIndicatorAtom);
  const [, setShowFloatingPanel] = useAtom(showFloatingPanelAtom);
  const [, setShowLeaderboard] = useAtom(showLeaderboardAtom);
  const [, setFancyButton] = useAtom(fancyButtonAtom);
  const [, setFactoryLevel] = useAtom(factoryLevelAtom);
  const [, setBonusLevel] = useAtom(bonusLevelAtom);
  const [, setDisplayUpgradeLevel] = useAtom(displayUpgradeLevelAtom);

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
      setPenguinLevel,
      setSkeletonLevel,
      setShowStageIndicator,
      setShowFloatingPanel,
      setShowLeaderboard,
      setFancyButton,
      setFactoryLevel,
      setBonusLevel,
      setDisplayUpgradeLevel,
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
