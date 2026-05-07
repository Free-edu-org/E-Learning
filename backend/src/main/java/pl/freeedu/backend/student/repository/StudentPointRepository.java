package pl.freeedu.backend.student.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.freeedu.backend.student.model.StudentPoint;

public interface StudentPointRepository extends JpaRepository<StudentPoint, Integer> {

	boolean existsByLessonResultIdAndReason(Integer lessonResultId, String reason);

	@Query("select coalesce(sum(sp.delta),0) from StudentPoint sp where sp.userId = :userId")
	Integer sumDeltaByUserId(@Param("userId") Integer userId);

	@Query("select coalesce(sum(sp.delta),0) from StudentPoint sp where sp.lessonResultId = :lessonResultId")
	Integer sumDeltaByLessonResultId(@Param("lessonResultId") Integer lessonResultId);
}
