import { Service } from "encore.dev/service";

// Import all endpoints
import "./create_category";
import "./create_product";
import "./delete_category";
import "./delete_product";
import "./list_categories";
import "./list_products";
import "./update_category";
import "./update_product";
import "./update_stock";
import "./seed_data";

export default new Service("inventory");
