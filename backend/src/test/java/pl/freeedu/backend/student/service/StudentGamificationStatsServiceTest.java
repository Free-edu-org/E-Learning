package pl.freeedu.backend.student.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.freeedu.backend.task.model.UserLessonStatus;
import pl.freeedu.backend.task.repository.UserLessonRepository;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentGamificationStatsServiceTest {

	@Mock
	private UserLessonRepository userLessonRepository;
	@Mock
	private PointService pointService;
	@Mock
	private UserRepository userRepository;

	private StudentGamificationStatsService studentGamificationStatsService;

	@BeforeEach
	void setUp() {
		studentGamificationStatsService = new StudentGamificationStatsService(userLessonRepository, pointService,
				userRepository);
	}

	@Test
	void shouldBuildStatsWithCompletedLessonsPointsAndChangedAvatar() {
		// given
		when(userRepository.findById(12))
				.thenReturn(Optional.of(User.builder().id(12).role(Role.STUDENT).username("student")
						.email("student@example.com").password("secret").avatarUrl("preset:avatar_2").build()));
		when(userLessonRepository.countByUserIdAndStatus(12, UserLessonStatus.COMPLETED)).thenReturn(5L);
		when(pointService.getCurrentPoints(12)).thenReturn(9);

		// when
		StudentGamificationStats stats = studentGamificationStatsService.buildStats(12);

		// then
		assertEquals(5L, stats.completedLessonsCount());
		assertEquals(9, stats.currentPoints());
		assertTrue(stats.avatarChanged());
	}

	@Test
	void shouldBuildStatsWithNoAvatarChangeWhenAvatarIsBlank() {
		// given
		when(userRepository.findById(15)).thenReturn(Optional.of(User.builder().id(15).role(Role.STUDENT)
				.username("student2").email("student2@example.com").password("secret").avatarUrl(" ").build()));
		when(userLessonRepository.countByUserIdAndStatus(15, UserLessonStatus.COMPLETED)).thenReturn(0L);
		when(pointService.getCurrentPoints(15)).thenReturn(0);

		// when
		StudentGamificationStats stats = studentGamificationStatsService.buildStats(15);

		// then
		assertEquals(0L, stats.completedLessonsCount());
		assertEquals(0, stats.currentPoints());
		assertFalse(stats.avatarChanged());
	}
}
