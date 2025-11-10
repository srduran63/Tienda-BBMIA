import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { cart, shippingLabel, shippingPrice } = req.body;
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: cart.map(item => ({
                price_data: {
                    currency: 'usd',
                    product_data: { name: item.name },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            })),
            mode: 'payment',
            success_url: `${process.env.URL}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.URL}/?canceled=true`,
            shipping_options: [{
                shipping_rate_data: {
                    type: 'fixed_amount',
                    fixed_amount: { amount: Math.round(shippingPrice * 100), currency: 'usd' },
                    display_name: shippingLabel,
                },
            }, ],
        });
        res.status(200).json({ url: session.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}