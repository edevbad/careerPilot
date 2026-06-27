require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
require('./config/db.js');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler.js');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  credentials: true, // Allow cookies to be sent
}))

app.use('/api/auth', require('./modules/auth/auth.routes.js'));

app.use(errorHandler)

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});