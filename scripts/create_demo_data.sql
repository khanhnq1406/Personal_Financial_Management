-- Demo Data Script for User ID=10
-- Purpose: Create comprehensive demo data for screenshots
-- Date: 2026-02-23

-- ============================================================================
-- STEP 1: DELETE EXISTING DATA (in order to respect foreign keys)
-- ============================================================================

BEGIN;

-- Delete category keywords first
DELETE FROM category_keyword
WHERE
    category_id IN (
        SELECT id
        FROM category
        WHERE
            user_id = 10
    );

-- Delete merchant category rules
DELETE FROM merchant_category_rule
WHERE
    category_id IN (
        SELECT id
        FROM category
        WHERE
            user_id = 10
    );

-- Delete import batches
DELETE FROM import_batch
WHERE
    wallet_id IN (
        SELECT id
        FROM wallet
        WHERE
            user_id = 10
    );

-- Delete investment transactions first
DELETE FROM investment_transaction
WHERE
    wallet_id IN (
        SELECT id
        FROM wallet
        WHERE
            user_id = 10
    );

-- Delete investment lots
DELETE FROM investment_lot
WHERE
    investment_id IN (
        SELECT id
        FROM investment
        WHERE
            wallet_id IN (
                SELECT id
                FROM wallet
                WHERE
                    user_id = 10
            )
    );

-- Delete investments
DELETE FROM investment
WHERE
    wallet_id IN (
        SELECT id
        FROM wallet
        WHERE
            user_id = 10
    );

-- Delete transactions
DELETE FROM transaction
WHERE
    wallet_id IN (
        SELECT id
        FROM wallet
        WHERE
            user_id = 10
    );

-- Delete budget items
DELETE FROM budget_item
WHERE
    budget_id IN (
        SELECT id
        FROM budget
        WHERE
            user_id = 10
    );

-- Delete budgets
DELETE FROM budget WHERE user_id = 10;

-- Delete categories
DELETE FROM category WHERE user_id = 10;

-- Delete wallets
DELETE FROM wallet WHERE user_id = 10;

COMMIT;

-- ============================================================================
-- STEP 2: CREATE DEMO CATEGORIES
-- ============================================================================

BEGIN;

-- Income Categories (type=1)
INSERT INTO
    category (
        user_id,
        name,
        type,
        created_at,
        updated_at
    )
VALUES (10, 'Lương', 1, NOW(), NOW()),
    (
        10,
        'Freelance',
        1,
        NOW(),
        NOW()
    ),
    (
        10,
        'Thu nhập đầu tư',
        1,
        NOW(),
        NOW()
    ),
    (
        10,
        'Thu nhập khác',
        1,
        NOW(),
        NOW()
    );

-- Expense Categories (type=2)
INSERT INTO
    category (
        user_id,
        name,
        type,
        created_at,
        updated_at
    )
VALUES (
        10,
        'Ăn uống',
        2,
        NOW(),
        NOW()
    ),
    (
        10,
        'Di chuyển',
        2,
        NOW(),
        NOW()
    ),
    (
        10,
        'Mua sắm',
        2,
        NOW(),
        NOW()
    ),
    (
        10,
        'Giải trí',
        2,
        NOW(),
        NOW()
    ),
    (10, 'Y tế', 2, NOW(), NOW()),
    (
        10,
        'Giáo dục',
        2,
        NOW(),
        NOW()
    ),
    (
        10,
        'Hóa đơn',
        2,
        NOW(),
        NOW()
    ),
    (10, 'Nhà ở', 2, NOW(), NOW()),
    (
        10,
        'Bảo hiểm',
        2,
        NOW(),
        NOW()
    ),
    (10, 'Đầu tư', 2, NOW(), NOW());

COMMIT;

-- ============================================================================
-- STEP 3: CREATE DEMO WALLETS
-- ============================================================================

BEGIN;

INSERT INTO
    wallet (
        user_id,
        wallet_name,
        balance,
        currency,
        type,
        created_at,
        updated_at
    )
