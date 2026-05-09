import handler from "@tanstack/react-start/server-entry";

export default {
  fetch(request: Request, env: unknown, ctx: unknown) {
    return handler.fetch(request, env, ctx);
  },
};