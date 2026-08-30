export interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  isCurrentUser?: boolean;
}

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: "u1", name: "Jonas K.", xp: 2450 },
  { id: "u2", name: "Mia S.", xp: 2210 },
  { id: "u3", name: "Elias R.", xp: 1980 },
  { id: "u4", name: "Laura B.", xp: 1740 },
  { id: "u5", name: "Tom H.", xp: 1590 },
  { id: "u6", name: "Sophie L.", xp: 1420 },
  { id: "u7", name: "Noah F.", xp: 1180 },
  { id: "u8", name: "Anna P.", xp: 990 },
];
