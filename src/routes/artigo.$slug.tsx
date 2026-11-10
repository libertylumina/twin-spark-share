import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/artigo/$slug")({
  head: () => ({
    meta: [
      { title: "Publicação — Central de Bulas" },
      { name: "description", content: "Acesse a publicação na Central de Bulas." },
      { property: "og:title", content: "Publicação — Central de Bulas" },
      { property: "og:description", content: "Acesse a publicação na Central de Bulas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RedirectToBulas,
});

function RedirectToBulas() {
  const { slug } = Route.useParams();
  return <Navigate to="/bulas/$slug" params={{ slug }} replace />;
}
