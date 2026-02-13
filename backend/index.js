const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); 
app.use(express.json()); 

// --- 1. NOTRE PETIT CARNET DE NOTES (BASE DE DONNÉES TEMPORAIRE) ---
let reservations = [
    { id: 1, room: 'Salle Atlas', hour: '09:00', user: 'Jean Admin' }
];

// --- 2. LES ROUTES (LES CHEMINS) ---

// Route de test
app.get('/api', (req, res) => {
    res.json({ message: "Le serveur TechSpace est en ligne ! 🚀" });
});

// Route pour VOIR les réservations
app.get('/api/reservations', (req, res) => {
    res.json(reservations);
});

// Route pour CRÉER une réservation
app.post('/api/reservations', (req, res) => {
    const newBooking = req.body;
    reservations.push(newBooking); // On l'ajoute au carnet
    res.status(201).json(newBooking);
});

// Route de Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (email === 'admin@techspace.com' && password === 'password123') {
        res.json({
            token: 'fake-jwt-token',
            user: { firstname: 'Admin', lastname: 'TechSpace', email: 'admin@techspace.com' }
        });
    } else {
        res.status(401).json({ error: 'Identifiants incorrects' });
    }
});

// --- 3. DÉMARRAGE ---
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});