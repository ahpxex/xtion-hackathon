/**
 * 购买行为处理器（调度器）
 * 统一管理所有 item 的购买后行为
 */

import { ShopItemData } from '../components/ShopItem';
import { setPageMetaByItemId } from './faviconManager';

/**
 * 购买行为的上下文
 */
export interface PurchaseContext {
  item: ShopItemData;
  setShopItems: (updater: (items: ShopItemData[]) => ShopItemData[]) => void;
  setStage?: (stage: number) => void;
  setClickMultiplier?: (multiplier: number) => void;
  setShowPenguin?: (show: boolean) => void;
  setShowSkeleton?: (show: boolean) => void;
  // 可以添加更多上下文数据
}

/**
 * 隐藏指定 id 的 item
 */
function hideItem(itemId: string, setShopItems: PurchaseContext['setShopItems']): void {
  setShopItems((items) =>
    items.map((item) =>
      item.id === itemId ? { ...item, hidden: true } : item
    )
  );
}

/**
 * 处理 'multiplier' 购买（点击倍增器升级）
 */
function handleMultiplierPurchase(context: PurchaseContext): void {
  const { item, setShopItems, setClickMultiplier } = context;

  const currentLevel = item.currentLevel || 1;
  const maxLevel = item.maxLevel || 5;

  if (currentLevel < maxLevel) {
    const newLevel = currentLevel + 1;

    // 更新倍数
    if (setClickMultiplier) {
      setClickMultiplier(newLevel);
    }

    // 更新 item 的等级和价格
    setShopItems((items) =>
      items.map((i) =>
        i.id === 'multiplier'
          ? {
              ...i,
              currentLevel: newLevel,
              price: 50 * newLevel, // 价格递增：50, 100, 150, 200, 250
              effect: `点击 +${newLevel}`
            }
          : i
      )
    );

    console.log(`✅ 购买了: ${item.name}，当前等级: ${newLevel}/${maxLevel}`);
  } else {
    console.log(`⚠️ ${item.name} 已达到最大等级`);
  }
}

/**
 * 处理 'penguin' 购买
 */
function handlePenguinPurchase(context: PurchaseContext): void {
  const { item, setShopItems, setShowPenguin } = context;

  // 显示企鹅
  if (setShowPenguin) {
    setShowPenguin(true);
  }

  // 设置网页标题和图标
  setPageMetaByItemId(item.id);

  // 购买后隐藏该 item
  hideItem(item.id, setShopItems);

  console.log(`✅ 购买了: ${item.name}，企鹅已显示`);
}

/**
 * 处理 'skeleton' 购买
 */
function handleSkeletonPurchase(context: PurchaseContext): void {
  const { item, setShopItems, setShowSkeleton } = context;

  // 显示骷髅
  if (setShowSkeleton) {
    setShowSkeleton(true);
  }

  // 设置网页标题和图标
  setPageMetaByItemId(item.id);

  // 购买后隐藏该 item
  hideItem(item.id, setShopItems);

  console.log(`✅ 购买了: ${item.name}，骷髅已显示`);
}

/**
 * 处理 'factory' 购买
 */
function handleFactoryPurchase(context: PurchaseContext): void {
  const { item, setShopItems } = context;

  // 设置网页标题和图标
  setPageMetaByItemId(item.id);

  // 购买后隐藏该 item
  hideItem(item.id, setShopItems);

  console.log(`✅ 购买了: ${item.name}，item 已隐藏，网页标题和图标已更新`);
}

/**
 * 处理 'bonus' 购买
 */
function handleBonusPurchase(context: PurchaseContext): void {
  const { item, setShopItems } = context;

  // 设置网页标题和图标
  setPageMetaByItemId(item.id);

  // 购买后隐藏该 item
  hideItem(item.id, setShopItems);

  console.log(`✅ 购买了: ${item.name}，item 已隐藏，网页标题和图标已更新`);
}

/**
 * 处理 'robot' 购买
 */
function handleRobotPurchase(context: PurchaseContext): void {
  const { item, setShopItems } = context;

  // 设置网页标题和图标
  setPageMetaByItemId(item.id);

  // 购买后隐藏该 item
  hideItem(item.id, setShopItems);

  console.log(`✅ 购买了: ${item.name}，item 已隐藏，网页标题和图标已更新`);
}

/**
 * 处理 'rocket' 购买
 */
function handleRocketPurchase(context: PurchaseContext): void {
  const { item, setShopItems } = context;

  // 设置网页标题和图标
  setPageMetaByItemId(item.id);

  // 购买后隐藏该 item
  hideItem(item.id, setShopItems);

  console.log(`✅ 购买了: ${item.name}，item 已隐藏，网页标题和图标已更新`);
}

/**
 * 购买行为处理器映射
 */
const purchaseHandlers: Record<string, (context: PurchaseContext) => void> = {
  multiplier: handleMultiplierPurchase,
  penguin: handlePenguinPurchase,
  skeleton: handleSkeletonPurchase,
  factory: handleFactoryPurchase,
  bonus: handleBonusPurchase,
  robot: handleRobotPurchase,
  rocket: handleRocketPurchase,
};

/**
 * 主调度器：根据 item id 执行对应的购买处理
 */
export function handleItemPurchase(context: PurchaseContext): void {
  const { item } = context;
  const handler = purchaseHandlers[item.id];

  if (handler) {
    handler(context);
  } else {
    console.warn(`⚠️ 没有为 item "${item.id}" 定义购买处理器`);
  }
}

/**
 * 添加新的购买处理器
 */
export function registerPurchaseHandler(
  itemId: string,
  handler: (context: PurchaseContext) => void
): void {
  purchaseHandlers[itemId] = handler;
  console.log(`✅ 已注册购买处理器: ${itemId}`);
}
