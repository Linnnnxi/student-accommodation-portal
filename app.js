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
app.use(express.urlencoded({ extended: true }));

app.use(express.static('pages'));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'login.html'));
});

//register route
app.post('/register', (req, res) => {
    const { username, password, email } = req.body;
    db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, [username, email, password], (err) => {
        if (err) {
            return res.send('Error occurred while registering user.');
        }
        res.send('User registered successfully.');
    }
    );
});

//login route insecure 
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    //SQL Injection vulnerability
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    console.log(query);

    db.get(query, (err, row) => {
        if (row) {
            res.redirect('/dashboard');
        } else {
            res.send('Invalid username or password.');
        }
    });
});

//maintenance route
app.post('/maintenance', (req, res) => {
    const { message } = req.body;
    db.run(`INSERT INTO maintenance (userId, message, createdAt) VALUES (?, ?, ?)`, [1, message, new Date().toISOString()], (err) => {
        if (err) {
            return res.send('Error occurred while submitting maintenance request.');
        }
        res.send('Maintenance request submitted successfully.');
    });
});

//book room route
app.post('/book', (req, res) => {
    const { roomId } = req.body;

    db.run(`INSERT INTO bookings (userId, roomId, startDate) VALUES (?, ?, ?)`, [1, roomId, new Date().toISOString()], (err) => {
        if (err) {
            return res.send('Error occurred while booking the room.');
        }
        res.send('Room booked successfully.');
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

//register
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'register.html'));
});

//dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'dashboard.html'));
});

//rooms
app.get('/rooms', (req, res) => {
    db.all(`SELECT * FROM rooms`, [], (err, rows) => {
        if (err) {
            return res.send('Error loading rooms.');
        }
        let html = '<h1>Available Rooms</h1><ul>';
        rows.forEach((room) => {
            html += `
            <h3>${room.roomName}</h3>
            <p>Price: €${room.price}</p>
            <p>Status: ${room.status}</p>
            <p>${room.description}</p>
            
            <form action="/book" method="POST">
            <input type="hidden" name="roomId" value="${room.roomsId}">
            <button type="submit">Book Now</button>
            </form>
            <hr>
            `;
        });
        html += '</ul>';
        res.send(html);
    });
});

//maintenance
app.get('/maintenance', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'maintenance.html'));
});
//Stored XSS vulnerability in maintenance requests
app.get('/requests', (req, res) => {
    db.all(`SELECT * FROM maintenance`, [], (err, rows) => {
        let html = '<h1>Maintenance Requests</h1><ul>';
        rows.forEach((request) => {
            html += `<p>${request.message}</p>`;
        });
        res.send(html);
    });
});

//users
app.get('/users', (req, res) => {
    db.all(`SELECT * FROM users`, [], (err, rows) => {
        res.send(JSON.stringify(rows));
    });
});

//Dom XSS
app.get('/domxss', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'domxss.html'));
});

//Reflected XSS
app.get('/search', (req, res) => {
    const query = req.query.q;
    res.send(`<h1>Search Results for: ${query}</h1>`);
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
`, (err) => {
    if (!err) {
        //rooms data
        db.run(`INSERT INTO rooms (roomName, price, status, description) VALUES 
        ('Room 1', 800, 'available', 'A single room with a beautiful view.'),
        ('Room 2', 1200, 'available', 'A double room with a balcony.')
        `);
    }
});

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