VALUES (
        10,
        'Tiền mặt',
        500000,
        'VND',
        0,
        NOW(),
        NOW()
    ), -- 5,000 VND
    (
        10,
        'Techcombank',
        5000000,
        'VND',
        0,
        NOW(),
        NOW()
    ), -- 50,000 VND
    (
        10,
        'Vietcombank',
        3000000,
        'VND',
        0,
        NOW(),
        NOW()
    ), -- 30,000 VND
    (
        10,
        'Danh mục đầu tư',
        15000000,
        'VND',
        1,
        NOW(),
        NOW()
    );
-- 150,000 VND (INVESTMENT type)

COMMIT;

-- ============================================================================
-- STEP 4: CREATE DEMO TRANSACTIONS
-- ============================================================================

BEGIN;

-- Generate 12 months of transactions in 2026 (Jan 2026 - Dec 2026)
-- This creates a realistic pattern of income and expenses


WITH wallet_ids AS (
    SELECT id, wallet_name FROM wallet WHERE user_id = 10
),
category_ids AS (
    SELECT id, name FROM category WHERE user_id = 10
),
-- Base date: Start of 2026 (January 1, 2026)
base_date AS (
    SELECT DATE '2026-01-01' as start_date
),
-- Generate monthly salaries for 12 months (Jan - Dec 2026)
monthly_salaries AS (
    SELECT
        generate_series(0, 11) as month_offset,
        2000000 as amount,
        'Lương tháng ' || TO_CHAR((SELECT start_date FROM base_date) + (generate_series(0, 11) || ' months')::INTERVAL, 'MM/YYYY') as note
),
-- Generate monthly bills for 12 months (Jan - Dec 2026)
monthly_bills AS (
    SELECT * FROM (VALUES
        (0, -100000, 'Tiền điện tháng 1'),   -- Jan
        (0, -80000, 'Tiền nước tháng 1'),
        (0, -50000, 'Internet tháng 1'),
        (1, -95000, 'Tiền điện tháng 2'),    -- Feb
        (1, -75000, 'Tiền nước tháng 2'),
        (1, -50000, 'Internet tháng 2'),
        (2, -105000, 'Tiền điện tháng 3'),   -- Mar
        (2, -80000, 'Tiền nước tháng 3'),
        (2, -50000, 'Internet tháng 3'),
        (3, -98000, 'Tiền điện tháng 4'),    -- Apr
        (3, -78000, 'Tiền nước tháng 4'),
        (3, -50000, 'Internet tháng 4'),
        (4, -110000, 'Tiền điện tháng 5'),   -- May
        (4, -82000, 'Tiền nước tháng 5'),
        (4, -50000, 'Internet tháng 5'),
        (5, -95000, 'Tiền điện tháng 6'),    -- Jun
        (5, -75000, 'Tiền nước tháng 6'),
        (5, -50000, 'Internet tháng 6'),
        (6, -100000, 'Tiền điện tháng 7'),   -- Jul
        (6, -80000, 'Tiền nước tháng 7'),
        (6, -50000, 'Internet tháng 7'),
        (7, -105000, 'Tiền điện tháng 8'),   -- Aug
        (7, -82000, 'Tiền nước tháng 8'),
        (7, -50000, 'Internet tháng 8'),
        (8, -98000, 'Tiền điện tháng 9'),    -- Sep
        (8, -78000, 'Tiền nước tháng 9'),
        (8, -50000, 'Internet tháng 9'),
        (9, -102000, 'Tiền điện tháng 10'),  -- Oct
        (9, -80000, 'Tiền nước tháng 10'),
        (9, -50000, 'Internet tháng 10'),
        (10, -95000, 'Tiền điện tháng 11'),  -- Nov
        (10, -75000, 'Tiền nước tháng 11'),
        (10, -50000, 'Internet tháng 11'),
        (11, -100000, 'Tiền điện tháng 12'), -- Dec
        (11, -80000, 'Tiền nước tháng 12'),
        (11, -50000, 'Internet tháng 12')
    ) as t(month_offset, amount, note)
)
INSERT INTO transaction (wallet_id, category_id, amount, currency, date, note, created_at, updated_at)
SELECT
    w.id,
    c.id,
    t.amount,
    'VND',
    t.transaction_date,
    t.note,
    NOW(),
    NOW()
