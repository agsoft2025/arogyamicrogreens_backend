
import express, {
  ErrorRequestHandler,
  Request,
  Response,
} from 'express';
import cors from 'cors';
import multer from 'multer';

import routes from './routes'

export const app = express();
const startedAt = new Date();
const PORT = process.env.PORT || 3000;

function formatUptime(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(
  '/uploads',
  express.static('uploads')
);

app.use('/api/v1', routes);

app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Agrinest API is running",
    health: "/health",
  });
});

app.get("/health", (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);

  res.status(200).json({
    status: "ok",
    message: "Health is ok",
    startedAt: startedAt.toISOString(),
    uptimeSeconds,
    uptime: formatUptime(uptimeSeconds),
  });
});

const errorHandler: ErrorRequestHandler =
  (error, _req, res, _next) => {
    const statusCode =
      error.statusCode ||
      (error instanceof multer.MulterError
        ? 400
        : 500);

    res.status(statusCode).json({
      success: false,
      message:
        error.message ||
        'Internal server error',
    });
  };

app.use(errorHandler);
