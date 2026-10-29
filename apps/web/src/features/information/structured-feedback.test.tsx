import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { StructuredFeedback } from "./structured-feedback";
const id = "49000000-0000-4000-8000-000000000001";
it("audit feedback sends only selected consented codes and waits for a genuine receipt", async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      Response.json(
        { data: { feedback_id: id }, request_id: id },
        { status: 202 },
      ),
    );
  render(<StructuredFeedback locale="en" fetcher={fetcher} />);
  fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Select a category");
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Feedback category"), {
    target: { value: "incorrect" },
  });
  fireEvent.change(screen.getByLabelText("Related page"), {
    target: { value: "ask" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("saved for review"),
  );
  expect(fetcher).toHaveBeenCalledOnce();
  const [url, init] = fetcher.mock.calls[0];
  expect(url).toBe("/api/v1/feedback");
  expect(JSON.parse(String(init?.body))).toEqual({
    category: "incorrect",
    locale: "en",
    page: "ask",
    consent: true,
  });
  expect(init?.credentials).toBe("omit");
  expect(screen.queryByRole("textbox")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  expect(screen.queryByRole("status")).toBeNull();
});
it("audit feedback never claims success for policy failure or malformed receipt", async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      Response.json({ error: { code: "POLICY_UNAVAILABLE" } }, { status: 503 }),
    );
  render(<StructuredFeedback locale="bn" fetcher={fetcher} />);
  fireEvent.change(screen.getByLabelText("মতামতের ধরন"), {
    target: { value: "accessibility" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "মতামত পাঠান" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("গ্রহণ করা যায়নি"),
  );
  expect(screen.queryByRole("status")).toBeNull();
});
