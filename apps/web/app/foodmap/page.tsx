"use client";

import { useSession } from "../../src/store/session.js";
import { EntryScreen } from "../../src/components/EntryScreen.js";
import { SessionShell } from "../../src/components/SessionShell.js";

/**
 * /foodmap — shows the entry/mode selection until a session is active, then the
 * session shell. A stopped session returns to the entry screen.
 */
export default function FoodMapPage() {
  const running = useSession((s) => s.running);
  const acquiring = useSession((s) => s.acquiring);
  const active = running || acquiring;
  return active ? <SessionShell /> : <EntryScreen />;
}
