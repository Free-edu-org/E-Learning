const fs = require('fs/promises');
const path = require('path');
const { createPool } = require('../utils/db');

const USER_PREDICATES = [
    "email LIKE 'attach.student.%@test.com'",
    "email LIKE 'noaccess.student.%@test.com'",
    "email LIKE 'student.dashboard.%@test.com'",
    "username LIKE 'attach_student_%'",
    "username LIKE 'noaccess_student_%'",
    "username LIKE 'student_dashboard_%'"
];

const GROUP_PREDICATES = [
    "name LIKE 'Attach Student Group %'",
    "name LIKE 'Student Dashboard Own Group %'",
    "name LIKE 'Student Dashboard Other Group %'"
];

const LESSON_PREDICATES = [
    "title LIKE 'Attach Lesson %'",
    "title LIKE 'Attach %'",
    "title LIKE 'Shared Lesson %'",
    "title LIKE 'Temp Lesson %'",
    "title LIKE 'Temp %'"
];

async function selectIds(pool, table, idColumn, predicates) {
    const [rows] = await pool.query(
        `SELECT ${idColumn} AS id FROM ${table} WHERE ${predicates.join(' OR ')}`
    );
    return rows.map((row) => row.id);
}

async function deleteByIds(pool, table, column, ids) {
    if (!ids.length) {
        return 0;
    }

    const placeholders = ids.map(() => '?').join(', ');
    const [result] = await pool.query(
        `DELETE FROM ${table} WHERE ${column} IN (${placeholders})`,
        ids
    );
    return result.affectedRows;
}

async function deleteAttachmentFiles(storedFileNames) {
    const roots = [
        path.resolve(__dirname, '../../backend/uploads/attachments'),
        path.resolve(__dirname, '../../uploads/attachments'),
        path.resolve(__dirname, '../uploads/attachments')
    ];

    for (const storedFileName of storedFileNames) {
        for (const root of roots) {
            const filePath = path.join(root, storedFileName);
            try {
                await fs.unlink(filePath);
                break;
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    throw error;
                }
            }
        }
    }
}

async function main() {
    const pool = createPool();

    try {
        const lessonIds = await selectIds(pool, 'lessons', 'id', LESSON_PREDICATES);
        const groupIds = await selectIds(pool, 'user_groups', 'id', GROUP_PREDICATES);
        const userIds = await selectIds(pool, 'users', 'id', USER_PREDICATES);

        const [attachmentRows] = lessonIds.length
            ? await pool.query(
                `SELECT stored_file_name FROM lesson_attachments
                 WHERE lesson_id IN (${lessonIds.map(() => '?').join(', ')})`,
                lessonIds
            )
            : [[]];

        const storedFileNames = attachmentRows.map((row) => row.stored_file_name);

        const summary = {};

        summary.password_reset_tokens = await deleteByIds(pool, 'password_reset_tokens', 'user_id', userIds);
        summary.user_answers_by_user = await deleteByIds(pool, 'user_answers', 'user_id', userIds);
        summary.user_answers_by_lesson = await deleteByIds(pool, 'user_answers', 'lesson_id', lessonIds);
        summary.user_lessons_by_user = await deleteByIds(pool, 'user_lessons', 'user_id', userIds);
        summary.user_lessons_by_lesson = await deleteByIds(pool, 'user_lessons', 'lesson_id', lessonIds);
        summary.user_get_achievement = await deleteByIds(pool, 'user_get_achievement', 'user_id', userIds);
        summary.user_in_group_by_user = await deleteByIds(pool, 'user_in_group', 'user_id', userIds);
        summary.user_in_group_by_group = await deleteByIds(pool, 'user_in_group', 'group_id', groupIds);
        summary.choose_tasks = await deleteByIds(pool, 'choose_tasks', 'lesson_id', lessonIds);
        summary.write_tasks = await deleteByIds(pool, 'write_tasks', 'lesson_id', lessonIds);
        summary.scatter_tasks = await deleteByIds(pool, 'scatter_tasks', 'lesson_id', lessonIds);
        summary.speak_tasks = await deleteByIds(pool, 'speak_tasks', 'lesson_id', lessonIds);
        summary.lesson_attachments = await deleteByIds(pool, 'lesson_attachments', 'lesson_id', lessonIds);
        summary.group_has_lesson_by_lesson = await deleteByIds(pool, 'group_has_lesson', 'lesson_id', lessonIds);
        summary.group_has_lesson_by_group = await deleteByIds(pool, 'group_has_lesson', 'group_id', groupIds);
        summary.lessons = await deleteByIds(pool, 'lessons', 'id', lessonIds);
        summary.user_groups = await deleteByIds(pool, 'user_groups', 'id', groupIds);
        summary.users = await deleteByIds(pool, 'users', 'id', userIds);

        await deleteAttachmentFiles(storedFileNames);

        console.log(JSON.stringify({
            lessonIds,
            groupIds,
            userIds,
            deletedFiles: storedFileNames,
            summary
        }, null, 2));
    } finally {
        await pool.end();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
