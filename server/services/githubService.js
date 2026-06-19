const { Octokit } = require("octokit");

async function fetchFileContent(owner, repo, path) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  const response = await octokit.rest.repos.getContent({ owner, repo, path });

  const content = Buffer.from(response.data.content, "base64").toString("utf-8");

  return {
    fileName: response.data.name,
    content,
  };
}

module.exports = { fetchFileContent };