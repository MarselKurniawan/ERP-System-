import { Service } from "encore.dev/service";

// Import all endpoints
import "./create_account";
import "./create_journal_entry";
import "./delete_account";
import "./delete_journal_entry";
import "./list_accounts";
import "./list_journal_entries";
import "./trial_balance";
import "./update_account";
import "./profit_loss_report";
import "./balance_sheet_report";
import "./general_ledger_report";
import "./seed_data";

export default new Service("accounting");
