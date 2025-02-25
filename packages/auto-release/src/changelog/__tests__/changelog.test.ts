import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addChangeLog,
  appendChangeLog,
  calculateChangeString,
  ChangeLogException,
  initChangelog,
} from "@/changelog/changelog";
import { ReleaseInformation } from "@/release-helper/release-helper";
import fs from "fs-extra";
import dayjs from "dayjs";
import { logger } from "@/logger/logger";
import { createCommit } from "@/release-helper/test-helpers/helpers";
import { release } from "@/cli/commands/release";

describe("ChangeLog", () => {
  const releaseInformation: ReleaseInformation = {
    currentVersion: "0.0.0",
    latestTagVersion: undefined,
    nextVersion: "0.0.1",
    changes: {
      minor: [createCommit("feat", "minor change 1")],
      major: [createCommit("feat", "breaking change 1", undefined, true)],
      patch: [createCommit("fix", "patch change 1")],
    },
  };
  const changelogFile = "CHANGELOG.md";

  describe("addChangeLog", () => {
    const mockedEnsureFile = vi.spyOn(fs, "ensureFile");
    const mockedWriteFile = vi.spyOn(fs, "writeFileSync");
    const mockedReadFile = vi.spyOn(fs, "readFileSync");
    const mockedLogInfo = vi.spyOn(logger, "info");

    beforeEach(() => {
      vi.clearAllMocks();
      mockedEnsureFile.mockResolvedValue();
      mockedWriteFile.mockReturnValue();
      mockedReadFile.mockReturnValue(initChangelog(releaseInformation));
    });

    it("should throw error as no change when no change", async () => {
      await expect(() =>
        addChangeLog(changelogFile, {
          ...releaseInformation,
          changes: {
            minor: [],
            major: [],
            patch: [],
          },
        }),
      ).rejects.toEqual(new ChangeLogException("no change for version 0.0.1"));
    });

    it("should ensure that the file is existed", async () => {
      await addChangeLog(changelogFile, releaseInformation);

      expect(mockedEnsureFile).toHaveBeenCalledWith(changelogFile);
    });

    it("should create new CHANGELOG.md with new content when the file does not existed", async () => {
      mockedEnsureFile.mockRejectedValue(new Error());

      await addChangeLog(changelogFile, releaseInformation);

      expect(mockedLogInfo).toHaveBeenCalledWith(
        `directory created for ${changelogFile}`,
      );
    });

    it("should init file content if file content is empty", async () => {
      mockedReadFile.mockReturnValue("");

      await addChangeLog(changelogFile, releaseInformation);

      expect(mockedWriteFile).toHaveBeenCalledWith(
        changelogFile,
        initChangelog(releaseInformation),
        "utf-8",
      );
    });

    it("should modify file content if the file already existed", async () => {
      await addChangeLog(changelogFile, releaseInformation);

      expect(mockedWriteFile).toHaveBeenCalledWith(
        changelogFile,
        appendChangeLog(
          initChangelog(releaseInformation),
          calculateChangeString(releaseInformation),
        ),
        "utf-8",
      );
    });
  });

  describe("appendChangeLog", () => {
    it("should add after heading", () => {
      const content = "# Changelog\n\nother content";
      const actual = appendChangeLog(content, "newContent");

      expect(actual).toEqual("# Changelog\n\nnewContent\n\nother content");
    });
  });

  describe("initChangelog", () => {
    it("should return formatted CHANGELOG.md", () => {
      const {
        changes: { major, minor, patch },
      } = releaseInformation;
      const actual = initChangelog(releaseInformation);

      expect(actual).toEqual(`# Changelog

## [Version 0.0.1] - ${dayjs().format("YYYY-MM-DD")}

### 🎉 Major Changes
${major.map((change) => `- ${change.mapped.subject}`).join("\n")}

### 🚀 Features
${minor.map((change) => `- ${change.mapped.subject}`).join("\n")}

### 🛠️ Fixes
${patch.map((change) => `- ${change.mapped.subject}`).join("\n")}
`);
    });
  });

  describe("calculateChangeString", () => {
    it("should have only major change if other changes is empty", () => {
      const actual = calculateChangeString({
        ...releaseInformation,
        changes: {
          ...releaseInformation.changes,
          minor: [],
          patch: [],
        },
      });

      expect(actual)
        .toEqual(`## [Version ${releaseInformation.nextVersion}] - ${dayjs().format("YYYY-MM-DD")}

### 🎉 Major Changes
${releaseInformation.changes.major.map((change) => `- ${change.mapped.subject}`).join("\n")}
`);
    });
  });
});