FROM wallet_ids w
CROSS JOIN category_ids c
CROSS JOIN base_date bd
CROSS JOIN (
    -- Monthly Salaries (12 months: Jan - Dec 2026)
    SELECT 'Techcombank' as wallet_name, 'Lương' as category_name, ms.amount, ms.note,
           (SELECT start_date FROM base_date) + (ms.month_offset || ' months')::INTERVAL + INTERVAL '5 days' as transaction_date
    FROM monthly_salaries ms

    UNION ALL

-- Monthly Bills (12 months: Jan - Dec 2026)
SELECT 'Techcombank', 'Hóa đơn', mb.amount, mb.note, (
        SELECT start_date
        FROM base_date
    ) + (mb.month_offset || ' months')::INTERVAL + INTERVAL '10 days'
FROM monthly_bills mb
UNION ALL

-- Monthly Rent (12 months: Jan - Dec 2026)
SELECT 'Techcombank', 'Nhà ở', -500000, 'Tiền nhà tháng ' || (month_num + 1)::text, (
        SELECT start_date
        FROM base_date
    ) + (month_num || ' months')::INTERVAL + INTERVAL '1 day'
FROM generate_series(0, 11) month_num
UNION ALL

-- Monthly Subscriptions Netflix (12 months)
SELECT 'Techcombank', 'Giải trí', -100000, 'Netflix tháng ' || (month_num + 1)::text, (
        SELECT start_date
        FROM base_date
    ) + (month_num || ' months')::INTERVAL + INTERVAL '12 days'
FROM generate_series(0, 11) month_num
UNION ALL

-- Monthly Subscriptions Spotify (12 months)
SELECT 'Techcombank', 'Giải trí', -80000, 'Spotify tháng ' || (month_num + 1)::text, (
        SELECT start_date
        FROM base_date
    ) + (month_num || ' months')::INTERVAL + INTERVAL '18 days'
FROM generate_series(0, 11) month_num
UNION ALL

-- Freelance income (quarterly - Q1, Q2, Q3, Q4 2026)
SELECT 'Vietcombank', 'Freelance', 1000000, 'Dự án freelance Q' || (quarter_num + 1)::text || '/2026', (
        SELECT start_date
        FROM base_date
    ) + (quarter_num * 3 || ' months')::INTERVAL + INTERVAL '15 days'
FROM generate_series(0, 3) quarter_num
UNION ALL

-- Investment dividends (quarterly 2026)
SELECT 'Vietcombank', 'Thu nhập đầu tư', 30000, 'Cổ tức Q' || (quarter_num + 1)::text || '/2026', (
        SELECT start_date
        FROM base_date
    ) + (quarter_num * 3 || ' months')::INTERVAL + INTERVAL '20 days'
FROM generate_series(0, 3) quarter_num
UNION ALL

-- Weekly food expenses - Coffee (260 transactions: 5 days/week for 52 weeks)
SELECT 'Tiền mặt', 'Ăn uống', -5000, 'Cà phê sáng', (
        SELECT start_date
        FROM base_date
    ) + (
        week_num * 7 + day_num || ' days'
    )::INTERVAL
FROM generate_series(0, 51) week_num, generate_series(0, 4) day_num
UNION ALL

-- Weekly food expenses - Lunch (260 transactions)
SELECT 'Tiền mặt', 'Ăn uống', -15000, 'Ăn trưa', (
        SELECT start_date
        FROM base_date
    ) + (
        week_num * 7 + day_num || ' days'
    )::INTERVAL + INTERVAL '5 hours'
FROM generate_series(0, 51) week_num, generate_series(0, 4) day_num
UNION ALL

-- Weekly food expenses - Dinner (130 transactions: every other week)
SELECT 'Tiền mặt', 'Ăn uống', -20000, 'Ăn tối', (
        SELECT start_date
        FROM base_date
    ) + (
        week_num * 7 + day_num || ' days'
    )::INTERVAL + INTERVAL '12 hours'
FROM generate_series(0, 51) week_num, generate_series(0, 4) day_num
WHERE
    week_num % 2 = 0
UNION ALL

-- Weekly transport (156 transactions: 3x per week for 52 weeks)
SELECT 'Tiền mặt', 'Di chuyển', -3000, 'Grab', (
        SELECT start_date
        FROM base_date
    ) + (
        week_num * 7 + day_num || ' days'
    )::INTERVAL + INTERVAL '8 hours'
FROM generate_series(0, 51) week_num, generate_series(0, 2) day_num
UNION ALL

-- Monthly shopping Shopee (12 months)
SELECT 'Techcombank', 'Mua sắm', -200000, 'Shopee tháng ' || (month_num + 1)::text, (
        SELECT start_date
        FROM base_date
    ) + (month_num || ' months')::INTERVAL + INTERVAL '8 days'
FROM generate_series(0, 11) month_num
UNION ALL

-- Monthly shopping Lazada (12 months)
SELECT 'Techcombank', 'Mua sắm', -150000, 'Lazada tháng ' || (month_num + 1)::text, (
        SELECT start_date
        FROM base_date
    ) + (month_num || ' months')::INTERVAL + INTERVAL '16 days'
FROM generate_series(0, 11) month_num
UNION ALL

-- Monthly entertainment - Movies (12 months)
SELECT 'Tiền mặt', 'Giải trí', -25000, 'Xem phim', (
        SELECT start_date
        FROM base_date
    ) + (month_num || ' months')::INTERVAL + INTERVAL '12 days'
FROM generate_series(0, 11) month_num
UNION ALL

-- Bi-monthly entertainment - Karaoke (6 times in 2026)
SELECT 'Tiền mặt', 'Giải trí', -30000, 'Karaoke', (
        SELECT start_date
        FROM base_date
    ) + (month_num || ' months')::INTERVAL + INTERVAL '25 days'
FROM generate_series(0, 11) month_num
WHERE
    month_num % 2 = 0
UNION ALL

-- Healthcare quarterly checkups (Q1, Q2, Q3, Q4 2026)
SELECT 'Vietcombank', 'Y tế', -200000, 'Khám sức khỏe Q' || (quarter_num + 1)::text || '/2026', (
        SELECT start_date
        FROM base_date
    ) + (quarter_num * 3 || ' months')::INTERVAL + INTERVAL '30 days'
FROM generate_series(0, 3) quarter_num
UNION ALL

-- Medicine purchases (every 3 months: Jan, Apr, Jul, Oct)
SELECT 'Tiền mặt', 'Y tế', -50000, 'Mua thuốc', (
        SELECT start_date
        FROM base_date
    ) + (month_num || ' months')::INTERVAL + INTERVAL '20 days'
FROM generate_series(0, 11) month_num
WHERE
    month_num % 3 = 0
UNION ALL

-- Education courses (Jan and Jul 2026)
SELECT 'Vietcombank', 'Giáo dục', -500000, 'Khóa học online', (
        SELECT start_date
        FROM base_date
    ) + (semester * 6 || ' months')::INTERVAL + INTERVAL '15 days'
FROM generate_series(0, 1) semester
UNION ALL

-- Insurance (Jan 2026)
SELECT 'Vietcombank', 'Bảo hiểm', -300000, 'Bảo hiểm y tế năm 2026', (
        SELECT start_date
        FROM base_date
    ) + INTERVAL '20 days'
UNION ALL

-- Large purchases spread across 2026
SELECT 'Vietcombank', 'Mua sắm', -300000, 'Mua điện thoại', DATE '2026-03-15'
UNION ALL
SELECT 'Vietcombank', 'Mua sắm', -400000, 'Mua laptop', DATE '2026-09-10'
UNION ALL
SELECT 'Techcombank', 'Mua sắm', -250000, 'Mua giày', DATE '2026-06-20'
UNION ALL

-- Investment purchases throughout 2026


SELECT 'Vietcombank', 'Đầu tư', -500000, 'Mua cổ phiếu VCB', DATE '2026-01-25'

    UNION ALL

    SELECT 'Vietcombank', 'Đầu tư', -450000, 'Mua cổ phiếu VNM', DATE '2026-02-05'

    UNION ALL

    SELECT 'Vietcombank', 'Đầu tư', -600000, 'Mua Bitcoin', DATE '2026-05-10'

    UNION ALL

    SELECT 'Vietcombank', 'Đầu tư', -820000, 'Mua vàng SJC', DATE '2026-08-15'
) t(wallet_name, category_name, amount, note, transaction_date)
WHERE w.wallet_name = t.wallet_name AND c.name = t.category_name;

