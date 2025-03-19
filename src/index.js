const flow3Bot = require("./main/flow3bot");
const chalk = require("chalk");
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
      .map((account) => account.trim())
      .filter(Boolean);
    const count = accounts.length;

    const botInstances = accounts.map((account, index) => ({
      bot: new flow3Bot(account, null, index + 1, count), // Proxy set to null
      delay: index * 5000, // Delay in milliseconds (e.g., 5 seconds per account)
    }));

    while (true) {
      logMessage(null, null, "Starting new process, Please wait...", "process");

      const results = await Promise.all(
        botInstances.map(async ({ bot, delay }) => {
          try {
            await new Promise((resolve) => setTimeout(resolve, delay)); // Add delay per account
            console.log(chalk.white("-".repeat(85)));
            const data = await bot.processKeepAlive();
            return {
              points: {
                total: data.points.total || 0,
                today: data.points.today || 0,
              },
              keepAlive: data.keepAlive || false,
              proxy: bot.proxy || "N/A",
            };
          } catch (error) {
            logMessage(
              null,
              null,
              `Failed to process account: ${error.message}`,
              "error"
            );
            return {
              points: {
                total: 0,
                today: 0,
              },
              keepAlive: false,
              proxy: "N/A",
            };
          }
        })
      );

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
        "Process completed, waiting for 1 minute before starting a new sharing bandwidth",
        "success"
      );

      await new Promise((resolve) => setTimeout(resolve, 60000));
    }
  } catch (error) {
    logMessage(null, null, `Main process failed: ${error.message}`, "error");
  }
}

main();
