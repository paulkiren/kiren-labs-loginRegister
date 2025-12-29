import { createApp } from "./src/app.js";
import { config } from "./src/config/index.js";

async function start() {
  try {
    const app = await createApp();

    app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║  Login/Register API Server v2.0                ║
╠════════════════════════════════════════════════╣
║  🚀 Server running on http://localhost:${config.port}   ║
║  📝 Environment: ${config.nodeEnv.padEnd(27)} ║
║  💾 Data storage: JSON files in ./data        ║
╚════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();
