import * as React from "react";
import { Case, CaseTask, AdminTask } from "../types";
import { PlusIcon, TrashIcon, CheckCircleIcon, PencilIcon } from "./icons";
import AdminTaskModal from "./AdminTaskModal";
import { useData } from "../context/DataContext";

interface CaseTasksProps {
  caseItem: Case;
  onUpdateTasks: (tasks: CaseTask[]) => void;
}

const CaseTasks: React.FC<CaseTasksProps> = ({ caseItem, onUpdateTasks }) => {
  const { assistants, set_admin_tasks, user_id } = useData();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<CaseTask | null>(null);
  const tasks = caseItem.tasks || [];

  const handleTaskSubmit = (taskData: any) => {
    if (editingTask) {
      // Update existing task
      const updatedTasks = tasks.map(t => 
        t.id === editingTask.id ? { ...t, ...taskData } : t
      );
      onUpdateTasks(updatedTasks);
      
      // Update global admin tasks
      set_admin_tasks((prev) => prev.map(t => 
        t.id === editingTask.id ? { ...t, ...taskData, location: taskData.location || "القضية: " + caseItem.subject, case_id: caseItem.id } : t
      ));
    } else {
      // Create new task
      const newTask: CaseTask = {
        id: Date.now().toString(),
        task: taskData.task,
        due_date: taskData.due_date,
        completed: false,
        importance: taskData.importance,
        assignee: taskData.assignee,
      };
      onUpdateTasks([...tasks, newTask]);

      // Add to global admin tasks
      const globalTask: AdminTask = {
        ...newTask,
        user_id: user_id,
        location: taskData.location || "القضية: " + caseItem.subject,
        case_id: caseItem.id,
      };
      set_admin_tasks((prev) => [...prev, globalTask]);
    }

    setIsModalOpen(false);
    setEditingTask(null);
  };

  const toggleTask = (taskId: string) => {
    const newTasks = tasks.map(t => t.id === taskId ? {...t, completed: !t.completed} : t);
    onUpdateTasks(newTasks);
    
    // Also update global admin tasks
    set_admin_tasks((prev) => prev.map(t => t.id === taskId ? {...t, completed: !t.completed} : t));
  };

  const deleteTask = (taskId: string) => {
    onUpdateTasks(tasks.filter(t => t.id !== taskId));
    set_admin_tasks((prev) => prev.filter(t => t.id !== taskId));
  };

  const openEditModal = (task: CaseTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">مهام القضية</h3>
        <button onClick={() => { setEditingTask(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <PlusIcon className="w-5 h-5" />
          <span>مهمة جديدة</span>
        </button>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">لا توجد مهام حالياً</p>
      ) : (
        tasks.map(task => (
          <div key={task.id} className={`flex items-center gap-2 p-2 border-b last:border-none ${task.completed ? "opacity-50" : ""}`}>
            <button onClick={() => toggleTask(task.id)}>
              <CheckCircleIcon className={`w-5 h-5 ${task.completed ? "text-green-500" : "text-gray-300"}`} />
            </button>
            <span className={`flex-grow ${task.completed ? "line-through text-gray-500" : ""}`}>{task.task}</span>
            <button onClick={() => openEditModal(task)} className="p-1 hover:bg-gray-200 rounded">
              <PencilIcon className="w-5 h-5 text-gray-500" />
            </button>
            <button onClick={() => deleteTask(task.id)}>
              <TrashIcon className="w-5 h-5 text-red-500" />
            </button>
          </div>
        ))
      )}
      <AdminTaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        onSubmit={handleTaskSubmit}
        initialData={editingTask ? { ...editingTask, case_id: caseItem.id } : undefined}
        assistants={assistants}
      />
    </div>
  );
};

export default CaseTasks;
