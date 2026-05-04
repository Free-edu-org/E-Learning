package pl.freeedu.backend.student.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import pl.freeedu.backend.student.model.StudentProgressHistory;

@Repository
public interface StudentProgressHistoryRepository extends JpaRepository<StudentProgressHistory, Integer> {

	List<StudentProgressHistory> findByUserIdOrderByProgressDateAsc(Integer userId);

	Optional<StudentProgressHistory> findByUserIdAndProgressDate(Integer userId, LocalDate progressDate);
}
