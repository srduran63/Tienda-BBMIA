export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { email, orderId } = req.body;
        // Implementa la lógica para enviar email aquí (ejemplo: SendGrid)
        res.status(200).json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}