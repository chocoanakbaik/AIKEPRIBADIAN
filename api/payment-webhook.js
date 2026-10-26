import handler from "../netlify/functions/payment-webhook.js";
import { adaptNetlifyHandler } from "./_lib/netlify-adapter.js";

export default adaptNetlifyHandler(handler);
