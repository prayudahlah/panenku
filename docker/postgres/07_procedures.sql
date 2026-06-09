CREATE SCHEMA IF NOT EXISTS util;

CREATE OR REPLACE PROCEDURE util.sp_get_buyer_dashboard(
    IN p_user_id BIGINT,
    OUT p_result VARCHAR,
    OUT p_data JSONB,
    OUT p_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_active_orders JSONB;
    v_recent_transactions JSONB;
    v_notifications JSONB;
    v_active_contracts JSONB;
    v_active_negotiations JSONB;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM master.users u
        WHERE u.id = p_user_id
          AND u.status = 'active'
          AND u.deleted_at IS NULL
    ) THEN
        p_result := 'ERR-LOG-01';
        p_data := '{}'::JSONB;
        p_message := 'User tidak ditemukan atau tidak aktif';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM master.users u
        WHERE u.id = p_user_id
          AND u.role = 'buyer'
          AND u.status = 'active'
          AND u.deleted_at IS NULL
    ) THEN
        p_result := 'ERR-DASH-02';
        p_data := '{}'::JSONB;
        p_message := 'Hanya pembeli yang dapat mengakses dashboard pembeli';
        RETURN;
    END IF;

    SELECT COALESCE(JSONB_AGG(TO_JSONB(data_row)), '[]'::JSONB)
    INTO v_active_orders
    FROM (
        SELECT
            c.id AS "checkoutId",
            o.id AS "orderId",
            o.order_number AS "orderNumber",
            o.seller_id AS "sellerId",
            o.subtotal AS "subtotal",
            cs.code AS "checkoutStatus",
            ss.code AS "shipmentStatus",
            s.shipping_address AS "shippingAddress",
            o.created_at AS "createdAt"
        FROM "transaction".checkouts c
        INNER JOIN "transaction".orders o ON o.checkout_id = c.id
        LEFT JOIN reference.checkout_statuses cs ON cs.id = c.checkout_status_id
        LEFT JOIN "transaction".shipments s ON s.id = o.shipment_id
        LEFT JOIN reference.shipment_statuses ss ON ss.id = s.shipment_status_id
        WHERE c.buyer_id = p_user_id
          AND cs.code IN ('awaiting_payment', 'paid')
        ORDER BY o.created_at DESC
        LIMIT 5
    ) data_row;

    SELECT COALESCE(JSONB_AGG(TO_JSONB(data_row)), '[]'::JSONB)
    INTO v_recent_transactions
    FROM (
        SELECT
            c.id AS "checkoutId",
            o.id AS "orderId",
            o.order_number AS "orderNumber",
            o.subtotal AS "subtotal",
            c.total_amount AS "totalAmount",
            cs.code AS "checkoutStatus",
            ps.code AS "paymentStatus",
            ss.code AS "shipmentStatus",
            o.created_at AS "createdAt"
        FROM "transaction".checkouts c
        INNER JOIN "transaction".orders o ON o.checkout_id = c.id
        LEFT JOIN reference.checkout_statuses cs ON cs.id = c.checkout_status_id
        LEFT JOIN "transaction".payments p ON p.id = c.payment_id
        LEFT JOIN reference.payment_statuses ps ON ps.id = p.payment_status_id
        LEFT JOIN "transaction".shipments s ON s.id = o.shipment_id
        LEFT JOIN reference.shipment_statuses ss ON ss.id = s.shipment_status_id
        WHERE c.buyer_id = p_user_id
        ORDER BY o.created_at DESC
        LIMIT 5
    ) data_row;

    SELECT COALESCE(JSONB_AGG(TO_JSONB(data_row)), '[]'::JSONB)
    INTO v_notifications
    FROM (
        SELECT
            n.id,
            n.title,
            n.message,
            n.type,
            n.reference_type AS "referenceType",
            n.reference_id AS "referenceId",
            n.is_read AS "isRead",
            n.created_at AS "createdAt"
        FROM util.notifications n
        WHERE n.user_id = p_user_id
        ORDER BY n.created_at DESC
        LIMIT 5
    ) data_row;

    SELECT COALESCE(JSONB_AGG(TO_JSONB(data_row)), '[]'::JSONB)
    INTO v_active_contracts
    FROM (
        SELECT
            c.id,
            c.seller_id AS "sellerId",
            sp.farm_name AS "sellerName",
            c.total_amount AS "totalAmount",
            c.delivery_location AS "deliveryLocation",
            c.start_date AS "startDate",
            c.end_date AS "endDate",
            c.frequency,
            c.total_shipping AS "totalShipping",
            cs.code AS "contractStatus",
            c.created_at AS "createdAt"
        FROM "transaction".contracts c
        LEFT JOIN master.seller_profiles sp ON sp.user_id = c.seller_id
        LEFT JOIN reference.contract_statuses cs ON cs.id = c.contract_status_id
        WHERE c.buyer_id = p_user_id
          AND cs.code = 'active'
        ORDER BY c.created_at DESC
        LIMIT 5
    ) data_row;

    SELECT COALESCE(JSONB_AGG(TO_JSONB(data_row)), '[]'::JSONB)
    INTO v_active_negotiations
    FROM (
        SELECT
            n.id,
            n.seller_id AS "sellerId",
            n.product_id AS "productId",
            p.name AS "productName",
            sp.farm_name AS "sellerName",
            n.agreed_price_offer AS "agreedPriceOffer",
            n.agreed_quantity_offer AS "agreedQuantityOffer",
            n.status,
            n.valid_until AS "validUntil",
            n.created_at AS "createdAt"
        FROM "transaction".negotiations n
        LEFT JOIN master.products p ON p.id = n.product_id
        LEFT JOIN master.seller_profiles sp ON sp.user_id = n.seller_id
        WHERE n.buyer_id = p_user_id
          AND n.status = 'ongoing'
        ORDER BY n.created_at DESC
        LIMIT 5
    ) data_row;

    p_result := 'SUCCESS';
    p_data := JSONB_BUILD_OBJECT(
        'activeOrders', v_active_orders,
        'recentTransactions', v_recent_transactions,
        'notifications', v_notifications,
        'activeContracts', v_active_contracts,
        'activeNegotiations', v_active_negotiations
    );
    p_message := 'Dashboard pembeli berhasil diambil';

