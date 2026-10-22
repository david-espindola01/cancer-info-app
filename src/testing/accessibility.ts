import axe from "axe-core";

/**
 * Accessibility violations (axe-core) inside an element. jsdom cannot measure color
 * contrast: Lighthouse covers that on the real page.
 */
export async function accessibilityViolations(element: Element): Promise<string[]> {
  const result = await axe.run(element, { rules: { region: { enabled: false } } });
  return result.violations.map((violation) => `${violation.id}: ${violation.help}`);
}
