const { spawnSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const waitForBackendScript = path.resolve(__dirname, 'wait-for-backend.js');
const cleanupScript = path.resolve(__dirname, 'cleanup-test-data.js');
const jestBin = path.resolve(rootDir, 'node_modules/jest/bin/jest.js');

function runNodeScript(scriptPath, args = []) {
    return spawnSync(process.execPath, [scriptPath, ...args], {
        cwd: rootDir,
        stdio: 'inherit'
    });
}

function runJest(args = []) {
    return spawnSync(process.execPath, [jestBin, ...args], {
        cwd: rootDir,
        stdio: 'inherit'
    });
}

const jestArgs = process.argv.slice(2);

const backendReady = runNodeScript(waitForBackendScript);
if (backendReady.status !== 0) {
	process.exit(backendReady.status ?? 1);
}

const preCleanup = runNodeScript(cleanupScript);
if (preCleanup.status !== 0) {
    process.exit(preCleanup.status ?? 1);
}

const jestRun = runJest(jestArgs);

const postCleanup = runNodeScript(cleanupScript);
if (postCleanup.status !== 0) {
    process.exit(postCleanup.status ?? 1);
}

if (jestRun.error) {
    throw jestRun.error;
}

process.exit(jestRun.status ?? 1);
