import { redirect } from "next/navigation";

import { auth } from "@/server/auth";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const preferredExam = (session.user as unknown as { preferredExam: string }).preferredExam ?? "cet6";

  redirect(`/${preferredExam}/dashboard`);
}