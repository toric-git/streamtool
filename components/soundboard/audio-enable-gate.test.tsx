import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AudioEnableGate } from "@/components/soundboard/audio-enable-gate";

describe("AudioEnableGate", () => {
  it("calls onEnable when clicked", async () => {
    const user = userEvent.setup();
    const onEnable = vi.fn();
    render(<AudioEnableGate onEnable={onEnable} />);
    await user.click(
      screen.getByRole("button", { name: "タップして参加する" }),
    );
    expect(onEnable).toHaveBeenCalledOnce();
  });
});
