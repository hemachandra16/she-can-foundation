require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many submissions, please try again later.' }
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

const submissionSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const Submission = mongoose.model('Submission', submissionSchema);

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const Admin = mongoose.model('Admin', adminSchema);

async function seedAdmin() {
    try {
        const exists = await Admin.findOne({ username: process.env.ADMIN_USERNAME });
        if (!exists) {
            const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
            await Admin.create({ username: process.env.ADMIN_USERNAME, password: hashed });
            console.log('Default admin user created');
        }
    } catch (err) { console.error('Error seeding admin:', err); }
}

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    try {
        req.admin = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

// POST /api/contact
app.post('/api/contact', contactLimiter, [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters').escape(),
    body('email').trim().isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).trim().matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
    body('subject').trim().notEmpty().withMessage('Please select a subject'),
    body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters').escape()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const { name, email, phone, subject, message } = req.body;
        const recent = await Submission.findOne({ email, createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } });
        if (recent) return res.status(429).json({ error: 'You recently submitted. Please wait a few minutes.' });
        await new Submission({ name, email, phone, subject, message }).save();
        res.status(201).json({ success: true, message: 'Form Submitted Successfully!' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

// POST /api/admin/login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });
        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, token, username: admin.username });
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/submissions
app.get('/api/admin/submissions', authMiddleware, async (req, res) => {
    try {
        const submissions = await Submission.find().sort({ createdAt: -1 });
        res.json({ success: true, submissions });
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/stats
app.get('/api/admin/stats', authMiddleware, async (req, res) => {
    try {
        const total = await Submission.countDocuments();
        const today = new Date(); today.setHours(0,0,0,0);
        const todayCount = await Submission.countDocuments({ createdAt: { $gte: today } });
        const unread = await Submission.countDocuments({ read: false });
        res.json({ success: true, stats: { total, todayCount, unread } });
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/admin/submissions/:id/read
app.patch('/api/admin/submissions/:id/read', authMiddleware, async (req, res) => {
    try {
        const sub = await Submission.findByIdAndUpdate(req.params.id, { read: true }, { returnDocument: 'after' });
        if (!sub) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true, submission: sub });
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/admin/submissions/:id
app.delete('/api/admin/submissions/:id', authMiddleware, async (req, res) => {
    try {
        const sub = await Submission.findByIdAndDelete(req.params.id);
        if (!sub) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true, message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await seedAdmin();
});
