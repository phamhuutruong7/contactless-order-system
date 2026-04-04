# Staff Sessions & Trinkgeld — Detailed Spec

**Epic:** E11 — Staff Work Sessions & Trinkgeld  
**Last Updated:** April 2026

---

## Why This Feature Exists

In a restaurant where staff take cash orders and guests pay directly to the waiter, the waiter collects money throughout the day and hands the total they *should* have earned back to the cashier at the end of the shift. The difference between what they handed over and the actual cash collected throughout the day is their **Trinkgeld** (tip).

This system gives each staff member a clear, trustworthy record so both the cashier and the waiter agree on the number.

---

## How a Working Day Looks

### 1 — Staff Logs In and Checks In

After entering their PIN, the staff member sees a "Check In" screen. They tap **Check In** to signal they are now actively serving.

Until they check in, the system does not count any orders towards their Trinkgeld total. This protects staff during handover or setup time.

---

### 2 — Staff Serves Guests Throughout the Day

While checked in, every order that is marked as **Served** at one of their assigned tables is automatically added to their running total. Staff do not need to do anything manually — the total updates in the background.

Staff can see a live running total at the top of their floor view: "Session total so far: €73.50"

---

### 3 — Staff Takes a Break (Checks Out and Back In)

If a staff member goes on break or hands their tables to a colleague temporarily, they tap **Check Out**.

- The system stops counting new orders towards their total
- Their session stays open (no data is lost)
- They can check back in at any time — from the same phone or any other device logged in with their PIN
- A staff member can check in and out as many times as needed during a single working day

Each check-in and check-out is recorded with a timestamp, so there is a clear audit trail.

---

### 4 — Staff Ends the Session

When the workday is done, staff tap **End Session**. This is different from checking out — it finalises the session permanently.

The system shows a summary screen:

| What | Amount |
|------|--------|
| Tables served today | 14 |
| Total value of served orders | €186.00 |
| Amount to return to cashier | €186.00 |
| Your Trinkgeld | Whatever cash you collected above €186.00 |

The summary clearly explains: *"Return €186.00 to the cashier. Any cash above that is yours to keep."*

Staff can save or screenshot this screen before logging out.

---

## Key Rules

- Only orders with status **Served** are counted — pending or preparing orders are not included
- Only orders at the staff member's **assigned tables** are counted — not orders at other staff members' tables
- Only orders that were served while the staff member was **checked in** are counted — break time is excluded
- Once a session is ended, it cannot be reopened
- A staff member can only have one open session at a time per restaurant

---

## What the Owner Sees

From the Owner Dashboard → Staff tab, the owner can:

- See which staff members are currently checked in
- View the current running total for each checked-in staff member
- Review completed sessions: date, staff name, tables served, total value
- Use this for end-of-day cashier reconciliation

---

## Take-Away Orders and Sessions

Take-away orders work the same way but without a table. A take-away session belongs to the restaurant as a whole rather than an individual staff member's table.

If the owner or a designated staff member handles all take-away orders, the owner can assign take-away handling to a specific staff member — those orders then count towards that person's Trinkgeld total.

If no assignment is made, take-away totals appear separately in the daily report but are not attributed to any individual staff member.
