import handler from "../netlify/functions/memory.js";
import { adaptNetlifyHandler } from "./_lib/netlify-adapter.js";

export default adaptNetlifyHandler(handler);
