import { Service } from "encore.dev/service";

// Import all endpoints
import "./create";
import "./delete";
import "./list";
import "./update";
import "./seed_data";

export default new Service("company");
