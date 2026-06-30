const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const resultsPath = path.resolve(rootDir, process.env.API_TEST_JEST_RESULTS_FILE || 'jest-results.json');
const summaryPath = path.resolve(rootDir, process.env.API_TEST_SUMMARY_FILE || 'ci-summary.md');
const commentPath = path.resolve(rootDir, process.env.API_TEST_COMMENT_FILE || 'ci-comment.md');

function readResults() {
    if (!fs.existsSync(resultsPath)) {
        return null;
    }

    return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
}

function escapeMarkdown(text) {
    return String(text).replace(/`/g, '\\`');
}

function trimMessage(message, maxLength = 1200) {
    if (!message) {
        return 'No failure details were captured.';
    }

    const normalized = String(message).trim();
    if (normalized.length <= maxLength) {
        return normalized;
    }

    return `${normalized.slice(0, maxLength - 3)}...`;
}

function buildFailureList(results) {
    return (results.testResults || [])
        .flatMap((suite) =>
            (suite.assertionResults || [])
                .filter((assertion) => assertion.status === 'failed')
                .map((assertion) => ({
                    title: assertion.fullName || assertion.title || suite.name,
                    location: path.relative(rootDir, suite.name),
                    message: trimMessage((assertion.failureMessages || []).join('\n\n'))
                }))
        );
}

function buildSummary(results, failures) {
    const lines = [];
    lines.push(results.success ? '## ✅ API Tests Passed' : '## ❌ API Tests Failed');
    lines.push('');
    lines.push(`- ${results.success ? '🟢' : '🔴'} Status: ${results.success ? 'PASSED' : 'FAILED'}`);
    lines.push(`- ${results.success ? '🧪' : '⚠️'} Test suites: ${results.numPassedTestSuites}/${results.numTotalTestSuites} passed`);
    lines.push(`- ${results.success ? '📊' : '📉'} Tests: ${results.numPassedTests}/${results.numTotalTests} passed`);
    lines.push(`- ⏱️ Runtime: ${(results.testResults || []).reduce((sum, suite) => sum + (suite.endTime - suite.startTime), 0) / 1000}s`);

    if (failures.length > 0) {
        const topFailures = failures.slice(0, 5);
        lines.push('');
        lines.push('### 🔎 Failed Tests');
        lines.push('');
        topFailures.forEach((failure) => {
            lines.push(`- ❌ ${escapeMarkdown(failure.title)} (${escapeMarkdown(failure.location)})`);
        });

        lines.push('');
        lines.push('### 🧯 Failure Details');
        lines.push('');
        topFailures.forEach((failure) => {
            lines.push(`<details>`);
            lines.push(`<summary>${escapeMarkdown(failure.title)}</summary>`);
            lines.push('');
            lines.push('```text');
            lines.push(failure.message);
            lines.push('```');
            lines.push('</details>');
            lines.push('');
        });
    }

    return `${lines.join('\n')}\n`;
}

function buildComment(results, failures) {
    if (results.success) {
        return [
            '## ✅ API Tests Passed',
            '',
            `- 🟢 Status: PASSED`,
            `- 🧪 Test suites: ${results.numPassedTestSuites}/${results.numTotalTestSuites}`,
            `- 📊 Tests: ${results.numPassedTests}/${results.numTotalTests}`
        ].join('\n');
    }

    const firstFailure = failures[0];
    const commentLines = [
        '## ❌ API Tests Failed',
        '',
        `- 🔴 Status: FAILED`,
        `- ⚠️ Test suites: ${results.numPassedTestSuites}/${results.numTotalTestSuites} passed`,
        `- 📉 Tests: ${results.numPassedTests}/${results.numTotalTests} passed`,
        ''
    ];

    if (firstFailure) {
        commentLines.push('### 🔥 First failing test');
        commentLines.push('');
        commentLines.push(`**${escapeMarkdown(firstFailure.title)}**`);
        commentLines.push('');
        commentLines.push('<details>');
        commentLines.push('<summary>Show error details</summary>');
        commentLines.push('');
        commentLines.push('```text');
        commentLines.push(firstFailure.message);
        commentLines.push('```');
        commentLines.push('</details>');
    }

    return `${commentLines.join('\n')}\n`;
}

const results = readResults();

if (!results) {
    const fallback = '## API Tests Report\n\nNo Jest JSON report was generated.\n';
    fs.writeFileSync(summaryPath, fallback, 'utf8');
    fs.writeFileSync(commentPath, fallback, 'utf8');
    process.exit(0);
}

const failures = buildFailureList(results);

fs.writeFileSync(summaryPath, buildSummary(results, failures), 'utf8');
fs.writeFileSync(commentPath, buildComment(results, failures), 'utf8');
