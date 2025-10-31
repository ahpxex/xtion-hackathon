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
 * 处理 'cursor' 购买
 */
function handleCursorPurchase(context: PurchaseContext): void {
  const { item } = context;
  console.log(`✅ 购买了: ${item.name}`);
  // cursor 可以重复购买，不需要隐藏
  // 可以添加其他逻辑，比如增加自动点击速度
}

/**
 * 处理 'multiplier' 购买
 */
function handleMultiplierPurchase(context: PurchaseContext): void {
  const { item } = context;
  console.log(`✅ 购买了: ${item.name}`);
  // multiplier 可以重复购买
  // 可以添加倍增效果的逻辑
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
  cursor: handleCursorPurchase,
  multiplier: handleMultiplierPurchase,
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
