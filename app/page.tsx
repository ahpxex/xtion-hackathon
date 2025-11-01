"use client";

import { useAtomValue } from "jotai";
import NativeButton from "./components/NativeButton";
import CreditDisplay from "./components/CreditDisplay";
import Shop from "./components/Shop";
import FloatingPanel from "./components/FloatingPanel";
import StageIndicator from "./components/StageIndicator";
import PenguinDisplay from "./components/PenguinDisplay";
import SkeletonDisplay from "./components/SkeletonDisplay";
import Leaderboard from "./components/Leaderboard";
import FactoryIncomeManager from "./components/FactoryIncomeManager";
import GameStateSync from "./components/GameStateSync";
import AbstractVideoDisplay from "./components/AbstractVideoDisplay";
import { finaleModeAtom } from "./store/atoms";
import DevTools from "./components/DevTools";
import AutoMascotBuyer from "./components/AutoMascotBuyer";

const isDev = process.env.NODE_ENV === "development";

export default function Home() {
  const finaleMode = useAtomValue(finaleModeAtom);

  return (
    <div className="min-h-screen flex flex-col gap-6 justify-center items-center py-8">
      <GameStateSync />
      <StageIndicator />
      {!finaleMode && (
        <>
          <AbstractVideoDisplay />
          {isDev && <DevTools />}
          <FactoryIncomeManager />
          <AutoMascotBuyer />
          <CreditDisplay size="sm" />
          <NativeButton clickValue={1}>click me</NativeButton>
          <Shop />
          <Leaderboard />
          <FloatingPanel />
          <PenguinDisplay />
          <SkeletonDisplay />
        </>
      )}
    </div>
  );
}
