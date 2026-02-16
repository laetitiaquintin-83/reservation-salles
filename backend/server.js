const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db'); 

const app = express();
app.use(cors()); 
app.use(express.json()); 

// --- CONNEXION ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0 || !(await bcrypt.compare(password, users[0].password))) {
            return res.status(401).json({ message: "Erreur email/password" });
        }
        res.json({ user: { id: users[0].id, nom: users[0].nom, prenom: users[0].prenom } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- RÉSERVATIONS ---

// LE FIX : On force le format HH:mm pour que React reconnaisse l'heure
app.get('/api/reservations', async (req, res) => {
    try {
        const sql = `
            SELECT id, 
            TIME_FORMAT(start_time, '%H:%i') AS start_time, 
            user_name, 
            user_id 
            FROM reservations
        `;
        const [rows] = await db.execute(sql);
        res.json(rows);
    } catch (e) {
        // Fallback au cas où start_time contient du texte bizarre
        const [rows] = await db.execute("SELECT id, LEFT(start_time, 5) AS start_time, user_name, user_id FROM reservations");
        res.json(rows);
    }
});

app.post('/api/reservations', async (req, res) => {
    try {
        const { hour, user, userId } = req.body;
        const today = new Date().toISOString().split('T')[0];
        const endTime = (parseInt(hour) + 1).toString().padStart(2, '0') + ":00";
        
        const sql = "INSERT INTO reservations (start_time, end_time, user_name, title, user_id, date) VALUES (?, ?, ?, ?, ?, ?)";
        await db.execute(sql, [hour, endTime, user, "Réservation", userId, today]);
        
        res.status(201).json({ message: "Réussi !" });
    } catch (e) { res.status(500).json({ message: "Erreur BDD" }); }
});

app.delete('/api/reservations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        await db.execute("DELETE FROM reservations WHERE id = ? AND user_id = ?", [id, userId]);
        res.json({ message: "Annulé" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(5000, () => console.log("✅ Serveur prêt sur le port 5000"));