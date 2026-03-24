package pl.freeedu.backend.lesson.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "group_has_lesson")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupHasLesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false)
    private Integer groupId;

    @Column(name = "lesson_id", nullable = false)
    private Long lessonId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}