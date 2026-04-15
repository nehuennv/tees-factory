-- Adminer 5.4.2 PostgreSQL 17.9 dump

DROP TABLE IF EXISTS "account_ledger";
CREATE TABLE "public"."account_ledger" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "client_id" uuid,
    "reference_order_id" uuid,
    "reference_payment_id" uuid,
    "transaction_type" character varying(30) NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "balance_after_transaction" numeric(15,2),
    "created_at" timestamp DEFAULT now(),
    CONSTRAINT "account_ledger_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "account_ledger_transaction_type_check" CHECK (((transaction_type)::text = ANY ((ARRAY['DEBT_INCREASE'::character varying, 'DEBT_DECREASE'::character varying])::text[])))
)
WITH (oids = false);

CREATE INDEX idx_account_ledger_client_id ON public.account_ledger USING btree (client_id);

INSERT INTO "account_ledger" ("id", "client_id", "reference_order_id", "reference_payment_id", "transaction_type", "amount", "balance_after_transaction", "created_at") VALUES
('f508a4f9-bed7-4612-be57-e3f52a96417d',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	'c2f1a67d-a7f6-4206-bc34-f5a41ad46625',	NULL,	'DEBT_INCREASE',	8550.00,	8550.00,	'2026-04-10 18:18:21.536963'),
('7932749c-6525-4a49-9fea-b227473346b2',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	NULL,	'71055a28-8bb0-47b6-bd05-97464c293cba',	'DEBT_DECREASE',	50000.00,	0.00,	'2026-04-10 18:18:23.296722'),
('86bc40b3-cfb4-4999-abb4-3a1ce71c4e20',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	'8579e1eb-903f-4cab-a2d7-1ae2c6e5312c',	NULL,	'DEBT_INCREASE',	8550.00,	8550.00,	'2026-04-10 19:40:31.583464'),
('a79dd08c-cf58-4a99-af58-6838ef824329',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	NULL,	'9d78f456-3b84-4fa9-a378-ee46017bb222',	'DEBT_DECREASE',	50000.00,	0.00,	'2026-04-10 19:40:32.57342'),
('c97035d8-6c03-4f4d-bafa-ac58e4bed8bd',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	'2b5de7cf-2a4c-422a-ae81-6eb1072e5c4f',	NULL,	'DEBT_INCREASE',	220500.00,	220500.00,	'2026-04-10 22:14:16.250096'),
('94c35a32-515d-4e9b-b4fc-d92f29fff0d2',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	'87c4e0de-647e-4dd6-8e1c-a3671c82ac0f',	NULL,	'DEBT_INCREASE',	3000.00,	223500.00,	'2026-04-15 03:24:49.675897'),
('b95231f2-cd34-4e20-af9e-e2fef2af38f4',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	NULL,	'55b7c84e-bec4-4252-8124-cf8ccb973995',	'DEBT_DECREASE',	220000.00,	3500.00,	'2026-04-15 07:24:30.900045'),
('428a7489-434c-4c0f-a99d-eeabb624cbab',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	NULL,	'35b3286c-09ea-4270-a3f8-c02ac5eb3c31',	'DEBT_DECREASE',	15000.00,	0.00,	'2026-04-15 07:31:49.810856'),
('dc5ae87b-1ce1-4f29-bd38-e1cac1f651a8',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	NULL,	'0baa2f17-fcc0-4889-b0fc-bfb3298d709e',	'DEBT_DECREASE',	12000.00,	0.00,	'2026-04-15 07:52:55.15119'),
('3f4397f1-6f2a-4c62-bd98-05f364de9850',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	NULL,	'57197eab-a1ce-4553-8819-547a5bbc4816',	'DEBT_DECREASE',	10000.00,	0.00,	'2026-04-15 07:59:29.250143'),
('8be3f2e4-c3ed-45eb-b37f-1c07ba983ff4',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	NULL,	'7d7558b5-e211-4cbd-ac95-02f82f6cd088',	'DEBT_DECREASE',	202620.00,	0.00,	'2026-04-15 08:08:29.04073'),
('56730a2e-ebe3-4f2c-a645-fe164dff1e21',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	NULL,	'460f973b-fab2-49c3-8c13-f920ecd0609b',	'DEBT_DECREASE',	50000.00,	0.00,	'2026-04-15 17:07:03.726998'),
('52258e24-d457-4707-850b-1a5e328f1147',	'a119b4c7-412c-46a2-9cb4-fe7064a3b49b',	'9709dc76-e017-4c50-a9b5-15536eb631f6',	NULL,	'DEBT_INCREASE',	1200.00,	1200.00,	'2026-04-15 18:06:12.056236'),
('61b0c3f8-e33e-44c0-bec2-434ad5e98f9d',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	'a1f95c97-cf8b-4d43-9e3e-647322880753',	NULL,	'DEBT_INCREASE',	2000.00,	2000.00,	'2026-04-15 18:31:18.577586');

