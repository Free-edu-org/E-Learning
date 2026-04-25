package pl.freeedu.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SetPresetAvatarRequest {

	@NotBlank(message = "Preset name must not be blank")
	private String presetName;
}
