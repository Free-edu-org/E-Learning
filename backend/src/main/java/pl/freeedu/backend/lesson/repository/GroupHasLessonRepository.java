package pl.freeedu.backend.lesson.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.lesson.model.GroupHasLesson;

import java.util.List;

@Repository
public interface GroupHasLessonRepository extends JpaRepository<GroupHasLesson, Long> {

    List<GroupHasLesson> findByLessonId(Long lessonId);

    void deleteByLessonId(Long lessonId);

    @Query("SELECT new pl.freeedu.backend.lesson.dto.GroupDto(g.id, g.name) " +
           "FROM pl.freeedu.backend.usergroup.model.UserGroup g JOIN pl.freeedu.backend.lesson.model.GroupHasLesson ghl ON g.id = ghl.groupId " +
           "WHERE ghl.lessonId = :lessonId")
    List<pl.freeedu.backend.lesson.dto.GroupDto> findGroupsForLesson(Long lessonId);

    @Query("SELECT ghl.lessonId FROM pl.freeedu.backend.lesson.model.GroupHasLesson ghl WHERE ghl.groupId = :groupId")
    List<Long> findLessonIdsByGroupId(Integer groupId);

    @Query("SELECT ghl FROM pl.freeedu.backend.lesson.model.GroupHasLesson ghl WHERE ghl.lessonId IN :lessonIds")
    List<GroupHasLesson> findByLessonIdIn(List<Long> lessonIds);
}