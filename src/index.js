const flow3Bot = require("./main/flow3bot");
const chalk = require("chalk");
const { getRandomProxy, loadProxies } = require("./main/proxy");
const fs = require("fs");
const { logMessage } = require("./utils/logger");

async function main() {
  console.log(
    chalk.cyan(`
░█▀▀░█░░░█▀█░█░█░▀▀█
░█▀▀░█░░░█░█░█▄█░░▀▄
░▀░░░▀▀▀░▀▀▀░▀░▀░▀▀░
    By : El Puqus Airdrop
    github.com/ahlulmukh
 Use it at your own risk
  `)
  );

  try {
    const accounts = fs
      .readFileSync("accounts.txt", "utf8")
      .split("\n")
      .filter(Boolean);
    const count = accounts.length;
    const proxiesLoaded = loadProxies();
    if (!proxiesLoaded) {
      logMessage(
        null,
        null,
        "Failed to load proxies, using default IP",
        "warning"
      );
    }
    while (true) {
      logMessage(null, null, "Starting new process, Please wait...", "process");
      const results = [];
      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        try {
          console.log(chalk.white("-".repeat(85)));
          const currentProxy = await getRandomProxy();
          const flow = new flow3Bot(account, currentProxy, i + 1, count);
          const data = await flow.processKeepAlive();
          results.push({
            points: {
              total: data.points.total || 0,
              today: data.points.today || 0,
            },
            keepAlive: data.keepAlive || false,
            proxy: currentProxy || "N/A",
          });
        } catch (error) {
          logMessage(
            null,
            null,
            `Failed to process account: ${error.message}`,
            "error"
          );
          results.push({
            points: {
              total: 0,
              today: 0,
            },
            keepAlive: false,
            proxy: "N/A",
          });
        }
      }
      console.log("\n" + "═".repeat(70));
      results.forEach((result) => {
        logMessage(
          null,
          null,
          `Today Points: ${result.points.today}`,
          "success"
        );
        logMessage(
          null,
          null,
          `Total Points: ${result.points.total}`,
          "success"
        );
        const keepAliveStatus = result.keepAlive
          ? chalk.green("✔ Sharing Bandwith Success")
          : chalk.red("✖ Sharing Bandwith Failed");
        logMessage(
          null,
          null,
          `Sharing Bandwith: ${keepAliveStatus}`,
          "success"
        );
        logMessage(null, null, `Proxy: ${result.proxy}`, "success");
        console.log("─".repeat(70));
      });

      logMessage(
        null,
        null,
        "Process completed, waiting for 1 minutes before starting new sharing bandwith",
        "success"
      );

      await new Promise((resolve) => setTimeout(resolve, 60000));
    }
  } catch (error) {
    logMessage(null, null, `Main process failed: ${error.message}`, "error");
  }
}

main();
