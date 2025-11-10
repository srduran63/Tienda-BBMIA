export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const order = req.body;
        // Implementa la lógica para guardar en Supabase aquí
        res.status(200).json({ order_id: '12345' }); // Simulación
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}