DROP TABLE IF EXISTS "clients";
CREATE TABLE "public"."clients" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "user_id" uuid,
    "company_name" character varying(255),
    "tax_id" character varying(50),
    "phone" character varying(50),
    "billing_address" text,
    "shipping_address" text,
    "current_debt" numeric(15,2) DEFAULT '0',
    "is_active" boolean DEFAULT true,
    "seller_id" uuid,
    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX clients_user_id_key ON public.clients USING btree (user_id);

CREATE INDEX idx_clients_seller_id ON public.clients USING btree (seller_id);

CREATE INDEX idx_clients_user_id ON public.clients USING btree (user_id);

INSERT INTO "clients" ("id", "user_id", "company_name", "tax_id", "phone", "billing_address", "shipping_address", "current_debt", "is_active", "seller_id") VALUES
('dd8970e2-6cfc-4d02-a660-b139d07453bb',	'5c4b0fb6-15e8-4b13-9131-f347b0ca366b',	'Confecciones Norte SRL',	'30-98765432-1',	'+5491166778899',	NULL,	NULL,	150000.00,	'1',	'd383396a-f413-42cd-8371-32829fa68664'),
('6d6c2ac5-6624-425a-85db-c09a698b8eb3',	'7e251aff-d4d1-4b55-b34d-1cab0a0b85f6',	'Walter Tognola',	'23248675349',	'1157517954',	NULL,	NULL,	0.00,	'1',	NULL),
('8a7c6bd4-b60c-46ee-b33b-7e301f571e7e',	'2f45990c-8529-43e1-b709-f94ff6db4bd0',	'Facundo Cano',	'29490717',	'+541134156422',	NULL,	NULL,	0.00,	'1',	'd383396a-f413-42cd-8371-32829fa68664'),
('38da814f-3949-4dc2-a138-b710a229b7b7',	'fe924867-58c1-4f2f-b5a5-3765f67ea4a7',	'Facundo Cano',	'29490717',	'+541134156422',	NULL,	NULL,	0.00,	'1',	'd383396a-f413-42cd-8371-32829fa68664'),
('23dacb83-9046-48c3-9542-c329160aed29',	'2e646067-df90-49b3-a318-c20c5656fb48',	'Martin Alonso',	'23417682244',	NULL,	NULL,	NULL,	0.00,	'1',	'd383396a-f413-42cd-8371-32829fa68664'),
('55f5e986-f247-452b-b04a-156e0102b114',	'169d1934-87e0-443a-bbdc-65fb79bf27ca',	'BROTHER INTERNATIONAL S.R.L.',	'30-70804923-5',	NULL,	NULL,	NULL,	0.00,	'1',	NULL),
('5658b37f-c0fa-48d9-89a9-9d25056fc8b5',	'7374a523-7e3c-473e-a195-3d7f8f86e77d',	'Facundo Cano',	'20294907174',	'',	NULL,	NULL,	0.00,	'1',	'd383396a-f413-42cd-8371-32829fa68664'),
('a119b4c7-412c-46a2-9cb4-fe7064a3b49b',	'80614ee1-1198-4b3b-9c63-f14f9a0198e5',	'Alejandro Ortuño',	'30878273',	'+5491166648355',	NULL,	NULL,	1200.00,	'1',	'd383396a-f413-42cd-8371-32829fa68664'),
('d16d3013-9b2a-41a4-8a77-439031d52cdc',	'213edbbb-8686-4577-a78b-a7bd192919be',	'Textiles del Sur SA',	'30-71234567-9',	'+5491155001122',	NULL,	NULL,	2000.00,	'1',	'd383396a-f413-42cd-8371-32829fa68664');

DROP TABLE IF EXISTS "order_items";
CREATE TABLE "public"."order_items" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "order_id" uuid,
    "variant_id" uuid,
    "quantity" integer NOT NULL,
    "unit_price" numeric(15,2),
    "row_subtotal" numeric(15,2),
    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);

