export type AuthEvent = {
  eventType: "sign_in_success" | "sign_in_failure" | "sign_out";
  outcome: "success" | "failure";
  timestamp: string;
  sourceIp: string;
  requestId: string;
  accountId?: number;
};

export function logAuthEvent(event: AuthEvent): void {
  console.info(JSON.stringify({ event: "auth", ...event }));
}
