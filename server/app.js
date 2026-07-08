require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
require('./config/db.js');
const cors = require('cors');
const {errorHandler,notFound} = require('./middlewares/errorHandler.js');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:3000','http://127.0.0.1:3000'] , // Replace with your frontend URL
  credentials: true, // Allow cookies to be sent
}))

app.use('/api/auth', require('./modules/auth/auth.routes.js'));
app.use('/api/roadmaps', require('./modules/roadmap/roadmap.routes.js'));
app.use('/api/progress', require('./modules/progress/progress.routes.js'));
app.use('/api/tasks', require('./modules/dailyTasks/dailyTask.routes.js'));

app.use(notFound);
app.use(errorHandler);

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});