EXCEPTION
    WHEN OTHERS THEN
        p_result := 'ERR-DASH-01';
        p_data := '{}'::JSONB;
        p_message := 'Gagal mengambil data dashboard pembeli, silakan coba lagi';
END;
$$;


CREATE OR REPLACE PROCEDURE util.sp_get_seller_dashboard(
    IN p_user_id BIGINT,
    OUT p_result VARCHAR,
    OUT p_data JSONB,
    OUT p_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_revenue NUMERIC;
    v_seller_history JSONB;
    v_notifications JSONB;
    v_active_contracts JSONB;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM master.users u
        WHERE u.id = p_user_id
          AND u.status = 'active'
          AND u.deleted_at IS NULL
    ) THEN
        p_result := 'ERR-LOG-01';
        p_data := '{}'::JSONB;
        p_message := 'User tidak ditemukan atau tidak aktif';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM master.users u
        WHERE u.id = p_user_id
          AND u.role = 'seller'
          AND u.status = 'active'
          AND u.deleted_at IS NULL
    ) THEN
        p_result := 'ERR-DASH-02';
        p_data := '{}'::JSONB;
        p_message := 'Hanya penjual yang dapat mengakses dashboard penjual';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM master.seller_profiles sp
        WHERE sp.user_id = p_user_id
          AND sp.status = 'active'
          AND sp.deleted_at IS NULL
    ) THEN
        p_result := 'ERR-DASH-02';
        p_data := '{}'::JSONB;
        p_message := 'Profil penjual tidak aktif atau tidak ditemukan';
        RETURN;
    END IF;

    SELECT COALESCE(SUM(o.subtotal), 0)
    INTO v_total_revenue
    FROM "transaction".orders o
    INNER JOIN "transaction".checkouts c ON c.id = o.checkout_id
    LEFT JOIN "transaction".payments p ON p.id = c.payment_id
    LEFT JOIN reference.payment_statuses ps ON ps.id = p.payment_status_id
    WHERE o.seller_id = p_user_id
      AND ps.code = 'paid';

    SELECT COALESCE(JSONB_AGG(TO_JSONB(data_row)), '[]'::JSONB)
    INTO v_seller_history
    FROM (
        SELECT
            o.id AS "orderId",
            o.order_number AS "orderNumber",
            o.checkout_id AS "checkoutId",
            o.subtotal,
            o.created_at AS "createdAt"
        FROM "transaction".orders o
        WHERE o.seller_id = p_user_id
        ORDER BY o.created_at DESC
        LIMIT 5
    ) data_row;

    SELECT COALESCE(JSONB_AGG(TO_JSONB(data_row)), '[]'::JSONB)
    INTO v_notifications
    FROM (
        SELECT
            n.id,
            n.title,
            n.message,
            n.type,
            n.reference_type AS "referenceType",
            n.reference_id AS "referenceId",
            n.is_read AS "isRead",
            n.created_at AS "createdAt"
        FROM util.notifications n
        WHERE n.user_id = p_user_id
        ORDER BY n.created_at DESC
        LIMIT 5
    ) data_row;

    SELECT COALESCE(JSONB_AGG(TO_JSONB(data_row)), '[]'::JSONB)
    INTO v_active_contracts
    FROM (
        SELECT
            c.id,
            c.buyer_id AS "buyerId",
            u.full_name AS "buyerName",
            c.total_amount AS "totalAmount",
            c.delivery_location AS "deliveryLocation",
            c.start_date AS "startDate",
            c.end_date AS "endDate",
            c.frequency,
            c.total_shipping AS "totalShipping",
            cs.code AS "contractStatus",
            c.created_at AS "createdAt"
        FROM "transaction".contracts c
        LEFT JOIN master.users u ON u.id = c.buyer_id
        LEFT JOIN reference.contract_statuses cs ON cs.id = c.contract_status_id
        WHERE c.seller_id = p_user_id
          AND cs.code = 'active'
        ORDER BY c.created_at DESC
        LIMIT 5
    ) data_row;

    p_result := 'SUCCESS';
    p_data := JSONB_BUILD_OBJECT(
        'totalRevenue', COALESCE(v_total_revenue, 0),
        'sellerHistory', v_seller_history,
        'notifications', v_notifications,
        'activeContracts', v_active_contracts
    );
    p_message := 'Dashboard penjual berhasil diambil';

