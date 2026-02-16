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

module.exports = pool.promise();