<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useCalendar } from '../composables/useCalendar.js';
import { useProjects } from '../composables/useProjects.js';
import { useToast } from '../composables/useToast.js';
import EventModal from '../components/EventModal.vue';

const { events, loading, load, update } = useCalendar();
const { load: loadProjects } = useProjects();
const { show: toast } = useToast();

const showEvent = ref(false);
const initialDate = ref('');
const editEvent = ref(null);

onMounted(async () => {
  const [evResult, prResult] = await Promise.all([load(), loadProjects()]);
  if (evResult?.error) toast('Could not load calendar events', { type: 'error' });
  if (prResult?.error) toast('Could not load projects', { type: 'error' });
});

function typeColor(type) {
  const colors = {
    tattoo_session: '#c9a84c',
    drawing_block: '#5b8fb9',
    personal: '#8a7d6b',
  };
  return colors[type] ?? '#8a7d6b';
}

const calendarEvents = computed(() =>
  events.value.map(e => {
    const clientName = e.projects?.client_name;
    const displayTitle = clientName ? `${e.title} — ${clientName}` : e.title;
    return {
      id: e.id,
      title: displayTitle,
      start: e.start_time,
      end: e.end_time,
      backgroundColor: e.color || typeColor(e.event_type),
      borderColor: e.color || typeColor(e.event_type),
      extendedProps: { ...e },
    };
  })
);

function handleSelect(info) {
  editEvent.value = null;
  initialDate.value = info.startStr?.slice(0, 16)
    || new Date(info.start).toISOString().slice(0, 16);
  showEvent.value = true;
}

function handleEventClick(info) {
  editEvent.value = info.event.extendedProps;
  showEvent.value = true;
}

async function handleEventDrop(info) {
  const { error } = await update(info.event.id, {
    start_time: info.event.start.toISOString(),
    end_time: info.event.end.toISOString(),
  });
  if (error) {
    toast('Could not move event', { type: 'error' });
    info.revert();
  }
}

async function handleEventResize(info) {
  const { error } = await update(info.event.id, {
    start_time: info.event.start.toISOString(),
    end_time: info.event.end.toISOString(),
  });
  if (error) {
    toast('Could not resize event', { type: 'error' });
    info.revert();
  }
}

const calendarOptions = reactive({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  events: [],
  editable: true,
  selectable: true,
  selectMirror: true,
  nowIndicator: true,
  slotMinTime: '07:00:00',
  slotMaxTime: '22:00:00',
  allDaySlot: false,
  height: 'auto',
  select: handleSelect,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
});

watch(calendarEvents, (val) => {
  calendarOptions.events = val;
}, { immediate: true });

function openNewEvent() {
  editEvent.value = null;
  initialDate.value = new Date().toISOString().slice(0, 16);
  showEvent.value = true;
}

function onEventSaved() {
  load();
}
</script>

<template>
  <div class="view-calendar">
    <!-- Legend -->
    <div class="cal-legend" role="list" aria-label="Event type legend">
      <span class="cal-legend__item" role="listitem">
        <span class="cal-legend__dot cal-legend__dot--session" aria-hidden="true"></span>
        Tattoo Session
      </span>
      <span class="cal-legend__item" role="listitem">
        <span class="cal-legend__dot cal-legend__dot--drawing" aria-hidden="true"></span>
        Drawing Block
      </span>
      <span class="cal-legend__item" role="listitem">
        <span class="cal-legend__dot cal-legend__dot--personal" aria-hidden="true"></span>
        Personal
      </span>
    </div>

    <div v-if="loading" class="cal-loading">
      <i class="ph-thin ph-circle-notch spin"></i> Loading...
    </div>
    <div v-else class="cal-wrapper">
      <FullCalendar :options="calendarOptions" />
    </div>

    <!-- FAB -->
    <button class="fab" @click="openNewEvent" aria-label="New event">
      <i class="ph-thin ph-plus" aria-hidden="true"></i>
    </button>

    <EventModal
      v-model="showEvent"
      :initialDate="initialDate"
      :editEvent="editEvent"
      @saved="onEventSaved"
    />
  </div>
</template>

<style scoped>
.view-calendar {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  position: relative;
}

/* FAB */
.fab {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-gold);
  color: var(--color-bg);
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(201,168,76,0.35);
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 50;
}
.fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(201,168,76,0.45);
}

.cal-legend {
  display: flex;
  gap: 1.2rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: var(--color-muted);
}
.cal-legend__item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.cal-legend__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.cal-legend__dot--session { background: var(--color-gold); }
.cal-legend__dot--drawing { background: var(--color-blue, #5b8fb9); }
.cal-legend__dot--personal { background: var(--color-muted); }

.cal-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 4rem;
  color: var(--color-muted);
  font-size: 0.9rem;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.cal-wrapper {
  flex: 1;
}

/* FullCalendar dark theme overrides */
.cal-wrapper :deep(.fc) {
  --fc-bg-event-opacity: 0.2;
  --fc-border-color: var(--color-border);
  --fc-button-bg-color: var(--color-surface-2);
  --fc-button-border-color: var(--color-border);
  --fc-button-text-color: var(--color-cream);
  --fc-button-hover-bg-color: var(--color-surface-3);
  --fc-button-hover-border-color: var(--color-muted);
  --fc-button-active-bg-color: var(--color-gold-dim);
  --fc-button-active-border-color: var(--color-gold-dim);
  --fc-event-border-color: transparent;
  --fc-neutral-bg-color: var(--color-surface);
  --fc-page-bg-color: var(--color-bg);
  --fc-today-bg-color: rgba(201, 168, 76, 0.06);
  --fc-now-indicator-color: var(--color-gold);
  font-family: var(--font-body);
  font-size: 0.82rem;
}
.cal-wrapper :deep(.fc .fc-toolbar-title) {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  color: var(--color-cream);
}
.cal-wrapper :deep(.fc .fc-col-header-cell-cushion),
.cal-wrapper :deep(.fc .fc-daygrid-day-number),
.cal-wrapper :deep(.fc .fc-timegrid-slot-label-cushion) {
  color: var(--color-muted);
  font-size: 0.78rem;
}
.cal-wrapper :deep(.fc .fc-event) {
  border-radius: 4px;
  font-size: 0.78rem;
  padding: 1px 4px;
  cursor: pointer;
}
.cal-wrapper :deep(.fc .fc-highlight) {
  background: var(--color-gold-glow);
}
.cal-wrapper :deep(.fc .fc-button) {
  font-size: 0.78rem;
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
}
.cal-wrapper :deep(.fc .fc-button:focus) {
  box-shadow: 0 0 0 3px var(--color-gold-glow);
}
</style>
