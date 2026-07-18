"use client";

import { create } from "zustand";
import { SEED_ORIGIN, straightEastbound } from "@foodmap/test-fixtures";
import {
  INITIAL_SNAPSHOT,
  SessionController,
  type SessionSnapshot,
} from "../session/controller.js";
import { browserGeolocationSource, simulatedSource } from "../session/sources.js";

export type StartMode = "real" | "sim";

interface SessionStore extends SessionSnapshot {
  startRadar: (mode: StartMode) => void;
  stop: () => void;
  select: (key: string | null) => void;
}

let controller: SessionController | null = null;

export const useSession = create<SessionStore>((set) => ({
  ...INITIAL_SNAPSHOT,
  startRadar: (mode) => {
    controller ??= new SessionController({
      sessionId: "sess-web",
      onState: (s) => set(s),
    });
    const source =
      mode === "sim"
        ? simulatedSource(straightEastbound(SEED_ORIGIN), 300)
        : browserGeolocationSource();
    controller.start(source);
  },
  stop: () => controller?.stop(),
  select: (key) => controller?.select(key),
}));
