const { Octokit } = require("octokit");

async function fetchFileContent(owner, repo, path) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  const response = await octokit.rest.repos.getContent({ owner, repo, path });

  const content = Buffer.from(response.data.content, "base64").toString(
    "utf-8",
  );

  return {
    fileName: response.data.name,
    content,
  };
}

async function getPRFiles(owner, repo, pullNumber) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const response = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
  });
  return response.data; // array of changed files, each with a "patch" (diff) field
}

async function postPRComment(owner, repo, pullNumber, body) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber, // GitHub treats PR comments via the "issues" endpoint
    body,
  });
}

module.exports = { fetchFileContent, getPRFiles, postPRComment };