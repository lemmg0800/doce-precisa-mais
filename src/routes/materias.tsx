import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/materias")({
  component: MateriasAliasPage,
});

function MateriasAliasPage() {
  return <Navigate to="/materias-primas" replace />;
}