COMMIT;

-- ============================================================================
-- STEP 5: CREATE DEMO BUDGETS
-- ============================================================================

BEGIN;

-- Create budget for February 2026
WITH
    new_budget AS (
        INSERT INTO
            budget (
                user_id,
                name,
                total,
                currency,
                created_at,
                updated_at
            )
        VALUES (
                10,
                'Ngân sách tháng 2/2026',
                3000000,
                'VND',
                NOW(),
                NOW()
            )
        RETURNING
            id
    )
INSERT INTO
    budget_item (
        budget_id,
        name,
        total,
        currency,
        checked,
        created_at,
        updated_at
    )
SELECT b.id, t.name, t.amount, 'VND', t.is_checked, NOW(), NOW()
FROM new_budget b
    CROSS JOIN (
        VALUES ('Ăn uống', 800000, true), ('Di chuyển', 300000, true), ('Mua sắm', 500000, false), ('Giải trí', 200000, false), ('Hóa đơn', 400000, true), ('Y tế', 300000, false), ('Nhà ở', 500000, false)
    ) t (name, amount, is_checked);

COMMIT;

-- ============================================================================
-- STEP 6: CREATE DEMO INVESTMENTS
-- ============================================================================

BEGIN;

-- Get the investment wallet ID
WITH investment_wallet AS (
    SELECT id FROM wallet WHERE user_id = 10 AND wallet_name = 'Danh mục đầu tư'
)
INSERT INTO investment (wallet_id, symbol, name, type, quantity, average_cost, total_cost, currency, is_custom, current_price, created_at, updated_at)
SELECT
    w.id,
    t.symbol,
    t.name,
    t.type,
    t.quantity,
    t.average_cost,
    t.total_cost,
    t.currency,
    t.is_custom,
    t.current_price,
    NOW(),
    NOW()
