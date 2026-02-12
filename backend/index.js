const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); // Autorise le frontend à appeler le backend
app.use(express.json()); // Permet de lire les données JSON envoyées par le formulaire

// Une petite route pour tester si ça marche
app.get('/api', (req, res) => {
    res.json({ message: "Le serveur TechSpace est en ligne ! 🚀" });
});

// Route de Login "Simulée" (pour tester ton bouton sans BDD pour l'instant)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Test simple : si c'est admin@techspace.com et password123
    if (email === 'admin@techspace.com' && password === 'password123') {
        res.json({
            token: 'fake-jwt-token',
            user: { firstname: 'Admin', lastname: 'TechSpace', email: 'admin@techspace.com' }
        });
    } else {
        res.status(401).json({ error: 'Identifiants incorrects' });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});