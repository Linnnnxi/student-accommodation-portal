//database setup
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the database.');
    }
});
//Users table
db.run(`CREATE TABLE IF NOT EXISTS users (
    userId INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL
)
`);
//Rooms table
db.run(`CREATE TABLE IF NOT EXISTS rooms (
    roomsId INTEGER PRIMARY KEY AUTOINCREMENT,
    roomName TEXT NOT NULL,
    price REAL NOT NULL,
    status TEXT NOT NULL,
    description TEXT NOT NULL
)
`);
//Bookings table
db.run(`CREATE TABLE IF NOT EXISTS bookings (
    bookingId INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    roomId INTEGER NOT NULL,
    startDate TEXT NOT NULL
)
`);
//Maintenance table
db.run(`CREATE TABLE IF NOT EXISTS maintenance (
    requestId INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    message TEXT NOT NULL,
    createdAt TEXT NOT NULL
)
`);    