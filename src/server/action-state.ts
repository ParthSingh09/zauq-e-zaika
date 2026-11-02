import type { ZodError } from "zod";

export type ActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  /** Optional payload, e.g. id of a created record or a redirect target. */
  data?: Record<string, string>;
};

export const initialState: ActionState = { ok: false, message: "" };

export function fieldErrors(err: ZodError): ActionState {
  const errors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, message: "Please check the highlighted fields.", errors };
}
