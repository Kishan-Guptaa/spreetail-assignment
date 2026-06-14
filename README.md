# ExpenseFlow: Premium Shared Expenses Management Application

ExpenseFlow is a production-grade shared expense management system designed to track group balances, split bills using advanced calculations, import CSV spreadsheets with real-time audit tools, and simplify cash settlements. The interface is styled around a premium Neo-Brutalist Sketchbook Journal theme.

---

## Design and Aesthetic System: Neo-Brutalist Doodle UI

The frontend of ExpenseFlow uses a custom-crafted Sketchbook Journal aesthetic. Key elements of this theme include:

1. **Dotted Notebook Grid**: A persistent radial dot-grid background that recreates the feeling of a physical bullet journal.
2. **Handwritten Typography**: Integrated Google Fonts that swap standard system letters for sketchbook styling:
   * **Comic Neue**: The default typeface for body copy, tables, input fields, and standard buttons.
   * **Architects Daughter**: Used for major headers, titles, and card callouts.
   * **Caveat**: Used for cursive highlighter tags, sidebar callouts, and handwritten notes.
3. **Neo-Brutalist Borders**: All containers, inputs, and buttons are defined by straight, flat, bold 3px black or white outlines. Offset rigid shadow boxes are used instead of soft blurs. Buttons depress down and right when clicked (active state) and lift up and left when hovered.
4. **Highlighter Accent Palettes**: Subtle pastel marker colors (Yellow, Cyan, and Pink) are used to draw emphasis to active menus, info badges, and critical warning flags.

### Transparent Doodle Characters and Avatar System
The application features 9 custom hand-drawn character avatars sliced from a unified sketch sheet:
* **Johnny Cap**: The Memory Loss Spender. Always forgets to check his ledger, relying on automated settlement graphs.
* **Baby Lily**: The Passive Invitee. Gets automatically invited to trips but maintains zero transaction volume.
* **Uncle Bob**: The Cash Negotiator. Tends to repay in small change and trigger repayment flags.
* **Brad Cheeseman**: The Gourmet Splitter. Uploads high-value items like imported truffle cheese, raising group averages.
* **Mrs. Gable**: The Salad Veteran. The ultimate group peacemaker who pays for duplicate costs without complaining.
* **Sarah Mathers**: The Six-Decimal Accountant. Demands high precision, rejecting splits if percentage allocations do not sum to exactly 100%.
* **Emily Spacebuns**: The Timeline Rebel. Enters transactions outside her active membership range, triggering calendar warnings.
* **Timmy Slice**: The Pro-Rata Master. Prefers split-by-shares over standard splits.
* **Dave Ironfist**: The Log Auditor. Audits database records and spots spreadsheet header issues.

#### Dynamic Avatar Resolution
The application includes a hashing utility at `src/utils/avatar.ts` that maps any group member's name or email to one of the 9 character sprites. This ensures consistent profile avatar tracking across all ledger entries, roster grids, and admin dashboards.

---

## Homepage Feature Showcases

To introduce new users to the core engines, the landing page includes three interactive demonstration sections:

### Hero Mock Dashboard Preview
A simulated group ledger window is displayed directly in the hero panel. Users can click tabs to switch between the Ledger, Balances, and Solver calculations. They can click "Add $30 Coffee" to watch the split totals, member balances, and optimal settlement transactions calculate dynamically in memory.

### Traditional vs. ExpenseFlow Product Battle Grid
A side-by-side comparison outlining the core differences between traditional spreadsheet splitting tools and the ExpenseFlow platform. It details features like timeline-aware splits, built-in CSV diagnostics, and graph-collapsing settlements.

### Core Split Engines Sandbox
A playground container that lets users interact with three core logic engines:
* **Debt Simplifier**: Simulates collapsing 5 multi-party transactions into 2 direct payments.
* **CSV Anomaly Scanner**: Visualizes spreadsheet lint checks, highlighting formatting warnings and letting users auto-resolve them inline.
* **Dynamic Timeline Splitter**: Toggle buttons that simulate changing transaction dates, showing how join and leave dates automatically include or exclude members from splits.

### Sketchbook Bound Footer
A multi-column footer displaying product links, core engine features, social buttons, a simulated newsletter subscription component, and legal resources. The top border is styled to look like notebook spiral rings.

---

## Technical Architecture and Features

### 1. Roster-Restricted Calendars (Dynamic Membership)
Traditional expense apps allow splitting transactions with anyone in a group, regardless of when they participated. ExpenseFlow tracks check-in and checkout dates for each group member. The transaction engine validates dates: if a member joins on June 12 and leaves on June 15, they are excluded from splits for expenses logged on June 10.

