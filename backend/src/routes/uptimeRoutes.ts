import { Router, Response } from 'express';

const router = Router();

router.get('/warmup', (_req, res: Response) => {
  res.status(204).end();
});

export default router;
