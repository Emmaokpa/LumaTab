
import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'node:stream/consumers';
import { appwriteService } from '@/lib/appwrite';
import { Paddle, type PaddleEvent } from '@paddle/paddle-node-sdk';
 
// Initialize the Paddle SDK.
// It's recommended to throw an error if the API key is missing.
if (!process.env.PADDLE_API_KEY) {
  throw new Error('PADDLE_API_KEY is not set in environment variables.');
}
const paddle = new Paddle(process.env.PADDLE_API_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const signature = req.headers['paddle-signature'] as string;
  const rawBody = await buffer(req);
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Paddle webhook secret is not configured.');
    return res.status(500).send({ message: 'Webhook secret not configured.' });
  }

  try {
    // Verify and parse the webhook event. The secret is required for security.
    const event: PaddleEvent | null = paddle.webhooks.unmarshal(rawBody, signature, webhookSecret);

    if (!event) {
        return res.status(400).send({ message: 'Invalid webhook signature.' });
    }

    // All handled events have a customer email, so we can look up the user first.
    // This also acts as a type guard for the data payload.
    if (!('customer' in event.data && typeof event.data.customer?.email === 'string')) {
      console.log(`Webhook event ${event.eventType} without customer email received. Skipping.`);
      return res.status(200).send({ message: 'Webhook received, but no action taken.' });
    }

    const user = await appwriteService.getUserByEmail(event.data.customer.email);

    if (!user) {
      console.warn(`User with email ${event.data.customer.email} not found for Paddle event ${event.eventType}.`);
      // Return 200 to acknowledge receipt and prevent Paddle from retrying.
      return res.status(200).send({ message: 'User not found, but webhook acknowledged.' });
    }

    switch (event.eventType) {
      case 'subscription.created':
      case 'subscription.updated':
        await appwriteService.updateUser(user.$id, {
          subscriptionStatus: event.data.status,
          subscriptionId: event.data.id,
          subscriptionEndDate: event.data.current_billing_period?.ends_at,
        });
        break;
      case 'subscription.canceled':
        await appwriteService.updateUser(user.$id, {
          subscriptionStatus: event.data.status,
          // It's good practice to clear related fields on cancellation.
          subscriptionId: undefined,
          subscriptionEndDate: undefined,
        });
        break;
      default:
        console.log(`Unhandled Paddle event: ${event.eventType}`);
    }

    res.status(200).send({ message: 'Webhook received' });
  } catch (err) {
    console.error('Error processing Paddle webhook:', err);
    res.status(500).send({ message: 'Internal Server Error' });
  }
}
