const fs = require('fs/promises');
const path = require('path');
const { createPool } = require('../utils/db');

const USER_PREDICATES = [
    "email LIKE 'student.new.%@example.com'",
    "email LIKE 'admin.success.%@example.com'",
    "email LIKE 'temp.del.%@example.com'",
    "email LIKE 'teacher.stats.%@test.com'",
    "email LIKE 'attach.student.%@test.com'",
    "email LIKE 'noaccess.student.%@test.com'",
    "email LIKE 'student.dashboard.%@test.com'",
    "email LIKE 'task.teacher.%@example.com'",
    "email LIKE 'task.student.%@example.com'",
    "email LIKE 'lesson.teacher.%@example.com'",
    "email LIKE 'submit.s1.%@test.com'",
    "email LIKE 'submit.s2.%@test.com'",
    "email LIKE 'lesson.result.student.%@test.com'",
    "email LIKE 'lesson.result.foreign.%@test.com'",
    "email LIKE 'lesson.result.teacher.%@test.com'",
    "email LIKE 'stats.student.%@test.com'",
    "email LIKE 'other.teacher.stats.%@test.com'",
    "email LIKE 'teacher.%@example.com'",
    "email LIKE 'teacher.student.%@example.com'",
    "email LIKE 'foreign.teacher.student.%@example.com'",
    "email LIKE 'unauth.ts.%@example.com'",
    "email LIKE 'stud.ts.%@example.com'",
    "email LIKE 'admin.ts.%@example.com'",
    "email LIKE 'teacher.new.student.%@example.com'",
    "email LIKE 'teacher.foreign.grp.%@example.com'",
    "email LIKE 'teacher.nogrp.%@example.com'",
    "email LIKE 'teacher.noid.%@example.com'",
    "email LIKE 'teacher.dup.username.%@example.com'",
    "email LIKE 'teacher.upd.base.%@example.com'",
    "email LIKE 'unauth.upd.%@example.com'",
    "email LIKE 'stud.upd.%@example.com'",
    "email LIKE 'admin.upd.%@example.com'",
    "email LIKE 'teacher.hijack.%@example.com'",
    "username LIKE 'attach_student_%'",
    "username LIKE 'noaccess_student_%'",
    "username LIKE 'student_dashboard_%'",
    "username LIKE 'newStudent%'",
    "username LIKE 'adminSuccess%'",
    "username LIKE 'tempUserDel%'",
    "username LIKE 'teacher_stats_%'",
    "username LIKE 'task_teacher_%'",
    "username LIKE 'task_student_%'",
    "username LIKE 'lesson_teacher_%'",
    "username LIKE 'submit_s1_%'",
    "username LIKE 'submit_s2_%'",
    "username LIKE 'lesson_result_student_%'",
    "username LIKE 'lesson_result_foreign_%'",
    "username LIKE 'lesson_result_teacher_%'",
    "username LIKE 'stats_student_%'",
    "username LIKE 'other_teacher_stats_%'",
    "username LIKE 'teacher_%'",
    "username LIKE 'teacher_student_%'",
    "username LIKE 'foreign_teacher_student_%'",
    "username LIKE 'unauth_ts_%'",
    "username LIKE 'stud_ts_%'",
    "username LIKE 'admin_ts_%'",
    "username LIKE 'teacher_new_student_%'",
    "username LIKE 'teacher_foreign_grp_%'",
    "username LIKE 'teacher_nogrp_%'",
    "username LIKE 'teacher_noid_%'",
    "username LIKE 'teacher_dup_check_%'",
    "username LIKE 'teacher_upd_base_%'",
    "username LIKE 'unauth_upd_%'",
    "username LIKE 'stud_upd_%'",
    "username LIKE 'admin_upd_%'",
    "username LIKE 'teacher_hijack_%'"
];

