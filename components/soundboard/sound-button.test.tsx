import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SoundButton } from "@/components/soundboard/sound-button";

describe("SoundButton", () => {
  it("renders accessible name and cooldown state", () => {
    render(
      <SoundButton
        name="拍手"
        buttonColor="#334155"
        textColor="#ffffff"
        state="cooldown"
        cooldownProgress={0.4}
      />,
    );
    expect(screen.getByRole("button", { name: "拍手" })).toBeDisabled();
    expect(screen.getByText("クールダウン中")).toBeInTheDocument();
  });
});
