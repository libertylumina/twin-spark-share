import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/artigo/$slug")({
  component: RedirectToBulas,
});

function RedirectToBulas() {
  const { slug } = Route.useParams();
  return <Navigate to="/bulas/$slug" params={{ slug }} replace />;
}
