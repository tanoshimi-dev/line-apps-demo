# Membership Points System Backend

## Backend specifications

1. Admin only screen

- dashboard
- users
- points transactions
- settings
- user point spending
  flow:
  1. User request store operator to spend points
  2. Store operator（operator auth） create QR code
  3. User read the QR code and input the points to spend
  4. Points are deducted from user account

2. Admin only screen

- issue store point
  flow:
  1. User create one time store point qr code
  2. Show the qr code to Store point screen
  3. User read the qr code and get points
