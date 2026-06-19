type FontOptions = {
  variable?: string;
};

function createFont(options: FontOptions = {}) {
  return {
    className: "test-font",
    variable: options.variable ?? "test-font-variable",
    style: {}
  };
}

export const Inter = createFont;
export const Montserrat = createFont;
