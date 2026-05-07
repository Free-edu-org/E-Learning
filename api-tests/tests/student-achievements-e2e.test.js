const { apiClient, setAuthToken } = require('../utils/apiClient');
const { createPool } = require('../utils/db');

describe('Student achievements E2E (ledger + events + notifications)', () => {
	const uniqueId = Date.now();
	const shortId = String(uniqueId).slice(-6);
	const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
	const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };
	const studentData = {
		email: `achievement.e2e.student.${uniqueId}@test.com`,
		username: `achievement_e2e_student_${uniqueId}`,
		password: 'password123'
	};

	let pool;
	let adminToken;
	let teacherToken;
	let studentToken;
	let studentPublicId;
	let studentDbId;
	let groupPublicId;
	let introLessonPublicId;
	let pointsLessonPublicId;
	let introTaskPublicId;
	let pointsTaskPublicIds = [];
	let introAchievement;
	let avatarAchievement;
	let tenPointsAchievement;
	let adminAchievementCode;
	let adminAchievementTitle;
	let adminAchievementId;

	async function queryOne(sql, params = []) {
		const [rows] = await pool.execute(sql, params);
		return rows[0] ?? null;
	}

	async function login(credentials) {
		const response = await apiClient.post('/auth/login', credentials);
		expect(response.status).toBe(200);
		return response.data.token;
	}

	async function fetchCurrentUserPublicId(token) {
		setAuthToken(token);
		const response = await apiClient.get('/users/me');
		expect(response.status).toBe(200);
		return response.data.publicId;
	}

	async function createChooseTask(lessonPublicId, label) {
		setAuthToken(teacherToken);
		const response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/choose`, {
			task: label,
			possibleAnswers: 'correct|wrong',
			correctAnswer: 0,
			hint: 'Pick the first answer',
			section: 'E2E'
		});
		expect(response.status).toBe(201);
		return response.data.publicId;
	}

	async function startLesson(lessonPublicId) {
		setAuthToken(studentToken);
		const response = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
		expect(response.status).toBe(200);
		return response;
	}

	async function submitChooseTasks(lessonPublicId, taskPublicIds) {
		await startLesson(lessonPublicId);
		setAuthToken(studentToken);
		const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
			answers: taskPublicIds.map((taskPublicId) => ({
				taskPublicId,
				taskType: 'choose',
				answer: '0'
			}))
		});
		expect(response.status).toBe(200);
		return response;
	}

	async function resetLesson(lessonPublicId) {
		setAuthToken(teacherToken);
		const response = await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);
		expect([204, 404]).toContain(response.status);
		return response;
	}

	async function getStudentStats() {
		setAuthToken(studentToken);
		const response = await apiClient.get('/student/stats');
		expect(response.status).toBe(200);
		return response;
	}

	async function getAchievements() {
		setAuthToken(studentToken);
		const response = await apiClient.get('/student/achievements');
		expect(response.status).toBe(200);
		return response;
	}

	async function waitForAchievements(predicate, attempts = 15, delayMs = 200) {
		for (let attempt = 1; attempt <= attempts; attempt++) {
			const response = await getAchievements();
			if (predicate(response.data)) {
				return response;
			}

			if (attempt < attempts) {
				await new Promise((resolve) => setTimeout(resolve, delayMs));
			}
		}

		throw new Error('Timed out waiting for expected achievement state');
	}

	async function markNotificationsSeen() {
		setAuthToken(studentToken);
		const response = await apiClient.post('/student/achievements/notifications/seen');
		expect(response.status).toBe(200);
		expect(typeof response.data.markedCount).toBe('number');
		return response;
	}

	function findAchievementByTitle(achievements, title) {
		return achievements.find((item) => item.title === title);
	}

	async function getUnlockCount(achievementId) {
		const row = await queryOne(
			'SELECT COUNT(*) AS count FROM user_get_achievement WHERE user_id = ? AND achievement_id = ?',
			[studentDbId, achievementId]
		);
		return Number(row?.count ?? 0);
	}

	async function getLedgerSum() {
		const row = await queryOne('SELECT COALESCE(SUM(delta), 0) AS points FROM student_points WHERE user_id = ?', [studentDbId]);
		return Number(row?.points ?? 0);
	}

	beforeAll(async () => {
		pool = createPool();
		adminToken = await login(adminCreds);
		teacherToken = await login(teacherCreds);

		setAuthToken(teacherToken);
		let response = await apiClient.post('/user-groups', {
			name: `Achievement E2E Group ${uniqueId}`,
			description: 'Group for end-to-end achievement verification'
		});
		expect(response.status).toBe(201);
		groupPublicId = response.data.publicId;

		response = await apiClient.post('/lessons', {
			title: `Ach E2E Intro ${shortId}`,
			theme: 'Achievements E2E',
			groupPublicIds: [groupPublicId]
		});
		expect(response.status).toBe(201);
		introLessonPublicId = response.data.publicId;

		response = await apiClient.post('/lessons', {
			title: `Ach E2E Points ${shortId}`,
			theme: 'Achievements E2E',
			groupPublicIds: [groupPublicId]
		});
		expect(response.status).toBe(201);
		pointsLessonPublicId = response.data.publicId;

		introTaskPublicId = await createChooseTask(introLessonPublicId, 'Intro achievement question');
		for (let index = 1; index <= 9; index++) {
			pointsTaskPublicIds.push(await createChooseTask(pointsLessonPublicId, `Points achievement question ${index}`));
		}

		setAuthToken(teacherToken);
		response = await apiClient.patch(`/lessons/${introLessonPublicId}/status`, { isActive: true });
		expect(response.status).toBe(204);
		response = await apiClient.patch(`/lessons/${pointsLessonPublicId}/status`, { isActive: true });
		expect(response.status).toBe(204);

		setAuthToken(adminToken);
		response = await apiClient.post('/users/register', studentData);
		expect(response.status).toBe(201);

		studentToken = await login({ identifier: studentData.username, password: studentData.password });
		studentPublicId = await fetchCurrentUserPublicId(studentToken);

		setAuthToken(adminToken);
		response = await apiClient.post(`/user-groups/${groupPublicId}/members/${studentPublicId}`);
		expect(response.status).toBe(204);

		const studentRow = await queryOne('SELECT id FROM users WHERE public_id = ? LIMIT 1', [studentPublicId]);
		studentDbId = studentRow.id;

		const achievementRows = await pool.execute(
			'SELECT id, code, name FROM achievements WHERE code IN (?, ?, ?) ORDER BY id',
			['FIRST_LESSON', 'AVATAR_CHANGED', 'TEN_POINTS']
		);
		const achievementsByCode = achievementRows[0].reduce((accumulator, row) => {
			accumulator[row.code] = row;
			return accumulator;
		}, {});

		introAchievement = achievementsByCode.FIRST_LESSON;
		avatarAchievement = achievementsByCode.AVATAR_CHANGED;
		tenPointsAchievement = achievementsByCode.TEN_POINTS;
	});

	afterAll(async () => {
		try {
			if (pointsLessonPublicId && studentPublicId) {
				await resetLesson(pointsLessonPublicId);
			}
			if (introLessonPublicId && studentPublicId) {
				await resetLesson(introLessonPublicId);
			}

			if (studentDbId) {
				await pool.execute('DELETE FROM student_points WHERE user_id = ?', [studentDbId]);
				await pool.execute('DELETE FROM user_get_achievement WHERE user_id = ?', [studentDbId]);
				await pool.execute('DELETE FROM user_answers WHERE user_id = ?', [studentDbId]);
				await pool.execute('DELETE FROM user_lessons WHERE user_id = ?', [studentDbId]);
				await pool.execute('DELETE FROM user_in_group WHERE user_id = ?', [studentDbId]);
			}

			if (adminAchievementCode) {
				setAuthToken(adminToken);
				await apiClient.patch(`/admin/achievements/${adminAchievementCode}/active`, { active: false });
				await pool.execute('DELETE FROM user_get_achievement WHERE achievement_id = (SELECT id FROM achievements WHERE code = ?)', [adminAchievementCode]);
				await pool.execute('DELETE FROM achievements WHERE code = ?', [adminAchievementCode]);
			}

			setAuthToken(teacherToken);
			for (const taskPublicId of pointsTaskPublicIds) {
				const response = await apiClient.delete(`/lessons/${pointsLessonPublicId}/tasks/choose/${taskPublicId}`);
				expect([204, 404]).toContain(response.status);
			}
			if (introTaskPublicId) {
				const response = await apiClient.delete(`/lessons/${introLessonPublicId}/tasks/choose/${introTaskPublicId}`);
				expect([204, 404]).toContain(response.status);
			}

			for (const lessonPublicId of [pointsLessonPublicId, introLessonPublicId]) {
				if (lessonPublicId) {
					const response = await apiClient.delete(`/lessons/${lessonPublicId}`);
					expect([204, 404]).toContain(response.status);
				}
			}

			setAuthToken(adminToken);
			if (groupPublicId) {
				const response = await apiClient.delete(`/user-groups/${groupPublicId}`);
				expect([204, 404]).toContain(response.status);
			}
			if (studentPublicId) {
				const response = await apiClient.delete(`/users/${studentPublicId}`);
				expect([204, 404]).toContain(response.status);
			}
		} finally {
			setAuthToken(null);
			if (pool) {
				await pool.end();
			}
		}
	});

	it('should expose initial achievement shape and start fully locked for the fresh student', async () => {
		const response = await getAchievements();
		expect(Array.isArray(response.data)).toBe(true);
		expect(response.data.length).toBeGreaterThanOrEqual(3);

		response.data.forEach((item) => {
			expect(item).toHaveProperty('id');
			expect(item).toHaveProperty('title');
			expect(item).toHaveProperty('description');
			expect(item).toHaveProperty('icon');
			expect(item).toHaveProperty('color');
			expect(item).toHaveProperty('unlocked');
			expect(item).toHaveProperty('unlockedAt');
			expect(item).toHaveProperty('newlyUnlocked');
		});

		expect(await getUnlockCount(avatarAchievement.id)).toBe(0);
		expect(await getUnlockCount(introAchievement.id)).toBe(0);
		expect(await getUnlockCount(tenPointsAchievement.id)).toBe(0);

		const avatar = findAchievementByTitle(response.data, avatarAchievement.name);
		const firstLesson = findAchievementByTitle(response.data, introAchievement.name);
		const tenPoints = findAchievementByTitle(response.data, tenPointsAchievement.name);

		expect(avatar.unlocked).toBe(false);
		expect(firstLesson.unlocked).toBe(false);
		expect(tenPoints.unlocked).toBe(false);
	});

	it('should unlock the avatar achievement via a real preset avatar update and clear newlyUnlocked after seen', async () => {
		setAuthToken(studentToken);
		let response = await apiClient.put(`/users/${studentPublicId}/avatar/preset`, {
			presetName: 'avatar_1'
		});
		expect(response.status).toBe(200);

		response = await waitForAchievements((achievements) => {
			const avatar = findAchievementByTitle(achievements, avatarAchievement.name);
			return avatar?.unlocked === true && avatar?.newlyUnlocked === true;
		});

		let avatar = findAchievementByTitle(response.data, avatarAchievement.name);
		expect(avatar.unlocked).toBe(true);
		expect(avatar.unlockedAt).toBeTruthy();
		expect(avatar.newlyUnlocked).toBe(true);
		expect(await getUnlockCount(avatarAchievement.id)).toBe(1);

		response = await markNotificationsSeen();
		expect(response.data.markedCount).toBeGreaterThanOrEqual(1);

		response = await getAchievements();
		avatar = findAchievementByTitle(response.data, avatarAchievement.name);
		expect(avatar.unlocked).toBe(true);
		expect(avatar.newlyUnlocked).toBe(false);
	});

	it('should unlock FIRST_LESSON via a real lesson submit without writing unlocks manually', async () => {
		const statsBefore = await getStudentStats();
		expect(statsBefore.data.points).toBe(0);
		expect(await getLedgerSum()).toBe(0);

		await submitChooseTasks(introLessonPublicId, [introTaskPublicId]);

		let response = await waitForAchievements((achievements) => {
			const firstLesson = findAchievementByTitle(achievements, introAchievement.name);
			return firstLesson?.unlocked === true && firstLesson?.newlyUnlocked === true;
		});

		const firstLesson = findAchievementByTitle(response.data, introAchievement.name);
		const avatar = findAchievementByTitle(response.data, avatarAchievement.name);
		expect(firstLesson.unlocked).toBe(true);
		expect(firstLesson.unlockedAt).toBeTruthy();
		expect(firstLesson.newlyUnlocked).toBe(true);
		expect(avatar.newlyUnlocked).toBe(false);
		expect(await getUnlockCount(introAchievement.id)).toBe(1);

		const statsAfter = await getStudentStats();
		expect(statsAfter.data.points).toBe(1);
		expect(await getLedgerSum()).toBe(1);

		response = await markNotificationsSeen();
		expect(response.data.markedCount).toBeGreaterThanOrEqual(1);
	});

	it('should unlock TEN_POINTS from real ledger updates and keep it unlocked after point rollback', async () => {
		await submitChooseTasks(pointsLessonPublicId, pointsTaskPublicIds);

		let response = await waitForAchievements((achievements) => {
			const tenPoints = findAchievementByTitle(achievements, tenPointsAchievement.name);
			return tenPoints?.unlocked === true && tenPoints?.newlyUnlocked === true;
		});

		let tenPoints = findAchievementByTitle(response.data, tenPointsAchievement.name);
		expect(tenPoints.unlocked).toBe(true);
		expect(tenPoints.unlockedAt).toBeTruthy();
		expect(tenPoints.newlyUnlocked).toBe(true);
		expect(await getUnlockCount(tenPointsAchievement.id)).toBe(1);

		let stats = await getStudentStats();
		expect(stats.data.points).toBe(10);
		expect(await getLedgerSum()).toBe(10);

		response = await markNotificationsSeen();
		expect(response.data.markedCount).toBeGreaterThanOrEqual(1);

		await resetLesson(pointsLessonPublicId);

		stats = await getStudentStats();
		expect(stats.data.points).toBe(1);
		expect(await getLedgerSum()).toBe(1);

		response = await getAchievements();
		tenPoints = findAchievementByTitle(response.data, tenPointsAchievement.name);
		expect(tenPoints.unlocked).toBe(true);
		expect(tenPoints.newlyUnlocked).toBe(false);
		expect(await getUnlockCount(tenPointsAchievement.id)).toBe(1);
	});

	it('should unlock an admin-created POINTS achievement only after a real point-changing event and preserve notification semantics', async () => {
		adminAchievementCode = `E2E_LEDGER_POINTS_${uniqueId}`;
		adminAchievementTitle = `E2E Ledger Points ${uniqueId}`;

		setAuthToken(adminToken);
		let response = await apiClient.post('/admin/achievements', {
			code: adminAchievementCode,
			title: adminAchievementTitle,
			description: 'Unlock through a real ledger event only',
			icon: 'bolt',
			color: 'success',
			type: 'POINTS',
			threshold: 1,
			active: true,
			sortOrder: 9500
		});
		expect(response.status).toBe(201);

		const achievementRow = await queryOne('SELECT id FROM achievements WHERE code = ? LIMIT 1', [adminAchievementCode]);
		adminAchievementId = achievementRow.id;

		expect(await getUnlockCount(adminAchievementId)).toBe(0);

		response = await getAchievements();
		let adminAchievement = findAchievementByTitle(response.data, adminAchievementTitle);
		expect(adminAchievement).toBeDefined();
		expect(adminAchievement.unlocked).toBe(false);
		expect(await getUnlockCount(adminAchievementId)).toBe(0);

		response = await getAchievements();
		expect(findAchievementByTitle(response.data, adminAchievementTitle).unlocked).toBe(false);
		expect(await getUnlockCount(adminAchievementId)).toBe(0);

		await submitChooseTasks(pointsLessonPublicId, pointsTaskPublicIds);

		response = await waitForAchievements((achievements) => {
			const dynamicAchievement = findAchievementByTitle(achievements, adminAchievementTitle);
			return dynamicAchievement?.unlocked === true && dynamicAchievement?.newlyUnlocked === true;
		});

		adminAchievement = findAchievementByTitle(response.data, adminAchievementTitle);
		expect(adminAchievement.unlocked).toBe(true);
		expect(adminAchievement.unlockedAt).toBeTruthy();
		expect(adminAchievement.newlyUnlocked).toBe(true);
		expect(await getUnlockCount(adminAchievementId)).toBe(1);

		const tenPoints = findAchievementByTitle(response.data, tenPointsAchievement.name);
		expect(tenPoints.unlocked).toBe(true);
		expect(tenPoints.newlyUnlocked).toBe(false);

		response = await markNotificationsSeen();
		expect(response.data.markedCount).toBeGreaterThanOrEqual(1);

		response = await getAchievements();
		adminAchievement = findAchievementByTitle(response.data, adminAchievementTitle);
		expect(adminAchievement.newlyUnlocked).toBe(false);
	});

	it('should hide a deactivated achievement from the student without deleting the persisted unlock', async () => {
		setAuthToken(adminToken);
		let response = await apiClient.patch(`/admin/achievements/${adminAchievementCode}/active`, {
			active: false
		});
		expect(response.status).toBe(200);
		expect(response.data.active).toBe(false);

		response = await getAchievements();
		expect(findAchievementByTitle(response.data, adminAchievementTitle)).toBeUndefined();
		expect(await getUnlockCount(adminAchievementId)).toBe(1);

		setAuthToken(adminToken);
		response = await apiClient.patch(`/admin/achievements/${adminAchievementCode}/active`, {
			active: true
		});
		expect(response.status).toBe(200);
		expect(response.data.active).toBe(true);

		response = await getAchievements();
		const adminAchievement = findAchievementByTitle(response.data, adminAchievementTitle);
		expect(adminAchievement).toBeDefined();
		expect(adminAchievement.unlocked).toBe(true);
		expect(adminAchievement.newlyUnlocked).toBe(false);
		expect(await getUnlockCount(adminAchievementId)).toBe(1);
	});

	it('should stay idempotent on repeated avatar changes and repeated reset-submit cycles', async () => {
		setAuthToken(studentToken);
		let response = await apiClient.put(`/users/${studentPublicId}/avatar/preset`, {
			presetName: 'avatar_2'
		});
		expect(response.status).toBe(200);

		response = await getAchievements();
		let avatar = findAchievementByTitle(response.data, avatarAchievement.name);
		expect(avatar.unlocked).toBe(true);
		expect(avatar.newlyUnlocked).toBe(false);

		await resetLesson(pointsLessonPublicId);
		let stats = await getStudentStats();
		expect(stats.data.points).toBe(1);

		await submitChooseTasks(pointsLessonPublicId, pointsTaskPublicIds);
		stats = await getStudentStats();
		expect(stats.data.points).toBe(10);

		response = await getAchievements();
		const tenPoints = findAchievementByTitle(response.data, tenPointsAchievement.name);
		const adminAchievement = findAchievementByTitle(response.data, adminAchievementTitle);
		expect(tenPoints.unlocked).toBe(true);
		expect(tenPoints.newlyUnlocked).toBe(false);
		expect(adminAchievement.unlocked).toBe(true);
		expect(adminAchievement.newlyUnlocked).toBe(false);

		expect(await getUnlockCount(avatarAchievement.id)).toBe(1);
		expect(await getUnlockCount(introAchievement.id)).toBe(1);
		expect(await getUnlockCount(tenPointsAchievement.id)).toBe(1);
		expect(await getUnlockCount(adminAchievementId)).toBe(1);
	});
});