INSERT INTO "order_items" ("id", "order_id", "variant_id", "quantity", "unit_price", "row_subtotal") VALUES
('7637593a-e194-472e-807b-6f568282e797',	'c2f1a67d-a7f6-4206-bc34-f5a41ad46625',	'7a47562e-b675-47e9-b436-73b23f5146cb',	2,	4500.00,	9000.00),
('d77d7697-695e-4406-b8f9-f9fc9c1c073a',	'8579e1eb-903f-4cab-a2d7-1ae2c6e5312c',	'7a47562e-b675-47e9-b436-73b23f5146cb',	2,	4500.00,	9000.00),
('c98b3b0c-4de4-4e3e-8a4c-9063b86c2255',	'2b5de7cf-2a4c-422a-ae81-6eb1072e5c4f',	'7a47562e-b675-47e9-b436-73b23f5146cb',	23,	4500.00,	103500.00),
('af1cfc19-2155-4734-a668-6393240d1b55',	'2b5de7cf-2a4c-422a-ae81-6eb1072e5c4f',	'72feb926-7ff7-49b2-becb-e858a50d0c55',	3,	4500.00,	13500.00),
('a05cefe4-6484-450d-89ad-f4f46d8af9ff',	'2b5de7cf-2a4c-422a-ae81-6eb1072e5c4f',	'd3fa3731-e3e8-404f-bf9c-4288622c7227',	23,	4500.00,	103500.00),
('b11971f6-bac5-4856-94b4-3d7b71001d72',	'87c4e0de-647e-4dd6-8e1c-a3671c82ac0f',	'3c5f035d-7055-4153-8ea8-33278f6e2a32',	10,	100.00,	1000.00),
('b2162dd9-59ab-4610-a872-3395ea6aedc5',	'87c4e0de-647e-4dd6-8e1c-a3671c82ac0f',	'c1792d7d-133d-4147-a9a8-b12dade1874b',	20,	100.00,	2000.00),
('fa9f326f-4de3-448c-abf0-89ceee5d37fd',	'9709dc76-e017-4c50-a9b5-15536eb631f6',	'818f2671-a811-414a-bd70-4066677e949d',	12,	100.00,	1200.00),
('3e8dfac2-762e-4d84-ae59-df2673d438dd',	'a1f95c97-cf8b-4d43-9e3e-647322880753',	'03ac8f7d-87eb-4d4e-9d73-45741aefd4f3',	20,	100.00,	2000.00);

DROP TABLE IF EXISTS "orders";
CREATE TABLE "public"."orders" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "client_id" uuid,
    "created_by_seller_id" uuid,
    "subtotal" numeric(15,2),
    "discount_percentage" numeric(5,2) DEFAULT '0',
    "total_amount" numeric(15,2),
    "status" character varying(30) DEFAULT 'PENDING' NOT NULL,
    "is_locked_by_payment" boolean DEFAULT false,
    "snapshot_shipping_address" text,
    "observations" text,
    "created_at" timestamp DEFAULT now(),
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "orders_status_check" CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PICKING'::character varying, 'SHIPPED'::character varying, 'DELIVERED'::character varying, 'CANCELLED'::character varying])::text[])))
)
WITH (oids = false);

CREATE INDEX idx_orders_client_id ON public.orders USING btree (client_id);

CREATE INDEX idx_orders_status ON public.orders USING btree (status);

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at);

INSERT INTO "orders" ("id", "client_id", "created_by_seller_id", "subtotal", "discount_percentage", "total_amount", "status", "is_locked_by_payment", "snapshot_shipping_address", "observations", "created_at") VALUES
('c2f1a67d-a7f6-4206-bc34-f5a41ad46625',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	NULL,	9000.00,	5.00,	8550.00,	'SHIPPED',	'0',	NULL,	'Pedido de prueba E2E',	'2026-04-10 18:18:21.536963'),
('8579e1eb-903f-4cab-a2d7-1ae2c6e5312c',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	NULL,	9000.00,	5.00,	8550.00,	'PENDING',	'0',	NULL,	'Pedido de prueba E2E',	'2026-04-10 19:40:31.583464'),
('87c4e0de-647e-4dd6-8e1c-a3671c82ac0f',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	NULL,	3000.00,	0.00,	3000.00,	'DELIVERED',	'0',	NULL,	NULL,	'2026-04-15 03:24:49.675897'),
('2b5de7cf-2a4c-422a-ae81-6eb1072e5c4f',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	NULL,	220500.00,	0.00,	220500.00,	'SHIPPED',	'0',	NULL,	NULL,	'2026-04-10 22:14:16.250096'),
('7986d9af-53b1-42ec-9176-ec592749bfd6',	NULL,	NULL,	75000.00,	0.00,	75000.00,	'PENDING',	'0',	NULL,	'[EXPRÉS - Cliente Walk-in] 5 remeras negras M',	'2026-04-15 17:07:03.367115'),
('9709dc76-e017-4c50-a9b5-15536eb631f6',	'a119b4c7-412c-46a2-9cb4-fe7064a3b49b',	NULL,	1200.00,	0.00,	1200.00,	'PENDING',	'0',	NULL,	NULL,	'2026-04-15 18:06:12.056236'),
('a1f95c97-cf8b-4d43-9e3e-647322880753',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	NULL,	2000.00,	0.00,	2000.00,	'PENDING',	'0',	NULL,	'Entrega: transporte. ',	'2026-04-15 18:31:18.577586');

DROP TABLE IF EXISTS "payments";
CREATE TABLE "public"."payments" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "client_id" uuid,
    "amount_reported" numeric(15,2),
    "payment_method" character varying(50),
    "bank_name" character varying(100),
    "operation_reference" character varying(100),
    "receipt_file_url" character varying(500),
    "payment_date" date,
    "status" character varying(30) DEFAULT 'PENDING_REVIEW' NOT NULL,
    "reported_at" timestamp DEFAULT now(),
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payments_status_check" CHECK (((status)::text = ANY ((ARRAY['PENDING_REVIEW'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))
)
WITH (oids = false);

