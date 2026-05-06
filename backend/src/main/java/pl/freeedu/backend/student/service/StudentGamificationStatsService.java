package pl.freeedu.backend.student.service;

import org.springframework.stereotype.Service;
import pl.freeedu.backend.task.model.UserLessonStatus;
import pl.freeedu.backend.task.repository.UserAnswerRepository;
import pl.freeedu.backend.task.repository.UserLessonRepository;
import pl.freeedu.backend.user.exception.UserErrorCode;
import pl.freeedu.backend.user.exception.UserException;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;

@Service
public class StudentGamificationStatsService {

	private final UserLessonRepository userLessonRepository;
	private final UserAnswerRepository userAnswerRepository;
	private final UserRepository userRepository;

	public StudentGamificationStatsService(UserLessonRepository userLessonRepository,
			UserAnswerRepository userAnswerRepository, UserRepository userRepository) {
		this.userLessonRepository = userLessonRepository;
		this.userAnswerRepository = userAnswerRepository;
		this.userRepository = userRepository;
	}

	public StudentGamificationStats buildStats(Integer userId) {
		User user = userRepository.findById(userId).orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
		long completedLessonsCount = userLessonRepository.countByUserIdAndStatus(userId, UserLessonStatus.COMPLETED);
		int currentPoints = calculateCurrentPoints(userId);
		boolean avatarChanged = user.getAvatarUrl() != null && !user.getAvatarUrl().isBlank();

		return StudentGamificationStats.builder().completedLessonsCount(completedLessonsCount)
				.currentPoints(currentPoints).avatarChanged(avatarChanged).build();
	}

	public int calculateCurrentPoints(Integer userId) {
		return Math.toIntExact(userAnswerRepository.countByUserId(userId));
	}
}
