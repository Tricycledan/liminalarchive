// server.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  'https://vtglocuqezepsnxtkhcz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0Z2xvY3VxZXplcHNueHRraGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MjgxNTMsImV4cCI6MjA1OTQwNDE1M30.kPP9okclJLnXzrHZH3-kD79pN_gU8N16nxyquP0IxWE'
);
const RECAPTCHA_SECRET = '6LdwVhErAAAAAK5abtIevothX6hXvjKu8Bv58cSD'; // Replace with your v3 Secret Key

app.post('/subscribe', async (req, res) => {
  const { email, token } = req.body; // Extract both email and token
  console.log('Received email:', email, 'Token:', token); // Log what we got

  // Verify reCAPTCHA v3 token
  try {
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`;
    const verificationResponse = await fetch(verificationUrl, { method: 'POST' });
    const verificationData = await verificationResponse.json();
    console.log('reCAPTCHA response:', verificationData); // Log verification result

    if (!verificationData.success || verificationData.score < 0.5) {
      return res.status(400).json({ message: 'Bot detected—please try again!' });
    }
  } catch (err) {
    console.log('reCAPTCHA verification error:', err);
    return res.status(500).json({ message: 'Error verifying CAPTCHA!' });
  }

  // Check for existing email
  try {
    const { data: existing, error: checkError } = await supabase
      .from('subscribers')
      .select('email')
      .eq('email', email);
    
    if (checkError) {
      console.log('Check error:', checkError);
      throw checkError;
    }

    console.log('Existing:', existing);
    if (existing.length > 0) {
      return res.json({ message: 'Email already subscribed!' });
    }

    // Insert new email
    const { error } = await supabase
      .from('subscribers')
      .insert([{ email }]);
    
    if (error) {
      console.log('Insert error:', error);
      throw error;
    }

    res.json({ message: 'Subscribed successfully!' });
  } catch (err) {
    console.log('Full error:', err);
    res.json({ message: 'Something went wrong!' });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Server running'));