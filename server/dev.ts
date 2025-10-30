import { createServer } from "./index";

const app = createServer();
const port = Number(process.env.DEV_API_PORT ?? 3001);

app.listen(port, () => {
  console.log(`🔧 Dev API server listening on http://127.0.0.1:${port}`);
});


