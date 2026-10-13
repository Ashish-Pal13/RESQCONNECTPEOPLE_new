package com.resqconnect.domain;

import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class AssignmentPolicy {
    public static final List<String> STATUSES = List.of("Notified", "Accepted", "In Progress", "Completed", "Declined", "Cancelled");
    public static final List<String> OPEN_STATUSES = List.of("Notified", "Accepted", "In Progress");
    public static final List<String> CLOSED_STATUSES = List.of("Completed", "Declined", "Cancelled");
    public static final List<String> INACTIVE_STATUSES = List.of("Declined", "Cancelled");
    public static final String VOLUNTEER = "volunteer";
    public static final String COORDINATOR = "coordinator";

    private static final Map<String, Map<String, List<String>>> TRANSITIONS = Map.of(
            VOLUNTEER, Map.of(
                    "Notified", List.of("Accepted", "Declined"),
                    "Accepted", List.of("In Progress", "Declined"),
                    "In Progress", List.of("Completed")),
            COORDINATOR, Map.of(
                    "Notified", List.of("Cancelled"),
                    "Accepted", List.of("Cancelled"),
                    "In Progress", List.of("Cancelled")));

    public record Problem(int status, String error) {
    }

    private AssignmentPolicy() {
    }

    public static List<String> allowedNext(String actor, String from) {
        Map<String, List<String>> byStatus = TRANSITIONS.get(actor);
        if (byStatus == null) {
            return List.of();
        }
        return byStatus.getOrDefault(from, List.of());
    }

    public static Problem check(String actor, String from, String to) {
        if (!STATUSES.contains(to)) {
            return new Problem(400, "Unknown assignment status.");
        }
        if (from.equals(to)) {
            return new Problem(409, "This assignment is already " + to + ".");
        }
        if (CLOSED_STATUSES.contains(from)) {
            return new Problem(409, "This assignment is " + from.toLowerCase(Locale.ROOT) + " and can no longer be changed.");
        }
        if (allowedNext(actor, from).contains(to)) {
            return null;
        }
        String other = VOLUNTEER.equals(actor) ? COORDINATOR : VOLUNTEER;
        if (allowedNext(other, from).contains(to)) {
            return new Problem(403, COORDINATOR.equals(actor)
                    ? "Only the assigned volunteer can mark this assignment " + to + "."
                    : "Only a coordinator can cancel an assignment.");
        }
        return new Problem(409, "An assignment cannot move from " + from + " to " + to + ".");
    }
}
