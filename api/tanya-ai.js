import handler from "../netlify/functions/tanya-ai.js";
import { adaptNetlifyHandler } from "./_lib/netlify-adapter.js";

export default adaptNetlifyHandler(handler);
