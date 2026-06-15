import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CopyableText } from "../components/CopyableText";

describe("CopyableText", () => {
  it("renders copy and download controls around readonly textareas", () => {
    const html = renderToStaticMarkup(
      <CopyableText
        text="nodeKind: CompanyGraph"
        mode="textarea"
        copyLabel="Copy YAML"
        downloadLabel="Download YAML"
        filename="company.yaml"
        languageLabel="Generated YAML"
        textareaLabel="Generated company graph YAML"
      />,
    );

    expect(html).toContain("Generated YAML");
    expect(html).toContain("Copy YAML");
    expect(html).toContain("Download YAML");
    expect(html).toContain("Generated company graph YAML");
    expect(html).toContain("nodeKind: CompanyGraph");
  });
});
