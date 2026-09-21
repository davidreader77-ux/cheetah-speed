import { createFileRoute } from "@tanstack/react-router";
import { CheetahSpeed } from "@/components/cheetah-speed";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <CheetahSpeed />;
}
