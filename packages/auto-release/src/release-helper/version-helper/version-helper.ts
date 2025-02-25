export type IVersionHelper = {
  getVersion: () => string;
  setVersion: (newVersion: string) => void;
  versionFileType: SupportVersionFile;
};

export class VersionHelperError extends Error {
  constructor(reason: string) {
    super(`Version helper error: ${reason}`);
  }
}

type SupportVersionFile = "package.json" | "build.sbt";

export const supportedVersionFiles: SupportVersionFile[] = [
  "package.json",
  "build.sbt",
];
