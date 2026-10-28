"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

function SortableItem({
  id,
  as: Tag,
  className,
  children,
}: {
  id: string;
  as: "li" | "div";
  className?: string;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      type="button"
      className="cursor-grab touch-none text-gray-400 hover:text-gray-700"
      aria-label="Drag to reorder"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-5 w-5" />
    </button>
  );

  return (
    <Tag
      ref={setNodeRef as never}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${className ?? ""} ${isDragging ? "relative z-10 shadow-lg" : ""}`}
    >
      {children(handle)}
    </Tag>
  );
}

// Drag-to-reorder for admin lists (layout "list") and photo grids (layout "grid").
// children renders one item and gets the drag handle to place where it fits.
export default function SortableList<T extends { id: string }>({
  items,
  onReorder,
  layout = "list",
  className,
  itemClassName,
  children,
}: {
  items: T[];
  onReorder: (next: T[]) => void;
  layout?: "list" | "grid";
  className?: string;
  itemClassName?: string;
  children: (item: T, handle: React.ReactNode) => React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onReorder(
      arrayMove(
        items,
        items.findIndex((item) => item.id === active.id),
        items.findIndex((item) => item.id === over.id)
      )
    );
  };

  const Wrapper = layout === "list" ? "ul" : "div";

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={layout === "list" ? verticalListSortingStrategy : rectSortingStrategy}
      >
        <Wrapper className={className}>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id} as={layout === "list" ? "li" : "div"} className={itemClassName}>
              {(handle) => children(item, handle)}
            </SortableItem>
          ))}
        </Wrapper>
      </SortableContext>
    </DndContext>
  );
}
