require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration base de données depuis .env
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'techspace_db'
});

// ========================================
// MIDDLEWARE D'AUTHENTIFICATION JWT
// ========================================
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token manquant ou invalide' });
    }
    
    const token = authHeader.substring(7); // Enlever "Bearer "
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Ajoute les données utilisateur à la requête
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
};

// ========================================
// ROUTES AUTHENTIFICATION
// ========================================

// POST /api/auth/register - Création de compte
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nom, prenom, email, password } = req.body;
        
        // Validation des champs obligatoires
        if (!nom || !prenom || !email || !password) {
            return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
        }
        
        // Validation du format email (RFC 5322 simplifié)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Format email invalide' });
        }
        
        // Validation du mot de passe : min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule et 1 chiffre' });
        }
        
        // Vérifier l'unicité de l'email
        const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé' });
        }
        
        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO users (nom, prenom, email, password) VALUES (?, ?, ?, ?)', 
            [nom, prenom, email, hashedPassword]);
        
        res.status(201).json({ message: "Compte créé avec succès" });
    } catch (e) { 
        console.error('Erreur inscription:', e);
        res.status(500).json({ message: "Erreur serveur lors de l'inscription" }); 
    }
});

// POST /api/auth/login - Connexion (retourne JWT)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Récupérer l'utilisateur
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect" });
        }
        
        const user = users[0];
        
        // Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect" });
        }
        
        // Générer le token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                nom: user.nom, 
                prenom: user.prenom 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
        
        res.status(200).json({ 
            token,
            user: {
                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email
            }
        });
    } catch (e) { 
        console.error('Erreur login:', e);
        res.status(500).json({ message: "Erreur serveur" }); 
    }
});

// GET /api/auth/logout - Déconnexion (optionnel - côté client supprime le token)
app.get('/api/auth/logout', authenticateJWT, (req, res) => {
    // Dans une architecture JWT, la déconnexion se fait principalement côté client
    // en supprimant le token. Cette route est optionnelle et sert de confirmation.
    res.status(200).json({ message: "Déconnexion réussie" });
});

// ========================================
// ROUTES UTILISATEUR (PROTÉGÉES)
// ========================================

