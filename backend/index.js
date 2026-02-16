const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// --- DONNÉES TEMPORAIRES ---
let reservations = [
    { id: 1, room: 'Salle Atlas', hour: '09:00', user: 'Jean Admin' }
];
let users = []; 

// --- ROUTES AUTHENTIFICATION ---

app.post('/api/register', (req, res) => {
    const { firstname, lastname, email, password } = req.body;
    const userExists = users.find(u => u.email === email);
    if (userExists) return res.status(400).json({ message: "Cet email est déjà utilisé." });

    const newUser = { firstname, lastname, email, password };
    users.push(newUser);
    res.status(201).json({ message: "Utilisateur créé !", user: newUser });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        res.json({ message: "Connexion réussie", user });
    } else {
        res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
});

// --- ROUTES RÉSERVATIONS ---

app.get('/api/reservations', (req, res) => {
    res.json(reservations);
});

app.post('/api/reservations', (req, res) => {
    const newBooking = req.body;

    // SÉCURITÉ 19H : On refuse la réservation si l'heure est 19:00
    if (newBooking.hour === "19:00" || newBooking.hour === "19h") {
        return res.status(400).json({ message: "L'établissement ferme à 19h. Réservation impossible." });
    }

    reservations.push(newBooking);
    res.status(201).json(newBooking);
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});