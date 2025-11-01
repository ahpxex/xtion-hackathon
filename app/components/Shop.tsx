'use client';

import { useAtom, useAtomValue } from 'jotai';
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
  displayUpgradeLevelAtom,
  leaderboardStyleLevelAtom,
  leaderboardBoostUntilAtom,
  leaderboardComedownUntilAtom,
} from '../store/atoms';
import ShopItem, { ShopItemData } from './ShopItem';
import { handleItemPurchase } from '../utils/purchaseHandler';
import { sendPurchaseEvent } from '../utils/websocketClient';

export default function Shop() {
  const [clickCount] = useAtom(clickCountAtom);
  const [shopItems, setShopItems] = useAtom(shopItemsAtom);
  const [stage, setStage] = useAtom(stageAtom);
  const [, setClickMultiplier] = useAtom(clickMultiplierAtom);
  const clickMultiplierValue = useAtomValue(clickMultiplierAtom);
  const [, setPenguinLevel] = useAtom(penguinLevelAtom);
  const [, setSkeletonLevel] = useAtom(skeletonLevelAtom);
  const [, setShowStageIndicator] = useAtom(showStageIndicatorAtom);
  const [, setShowFloatingPanel] = useAtom(showFloatingPanelAtom);
  const [, setShowLeaderboard] = useAtom(showLeaderboardAtom);
  const [, setFancyButton] = useAtom(fancyButtonAtom);
  const [, setFactoryLevel] = useAtom(factoryLevelAtom);
  const [, setBonusLevel] = useAtom(bonusLevelAtom);
  const [, setDisplayUpgradeLevel] = useAtom(displayUpgradeLevelAtom);
  const [, setLeaderboardStyleLevel] = useAtom(leaderboardStyleLevelAtom);
  const [, setLeaderboardBoostUntil] = useAtom(leaderboardBoostUntilAtom);
  const [, setLeaderboardComedownUntil] = useAtom(leaderboardComedownUntilAtom);

  if (clickCount === 0) {
    return null;
  }

  const handlePurchase = (item: ShopItemData) => {
    const nextClickCount = Math.max(0, clickCount - item.price);
    const nextLevel =
      item.currentLevel !== undefined
        ? Math.min((item.currentLevel ?? 0) + 1, item.maxLevel ?? (item.currentLevel ?? 0) + 1)
        : null;
    const nextClickMultiplier =
      item.id === 'multiplier'
        ? nextLevel ?? clickMultiplierValue
        : clickMultiplierValue;
    const nextStage = Math.max(0, stage - item.price);

    setStage(nextStage);

    sendPurchaseEvent({
      itemId: item.id,
      itemName: item.name,
      pricePaid: item.price,
      clickCount: nextClickCount,
      stage: nextStage,
      clickMultiplier: nextClickMultiplier,
      currentLevel: item.currentLevel ?? null,
      nextLevel,
      repeatable: item.repeatable,
    });

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
      setLeaderboardStyleLevel,
      setLeaderboardBoostUntil,
      setLeaderboardComedownUntil,
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
