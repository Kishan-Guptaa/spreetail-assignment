# ExpenseFlow REST API Specifications

The ExpenseFlow backend runs on port `5000` by default. All endpoints are prefixed with `/api`. All protected endpoints require a `Authorization: Bearer <token>` JWT header.

## 1. Authentication Endpoints

### `POST /auth/register`
Creates a new user account.
* **Payload**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "name": "Jane Doe"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "name": "Jane Doe",
      "role": "USER",
      "avatarUrl": "https://api.dicebear.com/..."
    }
  }
  ```

### `POST /auth/login`
Authenticates user and signs JWT token.
* **Payload**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```

### `GET /auth/profile`
Returns current user context (Protected).

---

## 2. Group & Members Endpoints

### `POST /groups`
Creates a group workspace and auto-joins the creator as an active member (Protected).
* **Payload**:
  ```json
  {
    "name": "Euro Trip 2026",
    "description": "Summer backpacking",
    "baseCurrency": "EUR"
  }
  ```

### `GET /groups/dashboard/summary`
Highly optimized endpoint aggregating totals (owed/owe) and recent spending logs across all user groups (Protected).

### `POST /groups/:groupId/members`
Invites a member with dynamic join/leave dates (Protected).
* **Payload**:
  ```json
  {
    "name": "Alice Wonderland",
    "email": "alice@example.com",
    "joinDate": "2026-01-01",
    "leaveDate": "2026-03-31",
    "status": "ACTIVE"
  }
  ```

---

## 3. Expense & Settlement Endpoints

### `POST /groups/:groupId/expenses`
Creates a shared bill, parses split sheets, and converts values (Protected).
* **Payload**:
  ```json
  {
    "title": "Prague dinner",
    "amount": 100,
    "currency": "EUR",
    "date": "2026-03-10",
    "paidById": "member-uuid",
    "splitType": "EQUAL",
    "participants": [
      { "memberId": "member-uuid", "shareValue": 50 },
      { "memberId": "another-member-uuid", "shareValue": 50 }
    ]
  }
  ```

### `GET /groups/:groupId/balances`
Calculates group net balances sheet and executes the **Splitwise Greedy Debt Simplification Solver** to return optimal settlement suggests (Protected).

### `GET /groups/:groupId/balance-breakdown`
Returns contributing ledgers (mutual expenses lent/owed, repayments) between two members to support drill-down reports (Protected).
* **Query Parameters**: `?memberA=uuid&memberB=uuid`

---

## 4. CSV Import Endpoints

### `POST /groups/:groupId/import`
Receives a `.csv` upload file via Multer, scans each line for anomalies, saves issues, and returns session ID (Protected).

### `GET /imports/:sessionId/issues`
Lists all detected issues for review (Protected).

### `PUT /imports/issues/:issueId`
Saves actions taken by user (APPROVE, REJECT, IGNORE, EDIT) for a single issue (Protected).

### `POST /imports/:sessionId/commit`
Executes final database write. Spits and currency rates are verified, auto-invites unknown members, and marks session as complete (Protected).
* **Payload**:
  ```json
  {
    "rows": [
      {
        "rowIndex": 1,
        "action": "APPROVE",
        "data": { ... }
      }
    ]
  }
  ```
