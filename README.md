# EazzyTranzact Mid-Level Fullstack Engineer Assessment

## Part 1: Identify Critical Issues (8+)

Below are key issues identified that must be addressed to ensure security, stability, and maintainability:

1. **Lack of Input Validation**
   No checks are performed on `event.body`, `body.amount`, or `body.user_id`. This can lead to type errors or exploitation through malicious input.

2. **No Signature Verification**
   The webhook does not validate its authenticity (e.g. using HMAC with a secret key). This exposes the system to spoofed requests.

3. **Insecure ID Generation**
   Uses `Math.random().toString()` for transaction IDs, which is not unique or cryptographically secure.

4. **Potential Race Conditions**
   The balance update logic (`user.balance = user.balance + amount`) is not atomic. Concurrent webhook calls can lead to incorrect user balances.

5. **No Error Handling**
   There are no `try/catch` blocks or conditional checks (e.g. if `getUserById` returns `null`). This risks unhandled exceptions and crashes.

6. **Hardcoded Bank Logic**
   The handler supports only `gtbank`. This makes it hard to extend and violates the Open/Closed Principle.

7. **Missing Logging**
   There is no logging for success or failure, making it difficult to trace, monitor, or debug webhook activity.

8. **Premature Notification**
   User notifications are sent before confirming that the transaction was successfully saved. This can lead to misinformation.

9. **Decimal Precision Issues**
   No validation or precision handling on `amount`. JavaScript’s floating-point math can introduce rounding errors.

10. **Crashes on Invalid JSON**
    Direct use of `JSON.parse(event.body)` without a try block can crash the handler on malformed input.

### ✅ Improved Implementation (Best Practices Applied)

```ts
export const handlePaymentWebhook = async (event: any) => {
  try {
    const rawBody = event.body;

    // Parse JSON payload
    const data = JSON.parse(rawBody);

    // Basic validation
    if (
      !data ||
      data.bank?.toLowerCase() !== "gtbank" ||
      typeof data.amount !== "number" ||
      data.amount <= 0 ||
      typeof data.user_id !== "string"
    ) {
      return { statusCode: 400, body: "Invalid payload" };
    }

    const { amount, user_id } = data;

    // Get user
    const user = await getUserById(user_id);
    if (!user) {
      return { statusCode: 404, body: "User not found" };
    }

    // Update user balance
    user.balance += amount;
    await updateUser(user);

    // Create transaction
    const transaction = {
      id: Date.now().toString(), // simple unique ID
      user_id,
      amount,
      status: "completed",
      created_at: new Date(),
    };
    await createTransaction(transaction);

    // Notify user
    await sendNotification(user_id, `You received ${amount} NGN`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, transactionId: transaction.id }),
    };
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
```

### 🔐 Security Considerations for Payment Webhooks

The following practices are essential for building a secure and robust webhook handler:

| ✅ Consideration           | 💡 Description                                                           |
| -------------------------- | ------------------------------------------------------------------------ |
| **Signature Verification** | Validate payloads using HMAC (e.g., SHA256) with a shared secret.        |
| **Input Validation**       | Sanitize and type-check incoming data using libraries like Zod or Joi.   |
| **Idempotency**            | Prevent duplicate processing using unique transaction/reference IDs.     |
| **Rate Limiting**          | Throttle requests to protect against abuse or denial-of-service attacks. |
| **IP Whitelisting**        | Accept requests only from trusted IPs (e.g., payment provider networks). |
| **HTTPS Only**             | Ensure webhook communication uses SSL/TLS to prevent MITM attacks.       |
| **Time-based Expiry**      | Reject outdated requests to defend against replay attacks.               |
