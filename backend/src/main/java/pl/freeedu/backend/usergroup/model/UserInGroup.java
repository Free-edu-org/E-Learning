package pl.freeedu.backend.usergroup.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_in_group")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInGroup {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "user_id", nullable = false)
	private Integer userId;

	@Column(name = "group_id", nullable = false)
	private Integer groupId;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
