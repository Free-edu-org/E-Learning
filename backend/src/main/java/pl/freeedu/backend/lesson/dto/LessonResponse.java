package pl.freeedu.backend.lesson.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonResponse {

    private Long id;
    private String title;
    private String theme;
    private Boolean isActive;
    private Integer teacherId;
    private LocalDateTime createdAt;

    // aggregated groups assigned to lesson
    private List<GroupDto> groups;
}