// server.js
const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json()); // Understands the form
app.use(express.static('../')); // Shows registry.html from the folder above

const subscribersFile = 'subscribers.json';

if (!fs.existsSync(subscribersFile)) {
    fs.writeFileSync(subscribersFile, '[]');
}

app.post('/subscribe', (req, res) => {
    const email = req.body.email;
    const date = new Date().toISOString();

    const subscribers = JSON.parse(fs.readFileSync(subscribersFile));
    if (subscribers.some(sub => sub.email === email)) {
        res.json({ message: 'Email already subscribed!' });
    } else {
        subscribers.push({ email, date });
        fs.writeFileSync(subscribersFile, JSON.stringify(subscribers, null, 2));
        res.json({ message: 'Subscribed successfully!' });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));