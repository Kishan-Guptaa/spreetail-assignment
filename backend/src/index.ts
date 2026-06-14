import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Adjust for production environments
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ping route
app.get('/api/ping', (req, res) => {
  res.json({ message: 'ExpenseFlow API is online and healthy', timestamp: new Date() });
});

// API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal server error occurred',
    message: err.message || 'Unknown error'
  });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`   ExpenseFlow Backend running on port ${PORT}`);
  console.log(`=========================================`);
});
