const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',      
    password: '',      // Vide par défaut sur Laragon
    database: 'techspace_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = pool.promise();

// --- AJOUT SECTION 4.2 LOGGING ---
// Test de connexion immédiat pour éviter de découvrir un bug en plein oral
db.getConnection()
    .then(connection => {
        console.log(" [INFO] Connexion MySQL établie avec succès (techspace_db)");
        connection.release();
    })
    .catch(err => {
        console.error(" [ERROR] Impossible de se connecter à MySQL !");
        console.error(" Détails :", err.message);
        console.log("💡 Vérifie que Laragon est bien lancé et que la BDD 'techspace_db' existe.");
    });

module.exports = db;