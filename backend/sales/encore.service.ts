import { Service } from "encore.dev/service";

// Import all endpoints
import "./create_customer";
import "./create_order";
import "./delete_customer";
import "./delete_order";
import "./list_customers";
import "./list_orders";
import "./update_customer";
import "./update_order";
import "./generate_invoice";
import "./list_invoices";
import "./get_invoice";
import "./update_invoice";
import "./sales_report";
import "./seed_data";

export default new Service("sales");