// GET /api/users/profile - Consultation profil (JWT requis)
app.get('/api/users/profile', authenticateJWT, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, nom, prenom, email, created_at FROM users WHERE id = ?', 
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
        
        res.status(200).json(users[0]);
    } catch (e) {
        console.error('Erreur profil:', e);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// ========================================
// ROUTES PLANNING ET RÉSERVATIONS
// ========================================

// GET /api/planning/week?date=YYYY-MM-DD - Planning hebdomadaire
app.get('/api/planning/week', async (req, res) => {
    try {
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({ message: 'Paramètre date requis (format: YYYY-MM-DD)' });
        }
        
        // Calculer le lundi de la semaine
        const requestedDate = new Date(date);
        const day = requestedDate.getDay();
        const diff = requestedDate.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(requestedDate.setDate(diff));
        
        // Calculer le vendredi de la semaine
        const friday = new Date(monday);
        friday.setDate(friday.getDate() + 4);
        
        // Formater les dates pour MySQL
        const mondayStr = monday.toISOString().split('T')[0];
        const fridayStr = friday.toISOString().split('T')[0];
        
        // Récupérer les réservations de la semaine
        const [rows] = await db.execute(
            'SELECT * FROM reservations WHERE date >= ? AND date <= ? ORDER BY date, start_time',
            [mondayStr, fridayStr]
        );
        
        res.status(200).json(rows);
    } catch (e) {
        console.error('Erreur planning:', e);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// GET /api/planning - Récupérer toutes les réservations (pour compatibilité)
app.get('/api/planning', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM reservations ORDER BY date, start_time');
        res.status(200).json(rows);
    } catch (e) {
        console.error('Erreur planning:', e);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// POST /api/reservations - Créer réservation (JWT requis)
app.post('/api/reservations', authenticateJWT, async (req, res) => {
    try {
        const { date, hour, object } = req.body;
        const userId = req.user.id;
        const userName = `${req.user.prenom} ${req.user.nom}`;
        
        // Validation des champs
        if (!date || !hour || !object) {
            return res.status(400).json({ message: 'Tous les champs sont requis' });
        }
        
        // Vérifier que le créneau n'est pas dans le passé
        const now = new Date();
        const reservationDateTime = new Date(`${date}T${hour}:00`);
        if (reservationDateTime < now) {
            return res.status(400).json({ message: "Impossible de réserver dans le passé" });
        }
        
        // Vérifier la disponibilité (éviter les doubles réservations)
        const [existing] = await db.execute(
            'SELECT id FROM reservations WHERE date = ? AND start_time = ?',
            [date, hour]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({ message: "Ce créneau est déjà réservé" });
        }
        
        // Créer la réservation
        await db.execute(
            'INSERT INTO reservations (date, start_time, end_time, user_id, user_name, object) VALUES (?, ?, ?, ?, ?, ?)',
            [date, hour, hour, userId, userName, object]
        );
        
        res.status(201).json({ success: true, message: "Réservation créée" });
    } catch (e) { 
        console.error('Erreur création réservation:', e);
        res.status(500).json({ message: "Erreur serveur" }); 
    }
});

// PUT /api/reservations/:id - Modifier réservation (JWT requis)
app.put('/api/reservations/:id', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const { object } = req.body;
        const userId = req.user.id;
        
        if (!object) {
            return res.status(400).json({ message: 'L\'objet est requis' });
        }
        
        // Vérifier que la réservation existe
        const [reservation] = await db.execute('SELECT * FROM reservations WHERE id = ?', [id]);
        if (reservation.length === 0) {
            return res.status(404).json({ message: 'Réservation introuvable' });
        }
        
        // Vérifier que c'est bien la réservation de l'utilisateur
        if (reservation[0].user_id !== userId) {
            return res.status(403).json({ message: 'Non autorisé : vous ne pouvez modifier que vos propres réservations' });
        }
        
        // Vérifier que le créneau n'est pas passé
        const resDate = new Date(reservation[0].date);
        const resTime = reservation[0].start_time.split(':');
        resDate.setHours(parseInt(resTime[0]), parseInt(resTime[1]));
        
        if (resDate < new Date()) {
            return res.status(400).json({ message: 'Impossible de modifier une réservation passée' });
        }
        
        // Mettre à jour
        await db.execute('UPDATE reservations SET object = ? WHERE id = ?', [object, id]);
        res.status(200).json({ success: true, message: 'Réservation modifiée avec succès' });
    } catch (e) { 
        console.error('Erreur modification réservation:', e);
        res.status(500).json({ message: "Erreur serveur" }); 
    }
});

// DELETE /api/reservations/:id - Annuler réservation (JWT requis)
app.delete('/api/reservations/:id', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // Vérifier que la réservation existe
        const [reservation] = await db.execute('SELECT * FROM reservations WHERE id = ?', [id]);
        if (reservation.length === 0) {
            return res.status(404).json({ message: 'Réservation introuvable' });
        }
        
        // Vérifier que c'est bien la réservation de l'utilisateur
        if (reservation[0].user_id !== userId) {
            return res.status(403).json({ message: 'Non autorisé : vous ne pouvez annuler que vos propres réservations' });
        }
        
        // Supprimer
        await db.execute('DELETE FROM reservations WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Réservation annulée avec succès' });
    } catch (e) { 
        console.error('Erreur annulation réservation:', e);
        res.status(500).json({ message: "Erreur serveur" }); 
    }
});

// ========================================
// DÉMARRAGE DU SERVEUR
// ========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Backend TechSpace opérationnel sur le port ${PORT}`);
    console.log(`📅 API disponible sur http://localhost:${PORT}`);
    console.log(`🔒 JWT activé - Durée de session: ${process.env.JWT_EXPIRES_IN || '24h'}`);
});
