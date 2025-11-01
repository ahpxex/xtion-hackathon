'use client';

import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { clickCountAtom, factoryLevelAtom, stageAtom } from '../store/atoms';

const FACTORY_INCOME_PER_LEVEL = 25;
const TICK_INTERVAL = 3000;

export default function FactoryIncomeManager() {
  const [factoryLevel] = useAtom(factoryLevelAtom);
  const [, setClickCount] = useAtom(clickCountAtom);
  const [, setStage] = useAtom(stageAtom);

  useEffect(() => {
    if (factoryLevel <= 0) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      const income = factoryLevel * FACTORY_INCOME_PER_LEVEL;
      setClickCount((prev) => prev + income);
      setStage((prev) => prev + income);
    }, TICK_INTERVAL);

    return () => {
      window.clearInterval(interval);
    };
  }, [factoryLevel, setClickCount, setStage]);

  return null;
}
