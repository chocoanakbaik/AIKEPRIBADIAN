import handler from "../netlify/functions/supabase-config.js";
import { adaptNetlifyHandler } from "./_lib/netlify-adapter.js";

export default adaptNetlifyHandler(handler);
