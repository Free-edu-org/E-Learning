# Domena - grupy

Grupy lacza [[Rola - Teacher]] z [[Rola - Student]] i decyduja, do ktorych lekcji student ma dostep.

Relacje:
- `user_groups.teacher_id` wskazuje nauczyciela
- `user_in_group.user_id` przypisuje ucznia do grupy
- `group_has_lesson.lesson_id` przypisuje lekcje do grupy
- [[Security]] uzywa grup do owner-checkow i dostepu studenta do lekcji

Scenariusze:
- nauczyciel lub admin tworzy grupe
- nauczyciel zarzadza czlonkami swojej grupy
- przypisanie lekcji do grupy udostepnia ja studentom
- student widzi lekcje przez [[Student Dashboard]]

Zrodla:
- [UserGroupController.java](../../backend/src/main/java/pl/freeedu/backend/usergroup/controller/v1/UserGroupController.java)
- [UserGroupService.java](../../backend/src/main/java/pl/freeedu/backend/usergroup/service/UserGroupService.java)
- [UserInGroupRepository.java](../../backend/src/main/java/pl/freeedu/backend/usergroup/repository/UserInGroupRepository.java)
