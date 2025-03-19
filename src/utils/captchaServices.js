const { Solver } = require("@2captcha/captcha-solver");
const ac = require("@antiadmin/anticaptchaofficial");
const config = require("../../config");
const { Telegraf } = require("telegraf");
const { logMessage } = require("./logger");
const fs = require("fs");

module.exports = class captchaServices {
  constructor() {
    this.botToken = config.telegramConfig.botToken;
    this.chatId = config.telegramConfig.chatId;
    this.bot = new Telegraf(this.botToken);
  }

  async sendCaptchaToTelegram(base64) {
    try {
      const filePath = `./captcha_${Date.now()}.png`;
      const buffer = Buffer.from(base64, "base64");
      fs.writeFileSync(filePath, buffer);
      await this.bot.telegram.sendPhoto(
        this.chatId,
        {
          source: fs.createReadStream(filePath),
        },
        {
          caption: "Please solve the captcha and send the solution.",
        }
      );

      fs.unlinkSync(filePath);

      return true;
    } catch (error) {
      console.error("Error send captcha to telegram:", error);
      return false;
    }
  }

  async waitForCaptchaResponse() {
    return new Promise((resolve) => {
      this.bot.on("text", (ctx) => {
        const answer = ctx.message.text;
        resolve(answer);
      });
      this.bot.launch();
    });
  }

  async solveCaptchaManually(base64) {
    try {
      const sent = await this.sendCaptchaToTelegram(base64);
      if (!sent) {
        throw new Error("Error sending captcha to Telegram");
      }

      logMessage(null, null, "Waiting captcha from telegram...", "process");
      const answer = await this.waitForCaptchaResponse();
      this.bot.stop();

      return answer;
    } catch (error) {
      console.error("Error solving CAPTCHA manually:", error);
      return null;
    }
  }

  async solveCaptcha(base64) {
    const captchaProvider = config.captchaServices.captchaUsing;

    if (captchaProvider === "manual") {
      return await this.solveCaptchaManually(base64);
    } else if (captchaProvider === "2captcha") {
      return await this.solve2Captcha(base64);
    } else if (captchaProvider === "antiCaptcha") {
      return await this.antiCaptcha(base64);
    } else {
      console.error("Invalid captcha provider in config.js");
      return null;
    }
  }

  getRandomApiKey(service) {
    const keys = config.captchaServices[service];
    return keys ? keys[Math.floor(Math.random() * keys.length)] : null;
  }

  async antiCaptcha(Base64) {
    const apikey = this.getRandomApiKey("antiCaptcha");
    ac.setAPIKey(apikey);
    try {
      const response = await ac.solveImage(Base64, true);
      return response;
    } catch (error) {
      console.error("Error solving CAPTCHA with antiCaptcha", error);
      return null;
    }
  }

  async solve2Captcha(base64) {
    const api2Captcha = this.getRandomApiKey("captcha2Apikey");
    try {
      const res = await new Solver(api2Captcha).imageCaptcha({
        body: `data:image/png;base64,${base64}`,
        regsense: 1,
      });
      return res.data;
    } catch (error) {
      console.error("Error solving CAPTCHA with 2Captcha:", error);
      return null;
    }
  }
};
