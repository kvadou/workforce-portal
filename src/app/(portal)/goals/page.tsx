import { redirect } from "next/navigation";

export default function GoalsPage() {
  redirect("/growth?tab=goals");
}
