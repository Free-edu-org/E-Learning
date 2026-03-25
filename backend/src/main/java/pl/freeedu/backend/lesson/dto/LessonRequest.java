package pl.freeedu.backend.lesson.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Theme is required")
    private String theme;

    // optional list of group ids to assign this lesson to
    private List<Integer> groupIds;
}