const axios = require('axios');

const baseUrl = (process.env.API_TEST_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '');
const attempts = Number(process.env.API_TEST_BACKEND_READY_ATTEMPTS || 60);
const delayMs = Number(process.env.API_TEST_BACKEND_READY_DELAY_MS || 1000);
const timeoutMs = Number(process.env.API_TEST_BACKEND_READY_TIMEOUT_MS || 5000);

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			const response = await axios.post(`${baseUrl}/auth/login`, {
				identifier: process.env.API_TEST_READY_USER || 'admin_marek',
				password: process.env.API_TEST_READY_PASSWORD || 'admin1'
			}, {
				validateStatus: () => true,
				timeout: timeoutMs
			});

			if (response.status === 200 && response.data?.token) {
				console.log(`Backend ready after ${attempt} attempt(s).`);
				return;
			}

			console.log(`Backend not ready yet (attempt ${attempt}/${attempts}, status ${response.status}).`);
		} catch (error) {
			console.log(`Backend not reachable yet (attempt ${attempt}/${attempts}): ${error.message}`);
		}

		if (attempt < attempts) {
			await sleep(delayMs);
		}
	}

	throw new Error(`Backend was not ready after ${attempts} attempts.`);
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});