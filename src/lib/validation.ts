import { manifestSchema } from "@stremio-addon/zod";

export function validate(manifest: unknown) {
  const result = manifestSchema.safeParse(manifest);

  if (result.success) {
    const strictResult = manifestSchema.strict().safeParse(manifest);

    if (!strictResult.success) {
      return {
        success: true,
        data: result.data,
        warning: strictResult.error,
      };
    }

    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}
