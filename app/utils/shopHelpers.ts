import { ShopItemData } from '../components/ShopItem';

/**
 * 根据 id 更新 shop item 的内容
 * @param items 当前的 shop items 数组
 * @param id 要更新的 item 的 id
 * @param updates 要更新的字段（可以是部分字段）
 * @returns 更新后的 shop items 数组
 */
export function updateShopItemById(
  items: ShopItemData[],
  id: string,
  updates: Partial<Omit<ShopItemData, 'id'>>
): ShopItemData[] {
  return items.map(item =>
    item.id === id
      ? { ...item, ...updates }
      : item
  );
}

/**
 * 根据 id 添加新的 shop item（如果 id 已存在则不添加）
 * @param items 当前的 shop items 数组
 * @param newItem 新的 shop item
 * @returns 更新后的 shop items 数组
 */
export function addShopItem(
  items: ShopItemData[],
  newItem: ShopItemData
): ShopItemData[] {
  if (items.some(item => item.id === newItem.id)) {
    console.warn(`Shop item with id "${newItem.id}" already exists`);
    return items;
  }
  return [...items, newItem];
}

/**
 * 根据 id 删除 shop item
 * @param items 当前的 shop items 数组
 * @param id 要删除的 item 的 id
 * @returns 更新后的 shop items 数组
 */
export function removeShopItemById(
  items: ShopItemData[],
  id: string
): ShopItemData[] {
  return items.filter(item => item.id !== id);
}

/**
 * 根据 id 查找 shop item
 * @param items 当前的 shop items 数组
 * @param id 要查找的 item 的 id
 * @returns 找到的 shop item，如果不存在则返回 undefined
 */
export function findShopItemById(
  items: ShopItemData[],
  id: string
): ShopItemData | undefined {
  return items.find(item => item.id === id);
}

/**
 * 批量更新多个 shop items
 * @param items 当前的 shop items 数组
 * @param updates 要更新的 items 数组，每个元素包含 id 和要更新的字段
 * @returns 更新后的 shop items 数组
 */
export function batchUpdateShopItems(
  items: ShopItemData[],
  updates: Array<{ id: string; updates: Partial<Omit<ShopItemData, 'id'>> }>
): ShopItemData[] {
  let result = items;
  for (const { id, updates: itemUpdates } of updates) {
    result = updateShopItemById(result, id, itemUpdates);
  }
  return result;
}
