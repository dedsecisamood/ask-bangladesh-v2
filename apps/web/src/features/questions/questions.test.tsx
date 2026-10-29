import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConversationProvider } from "./conversation-provider";
import { QuestionComposer } from "./question-composer";
import { Homepage } from "@/features/home/homepage";
import { ChatPage } from "@/features/chat/chat-page";
import { StructuredAnswer } from "@/features/chat/structured-answer";
import { copyFor, exampleQuestions } from "@/lib/product-copy";
import type { DemoAnswer, DemoAdapter } from "@/lib/chat";
import type { Locale } from "@/lib/i18n/config";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
beforeEach(() => navigation.push.mockReset());
const response: DemoAnswer = {
  kind: "demonstration",
  language: "en",
  shortAnswer:
    "Local demo. No live AI or government information was retrieved.",
  sources: [],
};
describe("homepage and question handoff", () => {
  it.each(["bn", "en"] as Locale[])(
    "renders the full %s homepage with eight safe service links",
    (locale) => {
      render(
        <ConversationProvider>
          <Homepage locale={locale} />
        </ConversationProvider>,
      );
      const copy = copyFor(locale);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        copy.hero.replace("\n", " "),
      );
      expect(screen.getByLabelText(copy.question)).toBeInTheDocument();
      expect(screen.getAllByRole("article")).toHaveLength(8);
      expect(
        screen.getByRole("link", {
          name: locale === "bn" ? "ই-পাসপোর্ট" : "E-passport",
        }),
      ).toHaveAttribute("href", `/${locale}/services/e-passport`);
      expect(screen.getByText(copy.trustText)).toBeVisible();
    },
  );
  it("selects examples and hands off via memory without putting the question in navigation", async () => {
    const adapter = vi.fn<DemoAdapter>().mockResolvedValue(response);
    render(
      <ConversationProvider adapter={adapter}>
        <Homepage locale="en" />
      </ConversationProvider>,
    );
    fireEvent.click(screen.getByText(copyFor("en").examples));
    fireEvent.click(screen.getByRole("button", { name: exampleQuestions[0] }));
    expect(screen.getByLabelText("Your question")).toHaveValue(
      exampleQuestions[0],
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Ask Question — Open demo conversation",
      }),
    );
    expect(navigation.push).toHaveBeenCalledExactlyOnceWith("/en/ask");
    await waitFor(() => expect(adapter).toHaveBeenCalledOnce());
    expect(adapter.mock.calls[0][0]).not.toHaveProperty("question");
    expect(Object.keys(localStorage)).toEqual([]);
    expect(Object.keys(sessionStorage)).toEqual([]);
  });
});
describe("composer behavior", () => {
  it("rejects empty and oversized questions, associates the error and keeps focus", () => {
    const send = vi.fn(() => true);
    render(<QuestionComposer locale="en" onSend={send} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Open demo conversation" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a question first.",
    );
    const field = screen.getByLabelText("Your question");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveFocus();
    fireEvent.change(field, { target: { value: "x".repeat(2001) } });
    fireEvent.click(
      screen.getByRole("button", { name: "Open demo conversation" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("2,000");
    expect(send).not.toHaveBeenCalled();
  });
  it("submits on desktop Enter, preserving Shift+Enter and IME composition", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    );
    const send = vi.fn(() => true);
    render(<QuestionComposer locale="en" onSend={send} chat />);
    const field = screen.getByLabelText("Your question");
    fireEvent.change(field, { target: { value: "Bangla\nEnglish" } });
    fireEvent.keyDown(field, { key: "Enter", shiftKey: true });
    fireEvent.keyDown(field, { key: "Enter", isComposing: true });
    fireEvent.keyDown(field, { key: "Enter", keyCode: 229 });
    expect(send).not.toHaveBeenCalled();
    fireEvent.keyDown(field, { key: "Enter" });
    expect(send).toHaveBeenCalledWith("Bangla\nEnglish", "auto");
    expect(field).toHaveValue("");
    vi.unstubAllGlobals();
  });
  it("leaves mobile Enter alone and preserves text if sending is declined", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false })),
    );
    const send = vi.fn(() => false);
    render(<QuestionComposer locale="en" onSend={send} chat />);
    const field = screen.getByLabelText("Your question");
    fireEvent.change(field, { target: { value: "NID kivabe?" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(send).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Answer language"), {
      target: { value: "banglish" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send in demo" }));
    expect(send).toHaveBeenCalledWith("NID kivabe?", "banglish");
    expect(field).toHaveValue("NID kivabe?");
    vi.unstubAllGlobals();
  });
});
describe("demonstration conversations", () => {
  it.each([
    "পাসপোর্ট নিয়ে জানতে চাই",
    "nid correction kivabe",
    "How can I find information?",
  ])(
    "handles %s without live answers and can clear all text",
    async (question) => {
      render(
        <ConversationProvider>
          <ChatPage locale="en" />
        </ConversationProvider>,
      );
      expect(
        screen.getByText("What would you like to understand?"),
      ).toBeVisible();
      fireEvent.change(screen.getByLabelText("Your question"), {
        target: { value: question },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send in demo" }));
      expect(screen.getByText(question)).toBeVisible();
      await screen.findByText("Demonstration response ready.");
      expect(screen.getAllByText(copyFor("en").demoAnswer)).toHaveLength(2);
      fireEvent.click(screen.getByRole("button", { name: "Helpful" }));
      expect(screen.getByRole("button", { name: "Helpful" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByText(copyFor("en").feedbackNote)).toBeVisible();
      fireEvent.change(screen.getByLabelText("Your question"), {
        target: { value: "unsent private draft" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Clear conversation" }),
      );
      expect(screen.queryByText(question)).not.toBeInTheDocument();
      expect(screen.getByLabelText("Your question")).toHaveValue("");
    },
  );
  it("announces failure without leaking the error and retries the same question", async () => {
    const adapter = vi
      .fn<DemoAdapter>()
      .mockRejectedValueOnce(new Error("private-internal-detail"))
      .mockResolvedValueOnce(response);
    render(
      <ConversationProvider adapter={adapter}>
        <ChatPage locale="en" />
      </ConversationProvider>,
    );
    fireEvent.change(screen.getByLabelText("Your question"), {
      target: { value: "retry question" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send in demo" }));
    fireEvent.click(await screen.findByRole("button", { name: "Retry demo" }));
    await screen.findByText(response.shortAnswer);
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText("retry question")).toHaveLength(1);
    expect(
      screen.queryByText("private-internal-detail"),
    ).not.toBeInTheDocument();
  });
  it("ignores late completion after stopping or clearing", async () => {
    let finish: (answer: DemoAnswer) => void = () => {};
    const adapter = vi.fn<DemoAdapter>(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(
      <ConversationProvider adapter={adapter}>
        <ChatPage locale="en" />
      </ConversationProvider>,
    );
    fireEvent.change(screen.getByLabelText("Your question"), {
      target: { value: "cancel question" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send in demo" }));
    await waitFor(() => expect(adapter).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("button", { name: "Stop demo" }));
    expect(screen.getByText(copyFor("en").cancelled)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Clear conversation" }));
    finish(response);
    await waitFor(() =>
      expect(screen.queryByText(response.shortAnswer)).not.toBeInTheDocument(),
    );
    expect(screen.queryByText("cancel question")).not.toBeInTheDocument();
  });
  it("renders structured sections as escaped text and omits missing fields", () => {
    render(
      <StructuredAnswer
        locale="en"
        answer={{
          ...response,
          requirements: ["Synthetic requirement layout only"],
          steps: ["Synthetic step layout only"],
          warnings: ["Never use this as guidance"],
          followups: ["Another question"],
          shortAnswer: '<img src=x onerror="alert(1)">',
          sources: [
            {
              id: "demo",
              title: "Fictional card",
              kind: "synthetic",
              ownership: "unavailable",
              evidenceEligible: false,
            },
          ],
        }}
      />,
    );
    expect(
      screen.getByText('<img src=x onerror="alert(1)">'),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Requirements" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Next steps" })).toBeVisible();
    expect(
      within(screen.getByRole("article")).queryByRole("link"),
    ).not.toBeInTheDocument();
  });
});
