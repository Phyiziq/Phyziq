// PHYZIQ API entry point
import { createApp } from './app';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);

const app = createApp();

app.listen(PORT, () => {
  console.log(`PHYZIQ API listening on port ${PORT}`);
});

export default app;
