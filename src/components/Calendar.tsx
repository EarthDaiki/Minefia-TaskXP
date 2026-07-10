import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { Task } from "../types/task";

// A task spread across two days. <- need to fix.

type CalendarViewProps = {
  tasks: Task[];
  eventOnClick: (info: number) => void;
};

function CalendarView({ tasks, eventOnClick  }: CalendarViewProps) {
  const events = tasks
    .filter((task) => task.due_at !== null)
    .map((task) => ({
      id: String(task.id),
      title: task.title,
      start: new Date(task.due_at! * 1000).toISOString(),
    }));

  return (
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            eventClick={(info) => {
                eventOnClick(Number(info.event.id));
            }}
        />
  );
}

export default CalendarView;