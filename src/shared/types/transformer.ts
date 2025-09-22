import { CoreMessage } from "ai";
import { StreamTextResult } from "../types";
import { A2ARequest, JSONRPCResponse } from "@a2a-js/sdk";

export type TransformerOptions = Record<string, any>;

export type Transformer = {
  transformRequestOut?: (
    request: CoreMessage[],
    options: TransformerOptions
  ) => Promise<A2ARequest>; // TODO: Convert to A2A format
  // transformResponseIn?: (
  //   response: Response,
  //   context?: TransformerContext
  // ) => Promise<Response>;
  transformResponseIn?: (
    response: JSONRPCResponse,
    options: TransformerOptions
  ) => Promise<StreamTextResult>;
};