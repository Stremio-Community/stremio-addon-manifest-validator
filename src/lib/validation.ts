import { manifestSchema } from "@stremio-addon/zod";

export function validate(manifest: unknown) {
  return manifestSchema.safeParse(manifest);
}
