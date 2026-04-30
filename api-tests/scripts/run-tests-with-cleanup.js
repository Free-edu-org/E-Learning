const { spawnSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const cleanupScript = path.resolve(__dirname, 'cleanup-test-data.js');
const jestBin = process.platform === 'win32'
    ? path.resolve(rootDir, 'node_modules/.bin/jest.cmd')
    : path.resolve(rootDir, 'node_modules/.bin/jest');

function runNodeScript(scriptPath, args = []) {
    return spawnSync(process.execPath, [scriptPath, ...args], {
        cwd: rootDir,
        stdio: 'inherit'
    });
}

function runJest(args = []) {
    if (process.platform === 'win32') {
        return spawnSync('cmd.exe', ['/c', jestBin, ...args], {
            cwd: rootDir,
            stdio: 'inherit'
        });
    }

    return spawnSync(jestBin, args, {
        cwd: rootDir,
        stdio: 'inherit'
    });
}

const jestArgs = process.argv.slice(2);

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
