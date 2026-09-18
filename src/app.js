import express from 'express';
import cors from 'cors';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json()); // Parses incoming JSON payloads

// Root API Router
app.use('/plan', apiRoutes);

module.exports = app;