CREATE INDEX idx_payments_client_id ON public.payments USING btree (client_id);

CREATE INDEX idx_payments_status ON public.payments USING btree (status);

INSERT INTO "payments" ("id", "client_id", "amount_reported", "payment_method", "bank_name", "operation_reference", "receipt_file_url", "payment_date", "status", "reported_at") VALUES
('71055a28-8bb0-47b6-bd05-97464c293cba',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	50000.00,	'Transferencia',	NULL,	'OP-123456',	NULL,	'2026-04-10',	'APPROVED',	'2026-04-10 18:18:22.874977'),
('a53e519e-8beb-465b-96fe-3b6500f08f01',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	10000.00,	'Efectivo',	NULL,	'CASH-001',	NULL,	'2026-04-10',	'REJECTED',	'2026-04-10 18:18:23.72493'),
('9d78f456-3b84-4fa9-a378-ee46017bb222',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	50000.00,	'Transferencia',	NULL,	'OP-123456',	NULL,	'2026-04-10',	'APPROVED',	'2026-04-10 19:40:32.401457'),
('f4682a37-d357-4e67-a715-d1dd2cda3eb1',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	10000.00,	'Efectivo',	NULL,	'CASH-001',	NULL,	'2026-04-10',	'REJECTED',	'2026-04-10 19:40:32.97152'),
('55b7c84e-bec4-4252-8124-cf8ccb973995',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	220000.00,	'transfer',	NULL,	NULL,	'/uploads/receipts/receipt-1776223880565-400840829.png',	'2026-04-15',	'APPROVED',	'2026-04-15 03:31:20.637389'),
('35b3286c-09ea-4270-a3f8-c02ac5eb3c31',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	15000.00,	'transfer',	NULL,	'1234567890',	'/uploads/receipts/receipt-1776237975064-789198684.png',	'2026-04-15',	'APPROVED',	'2026-04-15 07:26:15.148348'),
('0baa2f17-fcc0-4889-b0fc-bfb3298d709e',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	12000.00,	'Transferencia',	NULL,	NULL,	NULL,	'2026-04-15',	'APPROVED',	'2026-04-15 07:49:23.955838'),
('57197eab-a1ce-4553-8819-547a5bbc4816',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	50000.00,	'transfer',	NULL,	NULL,	'/uploads/receipts/receipt-1776238531378-837060628.png',	'2026-04-15',	'APPROVED',	'2026-04-15 07:35:31.455263'),
('7d7558b5-e211-4cbd-ac95-02f82f6cd088',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	202620.00,	'Transferencia',	NULL,	NULL,	NULL,	'2026-04-15',	'APPROVED',	'2026-04-15 08:08:00.100664'),
('460f973b-fab2-49c3-8c13-f920ecd0609b',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	50000.00,	'Transferencia',	NULL,	'OP-123456',	NULL,	'2026-04-15',	'APPROVED',	'2026-04-15 17:07:03.475704'),
('a6b288e8-bc6c-464c-9d15-f89b51cb14c9',	'd16d3013-9b2a-41a4-8a77-439031d52cdc',	10000.00,	'Efectivo',	NULL,	'CASH-001',	NULL,	'2026-04-15',	'REJECTED',	'2026-04-15 17:07:04.123169');

DROP TABLE IF EXISTS "product_qualities";
CREATE TABLE "public"."product_qualities" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "product_id" uuid,
    "quality_name" character varying(255),
    "base_price" numeric(15,2),
    CONSTRAINT "product_qualities_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE INDEX idx_product_qualities_product_id ON public.product_qualities USING btree (product_id);

