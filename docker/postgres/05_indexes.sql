-- Util
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON util.sessions(expires_at);

-- Master
CREATE INDEX IF NOT EXISTS idx_users_email ON master.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON master.users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON master.users(deleted_at);

CREATE INDEX IF NOT EXISTS idx_products_seller ON master.products(seller_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON master.products(category_id);

-- Transaction
CREATE INDEX IF NOT EXISTS idx_negotiations_seller ON transaction.negotiations(seller_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_buyer ON transaction.negotiations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON transaction.negotiations(status);

CREATE INDEX IF NOT EXISTS idx_orders_seller ON transaction.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_checkout ON transaction.orders(checkout_id);

CREATE INDEX IF NOT EXISTS idx_contracts_buyer ON transaction.contracts(buyer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_seller ON transaction.contracts(seller_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON transaction.contracts(contract_status_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON transaction.cart_items(cart_id);

CREATE INDEX IF NOT EXISTS idx_checkouts_buyer ON transaction.checkouts(buyer_id);
CREATE INDEX IF NOT EXISTS idx_checkouts_status ON transaction.checkouts(checkout_status_id);

-- Audit
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit.audit_logs(created_at);
