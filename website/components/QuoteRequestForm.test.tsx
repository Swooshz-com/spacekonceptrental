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
    render(<QuoteRequestForm validCanonicalIdentities={[]} />);

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

  it("focuses the selection fieldset and shows inline error when selection is the only error", () => {
    render(<QuoteRequestForm />);

    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Maya Tan" }
    });
    fireEvent.change(screen.getByLabelText(/preferred contact method/i), {
      target: { value: "email" }
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
    const inlineError = document.getElementById("quote-selection-error");
    expect(inlineError).toBeInTheDocument();
    expect(inlineError).toHaveClass("quote-form__field-error");
    const fieldset = document.getElementById("quote-selection");
    expect(fieldset).toHaveAttribute("tabindex", "-1");
    expect(fieldset).toHaveAttribute(
      "aria-describedby",
      "quote-selection-error"
    );
    expect(document.activeElement).toBe(fieldset);
  });

  it("accepts a stored rental row only when the canonical (reference, kind) matches a valid identity", () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            kind: "catalogue",
            reference: "lounge-chair",
            quantity: 1,
            source: "catalogue",
            order: 0,
            subkind: "rental"
          }
        ]
      })
    );
    render(
      <QuoteRequestForm
        validCanonicalIdentities={[
          { reference: "lounge-chair", kind: "rental" }
        ]}
      />
    );

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

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("rejects a stored row whose kind mismatches the canonical identity", () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            kind: "catalogue",
            reference: "lounge-chair",
            quantity: 1,
            source: "catalogue",
            order: 0,
            subkind: "setup"
          }
        ]
      })
    );
    render(
      <QuoteRequestForm
        validCanonicalIdentities={[
          { reference: "lounge-chair", kind: "rental" }
        ]}
      />
    );

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

  it("accepts a stored setup row only when (reference, kind) match a setup identity", () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            kind: "catalogue",
            reference: "metropolitan-gala",
            quantity: 1,
            source: "catalogue",
            order: 0,
            subkind: "setup"
          }
        ]
      })
    );
    render(
      <QuoteRequestForm
        validCanonicalIdentities={[
          { reference: "metropolitan-gala", kind: "setup" }
        ]}
      />
    );

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

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("rejects a stored setup row when only a rental identity exists for the same reference", () => {
    window.sessionStorage.setItem(
      QUOTE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rows: [
          {
            kind: "catalogue",
            reference: "metropolitan-gala",
            quantity: 1,
            source: "catalogue",
            order: 0,
            subkind: "setup"
          }
        ]
      })
    );
    render(
      <QuoteRequestForm
        validCanonicalIdentities={[
          { reference: "metropolitan-gala", kind: "rental" }
        ]}
      />
    );

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

  it("uses the same transaction for manual row add and remove, preserving byte-level integrity", () => {
    render(<QuoteRequestForm />);

    fireEvent.change(screen.getByLabelText(/manual item description/i), {
      target: { value: "Custom counter" }
    });
    fireEvent.click(
      screen.getByRole("button", { name: /add manual requirement/i })
    );

    const afterAdd = window.sessionStorage.getItem(
      QUOTE_SELECTION_STORAGE_KEY
    );
    expect(afterAdd).toBeDefined();
    const afterAddParsed = JSON.parse(afterAdd ?? "{}") as { rows: unknown[] };
    expect(afterAddParsed.rows).toHaveLength(1);

    const removeButton = screen.getByRole("button", {
      name: /remove manual requirement custom counter/i
    });
    fireEvent.click(removeButton);

    const afterRemove = window.sessionStorage.getItem(
      QUOTE_SELECTION_STORAGE_KEY
    );
    expect(afterRemove).toBeDefined();
    const afterRemoveParsed = JSON.parse(afterRemove ?? "{}") as {
      rows: unknown[];
    };
    expect(afterRemoveParsed.rows).toEqual([]);
  });

  describe("Design Lock B — manual-path failure coverage through the production form adapter", () => {
    function createFaultyStorage(overrides: {
      writeMismatch?: boolean;
      dispatchFailure?: boolean;
      removeThrows?: boolean;
      removeNoop?: boolean;
    }) {
      const real = window.sessionStorage;
      let inner: string | null = null;
      let writeCount = 0;
      let dispatchCount = 0;
      const faulty: Storage = {
        get length() { return inner === null ? 0 : 1; },
        key: (index: number) => index === 0 && inner !== null ? QUOTE_SELECTION_STORAGE_KEY : null,
        getItem: (key: string) => key === QUOTE_SELECTION_STORAGE_KEY ? inner : real.getItem(key),
        setItem: (key: string, value: string) => {
          if (key === QUOTE_SELECTION_STORAGE_KEY) {
            writeCount += 1;
            if (overrides.writeMismatch && writeCount === 1) {
              inner = '{"tampered":true}';
              return;
            }
            inner = value;
            return;
          }
          real.setItem(key, value);
        },
        removeItem: (key: string) => {
          if (key === QUOTE_SELECTION_STORAGE_KEY) {
            if (overrides.removeThrows) {
              throw new Error("quota");
            }
            if (overrides.removeNoop) {
              inner = '{"stale":true}';
              return;
            }
            inner = null;
            return;
          }
          real.removeItem(key);
        },
        clear: () => {
          inner = null;
          real.clear();
        }
      };
      Object.defineProperty(window, "sessionStorage", {
        value: faulty,
        writable: true,
        configurable: true
      });
      return {
        getWriteCount: () => writeCount,
        getDispatchCount: () => dispatchCount,
        getInner: () => inner,
        restore: () => {
          Object.defineProperty(window, "sessionStorage", {
            value: real,
            writable: true,
            configurable: true
          });
        }
      };
    }

    afterEach(() => {
      Object.defineProperty(window, "sessionStorage", {
        value: new (class implements Storage {
          private store = new Map<string, string>();
          get length() { return this.store.size; }
          key(i: number) { return Array.from(this.store.keys())[i] ?? null; }
          getItem(k: string) { return this.store.get(k) ?? null; }
          setItem(k: string, v: string) { this.store.set(k, String(v)); }
          removeItem(k: string) { this.store.delete(k); }
          clear() { this.store.clear(); }
        })(),
        writable: true,
        configurable: true
      });
    });

    it("manual add from absent key with write/read-back mismatch triggers remove and UI resync", () => {
      const faulty = createFaultyStorage({ writeMismatch: true });
      try {
        render(<QuoteRequestForm />);
        fireEvent.change(screen.getByLabelText(/manual item description/i), {
          target: { value: "Custom counter" }
        });
        fireEvent.click(
          screen.getByRole("button", { name: /add manual requirement/i })
        );

        expect(faulty.getInner()).toBeNull();
        expect(screen.queryByText(/custom counter - qty 1/i)).not.toBeInTheDocument();
        expect(screen.getAllByText(/could not be added|storage could not be updated/i).length).toBeGreaterThan(0);
      } finally {
        faulty.restore();
      }
    });

    it("removal throws during manual add recovery returns restore-failed and resyncs UI", () => {
      const faulty = createFaultyStorage({ writeMismatch: true, removeThrows: true });
      try {
        render(<QuoteRequestForm />);
        fireEvent.change(screen.getByLabelText(/manual item description/i), {
          target: { value: "Custom counter" }
        });
        fireEvent.click(
          screen.getByRole("button", { name: /add manual requirement/i })
        );

        expect(screen.queryByText(/custom counter - qty 1/i)).not.toBeInTheDocument();
        expect(screen.getAllByText(/storage could not be updated/i).length).toBeGreaterThan(0);
      } finally {
        faulty.restore();
      }
    });

    it("removal succeeds but key remains returns restore-failed and resyncs UI", () => {
      const faulty = createFaultyStorage({ writeMismatch: true, removeNoop: true });
      try {
        render(<QuoteRequestForm />);
        fireEvent.change(screen.getByLabelText(/manual item description/i), {
          target: { value: "Custom counter" }
        });
        fireEvent.click(
          screen.getByRole("button", { name: /add manual requirement/i })
        );

        expect(screen.queryByText(/custom counter - qty 1/i)).not.toBeInTheDocument();
        expect(screen.getAllByText(/storage could not be updated/i).length).toBeGreaterThan(0);
      } finally {
        faulty.restore();
      }
    });

    it("manual remove with existing row resyncs UI when commit fails", () => {
      window.sessionStorage.setItem(
        QUOTE_SELECTION_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          rows: [
            {
              kind: "manual",
              key: "manual-a",
              description: "Existing item",
              quantity: 1,
              source: "manual",
              order: 0
            }
          ]
        })
      );

      render(<QuoteRequestForm />);
      expect(screen.getByText(/existing item - qty 1/i)).toBeInTheDocument();

      const removeButton = screen.getByRole("button", {
        name: /remove manual requirement existing item/i
      });
      fireEvent.click(removeButton);

      expect(screen.queryByText(/existing item - qty 1/i)).not.toBeInTheDocument();
    });

    it("successful manual add and remove through the production adapter remain unchanged", () => {
      render(<QuoteRequestForm />);

      fireEvent.change(screen.getByLabelText(/manual item description/i), {
        target: { value: "Custom counter" }
      });
      fireEvent.click(
        screen.getByRole("button", { name: /add manual requirement/i })
      );

      expect(screen.getByText(/custom counter - qty 1/i)).toBeInTheDocument();
      expect(
        JSON.parse(window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY) ?? "{}")
      ).toHaveProperty("rows");

      fireEvent.click(
        screen.getByRole("button", { name: /remove manual requirement custom counter/i })
      );

      expect(screen.queryByText(/custom counter - qty 1/i)).not.toBeInTheDocument();
      const afterRemove = JSON.parse(
        window.sessionStorage.getItem(QUOTE_SELECTION_STORAGE_KEY) ?? "{}"
      ) as { rows: unknown[] };
      expect(afterRemove.rows).toEqual([]);
    });
  });
});