FROM investment_wallet w
CROSS JOIN (VALUES
-- Gold (VND)
    ('SJL1L10', 'Vàng SJC 1L-10L', 8, 750000, 2194667, 164600000, 'VND', false, 4842667),

-- Stock VN
(
    'VCB.VN',
    'JS COMM BANK FOREIGN TRADE VIET',
    2,
    1000000,
    60000,
    6000000,
    'VND',
    false,
    66100
),
(
    'VNM.VN',
    'VIETNAM DAIRY PRODUCTS JSC',
    2,
    1000000,
    40000,
    4000000,
    'VND',
    false,
    70000
),

-- Crypto USD
(
    'BTC-USD',
    'Bitcoin USD',
    1,
    1000000,
    5000000,
    50000,
    'USD',
    false,
    6578512
),

-- Fund
('FUEDCMID.VN', 'DRAGON CAPITAL VIETNAM FUND MGM', 3, 10000000, 13000, 13000000, 'VND', false, 14250)
) t(symbol, name, type, quantity, average_cost, total_cost, currency, is_custom, current_price);

COMMIT;

-- ============================================================================
-- STEP 7: CREATE INVESTMENT TRANSACTIONS AND LOTS
-- ============================================================================

BEGIN;

-- Create a temporary table to store investment IDs for reuse
CREATE TEMP TABLE temp_investment_ids AS
SELECT i.id, i.symbol, w.id as wallet_id
FROM investment i
    JOIN wallet w ON i.wallet_id = w.id
WHERE
    w.user_id = 10
    AND w.wallet_name = 'Danh mục đầu tư';

-- Gold Transaction (VND)
INSERT INTO
    investment_transaction (
        investment_id,
        wallet_id,
        type,
        quantity,
        price,
        cost,
        currency,
        transaction_date,
        remaining_quantity,
        created_at,
        updated_at
    )
SELECT i.id, i.wallet_id, 0, -- BUY
    750000, -- 75 grams
    2194667, -- 21,947 VND/gram
    164600000, -- 1,646,000 VND
    'VND', DATE '2026-08-15', 750000, NOW(), NOW()
FROM temp_investment_ids i
WHERE
    i.symbol = 'SJL1L10';

