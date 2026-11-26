//secure password handling
const bcrypt = require('bcrypt');
//sanitize-html for XSS protection
const sanitizeHtml = require('sanitize-html');
//session management
const session = require('express-session');
//helmet for security headers
const helmet = require('helmet');
//winston for logging
const winston = require('winston');
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
const sanitize = require('sanitize-html');
const app = express();
//winston logger setup
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
    ]
});
//session setup
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(express.urlencoded({ extended: true }));

app.use(express.static('pages'));
app.use(helmet());
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'login.html'));
});

//register route secure
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, [username, email, hashedPassword], (err) => {
        if (err) {
            return res.send('Error occurred while registering user.');
        }
        res.send('User registered successfully.');
    }
    );
});

//login route secure
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (!user) {
            return res.send('Invalid username or password.');
        }
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.userId = user.userId;
            logger.info('User logged in successfully.');
            res.redirect('/dashboard');
        } else {
            logger.warn('Login Failed');
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
//secure maintenance requests page
app.get('/requests', (req, res) => {
    db.all(`SELECT * FROM maintenance`, [], (err, rows) => {
        let html = '<h1>Maintenance Requests</h1><ul>';
        rows.forEach((request) => {
            const cleanMessage = sanitize(request.message);
            html += `<p>${cleanMessage}</p><hr>`;
        });
        res.send(html);
    });
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