import { create } from "zustand";

type Result = { id: string; text: string; count: number; percent: number };
type PollHistoryItem = {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  votes?: { userId: string; optionId: string }[];
  endedAt?: number;
};

type AppState = {
  role: "STUDENT" | "TEACHER" | null;
  userId: string | null;
  name: string;
  activePoll: {
    id: string;
    question: string;
    options: { id: string; text: string }[];
  } | null;
  results: Result[];
  chatEnabled?: boolean;
  joined?: boolean;
  pollHistory: PollHistoryItem[];
  setRole: (r: AppState["role"]) => void;
  setUser: (id: string, name: string) => void;
  setActivePoll: (p: AppState["activePoll"]) => void;
  setResults: (r: Result[]) => void;
  setChatEnabled?: (v: boolean) => void;
  setJoined?: (v: boolean) => void;
  addPollToHistory: (p: PollHistoryItem) => void;
  clearHistory: () => void;
};

export const useApp = create<AppState>((set) => ({
  role: null,
  userId: null,
  name: "",
  activePoll: null,
  results: [],
  chatEnabled: false,
  joined: false,
  pollHistory: [],
  setRole: (role) => set({ role }),
  setUser: (userId, name) => set({ userId, name }),
  setActivePoll: (activePoll) => set({ activePoll }),
  setResults: (results) => set({ results }),
  setChatEnabled: (chatEnabled) => set({ chatEnabled }),
  setJoined: (joined) => set({ joined }),
  addPollToHistory: (poll) =>
    set((state) => ({ pollHistory: [...state.pollHistory, poll] })),
  clearHistory: () => set({ pollHistory: [] }),
}));
