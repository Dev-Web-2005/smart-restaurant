# ER Diagram (MVP)

```mermaid
erDiagram
		TENANT ||--o{ USER : has
		TENANT ||--o{ TABLE : has
		TENANT ||--o{ MENU_CATEGORY : has
		TENANT ||--o{ MENU_ITEM : has
		TENANT ||--o{ ORDER : has
		ORDER ||--o{ ORDER_ITEM : contains
		MENU_CATEGORY ||--o{ MENU_ITEM : groups
		MENU_ITEM ||--o{ MODIFIER_OPTION : offers
		TABLE ||--o{ ORDER : places

		TENANT {
			uuid id PK
			string name
			string email
			string timezone
			timestamptz created_at
		}
		USER {
			uuid id PK
			uuid tenant_id FK
			string email
			string role  "admin|staff|kitchen|super_admin?"
			timestamptz created_at
		}
		TABLE {
			uuid id PK
			uuid tenant_id FK
			string name
			int capacity
			string location
			int qr_token_version
			timestamptz created_at
		}
		MENU_CATEGORY {
			uuid id PK
			uuid tenant_id FK
			string name
			string description
			bool published
			timestamptz created_at
		}
		MENU_ITEM {
			uuid id PK
			uuid tenant_id FK
			uuid category_id FK
			string name
			string description
			string image_url
			numeric price
			string currency
			bool available
			bool published
			timestamptz created_at
		}
		MODIFIER_OPTION {
			uuid id PK
			uuid item_id FK
			string group_name
			string label
			numeric price_delta
			string type  "single|multiple"
		}
		ORDER {
			uuid id PK
			uuid tenant_id FK
			uuid table_id FK
			string status "Draft|Submitted|PaymentPending|PaymentFailed|Received|Preparing|Ready|Completed|Cancelled"
			numeric total
			string currency
			timestamptz created_at
			timestamptz updated_at
		}
		ORDER_ITEM {
			uuid id PK
			uuid order_id FK
			uuid item_id FK
			int quantity
			jsonb modifiers  "selected options"
			numeric unit_price
			numeric line_total
		}
```

Notes

- All tenant-owned tables include `tenant_id` (enforced by RLS, see ADR-0001).
- `TABLE.qr_token_version` increments on regenerate to invalidate old tokens.
- Prices stored as numeric; consider minor-unit integer for precision (future ADR).

Related

- SRS FR-3/4/5/6, OpenAPI schemas, Order state machine diagram.
