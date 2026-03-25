package pl.freeedu.backend.lesson.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.lesson.model.Lesson;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Integer> {
	// Można dodać query methody w razie potrzeby
}