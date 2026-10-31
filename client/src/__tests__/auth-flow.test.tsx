// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { queryClient } from "../lib/queryClient";

const authUser = { id: 1, username: "fixture-a", displayName: "Fixture Account A" };
const testPassword = "fixture-a-test-password";

function response(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("server-backed sign-in flow", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    queryClient.clear();
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/auth/me") return response(401, { message: "Authentication required" });
      if (url === "/api/auth/login") {
        const body = JSON.parse(String(init?.body)) as { username: string; password: string };
        return body.username === authUser.username && body.password === testPassword
          ? response(200, { user: authUser })
          : response(401, { message: "Invalid username or password" });
      }
      if (url === "/api/auth/logout") return response(204);
      if (url === "/api/family-tree") return response(200, { members: [], relationships: [], events: [] });
      throw new Error(`Unexpected request: ${url}`);
    }));
  });

  it("authenticates with the server, loads the tree UI, and ends the session on sign-out", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Sign in to Family Tree" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/auth/me", { credentials: "include" });

    await user.type(screen.getByLabelText("Username"), authUser.username);
    await user.type(screen.getByLabelText("Password"), testPassword);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("heading", { name: "Start your family tree" })).toBeInTheDocument();
    expect(window.sessionStorage.length).toBe(0);

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("heading", { name: "Sign in to Family Tree" })).toBeInTheDocument();
    expect(vi.mocked(fetch)).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  });

  it("shows a generic server rejection for invalid credentials", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("heading", { name: "Sign in to Family Tree" });
    await user.type(screen.getByLabelText("Username"), "unknown");
    await user.type(screen.getByLabelText("Password"), "incorrect-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid username or password");
    expect(window.sessionStorage.length).toBe(0);
  });
});
