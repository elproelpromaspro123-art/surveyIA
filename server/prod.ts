import { initializeApp, log } from "./index";

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    const app = await initializeApp();
    
    app.listen(PORT, () => {
      log(`Server listening on port ${PORT}`, "startup");
      log(`Visit http://localhost:${PORT}`, "startup");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
