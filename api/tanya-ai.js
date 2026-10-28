import handler from "../netlify/functions/chat.js";
import { adaptNetlifyHandler } from "./_lib/netlify-adapter.js";

export default adaptNetlifyHandler(handler);
