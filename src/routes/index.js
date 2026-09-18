import express from "express";
// todo
import contactSyncRoutes from "./contact-sync.js";

const app = express();

app.use(express.json());

app.use('/plan', contactSyncRoutes);

export default app;
