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
import { db } from '../../config/firebase';
import { appId } from '../../config/env';

// Keep dragged rows on the vertical axis so they can't slide out of the sidebar.
const restrictToVerticalAxis = ({ transform }) => ({ ...transform, x: 0 });

function SortableProjectRow({ project, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  };
  return (
    <div ref={setNodeRef} style={style} className="group/row flex items-center rounded-md hover:bg-gray-700/50">
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${project.name}`}
        title="Drag to reorder"
        className="flex-shrink-0 pl-1 py-1.5 cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-300 touch-none opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition-opacity"
      >
        <GripVertical size={14} />
      </button>
      <button
        onClick={() => onOpen(project.id)}
        className="flex-grow min-w-0 text-left px-2 py-1.5 text-gray-300 truncate"
      >
        <span className="truncate block" title={project.name}>{project.name}</span>
      </button>
    </div>
  );
}

/**
 * Drag-to-reorder list of sidebar projects (under a goal, or standalone). The new order is saved
 * to each project's `order` field so it survives reloads and syncs across
 * devices.
 */
export default function SortableProjectList({ projects, userId, onOpen }) {
  const [items, setItems] = useState(projects);

  useEffect(() => {
    setItems(projects);
  }, [projects]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((p) => p.id === active.id);
    const newIndex = items.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next); // optimistic

    if (!userId || !db) return;
    const batch = writeBatch(db);
    next.forEach((p, i) => {
      batch.update(doc(db, `artifacts/${appId}/users/${userId}/projects`, p.id), { order: i });
    });
    try {
      await batch.commit();
    } catch (e) {
      console.error('Project reorder failed:', e);
      setItems(projects); // roll back to last known good
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        {items.map((p) => (
          <SortableProjectRow key={p.id} project={p} onOpen={onOpen} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
