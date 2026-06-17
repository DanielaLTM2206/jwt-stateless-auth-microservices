import express from 'express';
import { config } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import resourceRoutes from './routes/resource.routes.js';

const app = express();

app.use(express.json());
app.use(express.static('public'));

app.use('/auth', authRoutes);
app.use('/', resourceRoutes);

app.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT}`);
});
