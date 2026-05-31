import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { doc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { appId } from '../../config/env';
import TaskItem from '../../components/shared/TaskItem';

/** A single draggable row: drag handle + the normal TaskItem. */
function SortableRow({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1.5">
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${task.title}`}
        className="mt-2.5 flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-300 touch-none"
      >
        <GripVertical size={16} />
      </button>
      <div className="flex-grow min-w-0">
        <TaskItem task={task} />
      </div>
    </div>
  );
}

/**
 * Manual-order task list. Only incomplete tasks are draggable; completed tasks
 * render below, non-draggable. New order is persisted to each task's `order`
 * field so it survives reloads and syncs across devices.
 */
export default function SortableTaskList({ tasks, completedTasks }) {
  const userId = auth?.currentUser?.uid;
  const [items, setItems] = useState(tasks);

  // Stay in sync with Firestore unless the user is mid-reorder.
  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((t) => t.id === active.id);
    const newIndex = items.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next); // optimistic

    if (!userId || !db) return;
    const batch = writeBatch(db);
    next.forEach((t, i) => {
      batch.update(doc(db, `artifacts/${appId}/users/${userId}/tasks`, t.id), { order: i });
    });
    try {
      await batch.commit();
    } catch (e) {
      console.error('Reorder failed:', e);
      setItems(tasks); // roll back to last known good
    }
  };

  return (
    <div className="space-y-3">
      {items.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map((task) => (
                <SortableRow key={task.id} task={task} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        completedTasks.length === 0 && (
          <p className="text-gray-400 text-center py-4">No tasks for this project yet. Try generating some with AI!</p>
        )
      )}

      {completedTasks.length > 0 && (
        <div className="space-y-3 pt-1">
          {completedTasks.map((task) => (
            // align with the draggable rows (which have a 16px handle + gap)
            <div key={task.id} className="pl-[22px]">
              <TaskItem task={task} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
