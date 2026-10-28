import { redirect } from "next/navigation";
import { getSession } from "@/server/session";

export default async function Home() {
  redirect((await getSession()) ? "/tableau-de-bord" : "/connexion");
}
