import { Service } from "encore.dev/service";

// Import all endpoints
import "./create_user";
import "./delete_user";
import "./list_users";
import "./login";
import "./logout";
import "./update_profile";
import "./update_user";
import "./verify_token";
import "./seed_data";

export default new Service("auth");