-- VCB.VN
INSERT INTO
    investment_transaction (
        investment_id,
        wallet_id,
        type,
        quantity,
        price,
        cost,
        currency,
        transaction_date,
        remaining_quantity,
        created_at,
        updated_at
    )
SELECT i.id, i.wallet_id, 1, -- SELL (using type 1 as per actual data)
    1000000, -- 100 shares
    60000, -- 600 VND/share
    6000000, -- 60,000 VND
    'USD', DATE '2026-01-15', 1000000, NOW(), NOW()
FROM temp_investment_ids i
WHERE
    i.symbol = 'VCB.VN';

-- VNM.VN
INSERT INTO
    investment_transaction (
        investment_id,
        wallet_id,
        type,
        quantity,
        price,
        cost,
        currency,
        transaction_date,
        remaining_quantity,
        created_at,
        updated_at
    )
SELECT i.id, i.wallet_id, 1, -- SELL
    1000000, -- 100 shares
    40000, -- 400 VND/share
    4000000, -- 40,000 VND
    'USD', DATE '2026-01-18', 1000000, NOW(), NOW()
FROM temp_investment_ids i
WHERE
    i.symbol = 'VNM.VN';

-- BTC-USD Transactions
INSERT INTO
    investment_transaction (
        investment_id,
        wallet_id,
        type,
        quantity,
        price,
        cost,
        currency,
        transaction_date,
        remaining_quantity,
        created_at,
        updated_at
    )
WITH
    btc_usd_investments AS (
        SELECT id, wallet_id, ROW_NUMBER() OVER (
                ORDER BY id
            ) as rn
        FROM temp_investment_ids
        WHERE
            symbol = 'BTC-USD'
    )
SELECT
    id,
    wallet_id,
    1, -- SELL
    CASE
        WHEN rn = 1 THEN 100
        ELSE 1000000
    END,
    CASE
        WHEN rn = 1 THEN 4999700
        ELSE 5000000
    END,
    CASE
        WHEN rn = 1 THEN 49997
        ELSE 50000
    END,
    'USD',
    CASE
        WHEN rn = 1 THEN DATE '2026-02-01'
        ELSE DATE '2026-02-05'
    END,
    CASE
        WHEN rn = 1 THEN 100
        ELSE 1000000
    END,
    NOW(),
    NOW()
FROM btc_usd_investments;

-- FUEDCMID.VN Fund Transaction
INSERT INTO
    investment_transaction (
        investment_id,
        wallet_id,
        type,
        quantity,
        price,
        cost,
        currency,
        transaction_date,
        remaining_quantity,
        created_at,
        updated_at
    )
SELECT i.id, i.wallet_id, 1, -- SELL
    10000000, -- 1000 units
    13000, -- 130 VND/unit
    13000000, -- 130,000 VND
    'USD', DATE '2026-03-10', 10000000, NOW(), NOW()
FROM temp_investment_ids i
WHERE
    i.symbol = 'FUEDCMID.VN';

-- Create investment lots (FIFO tracking) - 2026 dates
-- Gold Lot (VND)
INSERT INTO
    investment_lot (
        investment_id,
        quantity,
        average_cost,
        purchased_at,
        remaining_quantity,
        total_cost,
        currency,
        created_at,
        updated_at
    )
SELECT i.id, 750000, -- 75 grams
    2194667, DATE '2026-08-15', 750000, 164600000, 'VND', NOW(), NOW()
FROM temp_investment_ids i
WHERE
    i.symbol = 'SJL1L10';

-- VCB.VN
INSERT INTO
    investment_lot (
        investment_id,
        quantity,
        average_cost,
        purchased_at,
        remaining_quantity,
        total_cost,
        currency,
        created_at,
        updated_at
    )
SELECT i.id, 1000000, -- 100 shares
    60000, DATE '2026-01-15', 1000000, 6000000, 'USD', NOW(), NOW()
FROM temp_investment_ids i
WHERE
    i.symbol = 'VCB.VN';

-- VNM.VN
INSERT INTO
    investment_lot (
        investment_id,
        quantity,
        average_cost,
        purchased_at,
        remaining_quantity,
        total_cost,
        currency,
        created_at,
        updated_at
    )
SELECT i.id, 1000000, -- 100 shares
    40000, DATE '2026-01-18', 1000000, 4000000, 'USD', NOW(), NOW()
