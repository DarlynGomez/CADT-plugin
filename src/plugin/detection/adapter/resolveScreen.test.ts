import { describe, expect, it } from "vitest";

import { resolveScreen } from "./resolveScreen";

describe("resolveScreen", () => {
  it("resolves a frame directly on the page", () => {
    const page = { type: "PAGE", id: "0:1", name: "Page 1" };
    const frame = { type: "FRAME", id: "1:1", name: "Screen A", parent: page };
    const textNode = { type: "TEXT", parent: frame };

    expect(resolveScreen(textNode as unknown as SceneNode)).toEqual({
      screenId: "1:1",
      screenName: "Screen A"
    });
  });

  it("resolves a frame inside a section, the section is transparent", () => {
    const page = { type: "PAGE", id: "0:1", name: "Page 1" };
    const section = { type: "SECTION", id: "1:9", name: "In progress", parent: page };
    const frame = { type: "FRAME", id: "1:1", name: "Screen A", parent: section };
    const textNode = { type: "TEXT", parent: frame };

    expect(resolveScreen(textNode as unknown as SceneNode)).toEqual({
      screenId: "1:1",
      screenName: "Screen A"
    });
  });

  it("resolves a frame wrapped in a group, the group is transparent", () => {
    const page = { type: "PAGE", id: "0:1", name: "Page 1" };
    const frame = { type: "FRAME", id: "1:1", name: "Screen A", parent: page };
    const group = { type: "GROUP", id: "1:2", name: "Group", parent: frame };
    const textNode = { type: "TEXT", parent: group };

    expect(resolveScreen(textNode as unknown as SceneNode)).toEqual({
      screenId: "1:1",
      screenName: "Screen A"
    });
  });

  it("resolves to the component set, the outermost container, not the component inside it", () => {
    const page = { type: "PAGE", id: "0:1", name: "Page 1" };
    const componentSet = {
      type: "COMPONENT_SET",
      id: "1:5",
      name: "Button",
      parent: page
    };
    const component = {
      type: "COMPONENT",
      id: "1:6",
      name: "Button=Primary",
      parent: componentSet
    };
    const textNode = { type: "TEXT", parent: component };

    expect(resolveScreen(textNode as unknown as SceneNode)).toEqual({
      screenId: "1:5",
      screenName: "Button"
    });
  });

  it("resolves an instance placed directly on the page", () => {
    const page = { type: "PAGE", id: "0:1", name: "Page 1" };
    const instance = { type: "INSTANCE", id: "1:7", name: "Card instance", parent: page };
    const textNode = { type: "TEXT", parent: instance };

    expect(resolveScreen(textNode as unknown as SceneNode)).toEqual({
      screenId: "1:7",
      screenName: "Card instance"
    });
  });

  it("falls back to the nearest section when no frame-like ancestor exists", () => {
    const page = { type: "PAGE", id: "0:1", name: "Page 1" };
    const section = { type: "SECTION", id: "1:9", name: "Scratch notes", parent: page };
    const textNode = { type: "TEXT", parent: section };

    expect(resolveScreen(textNode as unknown as SceneNode)).toEqual({
      screenId: "1:9",
      screenName: "Scratch notes"
    });
  });

  it("is its own screen when it sits directly on the page with no frame or section", () => {
    const page = { type: "PAGE", id: "0:1", name: "Page 1" };
    const textNode = { type: "TEXT", id: "1:10", name: "Loose note", parent: page };

    expect(resolveScreen(textNode as unknown as SceneNode)).toEqual({
      screenId: "1:10",
      screenName: "Loose note"
    });
  });

  it("is its own screen when it has no parent at all", () => {
    const textNode = { type: "TEXT", id: "1:11", name: "Orphan", parent: null };

    expect(resolveScreen(textNode as unknown as SceneNode)).toEqual({
      screenId: "1:11",
      screenName: "Orphan"
    });
  });
});