INSERT INTO "product_qualities" ("id", "product_id", "quality_name", "base_price") VALUES
('7ac1d42f-f2c9-401b-9a63-3692e6e15fde',	'2738a30b-395a-4a00-a2ca-416ecaaaafa4',	'Gabardina Reforzada',	8500.00),
('dbe12d8a-6f1e-4414-9baa-6fafb9c3a44a',	'33f58c77-a758-4f11-8cf0-ecdb71a70245',	'2',	0.00),
('a19e3ee9-fc76-4bc7-ae24-22035070b29c',	'33f58c77-a758-4f11-8cf0-ecdb71a70245',	'3',	0.00),
('25072d66-8ada-415d-98bb-4ca56151f077',	'33f58c77-a758-4f11-8cf0-ecdb71a70245',	'1',	0.00),
('6f9e2fe6-4018-43fb-966b-5200893c7bac',	'b59d3bc9-2661-4910-9c99-b6995fd78013',	'2',	0.00),
('f51b68d2-828a-4506-a7af-d645ca935862',	'b59d3bc9-2661-4910-9c99-b6995fd78013',	'3',	0.00),
('98186723-26e1-4595-9d49-3130952b3f5b',	'b59d3bc9-2661-4910-9c99-b6995fd78013',	'1',	0.00),
('708b40fd-1bb8-4b70-9194-ff726debaac9',	'92c1ee02-9349-41bf-a6e1-b180a751c031',	'2',	0.00),
('7422312d-134b-4661-9156-960008b71f1c',	'92c1ee02-9349-41bf-a6e1-b180a751c031',	'3',	0.00),
('75f55045-c050-4f85-9f3b-e07c776c8511',	'92c1ee02-9349-41bf-a6e1-b180a751c031',	'1',	0.00),
('f67e94cb-4e75-4009-b81c-19fa3f441829',	'2501e339-f7f2-4e14-b035-d0951864cd92',	'Premium 100% Algodón',	100.00),
('ccae9f9e-c5c4-405a-b9ec-75493d47a45f',	'2501e339-f7f2-4e14-b035-d0951864cd92',	'Standard Poliéster',	5.00),
('2f17b9c4-a042-494b-8681-9effc16402de',	'a38bc708-9b71-48a1-af50-d31f09c2b965',	'1',	100.00),
('12176a4d-afbc-4f16-9d72-d700da63db09',	'a38bc708-9b71-48a1-af50-d31f09c2b965',	'2',	200.00),
('d93c098e-3ca6-43ba-ac51-ec5a2b30da88',	'a38bc708-9b71-48a1-af50-d31f09c2b965',	'3',	300.00),
('576ab722-ec4a-4826-9aa3-914129a7efc5',	'a07b7c9a-c099-4f29-a090-753586baa1d2',	'2',	0.00),
('f6e3e2fa-e9e8-41dd-b240-3411716ca4dd',	'a07b7c9a-c099-4f29-a090-753586baa1d2',	'3',	0.00),
('6620db4f-7981-4d1c-b536-cfd5e4d5d65d',	'a07b7c9a-c099-4f29-a090-753586baa1d2',	'1',	0.00);

DROP TABLE IF EXISTS "product_variants";
CREATE TABLE "public"."product_variants" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "quality_id" uuid,
    "color_name" character varying(100),
    "size_name" character varying(50),
    "sku" character varying(100),
    "physical_stock" integer DEFAULT '0',
    "reserved_stock" integer DEFAULT '0',
    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX product_variants_sku_key ON public.product_variants USING btree (sku);

CREATE INDEX idx_product_variants_quality_id ON public.product_variants USING btree (quality_id);