### 2. Graph Collapsing Solver (Optimal Settlements)
Calculates and simplifies debt vectors. Instead of separate bank transfers between every member pair (such as Alice paying Bob, Bob paying Charlie), a greedy search algorithm offsets credits against debits to minimize the count and value of settlement operations.

### 3. Smart CSV Import Wizard and Diagnostics
Allows uploading bank statements or ledger spreadsheets directly.
* Parses columns and maps headers.
* Scans incoming data against a validation suite.
* Displays warning markers for duplicates or date violations.
* Provides inline correction inputs so users can edit values before writing records to the PostgreSQL database.

---

## 13 Anomaly Diagnostic Rules

Each transaction row in an uploaded CSV file is verified against the following validation policies:

| Rule Code | Severity | Description | Core Action |
|-----------|----------|-------------|-------------|
| **MALFORMED_ROW** | ERROR | The column count does not match the CSV header schema. | Skips row or allows inline correction |
| **BLANK_FIELD** | ERROR | Required fields (Title, Amount, Date, PaidBy) are empty. | Requires entry of missing values |
| **MISSING_PAYER** | ERROR | Payer email is blank or missing. | Requires selection of group payer |
| **NEGATIVE_AMOUNT** | ERROR | Transaction amount is zero or negative. | Adjusts value to positive decimal |
| **INVALID_DATE** | ERROR | Date format cannot be parsed by the engine. | Adjusts to YYYY-MM-DD standard |
| **FUTURE_DATE** | WARNING | Transaction date is set in the future. | Alerts user for validation confirm |
| **INVALID_CURRENCY**| WARNING | Currency is not supported (standard base is USD/EUR/INR).| Converts currency |
| **UNKNOWN_MEMBER** | WARNING | Payer or split member email is not in the roster. | Invites member automatically on import |
| **MEMBER_INACTIVE** | WARNING | Transaction date lies outside active roster dates. | Overrides split weights or adjusts roster |
| **SETTLEMENT_FLAG** | INFO | Title text keywords suggest this is a debt payment. | Flags row as debt settlement |
| **INCORRECT_SPLIT** | ERROR | Portions do not sum to 100%, or shares mismatch total. | Re-calculates percentages |
| **DUPLICATE** | WARNING | An identical expense exists in the database. | Prompts user to skip or import anyway |
| **DUPLICATE_DIFFERENT_AMOUNT** | WARNING | Same Title, Date, Payer exists but with a different amount. | Re-verifies exact receipt amount |

---

## Directory Structure

* **frontend**: Client application built using React, Vite, Tailwind CSS, Framer Motion, and Lucide React.
  * **src/pages**: Main view files (Landing, Login, Register, Dashboard, GroupDetails, ImportCsv).
  * **src/components**: Reusable UI blocks (Sidebar, Header, Dialogs, Layout).
  * **src/utils**: Hashing tools and math solvers.
* **backend**: REST API server built with Express, Node.js, TypeScript, and Prisma ORM.
  * **src/index.ts**: Main API router and connection settings.
  * **prisma**: Holds the database schema definition and local database seeding scripts.

---

## Local Setup Instructions

### Prerequisites
* **Node.js** (v18 or higher)
* Stable internet connection (for remote database access)

### Database Configuration (Neon Cloud PostgreSQL)
The backend is configured to connect to a cloud-hosted Neon PostgreSQL database. 
* Database queries run directly on the Neon AWS instance.
* The connection string is managed dynamically in the backend `.env` file via the `DATABASE_URL` environment variable. A local PostgreSQL database is not required.

### Step 1: Configure and Seed Backend Server
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Set up the environment variables:
   ```bash
   cp .env.example .env
   ```
3. Push the Prisma database schema:
   ```bash
   npx prisma db push
   ```
4. Populate the database tables with mock accounts, exchange rates, and test groups:
   ```bash
   npm run prisma:seed
   ```
5. Start the API development server:
   ```bash
   npm run dev
   ```
   * The server listens on `http://localhost:5001`

### Step 2: Configure and Run Frontend Client
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the package dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   * The client application runs on `http://localhost:5173`

---

## Demo Login Credentials

To bypass manual account creation, quick-login buttons are provided on the sign-in screen for standard sandbox accounts:
* **Standard Member (John Doe)**: `john@example.com` / `password123`
* **Administrator**: `admin@expenseflow.com` / `admin123`