FROM temp_investment_ids i
WHERE
    i.symbol = 'VNM.VN';

-- BTC-USD Lots (2 separate investments)
INSERT INTO
    investment_lot (
        investment_id,
        quantity,
        average_cost,
        purchased_at,
        remaining_quantity,
        total_cost,
        currency,
        created_at,
        updated_at
    )
WITH
    btc_usd_investments AS (
        SELECT id, ROW_NUMBER() OVER (
                ORDER BY id
            ) as rn
        FROM temp_investment_ids
        WHERE
            symbol = 'BTC-USD'
    )
SELECT
    id,
    CASE
        WHEN rn = 1 THEN 100
        ELSE 1000000
    END,
    CASE
        WHEN rn = 1 THEN 4999700
        ELSE 5000000
    END,
    CASE
        WHEN rn = 1 THEN DATE '2026-02-01'
        ELSE DATE '2026-02-05'
    END,
    CASE
        WHEN rn = 1 THEN 100
        ELSE 1000000
    END,
    CASE
        WHEN rn = 1 THEN 49997
        ELSE 50000
    END,
    'USD',
    NOW(),
    NOW()
FROM btc_usd_investments;

-- FUEDCMID.VN Fund Lot
INSERT INTO
    investment_lot (
        investment_id,
        quantity,
        average_cost,
        purchased_at,
        remaining_quantity,
        total_cost,
        currency,
        created_at,
        updated_at
    )
SELECT i.id, 10000000, 13000, DATE '2026-03-10', 10000000, 13000000, 'USD', NOW(), NOW()
FROM temp_investment_ids i
WHERE
    i.symbol = 'FUEDCMID.VN';

-- Clean up temp table
DROP TABLE temp_investment_ids;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check created data
SELECT 'Categories' as table_name, COUNT(*) as count
FROM category
WHERE
    user_id = 10
UNION ALL
SELECT 'Wallets', COUNT(*)
FROM wallet
WHERE
    user_id = 10
UNION ALL
SELECT 'Transactions', COUNT(*)
FROM transaction
WHERE
    wallet_id IN (
        SELECT id
        FROM wallet
        WHERE
            user_id = 10
    )
UNION ALL
SELECT 'Budgets', COUNT(*)
FROM budget
WHERE
    user_id = 10
UNION ALL
SELECT 'Budget Items', COUNT(*)
FROM budget_item
WHERE
    budget_id IN (
        SELECT id
        FROM budget
        WHERE
            user_id = 10
    )
UNION ALL
SELECT 'Investments', COUNT(*)
FROM investment
WHERE
    wallet_id IN (
        SELECT id
        FROM wallet
        WHERE
            user_id = 10
    )
UNION ALL
SELECT 'Investment Transactions', COUNT(*)
FROM investment_transaction
WHERE
    wallet_id IN (
        SELECT id
        FROM wallet
        WHERE
            user_id = 10
    )
UNION ALL
SELECT 'Investment Lots', COUNT(*)
FROM investment_lot
WHERE
    investment_id IN (
        SELECT id
        FROM investment
        WHERE
            wallet_id IN (
                SELECT id
                FROM wallet
                WHERE
                    user_id = 10
            )
    );

-- Summary of wallets and balances
SELECT
    wallet_name,
    balance / 100.0 as balance_vnd,
    CASE type
        WHEN 0 THEN 'BASIC'
        WHEN 1 THEN 'INVESTMENT'
    END as wallet_type
FROM wallet
WHERE
    user_id = 10
ORDER BY id;

-- Summary of investments
SELECT
    i.symbol,
    i.name,
    i.quantity / 10000.0 as quantity,
    i.average_cost / 100.0 as avg_cost_vnd,
    i.total_cost / 100.0 as total_cost_vnd,
    CASE i.type
        WHEN 0 THEN 'STOCK'
        WHEN 1 THEN 'ETF'
        WHEN 3 THEN 'CRYPTO'
        WHEN 8 THEN 'GOLD_VND'
    END as investment_type
FROM investment i
    JOIN wallet w ON i.wallet_id = w.id
WHERE
    w.user_id = 10
ORDER BY i.id;