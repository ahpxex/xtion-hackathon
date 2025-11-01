"use client";

import { useEffect, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  clickCountAtom,
  shopItemsAtom,
  stageAtom,
  clickMultiplierAtom,
  globalMultiplierAtom,
  penguinLevelAtom,
  skeletonLevelAtom,
  showFloatingPanelAtom,
  toastsAtom,
} from "../store/atoms";
import { handleItemPurchase } from "../utils/purchaseHandler";
import { sendPurchaseEvent } from "../utils/websocketClient";
import { addToast } from "../utils/toastHelpers";
import type { ShopItemData } from "./ShopItem";

const TARGET_IDS = new Set(["penguin", "skeleton"]);
const PURCHASE_PROBABILITY = 0.01;

function pickRandomItem(items: ShopItemData[]): ShopItemData | null {
  if (items.length === 0) {
    return null;
  }
  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? null;
}

export default function AutoMascotBuyer() {
  const [clickCount, setClickCount] = useAtom(clickCountAtom);
  const [shopItems, setShopItems] = useAtom(shopItemsAtom);
  const [stage, setStage] = useAtom(stageAtom);
  const clickMultiplierValue = useAtomValue(clickMultiplierAtom);
  const globalMultiplierValue = useAtomValue(globalMultiplierAtom);
  const [, setPenguinLevel] = useAtom(penguinLevelAtom);
  const [, setSkeletonLevel] = useAtom(skeletonLevelAtom);
  const [, setShowFloatingPanel] = useAtom(showFloatingPanelAtom);
  const [, setToasts] = useAtom(toastsAtom);

  const lastEvaluatedBalanceRef = useRef(0);

  useEffect(() => {
    if (clickCount <= 0) {
      lastEvaluatedBalanceRef.current = clickCount;
      return;
    }

    if (clickCount <= lastEvaluatedBalanceRef.current) {
      lastEvaluatedBalanceRef.current = clickCount;
      return;
    }

    const eligibleItems = shopItems.filter((item) => {
      if (!TARGET_IDS.has(item.id)) return false;
      if (item.hidden) return false;
      if (item.stageThreshold && stage < item.stageThreshold) return false;
      return clickCount >= item.price;
    });

    if (eligibleItems.length === 0) {
      lastEvaluatedBalanceRef.current = clickCount;
      return;
    }

    if (Math.random() >= PURCHASE_PROBABILITY) {
      lastEvaluatedBalanceRef.current = clickCount;
      return;
    }

    const targetItem = pickRandomItem(eligibleItems);
    if (!targetItem) {
      lastEvaluatedBalanceRef.current = clickCount;
      return;
    }

    const nextClickCount = Math.max(0, clickCount - targetItem.price);
    const nextStage = Math.max(0, stage - targetItem.price);
    const nextLevel = (targetItem.currentLevel ?? 0) + 1;

    setClickCount((prev) => Math.max(0, prev - targetItem.price));
    setStage((prev) => Math.max(0, prev - targetItem.price));

    sendPurchaseEvent({
      itemId: targetItem.id,
      itemName: targetItem.name,
      pricePaid: targetItem.price,
      clickCount: nextClickCount,
      stage: nextStage,
      clickMultiplier: clickMultiplierValue * globalMultiplierValue,
      currentLevel: targetItem.currentLevel ?? null,
      nextLevel,
      repeatable: targetItem.repeatable,
    });

    handleItemPurchase({
      item: targetItem,
      setShopItems,
      setStage,
      setPenguinLevel,
      setSkeletonLevel,
    });

    setShowFloatingPanel(true);

    const tauntMessage =
      targetItem.id === "penguin"
        ? "AI 又替你买了一只企鹅，看来余额闲得发慌。"
        : "AI 自作主张入手了一个骷髅，别担心，你的钱包撑得住。";

    setToasts(
      (current) =>
        addToast(current, tauntMessage, "warning", {
          duration: 4200,
          showIcon: false,
        }).toasts
    );

    lastEvaluatedBalanceRef.current = nextClickCount;
  }, [
    clickCount,
    shopItems,
    stage,
    setClickCount,
    setStage,
    setShopItems,
    setPenguinLevel,
    setSkeletonLevel,
    setShowFloatingPanel,
    setToasts,
    clickMultiplierValue,
    globalMultiplierValue,
  ]);

  return null;
}