INSERT INTO "product_variants" ("id", "quality_id", "color_name", "size_name", "sku", "physical_stock", "reserved_stock") VALUES
('04e8a2bb-1d3a-4780-a798-44621a81d3ea',	'7ac1d42f-f2c9-401b-9a63-3692e6e15fde',	'Beige',	'38',	'PC-GAB-BEI-38',	41,	0),
('c6b15908-f81b-4fd9-9708-cd2154b7a7a8',	'7ac1d42f-f2c9-401b-9a63-3692e6e15fde',	'Beige',	'40',	'PC-GAB-BEI-40',	39,	0),
('33047b71-3ee5-4200-8cd7-4908b0bb413e',	'7ac1d42f-f2c9-401b-9a63-3692e6e15fde',	'Beige',	'42',	'PC-GAB-BEI-42',	25,	0),
('46c1363e-01ea-45ee-a464-52a9650f56a4',	'7ac1d42f-f2c9-401b-9a63-3692e6e15fde',	'Beige',	'44',	'PC-GAB-BEI-44',	15,	0),
('107298d4-8410-4d25-b8c0-10cf43f9b1e0',	'7ac1d42f-f2c9-401b-9a63-3692e6e15fde',	'Negro',	'38',	'PC-GAB-NEG-38',	6,	0),
('f8700bcb-e64c-412e-b8ab-63ee97f03732',	'7ac1d42f-f2c9-401b-9a63-3692e6e15fde',	'Negro',	'40',	'PC-GAB-NEG-40',	10,	0),
('959931c5-3b1d-475b-8846-53a1254df019',	'7ac1d42f-f2c9-401b-9a63-3692e6e15fde',	'Negro',	'42',	'PC-GAB-NEG-42',	14,	0),
('76c1e494-5415-4886-93f9-d69310652769',	'7ac1d42f-f2c9-401b-9a63-3692e6e15fde',	'Negro',	'44',	'PC-GAB-NEG-44',	22,	0),
('0c38750c-c5f4-4b7a-a487-0623598b7d1a',	'7ac1d42f-f2c9-401b-9a63-3692e6e15fde',	'Verde Militar',	'38',	'PC-GAB-VER-38',	16,	0),
('27584876-d2bf-43db-bf9e-882b92dc81e1',	'7ac1d42f-f2c9-401b-9a63-3692e6e15fde',	'Verde Militar',	'40',	'PC-GAB-VER-40',	14,	0),
('beeaece0-8864-4bb1-a22f-1e3023b55b80',	'7ac1d42f-f2c9-401b-9a63-3692e6e15fde',	'Verde Militar',	'42',	'PC-GAB-VER-42',	37,	0),
('fd2f4ece-dfbc-4798-9d38-3ae9ef08f65a',	'7ac1d42f-f2c9-401b-9a63-3692e6e15fde',	'Verde Militar',	'44',	'PC-GAB-VER-44',	44,	0),
('55addc19-f1e8-4e91-9a56-86d223183596',	'd93c098e-3ca6-43ba-ac51-ec5a2b30da88',	'Verde',	'S',	NULL,	10,	0),
('12d66131-d43a-4514-81be-8b64f600299f',	'd93c098e-3ca6-43ba-ac51-ec5a2b30da88',	'Verde',	'M',	NULL,	20,	0),
('e2c05084-8e16-4d21-ae72-fcb74137b21d',	'd93c098e-3ca6-43ba-ac51-ec5a2b30da88',	'Verde',	'L',	NULL,	30,	0),
('3c5f035d-7055-4153-8ea8-33278f6e2a32',	'2f17b9c4-a042-494b-8681-9effc16402de',	'Rojo',	'S',	NULL,	10,	10),
('c1792d7d-133d-4147-a9a8-b12dade1874b',	'2f17b9c4-a042-494b-8681-9effc16402de',	'Rojo',	'M',	NULL,	20,	20),
('818f2671-a811-414a-bd70-4066677e949d',	'f67e94cb-4e75-4009-b81c-19fa3f441829',	'Verde',	'S',	NULL,	20,	12),
('03ac8f7d-87eb-4d4e-9d73-45741aefd4f3',	'2f17b9c4-a042-494b-8681-9effc16402de',	'Rojo',	'L',	NULL,	30,	20),
('7a47562e-b675-47e9-b436-73b23f5146cb',	'f67e94cb-4e75-4009-b81c-19fa3f441829',	'Blanco Puro',	'L',	'RB-PREM-BLA-L',	10,	27),
('57f5a1f9-82a6-41f8-9216-711213188780',	'f67e94cb-4e75-4009-b81c-19fa3f441829',	'Blanco Puro',	'M',	'RB-PREM-BLA-M',	65,	0),
('2bbef9e2-8564-4870-bb8b-aafd38d35c57',	'f67e94cb-4e75-4009-b81c-19fa3f441829',	'Blanco Puro',	'S',	'RB-PREM-BLA-S',	42,	0),
('f7f05181-4011-43e4-9530-7a1398bf7cff',	'f67e94cb-4e75-4009-b81c-19fa3f441829',	'Blanco Puro',	'XL',	'RB-PREM-BLA-XL',	39,	0),
('f517d283-ed0e-416a-8a44-9e0d2afa291c',	'f67e94cb-4e75-4009-b81c-19fa3f441829',	'Blanco Puro',	'XXL',	NULL,	20,	0),
('fa5b78bf-57f0-4195-b5c6-98f7d67e7fe8',	'f67e94cb-4e75-4009-b81c-19fa3f441829',	'Gris Melange',	'L',	'RB-PREM-GRI-L',	43,	0),
('72feb926-7ff7-49b2-becb-e858a50d0c55',	'f67e94cb-4e75-4009-b81c-19fa3f441829',	'Gris Melange',	'M',	'RB-PREM-GRI-M',	49,	3),
('ff1c6e0f-a620-476e-886d-a777cfe35123',	'f67e94cb-4e75-4009-b81c-19fa3f441829',	'Gris Melange',	'S',	'RB-PREM-GRI-S',	91,	0),
('4fdf03d8-6886-48c5-b5b9-47dc4d361095',	'f67e94cb-4e75-4009-b81c-19fa3f441829',	'Gris Melange',	'XL',	'RB-PREM-GRI-XL',	78,	0),
('adc66286-255a-40b3-8c58-7631c7173ae5',	'f67e94cb-4e75-4009-b81c-19fa3f441829',	'Negro Medianoche',	'L',	'RB-PREM-NEG-L',	53,	0),
('d3fa3731-e3e8-404f-bf9c-4288622c7227',	'f67e94cb-4e75-4009-b81c-19fa3f441829',	'Negro Medianoche',	'M',	'RB-PREM-NEG-M',	0,	23),
('583eafc4-33d6-480c-86b8-2803e2588bd4',	'f67e94cb-4e75-4009-b81c-19fa3f441829',	'Negro Medianoche',	'S',	'RB-PREM-NEG-S',	23,	0),
('2fea8489-7d56-4aa3-b9c2-2945966f6888',	'f67e94cb-4e75-4009-b81c-19fa3f441829',	'Negro Medianoche',	'XL',	'RB-PREM-NEG-XL',	61,	0),
('85177fd0-324f-48f6-9690-fb5152a8537e',	'ccae9f9e-c5c4-405a-b9ec-75493d47a45f',	'Blanco Puro',	'L',	'RB-STD-BLA-L',	52,	0),
('0d5d6794-3127-4a70-be8b-6360ab6ed17c',	'ccae9f9e-c5c4-405a-b9ec-75493d47a45f',	'Blanco Puro',	'M',	'RB-STD-BLA-M',	39,	0),
('db9c982e-e241-4bef-8c12-658f0eef146b',	'ccae9f9e-c5c4-405a-b9ec-75493d47a45f',	'Blanco Puro',	'XL',	'RB-STD-BLA-XL',	49,	0),
('7e6f1f03-a51c-4d87-b3d4-49f3bc612bc0',	'ccae9f9e-c5c4-405a-b9ec-75493d47a45f',	'Negro Medianoche',	'L',	'RB-STD-NEG-L',	48,	0),
('6c1e2378-d612-4949-ad74-6ea94d9eea6f',	'ccae9f9e-c5c4-405a-b9ec-75493d47a45f',	'Negro Medianoche',	'M',	'RB-STD-NEG-M',	25,	0),
('62449dd1-d584-4ff6-a38a-4c4f4455b15b',	'ccae9f9e-c5c4-405a-b9ec-75493d47a45f',	'Negro Medianoche',	'XL',	'RB-STD-NEG-XL',	43,	0),
('3e18fa37-bdc1-4ebc-9a24-39b0b58ccbf0',	'12176a4d-afbc-4f16-9d72-d700da63db09',	'Azul',	'S',	NULL,	10,	0),
('0a8d9739-0b9a-4ac0-96f1-0ff3517ef755',	'12176a4d-afbc-4f16-9d72-d700da63db09',	'Azul',	'M',	NULL,	20,	0),
('8b14455d-aacf-43de-9b60-4cab56f2ca8a',	'12176a4d-afbc-4f16-9d72-d700da63db09',	'Azul',	'L',	NULL,	30,	0);

