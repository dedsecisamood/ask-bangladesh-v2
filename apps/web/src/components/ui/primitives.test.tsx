import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Link from "next/link";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { Badge } from "./badge";
import { Separator } from "./separator";
import { Skeleton } from "./skeleton";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { cn } from "@/lib/utils";

describe("shared design primitives", () => {
  it("makes ordinary buttons safe inside forms while respecting explicit submit", () => {
    render(
      <form>
        <Button>Open navigation</Button>
        <Button type="submit">Submit</Button>
        <Button disabled>Unavailable</Button>
      </form>,
    );
    expect(
      screen.getByRole("button", { name: "Open navigation" }),
    ).toHaveAttribute("type", "button");
    expect(screen.getByRole("button", { name: "Submit" })).toHaveAttribute(
      "type",
      "submit",
    );
    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  });

  it("preserves link semantics when styled through the button slot", () => {
    render(
      <Button asChild variant="outline">
        <Link href="/en">English</Link>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "English" });
    expect(link).toHaveAttribute("href", "/en");
    expect(link).not.toHaveAttribute("type");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps labeled native controls editable and associates validation details", () => {
    render(
      <>
        <label htmlFor="topic">বিষয়</label>
        <Input id="topic" aria-invalid="true" aria-describedby="topic-error" />
        <p id="topic-error">বিষয় লিখুন</p>
        <label htmlFor="message">মন্তব্য</label>
        <Textarea id="message" />
        <Input aria-label="Disabled input" disabled />
      </>,
    );
    const input = screen.getByRole("textbox", { name: "বিষয়" });
    const message = screen.getByRole("textbox", { name: "মন্তব্য" });
    fireEvent.change(input, { target: { value: "Synthetic topic" } });
    fireEvent.change(message, { target: { value: "Synthetic message" } });
    expect(input).toHaveValue("Synthetic topic");
    expect(input).toHaveAccessibleDescription("বিষয় লিখুন");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(message).toHaveValue("Synthetic message");
    expect(
      screen.getByRole("textbox", { name: "Disabled input" }),
    ).toBeDisabled();
  });

  it("renders semantic content without assigning an unsupported verification status", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Preparation</CardTitle>
          <CardDescription>Information is not published yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge>Under development</Badge>
          <Separator />
          <Alert role="status">
            <AlertTitle>Unavailable</AlertTitle>
            <AlertDescription>
              No operational assistant is connected.
            </AlertDescription>
          </Alert>
          <Skeleton data-testid="loading-shape" className="h-6 w-24" />
        </CardContent>
      </Card>,
    );
    expect(
      screen.getByRole("heading", { name: "Preparation", level: 3 }),
    ).toBeVisible();
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(
      within(screen.getByRole("status")).getByText("Unavailable"),
    ).toBeVisible();
    expect(screen.getByText("Under development")).toBeVisible();
    expect(screen.getByTestId("loading-shape")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("opens a named dialog, localizes its close control and restores keyboard focus", async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open details</Button>
        </DialogTrigger>
        <DialogContent closeLabel="বন্ধ করুন">
          <DialogHeader>
            <DialogTitle>Project details</DialogTitle>
            <DialogDescription>
              These are synthetic interface details.
            </DialogDescription>
          </DialogHeader>
          <Input aria-label="Dialog field" />
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Open details" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", {
      name: "Project details",
    });
    expect(dialog).toHaveAccessibleDescription(
      "These are synthetic interface details.",
    );
    expect(
      within(dialog).getByRole("button", { name: "বন্ধ করুন" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        within(dialog).getByRole("textbox", { name: "Dialog field" }),
      ).toHaveFocus(),
    );
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("supports an explicit localized close action", async () => {
    const changed = vi.fn();
    render(
      <Dialog onOpenChange={changed}>
        <DialogTrigger asChild>
          <Button>Show notice</Button>
        </DialogTrigger>
        <DialogContent closeLabel="Close notice">
          <DialogTitle>Notice</DialogTitle>
          <DialogDescription>Interface demonstration only.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Show notice" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Close notice" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(changed).toHaveBeenLastCalledWith(false);
  });

  it("opens the dropdown with the keyboard and selects an available item", async () => {
    const selected = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Choose language</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Interface language</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={selected}>English</DropdownMenuItem>
          <DropdownMenuItem disabled>Unavailable language</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const trigger = screen.getByRole("button", { name: "Choose language" });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const menu = await screen.findByRole("menu");
    const item = within(menu).getByRole("menuitem", { name: "English" });
    await waitFor(() => expect(item).toHaveFocus());
    expect(
      within(menu).getByRole("menuitem", { name: "Unavailable language" }),
    ).toHaveAttribute("aria-disabled", "true");
    fireEvent.keyDown(item, { key: "Enter" });
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    expect(selected).toHaveBeenCalledOnce();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("resolves conflicting utility classes while retaining conditional styles", () => {
    expect(cn("px-3", false, { "font-semibold": true }, "px-5")).toBe(
      "font-semibold px-5",
    );
  });
});
