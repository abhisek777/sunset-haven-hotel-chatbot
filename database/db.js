const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbFile = path.join(__dirname, 'hotels.db');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        // Create tables when database is first opened
        createTables();
    }
});

// Create necessary tables
function createTables() {
    const bookingsTable = `
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            checkin TEXT NOT NULL,
            checkout TEXT NOT NULL,
            guests INTEGER NOT NULL,
            breakfast TEXT,
            payment TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.run(bookingsTable, (err) => {
        if (err) {
            console.error('Error creating bookings table:', err.message);
        } else {
            console.log('Bookings table ready');
        }
    });
}

// Insert a new booking
function insertBooking(booking) {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO bookings (name, checkin, checkout, guests, breakfast, payment)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        db.run(query, 
            [
                booking.name,
                booking.checkin,
                booking.checkout,
                booking.guests,
                booking.breakfast,
                booking.payment
            ],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            }
        );
    });
}

// Get all bookings
function getAllBookings() {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM bookings ORDER BY created_at DESC';
        
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Get a specific booking by ID
function getBookingById(id) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM bookings WHERE id = ?';
        
        db.get(query, [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

module.exports = {
    insertBooking,
    getAllBookings,
    getBookingById
};
