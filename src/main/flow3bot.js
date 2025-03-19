const { getProxyAgent } = require("./proxy");
const UserAgent = require("user-agents");
const axios = require("axios");
const { logMessage } = require("../utils/logger");
const userAgent = new UserAgent().toString();

module.exports = class flow3Bot {
  constructor(account, proxy = null, currentNum, total) {
    this.currentNum = currentNum;
    this.total = total;
    this.account = account;
    this.proxy = proxy;
    this.axiosConfig = {
      ...(this.proxy && { httpsAgent: getProxyAgent(this.proxy) }),
      timeout: 120000,
      headers: {
        "User-Agent": userAgent,
        Origin: "chrome-extension://lhmminnoafalclkgcbokfcngkocoffcp",
      },
    };
  }

  async makeRequest(method, url, config = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios({
          method,
          url,
          ...this.axiosConfig,
          ...config,
        });

        return response;
      } catch (error) {
        logMessage(
          this.currentNum,
          this.total,
          `Request Failed ${error.message}`,
          "error"
        );

        logMessage(
          this.currentNum,
          this.total,
          `Retrying... (${i + 1}/${retries})`,
          "process"
        );
        await new Promise((resolve) => setTimeout(resolve, 12000));
      }
    }
    return null;
  }

  async sharingBandwith() {
    logMessage(
      this.currentNum,
      this.total,
      "Trying sharing bandwith...",
      "process"
    );
    const headers = {
      Authorization: `Bearer ${this.account}`,
    };

    try {
      const response = await this.makeRequest(
        "POST",
        "https://api.mtcadmin.click/api/v1/bandwidth",
        { headers: headers }
      );
      if (response.data.statusCode === 200) {
        logMessage(
          this.currentNum,
          this.total,
          `Success sharing bandwith`,
          "success"
        );
        return true;
      }
      return false;
    } catch (error) {
      logMessage(
        this.currentNum,
        this.total,
        `Failed to sharing bandwith`,
        "error"
      );
      return false;
    }
  }

  async getPoints() {
    logMessage(
      this.currentNum,
      this.total,
      "Trying getting points...",
      "process"
    );
    const headers = {
      Authorization: `Bearer ${this.account}`,
    };

    try {
      const response = await this.makeRequest(
        "GET",
        `https://api.mtcadmin.click/api/v1/point/info`,
        {
          headers: headers,
        }
      );

      if (response.data.statusCode === 200) {
        logMessage(
          this.currentNum,
          this.total,
          `Success get points`,
          "success"
        );
        return response.data.data;
      }
      logMessage(this.currentNum, this.total, `Failed to get points`, "error");
      return null;
    } catch (error) {
      logMessage(
        this.currentNum,
        this.total,
        `Failed to get points: ${error.message}`,
        "error"
      );
      return null;
    }
  }

  async processKeepAlive() {
    try {
      const sharingBandwith = await this.sharingBandwith();
      const data = await this.getPoints();
      return {
        points: {
          total: data.totalEarningPoint,
          today: data.todayEarningPoint,
        },
        keepAlive: sharingBandwith,
      };
    } catch (error) {
      logMessage(
        this.currentNum,
        this.total,
        `Failed to process account: ${error.message}`,
        "error"
      );
      throw error;
    }
  }
};
