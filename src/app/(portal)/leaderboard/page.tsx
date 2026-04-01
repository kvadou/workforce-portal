import { redirect } from "next/navigation";

export default function LeaderboardPage() {
  redirect("/growth?tab=leaderboard");
}
