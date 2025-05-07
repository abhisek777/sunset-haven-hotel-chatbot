const express = require('express');
const { insertBooking, getAllBookings, getBookingById } = require('./database/db');

const app = express();
app.use(express.json());

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// POST endpoint to create a new booking
app.post('/api/bookings', async (req, res) => {
    try {
        const booking = req.body;
        
        // Validate required fields
        if (!booking.name || !booking.checkin || !booking.checkout || !booking.guests) {
            return res.status(400).json({
                error: 'Missing required booking fields'
            });
        }

        const result = await insertBooking(booking);
        res.status(201).json({
            message: 'Booking created successfully',
            bookingId: result.id
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// GET endpoint to retrieve all bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await getAllBookings();
        res.json(bookings);
    } catch (error) {
        console.error('Error retrieving bookings:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// GET endpoint to retrieve a specific booking
app.get('/api/bookings/:id', async (req, res) => {
    try {
        const booking = await getBookingById(req.params.id);
        if (booking) {
            res.json(booking);
        } else {
            res.status(404).json({
                error: 'Booking not found'
            });
        }
    } catch (error) {
        console.error('Error retrieving booking:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
