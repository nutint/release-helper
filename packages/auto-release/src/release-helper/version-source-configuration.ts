import { z } from "zod";

export type VersionSourceConfiguration = {
  versionFile?: string;
  gitTagPrefix?: string;
  scope?: string;
};

export const versionSourceSchema = z.object({
  versionFile: z.string().optional(),
  gitTagPrefix: z.string().optional(),
  scope: z.string().optional(),
});
