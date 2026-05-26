-- ============================================
-- Seeder: Wrapper Transaction
-- ============================================
BEGIN;

-- reference.units
\copy reference.units (name) FROM '/seeder/reference/01_units.csv' WITH (FORMAT CSV, HEADER);

-- reference.checkout_statuses
\copy reference.checkout_statuses (code) FROM '/seeder/reference/02_checkout_statuses.csv' WITH (FORMAT CSV, HEADER);

-- reference.order_item_statuses
\copy reference.order_item_statuses (code) FROM '/seeder/reference/03_order_item_statuses.csv' WITH (FORMAT CSV, HEADER);

-- reference.payment_statuses
\copy reference.payment_statuses (code) FROM '/seeder/reference/04_payment_statuses.csv' WITH (FORMAT CSV, HEADER);

-- reference.shipment_statuses
\copy reference.shipment_statuses (code) FROM '/seeder/reference/05_shipment_statuses.csv' WITH (FORMAT CSV, HEADER);

-- reference.contract_statuses
\copy reference.contract_statuses (code) FROM '/seeder/reference/06_contract_statuses.csv' WITH (FORMAT CSV, HEADER);

-- reference.payment_methods
\copy reference.payment_methods (name) FROM '/seeder/reference/07_payment_methods.csv' WITH (FORMAT CSV, HEADER);

-- reference.product_categories
\copy reference.product_categories (name, parent_id) FROM '/seeder/reference/08_product_categories.csv' WITH (FORMAT CSV, HEADER);

-- reference.provinces
\copy reference.provinces (name) FROM '/seeder/reference/09_provinces.csv' WITH (FORMAT CSV, HEADER);

-- reference.cities
\copy reference.cities (name, province_id) FROM '/seeder/reference/10_cities.csv' WITH (FORMAT CSV, HEADER);

-- master.users
\copy master.users (full_name, email, phone, password_hash, role, status) FROM '/seeder/master/01_users.csv' WITH (FORMAT CSV, HEADER);

-- master.seller_profiles
\copy master.seller_profiles (user_id, farm_name, land_certificate, address, city_id, province_id, status) FROM '/seeder/master/02_seller_profiles.csv' WITH (FORMAT CSV, HEADER);

-- master.products
\copy master.products (seller_id, category_id, name, description, unit_id, min_order_qty, price_per_unit, stock_quantity, is_negotiable) FROM '/seeder/master/03_products.csv' WITH (FORMAT CSV, HEADER);

COMMIT;
