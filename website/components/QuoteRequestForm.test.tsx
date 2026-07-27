import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QUOTE_SELECTION_STORAGE_KEY } from "../lib/quote/selection-model";
import QuoteRequestForm from "./QuoteRequestForm";

describe("QuoteRequestForm", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("never performs a client quote request while submission is disabled", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<QuoteRequestForm />);

    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Maya Tan" }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "maya@example.test" }
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: /submission unavailable during review/i
      })
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /select a published catalogue listing or add a valid manual requirement/i
    );
  });

  it("does not count an unavailable stored catalogue reference as a valid selection", () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            kind: "catalogue",
            reference: "retired-chair",
            quantity: 1,
            source: "catalogue",
            order: 0
          }
        ]
      })
    );
    render(<QuoteRequestForm validCatalogueReferences={[]} />);

    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Maya Tan" }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "maya@example.test" }
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: /submission unavailable during review/i
      })
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /select a published catalogue listing or add a valid manual requirement/i
    );
  });

  it("applies conditional native requirements for email and phone", () => {
    render(<QuoteRequestForm />);

    const email = screen.getByLabelText(/email address/i);
    const phone = screen.getByLabelText(/phone number/i);
    const method = screen.getByLabelText(/preferred contact method/i);

    expect(email).toBeRequired();
    expect(phone).not.toBeRequired();

    fireEvent.change(method, { target: { value: "phone" } });

    expect(email).not.toBeRequired();
    expect(phone).toBeRequired();
  });

  it("validates every supplied contact value and associates summary and inline errors", () => {
    render(<QuoteRequestForm />);

    fireEvent.change(screen.getByLabelText(/preferred contact method/i), {
      target: { value: "phone" }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "not-an-email" }
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: /submission unavailable during review/i
      })
    );

    const summary = screen.getByRole("alert");
    const name = screen.getByLabelText(/your name/i);
    const email = screen.getByLabelText(/email address/i);
    const phone = screen.getByLabelText(/phone number/i);

    expect(summary).toHaveTextContent(/name is required/i);
    expect(summary).toHaveTextContent(/enter a valid email address/i);
    expect(summary).toHaveTextContent(/phone number is required/i);
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAttribute("aria-describedby", "quote-customerEmail-error");
    expect(phone).toHaveAttribute("aria-describedby", "quote-customerPhone-error");
    expect(document.activeElement).toBe(name);
  });

  it("stores distinct bounded manual rows in the same tab alongside catalogue rows", () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            kind: "catalogue",
            reference: "lounge-chair",
            quantity: 2,
            source: "catalogue",
            order: 0
          }
        ]
      })
    );
    render(<QuoteRequestForm />);

    const add = screen.getByRole("button", { name: /add manual requirement/i });
    const description = screen.getByLabelText(/manual item description/i);

    fireEvent.change(description, { target: { value: "Custom counter" } });
    fireEvent.click(add);
    fireEvent.change(description, { target: { value: "Custom counter" } });
    fireEvent.click(add);

    const stored = JSON.parse(
      window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY) ?? "{}"
    ) as { rows: Array<{ kind: string; key?: string }> };

    expect(stored.rows.map((row) => row.kind)).toEqual([
      "catalogue",
      "manual",
      "manual"
    ]);
    expect(stored.rows[1]?.key).not.toBe(stored.rows[2]?.key);
    expect(screen.getAllByText(/custom counter - qty 1/i)).toHaveLength(2);
  });

  it.each(["0", "100", "1.5", "1e2"])(
    "rejects invalid manual quantity %s",
    (quantity) => {
      render(<QuoteRequestForm />);
      fireEvent.change(screen.getByLabelText(/manual item description/i), {
        target: { value: "Custom counter" }
      });
      fireEvent.change(screen.getByLabelText(/manual item quantity/i), {
        target: { value: quantity }
      });
      fireEvent.click(
        screen.getByRole("button", { name: /add manual requirement/i })
      );

      expect(screen.getAllByText(/whole number from 1 to 99/i)).toHaveLength(2);
      expect(
        window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY)
      ).toBeNull();
    }
  );

  it("uses real responsive text and icon elements in the review-only submit control", () => {
    render(<QuoteRequestForm />);

    const button = screen.getByRole("button", {
      name: /submission unavailable during review/i
    });

    expect(
      within(button).getByText(/submission unavailable during review/i)
    ).toHaveClass("quote-form__submit-text");
    expect(button.querySelector(".quote-form__submit-icon")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });

  it("keeps legal links next to the review-only data flow", () => {
    render(<QuoteRequestForm />);

    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
      "href",
      "/privacy"
    );
    expect(screen.getByRole("link", { name: /terms of use/i })).toHaveAttribute(
      "href",
      "/terms"
    );
  });

  it("defaults to email and offers only direct contact methods", () => {
    render(<QuoteRequestForm />);

    expect(screen.getByLabelText(/preferred contact method/i)).toHaveValue("email");
    expect(screen.getByRole("option", { name: "Email" })).toHaveValue("email");
    expect(screen.getByRole("option", { name: "Phone" })).toHaveValue("phone");
    expect(screen.queryByRole("option", { name: /no preference|either/i })).not.toBeInTheDocument();
  });

  it("does not import persistence or Supabase into browser form code", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/QuoteRequestForm.tsx"),
      "utf8"
    );

    expect(source).not.toContain("@supabase/");
    expect(source).not.toContain("lib/supabase");
    expect(source).not.toContain("createServerSupabaseClient");
    expect(source).not.toContain("SUPABASE_URL");
    expect(source).not.toContain("SUPABASE_ANON_KEY");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE");
    expect(source).not.toContain("fetch(");
  });
});
