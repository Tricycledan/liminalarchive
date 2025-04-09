// server.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(cors()); // Add this
app.use(express.json());

const supabase = createClient(
  'https://vtglocuqezepsnxtkhcz.supabase.co', // Replace with your URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0Z2xvY3VxZXplcHNueHRraGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MjgxNTMsImV4cCI6MjA1OTQwNDE1M30.kPP9okclJLnXzrHZH3-kD79pN_gU8N16nxyquP0IxWE' // Replace with your anon key
);

app.post('/subscribe', async (req, res) => {
  const email = req.body.email;
  console.log('Received email:', email); // Log what we got

  try {
    const { data: existing, error: checkError } = await supabase
      .from('subscribers')
      .select('email')
      .eq('email', email);
    
    if (checkError) {
      console.log('Check error:', checkError);
      throw checkError;
    }

    console.log('Existing:', existing); // Log what we found
    if (existing.length > 0) {
      return res.json({ message: 'Email already subscribed!' });
    }

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

app.listen(3000, () => console.log('Server running on port 3000'));