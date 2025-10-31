'use client';

import { useAtom } from 'jotai';
import { clickCountAtom, shopItemsAtom } from '../store/atoms';
import ShopItem, { ShopItemData } from './ShopItem';

export default function Shop() {
  const [clickCount] = useAtom(clickCountAtom);
  const [shopItems] = useAtom(shopItemsAtom);

  if (clickCount === 0) {
    return null;
  }

  const handlePurchase = (item: ShopItemData) => {
    console.log(`购买了: ${item.name}`);
  };

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {shopItems.map(item => (
        <ShopItem
          key={item.id}
          item={item}
          onPurchase={handlePurchase}
        />
      ))}
    </div>
  );
}