DROP TABLE IF EXISTS "products";
CREATE TABLE "public"."products" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" character varying(500),
    "category" character varying(100),
    "is_active" boolean DEFAULT true,
    "image_url" character varying(500),
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

INSERT INTO "products" ("id", "name", "description", "category", "is_active", "image_url") VALUES
('33f58c77-a758-4f11-8cf0-ecdb71a70245',	'Bufanda Descontinuada',	'Ya no se fabrica',	'Accesorios',	'0',	NULL),
('b59d3bc9-2661-4910-9c99-b6995fd78013',	'Campera Test E2E',	'Test product',	'Camperas',	'0',	NULL),
('2738a30b-395a-4a00-a2ca-416ecaaaafa4',	'Pantalón Cargo',	'Pantalón cargo reforzado',	'Pantalones',	'0',	NULL),
('2501e339-f7f2-4e14-b035-d0951864cd92',	'Remera Básica Test',	'rest',	'Remeras',	'1',	NULL),
('92c1ee02-9349-41bf-a6e1-b180a751c031',	'Campera Test 14-4',	'Campera Testeo',	'Camperas',	'0',	NULL),
('a38bc708-9b71-48a1-af50-d31f09c2b965',	'Buzo  Cuello Redondo Premium Frisa ',	'Buzo de Frisa',	'Buzos',	'1',	NULL),
('a07b7c9a-c099-4f29-a090-753586baa1d2',	'Campera Test E2E',	'Test product',	'Camperas',	'0',	NULL);

DROP TABLE IF EXISTS "sellers";
CREATE TABLE "public"."sellers" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "user_id" uuid,
    "full_name" character varying(255),
    "internal_code" character varying(50),
    CONSTRAINT "sellers_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX sellers_user_id_key ON public.sellers USING btree (user_id);

CREATE INDEX idx_sellers_user_id ON public.sellers USING btree (user_id);

INSERT INTO "sellers" ("id", "user_id", "full_name", "internal_code") VALUES
('d383396a-f413-42cd-8371-32829fa68664',	'9c0a1249-b375-46e8-8eda-019fe6d0a4dc',	'Juan Vendedor',	'VND-001');

DROP TABLE IF EXISTS "users";
CREATE TABLE "public"."users" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "email" character varying(255) NOT NULL,
    "password_hash" character varying(255) NOT NULL,
    "role" character varying(20) NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "deleted_at" timestamp,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_role_check" CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'CLIENT'::character varying, 'SELLER'::character varying])::text[])))
)
WITH (oids = false);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

