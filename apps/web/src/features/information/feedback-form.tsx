"use client";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import type { Locale } from "@/lib/i18n/config";
import { copyFor } from "@/lib/product-copy";

export function FeedbackForm({ locale }: { locale: Locale }) {
  const copy = copyFor(locale);
  const id = useId();
  const [category, setCategory] = useState("");
  const [related, setRelated] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<"idle" | "required" | "length" | "valid">(
    "idle",
  );
  const hasError = state === "required" || state === "length";
  return (
    <form
      noValidate
      autoComplete="off"
      className="feedback-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!category || !description.trim()) setState("required");
        else if ([...description].length > 2000) setState("length");
        else setState("valid");
      }}
    >
      <Alert id={`${id}-privacy`}>
        {copy.feedbackIntro} {copy.privacy}
      </Alert>
      <div>
        <label className="type-label block" htmlFor={`${id}-category`}>
          {copy.feedbackCategory}
        </label>
        <select
          id={`${id}-category`}
          required
          className="native-select mt-2 w-full"
          value={category}
          aria-invalid={state === "required" && !category}
          aria-describedby={hasError ? `${id}-error` : undefined}
          onChange={(event) => {
            setCategory(event.target.value);
            setState("idle");
          }}
        >
          <option value="">{copy.selectCategory}</option>
          {copy.feedbackCategories.map((category, index) => (
            <option key={category} value={index}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="type-label block" htmlFor={`${id}-page`}>
          {copy.relatedPage}
        </label>
        <select
          id={`${id}-page`}
          className="native-select mt-2 w-full"
          value={related}
          onChange={(event) => setRelated(event.target.value)}
        >
          <option value="">—</option>
          {["ask", "services", "sources", "accessibility"].map((page) => (
            <option key={page} value={page}>
              /{locale}/{page}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="type-label block" htmlFor={`${id}-description`}>
          {copy.description}
        </label>
        <Textarea
          id={`${id}-description`}
          required
          className="mt-2 bg-card"
          value={description}
          maxLength={4000}
          aria-invalid={hasError}
          aria-describedby={`${id}-privacy${hasError ? ` ${id}-error` : ""}`}
          onChange={(event) => {
            setDescription(event.target.value);
            setState("idle");
          }}
        />
      </div>
      {hasError && (
        <p id={`${id}-error`} role="alert" className="text-destructive">
          {state === "length" ? copy.feedbackLength : copy.feedbackRequired}
        </p>
      )}
      {state === "valid" && <Alert role="status">{copy.feedbackResult}</Alert>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit">{copy.preview}</Button>
        <Button
          variant="outline"
          onClick={() => {
            setCategory("");
            setRelated("");
            setDescription("");
            setState("idle");
          }}
        >
          {copy.reset}
        </Button>
      </div>
    </form>
  );
}
