import { Service } from "encore.dev/service";

// Import all endpoints
import "./create_purchase_order";
import "./create_supplier";
import "./delete_purchase_order";
import "./delete_supplier";
import "./list_purchase_orders";
import "./list_suppliers";
import "./update_purchase_order";
import "./update_supplier";
import "./seed_data";

export default new Service("purchasing");
