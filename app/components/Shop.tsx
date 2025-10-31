'use client';

import { useAtom } from 'jotai';
import { clickCountAtom, shopItemsAtom, stageAtom } from '../store/atoms';
import ShopItem, { ShopItemData } from './ShopItem';
import { handleItemPurchase } from '../utils/purchaseHandler';

export default function Shop() {
  const [clickCount] = useAtom(clickCountAtom);
  const [shopItems, setShopItems] = useAtom(shopItemsAtom);
  const [stage, setStage] = useAtom(stageAtom);

  if (clickCount === 0) {
    return null;
  }

  const handlePurchase = (item: ShopItemData) => {
    // 调用统一的购买处理器
    handleItemPurchase({
      item,
      setShopItems,
      setStage,
    });
  };

  // 过滤掉隐藏的 items
  const visibleItems = shopItems.filter(item => !item.hidden);

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
