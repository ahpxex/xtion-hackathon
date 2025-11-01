'use client';

import { useEffect, useRef } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { clicksAtom, showAbstractVideoAtom, stageAtom } from '../store/atoms';
import { sendUserAction } from '../utils/websocketClient';

export default function GameStateSync() {
  const stage = useAtomValue(stageAtom);
  const clicks = useAtomValue(clicksAtom);
  const [, setShowAbstractVideo] = useAtom(showAbstractVideoAtom);
  const previous = useRef<{ stage: number; clicks: number }>({ stage, clicks });
  const hasSentInitial = useRef(false);

  useEffect(() => {
    if (!hasSentInitial.current) {
      hasSentInitial.current = true;
      previous.current = { stage, clicks };
      sendUserAction({ stage, clicks });
      return;
    }

    const { stage: prevStage, clicks: prevClicks } = previous.current;
    if (stage === prevStage && clicks === prevClicks) {
      return;
    }

    previous.current = { stage, clicks };
    sendUserAction({ stage, clicks });
  }, [stage, clicks]);

  useEffect(() => {
    if (stage >= 2400) {
      setShowAbstractVideo(true);
    }
  }, [stage, setShowAbstractVideo]);

  return null;
}
