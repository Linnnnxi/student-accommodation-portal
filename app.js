//database setup
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the database.');
    }
});
//express
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('pages'));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'login.html'));
});
app.listen(3000, () => {
    console.log('Server is running on port 3000');
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