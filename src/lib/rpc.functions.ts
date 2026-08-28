import { createServerFn } from "@tanstack/react-start";

export const rpc = createServerFn({ method: "POST" })
  .inputValidator((input: { path: string; input?: unknown }) => {
    if (!input || typeof input.path !== "string") throw new Error("Chamada inválida.");
    return input;
  })
  .handler(async ({ data }): Promise<any> => {
    const { dispatch } = await import("./community.server");
    return dispatch(data.path, data.input ?? null);
  });
