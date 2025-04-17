import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Make sure the app responds to HTTP requests to keep Render from idling
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// Listen on the port Render provides (it will use PORT environment variable)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
