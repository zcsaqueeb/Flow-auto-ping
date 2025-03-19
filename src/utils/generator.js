module.exports = class generator {
  generateAppId() {
    const hexDigits = "0123456789abcdefABCDEF";
    const randomPart = Array.from(
      { length: 22 },
      () => hexDigits[Math.floor(Math.random() * hexDigits.length)]
    )
      .join("")
      .toLowerCase();
    return `67${randomPart}`;
  }
};