INSERT INTO "users" ("id", "email", "password_hash", "role", "created_at", "deleted_at") VALUES
('466c8cfb-d8b1-4709-8a3e-372e0e0fdceb',	'admin@hector.com',	'$2b$10$9oV0jFV8F.e.H1LKzNjmOejNyeW3FVOBT1hX6cq7JnrOImrpNdf8y',	'ADMIN',	'2026-04-10 18:10:53.799175',	NULL),
('9c0a1249-b375-46e8-8eda-019fe6d0a4dc',	'vendedor@hector.com',	'$2b$10$jBFM2HbGqJdUGnEMjtBNOeJxO95FNmgs6fwJbjMKrLzVTQ6Ti6oIW',	'SELLER',	'2026-04-10 18:10:53.799175',	NULL),
('213edbbb-8686-4577-a78b-a7bd192919be',	'cliente@hector.com',	'$2b$10$7nRWv69U4p1KRGIJuqYwUupICXFqVWcNJMQpKZFgkdk18zoUdR5Yy',	'CLIENT',	'2026-04-10 18:10:53.799175',	NULL),
('5c4b0fb6-15e8-4b13-9131-f347b0ca366b',	'cliente2@hector.com',	'$2b$10$dFlu9jw6PyJ5kmBodFOeIORyuPo8Vl7NFXx.u.xQhZ5nQGESl1wYO',	'CLIENT',	'2026-04-10 18:10:53.799175',	NULL),
('7e251aff-d4d1-4b55-b34d-1cab0a0b85f6',	'walterat88@gmail.com',	'$2b$10$mGcs5NExu//hTuIDkPe1HOxHFqsr42gCxlfRPnwd72elh3iWDjcTC',	'CLIENT',	'2026-04-13 13:47:19.989328',	NULL),
('2f45990c-8529-43e1-b709-f94ff6db4bd0',	'alvarezhmo@gmail.com',	'$2b$10$0vciZPjJbv/24D2Ej.edY.AjTKxxoF6dCb51u5ezhm1.uht/CM1LW',	'CLIENT',	'2026-04-13 14:04:16.437964',	NULL),
('fe924867-58c1-4f2f-b5a5-3765f67ea4a7',	'hector.m4nuel@gmail.com',	'$2b$10$3ce7DDN1Ac1nT8xtGTmWN.rjNh4WK8DsKZY.MPy.Ad8Ejpg5u6Q1S',	'CLIENT',	'2026-04-13 14:04:38.591231',	NULL),
('7374a523-7e3c-473e-a195-3d7f8f86e77d',	'hector.mnuel@gmail.com',	'$2b$10$ZxqAYYdRjQ.BcHJVaxK.kOseSRknxwaZ0jkXQmf4zlLwYDCsWkAti',	'CLIENT',	'2026-04-13 14:05:10.566901',	NULL),
('2e646067-df90-49b3-a318-c20c5656fb48',	'martin@gmail.com',	'$2b$10$c9oYMvFJurjACO47ZPaDkOAo73IjBPH0GbdKWrzbraOkA5Ogo8jH2',	'CLIENT',	'2026-04-13 14:07:36.143586',	NULL),
('169d1934-87e0-443a-bbdc-65fb79bf27ca',	'Sgrosjean@brother.com.ar',	'$2b$10$P875aprJIvZz23jjQhJZL.XcXVN3OVZOX0vMJ1gUXXvb0q1mRoPxS',	'CLIENT',	'2026-04-13 19:38:36.490251',	NULL),
('80614ee1-1198-4b3b-9c63-f14f9a0198e5',	'eitivi@yahoo.com.ar',	'$2b$10$bSrBpRX61jEw41d32XbTX.M83zERyoDO6sDrs7LPlePTcPp2v3Wsi',	'CLIENT',	'2026-04-15 14:11:15.266751',	NULL);

ALTER TABLE ONLY "public"."account_ledger" ADD CONSTRAINT "account_ledger_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."account_ledger" ADD CONSTRAINT "account_ledger_reference_order_id_fkey" FOREIGN KEY (reference_order_id) REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."account_ledger" ADD CONSTRAINT "account_ledger_reference_payment_id_fkey" FOREIGN KEY (reference_payment_id) REFERENCES payments(id) ON DELETE SET NULL;

ALTER TABLE ONLY "public"."clients" ADD CONSTRAINT "clients_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."clients" ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE ONLY "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;

ALTER TABLE ONLY "public"."orders" ADD CONSTRAINT "orders_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."orders" ADD CONSTRAINT "orders_created_by_seller_id_fkey" FOREIGN KEY (created_by_seller_id) REFERENCES sellers(id) ON DELETE SET NULL;

ALTER TABLE ONLY "public"."payments" ADD CONSTRAINT "payments_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE ONLY "public"."product_qualities" ADD CONSTRAINT "product_qualities_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE ONLY "public"."product_variants" ADD CONSTRAINT "product_variants_quality_id_fkey" FOREIGN KEY (quality_id) REFERENCES product_qualities(id) ON DELETE CASCADE;

ALTER TABLE ONLY "public"."sellers" ADD CONSTRAINT "sellers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2026-04-15 19:17:34 UTC