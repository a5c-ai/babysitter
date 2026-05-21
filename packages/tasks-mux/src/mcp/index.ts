export {
  createBreakpointMcpServer,
  startBreakpointMcpServer,
  startHttpBreakpointMcpServer,
} from "./server.js";

export { createHttpMcpServer, startHttpMcpServer } from "./http-transport.js";
export type { HttpMcpServerOptions, HttpMcpServerResult } from "./http-transport.js";

export {
  handleAskBreakpoint,
  askBreakpointDescription,
  askBreakpointParams,
} from "./tools/ask-breakpoint.js";

export {
  handleCheckBreakpointStatus,
  checkBreakpointStatusDescription,
  checkBreakpointStatusParams,
} from "./tools/check-status.js";

export {
  handleListBreakpoints,
  listBreakpointsDescription,
  listBreakpointsParams,
} from "./tools/list-breakpoints.js";

export {
  handleAnswerBreakpoint,
  answerBreakpointDescription,
  answerBreakpointParams,
} from "./tools/answer-breakpoint.js";

export {
  handleVerifyBreakpointAnswer,
  verifyBreakpointAnswerDescription,
  verifyBreakpointAnswerParams,
} from "./tools/verify-answer.js";

export {
  handleListResponders,
  listRespondersDescription,
  listRespondersParams,
} from "./tools/list-responders.js";

export {
  handleClaimBreakpoint,
  claimBreakpointDescription,
  claimBreakpointParams,
} from "./tools/claim-breakpoint.js";

export {
  handlePollBreakpoints,
  pollBreakpointsDescription,
  pollBreakpointsParams,
} from "./tools/poll-breakpoints.js";

export {
  resolveBreakpointBackend,
} from "./backend-resolver.js";

export type {
  BackendResolveContext,
  ResolvedBackend,
} from "./backend-resolver.js";
