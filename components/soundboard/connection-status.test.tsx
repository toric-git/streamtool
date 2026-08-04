import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConnectionStatusBadge } from "@/components/soundboard/connection-status";

describe("ConnectionStatusBadge", () => {
  it("exposes accessible status text", () => {
    render(<ConnectionStatusBadge status="connected" />);
    expect(screen.getByText("接続済み")).toBeInTheDocument();
    expect(screen.getByText(/接続状態: 接続済み/)).toBeInTheDocument();
  });
});