EXCEPTION
    WHEN OTHERS THEN
        p_result := 'ERR-DASH-01';
        p_data := '{}'::JSONB;
        p_message := 'Gagal mengambil data dashboard penjual, silakan coba lagi';
END;
$$;


CREATE OR REPLACE PROCEDURE util.sp_get_admin_dashboard(
    IN p_user_id BIGINT,
    OUT p_result VARCHAR,
    OUT p_data JSONB,
    OUT p_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_active_users BIGINT;
    v_active_partnerships BIGINT;
    v_active_sellers BIGINT;
    v_total_checkout BIGINT;
    v_success_checkout BIGINT;
    v_success_transaction_ratio NUMERIC;
    v_growth_analysis JSONB;
    v_activity_logs JSONB;
    v_category_leaderboard JSONB;
    v_seller_leaderboard JSONB;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM master.users u
        WHERE u.id = p_user_id
          AND u.status = 'active'
          AND u.deleted_at IS NULL
    ) THEN
        p_result := 'ERR-LOG-01';
        p_data := '{}'::JSONB;
        p_message := 'User tidak ditemukan atau tidak aktif';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM master.users u
        WHERE u.id = p_user_id
          AND u.role = 'admin'
          AND u.status = 'active'
          AND u.deleted_at IS NULL
    ) THEN
        p_result := 'ERR-DASH-02';
        p_data := '{}'::JSONB;
        p_message := 'Role bukan admin';
        RETURN;
    END IF;

    SELECT COUNT(*)
    INTO v_active_users
    FROM util.sessions s
    WHERE s.expires_at > NOW();

    SELECT COUNT(*)
    INTO v_active_partnerships
    FROM "transaction".contracts c
    LEFT JOIN reference.contract_statuses cs ON cs.id = c.contract_status_id
    WHERE cs.code = 'active';

    SELECT COUNT(*)
    INTO v_active_sellers
    FROM master.seller_profiles sp
    WHERE sp.status = 'active'
      AND sp.deleted_at IS NULL;

    SELECT COUNT(*)
    INTO v_total_checkout
    FROM "transaction".checkouts c;

    SELECT COUNT(*)
    INTO v_success_checkout
    FROM "transaction".checkouts c
    LEFT JOIN "transaction".payments p ON p.id = c.payment_id
    LEFT JOIN reference.payment_statuses ps ON ps.id = p.payment_status_id
    WHERE ps.code = 'paid';

    v_success_transaction_ratio :=
        CASE
            WHEN COALESCE(v_total_checkout, 0) = 0 THEN 0
            ELSE ROUND((v_success_checkout::NUMERIC / v_total_checkout::NUMERIC) * 100, 2)
        END;

    SELECT COALESCE(JSONB_AGG(TO_JSONB(data_row)), '[]'::JSONB)
    INTO v_growth_analysis
    FROM (
        SELECT
            TO_CHAR(DATE_TRUNC('day', c.created_at), 'YYYY-MM-DD') AS date,
            COUNT(*) AS "totalTransactions",
            COALESCE(SUM(c.total_amount), 0) AS "totalAmount"
        FROM "transaction".checkouts c
        WHERE c.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY DATE_TRUNC('day', c.created_at)
        ORDER BY DATE_TRUNC('day', c.created_at)
    ) data_row;

    SELECT COALESCE(JSONB_AGG(TO_JSONB(data_row)), '[]'::JSONB)
    INTO v_activity_logs
    FROM (
        SELECT
            a.id,
            a.user_id AS "userId",
            a.action,
            a.entity_type AS "entityType",
            a.entity_id AS "entityId",
            a.created_at AS "createdAt"
        FROM audit.audit_logs a
        ORDER BY a.created_at DESC
        LIMIT 10
    ) data_row;

    SELECT COALESCE(JSONB_AGG(TO_JSONB(data_row)), '[]'::JSONB)
    INTO v_category_leaderboard
    FROM (
        SELECT
            pc.id AS "categoryId",
            pc.name AS "categoryName",
            COUNT(*) AS "totalOrders",
            COALESCE(SUM(oi.subtotal), 0) AS "totalRevenue"
        FROM "transaction".order_items oi
        INNER JOIN master.products p ON p.id = oi.product_id
        INNER JOIN reference.product_categories pc ON pc.id = p.category_id
        GROUP BY pc.id, pc.name
        ORDER BY COALESCE(SUM(oi.subtotal), 0) DESC
        LIMIT 5
    ) data_row;

    SELECT COALESCE(JSONB_AGG(TO_JSONB(data_row)), '[]'::JSONB)
    INTO v_seller_leaderboard
    FROM (
        SELECT
            o.seller_id AS "sellerId",
            sp.farm_name AS "sellerName",
            COUNT(*) AS "totalOrders",
            COALESCE(SUM(o.subtotal), 0) AS "totalRevenue"
        FROM "transaction".orders o
        LEFT JOIN master.seller_profiles sp ON sp.user_id = o.seller_id
        GROUP BY o.seller_id, sp.farm_name
        ORDER BY COALESCE(SUM(o.subtotal), 0) DESC
        LIMIT 5
    ) data_row;

    p_result := 'SUCCESS';
    p_data := JSONB_BUILD_OBJECT(
        'metrics', JSONB_BUILD_OBJECT(
            'activeUsers', COALESCE(v_active_users, 0),
            'activePartnerships', COALESCE(v_active_partnerships, 0),
            'successTransactionRatio', COALESCE(v_success_transaction_ratio, 0),
            'activeSellers', COALESCE(v_active_sellers, 0)
        ),
        'growthAnalysis', v_growth_analysis,
        'activityLogs', v_activity_logs,
        'categoryLeaderboard', v_category_leaderboard,
        'sellerLeaderboard', v_seller_leaderboard
    );
    p_message := 'Dashboard admin berhasil diambil';

EXCEPTION
    WHEN OTHERS THEN
        p_result := 'ERR-DASH-01';
        p_data := '{}'::JSONB;
        p_message := 'Gagal mengambil data dashboard admin, silakan coba lagi';
END;
$$;