const GROUP_PREDICATES = [
    "name LIKE 'Task Group %'",
    "name LIKE 'Submit Group %'",
    "name LIKE 'Result Group %'",
    "name LIKE 'Stats Group %'",
    "name LIKE 'Attach Student Group %'",
    "name LIKE 'Attach Group %'",
    "name LIKE 'Student Dashboard Own Group %'",
    "name LIKE 'Student Dashboard Other Group %'",
    "name LIKE 'TeacherScopeGroup_%'",
    "name LIKE 'SecondTeacherScopeGroup_%'"
];

const LESSON_PREDICATES = [
    "title LIKE 'Attach Lesson %'",
    "title LIKE 'Attach %'",
    "title LIKE 'Task Lesson %'",
    "title LIKE 'Submit Lesson %'",
    "title LIKE 'Result Lesson %'",
    "title LIKE 'Empty Result %'",
    "title LIKE 'Stats %'",
    "title LIKE 'Empty Stats %'",
    "title LIKE 'Shared Lesson %'",
    "title LIKE 'Inactive %'",
    "title LIKE 'Prog %'",
    "title LIKE 'Temp Lesson %'",
    "title LIKE 'Temp %'",
    "title LIKE 'Reg %'",
    "title LIKE 'Reg1Att %'",
    "title LIKE 'Sec %'",
    "title LIKE 'CRUD Lesson %'",
    "title LIKE 'Admin Lesson %'",
    "title LIKE 'No Group Lesson %'",
    "title LIKE 'Disposable %'",
    "title LIKE 'Double Delete %'",
    "title LIKE 'Own Lesson %'"
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

        const deletedResetArtifactsCount = await deleteByIds(pool, 'password_reset_tokens', 'user_id', userIds);
        const deletedUserAnswersCount = await deleteByIds(pool, 'user_answers', 'user_id', userIds)
            + await deleteByIds(pool, 'user_answers', 'lesson_id', lessonIds);
        const deletedUserLessonsCount = await deleteByIds(pool, 'user_lessons', 'user_id', userIds)
            + await deleteByIds(pool, 'user_lessons', 'lesson_id', lessonIds);
        const deletedAchievementLinksCount = await deleteByIds(pool, 'user_get_achievement', 'user_id', userIds);
        const deletedMembershipsCount = await deleteByIds(pool, 'user_in_group', 'user_id', userIds)
            + await deleteByIds(pool, 'user_in_group', 'group_id', groupIds);
        const deletedTasksCount = await deleteByIds(pool, 'choose_tasks', 'lesson_id', lessonIds)
            + await deleteByIds(pool, 'write_tasks', 'lesson_id', lessonIds)
            + await deleteByIds(pool, 'scatter_tasks', 'lesson_id', lessonIds)
            + await deleteByIds(pool, 'speak_tasks', 'lesson_id', lessonIds);
        const deletedAttachmentsCount = await deleteByIds(pool, 'lesson_attachments', 'lesson_id', lessonIds);
        const deletedLessonAssignmentsCount = await deleteByIds(pool, 'group_has_lesson', 'lesson_id', lessonIds)
            + await deleteByIds(pool, 'group_has_lesson', 'group_id', groupIds);
        const deletedLessonsCount = await deleteByIds(pool, 'lessons', 'id', lessonIds);
        const deletedGroupsCount = await deleteByIds(pool, 'user_groups', 'id', groupIds);
        const deletedUsersCount = await deleteByIds(pool, 'users', 'id', userIds);

        await deleteAttachmentFiles(storedFileNames);

        console.log(JSON.stringify({
            deletedLessonsCount,
            deletedGroupsCount,
            deletedUsersCount,
            deletedTasksCount,
            deletedAttachmentsCount,
            deletedLessonAssignmentsCount,
            deletedMembershipsCount,
            deletedUserLessonsCount,
            deletedUserAnswersCount,
            deletedAchievementLinksCount,
            deletedResetArtifactsCount,
            deletedFilesCount: storedFileNames.length
        }, null, 2));
    } finally {
        await pool.end();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
