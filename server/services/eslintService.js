const { ESLint } = require("eslint");

async function lintCode(code, fileName) {
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.js" });

  const results = await eslint.lintText(code, {
    filePath: fileName || "submitted-code.js",
  });

  const issues = results[0].messages.map((msg) => ({
    line: msg.line,
    column: msg.column,
    severity: msg.severity === 2 ? "error" : "warning",
    rule: msg.ruleId,
    message: msg.message,
  }));

  return {
    issueCount: issues.length,
    issues,
  };
}

module.exports = { lintCode };