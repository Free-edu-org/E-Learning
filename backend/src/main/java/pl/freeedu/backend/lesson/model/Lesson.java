package pl.freeedu.backend.lesson.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lessons")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String theme;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "teacher_id", nullable = false)
    private Integer teacherId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}