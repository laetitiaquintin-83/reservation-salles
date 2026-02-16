const express = require('express');
const cors = require('cors');
const db = require('./db'); // Ton fichier de connexion créé juste avant

const app = express();

// Configuration
app.use(cors()); // Autorise le frontend à communiquer avec le backend
app.use(express.json()); // Permet de lire les données envoyées en JSON

// Route de test
app.get('/', (req, res) => {
    res.send("🚀 Le serveur de TechSpace est officiellement en ligne !");
});

// Lancement du serveur
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur : http://localhost:${PORT}`);
});